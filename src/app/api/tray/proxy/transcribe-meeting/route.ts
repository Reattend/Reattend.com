import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq, and, gte, sql } from 'drizzle-orm'
import { validateApiToken } from '@/lib/auth/token'
import { getUserSubscription } from '@/lib/auth'

const ASSEMBLYAI_API = 'https://api.assemblyai.com/v2'
const POLL_INTERVAL_MS = 5_000
const POLL_TIMEOUT_MS = 10 * 60 * 1000 // 10 min

/**
 * POST /api/tray/proxy/transcribe-meeting
 *
 * Accepts multipart/form-data:
 *   audio    — audio blob (webm/mp4/wav/ogg, any format AssemblyAI accepts)
 *   title    — string (optional, used as fallback title)
 *   platform — string (optional, e.g. "Google Meet")
 *   duration_seconds — number (optional)
 *
 * Flow:
 *   1. Upload audio to AssemblyAI
 *   2. Submit async transcript with Nano model + speaker diarization
 *   3. Poll until complete
 *   4. Run Groq post-processing for title/summary/action items/decisions
 *   5. Save record to DB as type "transcript"
 *   6. Enqueue embed job
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await validateApiToken(req.headers.get('authorization'))
    if (!auth) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // Check meeting recording quota for free users (2/day)
    const RECORDING_LIMIT = 2
    const sub = await getUserSubscription(auth.userId)
    if (!sub.isSmartActive) {
      const todayStart = new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z'
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.records)
        .where(and(
          eq(schema.records.workspaceId, auth.workspaceId),
          eq(schema.records.type, 'transcript'),
          gte(schema.records.createdAt, todayStart),
        ))
      const used = Number(result[0]?.count ?? 0)
      if (used >= RECORDING_LIMIT) {
        return NextResponse.json(
          { error: 'recording_quota_exceeded', used, limit: RECORDING_LIMIT },
          { status: 429 },
        )
      }
    }

    const assemblyKey = process.env.ASSEMBLYAI_API_KEY
    const groqKey = process.env.GROQ_API_KEY
    if (!assemblyKey) {
      return NextResponse.json({ error: 'AssemblyAI not configured' }, { status: 503 })
    }
    if (!groqKey) {
      return NextResponse.json({ error: 'Groq not configured' }, { status: 503 })
    }

    // --- Parse multipart form ---
    const form = await req.formData()
    const audioFile = form.get('audio') as File | null
    const titleHint = (form.get('title') as string | null) || 'Meeting Recording'
    const platform = (form.get('platform') as string | null) || ''
    const durationSec = parseInt(form.get('duration_seconds') as string || '0', 10) || 0

    if (!audioFile || audioFile.size === 0) {
      return NextResponse.json({ error: 'audio file is required' }, { status: 400 })
    }

    // --- 1. Upload audio to AssemblyAI ---
    const audioBuffer = await audioFile.arrayBuffer()
    const uploadRes = await fetch(`${ASSEMBLYAI_API}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': assemblyKey,
        'Content-Type': 'application/octet-stream',
      },
      body: audioBuffer,
      signal: AbortSignal.timeout(120_000),
    })

    if (!uploadRes.ok) {
      const errText = await uploadRes.text()
      return NextResponse.json(
        { error: `AssemblyAI upload failed (${uploadRes.status})`, details: errText },
        { status: 502 }
      )
    }

    const { upload_url } = await uploadRes.json()

    // --- 2. Submit transcript job ---
    const transcriptRes = await fetch(`${ASSEMBLYAI_API}/transcript`, {
      method: 'POST',
      headers: {
        'Authorization': assemblyKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: upload_url,
        speech_models: ['universal-2'],
        speaker_labels: true,
        language_detection: true,
      }),
      signal: AbortSignal.timeout(30_000),
    })

    if (!transcriptRes.ok) {
      const errText = await transcriptRes.text()
      return NextResponse.json(
        { error: `AssemblyAI submit failed (${transcriptRes.status})`, details: errText },
        { status: 502 }
      )
    }

    const { id: transcriptId } = await transcriptRes.json()

    // --- 3. Poll until complete ---
    const pollUrl = `${ASSEMBLYAI_API}/transcript/${transcriptId}`
    const deadline = Date.now() + POLL_TIMEOUT_MS
    let transcriptData: any = null

    while (Date.now() < deadline) {
      await sleep(POLL_INTERVAL_MS)

      const pollRes = await fetch(pollUrl, {
        headers: { 'Authorization': assemblyKey },
        signal: AbortSignal.timeout(15_000),
      })

      if (!pollRes.ok) continue

      const data = await pollRes.json()
      if (data.status === 'completed') {
        transcriptData = data
        break
      }
      if (data.status === 'error') {
        return NextResponse.json(
          { error: 'AssemblyAI transcription failed', details: data.error },
          { status: 502 }
        )
      }
      // status === 'processing' || 'queued' — keep polling
    }

    if (!transcriptData) {
      return NextResponse.json({ error: 'Transcription timed out' }, { status: 504 })
    }

    // --- 4. Format transcript with speaker labels ---
    const formattedLines: string[] = []
    const speakerSet = new Set<string>()

    if (transcriptData.utterances && transcriptData.utterances.length > 0) {
      for (const utt of transcriptData.utterances) {
        const mm = Math.floor(utt.start / 60000)
        const ss = Math.floor((utt.start % 60000) / 1000)
        const timestamp = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
        const speaker = `Speaker ${utt.speaker}`
        speakerSet.add(speaker)
        formattedLines.push(`[${timestamp}] ${speaker}: ${utt.text}`)
      }
    } else if (transcriptData.text) {
      formattedLines.push(transcriptData.text)
    }

    const formattedTranscript = formattedLines.join('\n')

    if (!formattedTranscript.trim()) {
      return NextResponse.json({ error: 'Transcript is empty — no speech detected' }, { status: 422 })
    }

    // --- 5. Groq post-processing ---
    const systemPrompt = `You analyze meeting transcripts. Extract structured information and respond with valid JSON only.`

    const userPrompt = `Analyze this meeting transcript${platform ? ` (recorded on ${platform})` : ''}:

${formattedTranscript.slice(0, 12000)}

Respond with this JSON:
{
  "title": "concise meeting title (max 80 chars)",
  "summary": "2-4 sentence summary of what was discussed and decided",
  "actionItems": ["action item 1", "action item 2"],
  "decisions": ["decision 1", "decision 2"],
  "participants": ["Speaker A", "Speaker B"]
}`

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(30_000),
    })

    let title = titleHint
    let summary = ''
    let actionItems: string[] = []
    let decisions: string[] = []
    let participants: string[] = Array.from(speakerSet)

    if (groqRes.ok) {
      try {
        const groqData = await groqRes.json()
        const parsed = JSON.parse(groqData.choices?.[0]?.message?.content || '{}')
        if (parsed.title) title = parsed.title
        if (parsed.summary) summary = parsed.summary
        if (Array.isArray(parsed.actionItems)) actionItems = parsed.actionItems
        if (Array.isArray(parsed.decisions)) decisions = parsed.decisions
        if (Array.isArray(parsed.participants) && parsed.participants.length > 0) {
          participants = parsed.participants
        }
      } catch {
        // fall through with defaults
      }
    }

    // Build rich content block
    const contentParts: string[] = []
    if (summary) contentParts.push(`## Summary\n${summary}`)
    if (actionItems.length > 0) contentParts.push(`## Action Items\n${actionItems.map(a => `- ${a}`).join('\n')}`)
    if (decisions.length > 0) contentParts.push(`## Decisions\n${decisions.map(d => `- ${d}`).join('\n')}`)
    if (participants.length > 0) contentParts.push(`## Participants\n${participants.join(', ')}`)
    contentParts.push(`## Transcript\n${formattedTranscript}`)

    const fullContent = contentParts.join('\n\n')

    const tags = ['transcript']
    if (platform) tags.push(platform.toLowerCase().replace(/\s+/g, '-'))
    if (durationSec > 0) {
      const mins = Math.round(durationSec / 60)
      if (mins >= 60) tags.push('long-meeting')
      else if (mins >= 30) tags.push('medium-meeting')
    }

    // --- 6. Save record to DB ---
    const recordId = crypto.randomUUID()

    await db.insert(schema.records).values({
      id: recordId,
      workspaceId: auth.workspaceId,
      type: 'transcript',
      title,
      summary: summary || formattedTranscript.slice(0, 300),
      content: fullContent,
      confidence: 0.9,
      tags: JSON.stringify(tags),
      triageStatus: 'auto_accepted',
      createdBy: auth.userId,
    })

    // Assign to default project
    const defaultProject = await db.query.projects.findFirst({
      where: and(
        eq(schema.projects.workspaceId, auth.workspaceId),
        eq(schema.projects.isDefault, true),
      ),
    })
    if (defaultProject) {
      await db.insert(schema.projectRecords).values({
        projectId: defaultProject.id,
        recordId,
      })
    }

    // Enqueue embed job (fire-and-forget)
    db.insert(schema.jobQueue).values({
      type: 'embed',
      payload: JSON.stringify({ recordId }),
      workspaceId: auth.workspaceId,
    }).catch(console.error)

    return NextResponse.json({
      ok: true,
      recordId,
      title,
      summary,
      actionItems,
      decisions,
      participants,
      durationSeconds: durationSec,
    })
  } catch (error: any) {
    console.error('[transcribe-meeting]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
