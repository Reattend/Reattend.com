import { NextRequest } from 'next/server'
import { resolveAuth, checkAllowed, recordUsage, rateLimitResponse } from '@/lib/metering'

/**
 * POST /api/tray/proxy/transcribe
 * Proxies audio transcription to Groq Whisper API.
 * Body: multipart/form-data with "audio" file field.
 * Headers: X-Device-Id or Authorization: Bearer rat_xxx
 * Returns: { text, segments, duration }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await resolveAuth(req.headers)

    if (!auth.deviceId && !auth.userId) {
      return Response.json({ error: 'X-Device-Id header or Authorization required' }, { status: 401 })
    }

    const usage = await checkAllowed(auth.deviceId, auth.userId, auth.tier)
    if (!usage.allowed) {
      return rateLimitResponse(auth.tier, usage.used, usage.limit)
    }

    const groqKey = process.env.GROQ_API_KEY
    if (!groqKey) {
      return Response.json({ error: 'AI provider not configured' }, { status: 503 })
    }

    // Parse multipart form data
    const formData = await req.formData()
    const audioFile = formData.get('audio')
    if (!audioFile || !(audioFile instanceof Blob)) {
      return Response.json({ error: '"audio" file field is required' }, { status: 400 })
    }

    // Build multipart request for Groq Whisper API
    const groqForm = new FormData()
    groqForm.append('file', audioFile, 'recording.wav')
    groqForm.append('model', 'whisper-large-v3-turbo')
    groqForm.append('response_format', 'verbose_json')
    groqForm.append('language', 'en')

    const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
      },
      body: groqForm,
      signal: AbortSignal.timeout(120_000), // 2 min timeout for long recordings
    })

    if (!groqRes.ok) {
      const errText = await groqRes.text()
      return Response.json(
        { error: `Transcription failed (${groqRes.status})`, details: errText },
        { status: groqRes.status >= 500 ? 502 : groqRes.status },
      )
    }

    await recordUsage(auth.deviceId, auth.userId, auth.tier, 'transcribe')

    const data = await groqRes.json()

    return Response.json({
      text: data.text || '',
      segments: data.segments || [],
      duration: data.duration || 0,
      language: data.language || 'en',
    })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
