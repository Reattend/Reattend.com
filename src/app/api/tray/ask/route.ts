import { NextRequest } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq, and, desc, or, inArray } from 'drizzle-orm'
import { validateApiToken } from '@/lib/auth/token'
import { getLLM } from '@/lib/ai/llm'
import { cosineSimilarity } from '@/lib/utils'

const STOP_WORDS = new Set([
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'it', 'they',
  'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall',
  'should', 'may', 'might', 'can', 'could', 'a', 'an', 'the', 'and', 'but',
  'or', 'nor', 'not', 'so', 'if', 'then', 'than', 'too', 'very', 'just',
  'about', 'above', 'after', 'again', 'all', 'also', 'any', 'because', 'before',
  'between', 'both', 'by', 'during', 'each', 'for', 'from', 'further', 'get',
  'here', 'how', 'in', 'into', 'more', 'most', 'no', 'of', 'on', 'once',
  'only', 'other', 'out', 'over', 'own', 'same', 'some', 'such', 'to', 'under',
  'until', 'up', 'what', 'when', 'where', 'which', 'while', 'who', 'whom',
  'why', 'with', 'there', 'their', 'its', 'make', 'made', 'tell', 'more',
  'light', 'shed', 'please', 'could', 'know', 'like',
])

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))
}

export async function POST(req: NextRequest) {
  try {
    const auth = await validateApiToken(req.headers.get('authorization'))
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { question } = await req.json() as { question: string }
    if (!question) {
      return new Response(JSON.stringify({ error: 'question is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get ALL workspaces this user belongs to (cross-workspace search)
    const memberships = await db.query.workspaceMembers.findMany({
      where: eq(schema.workspaceMembers.userId, auth.userId),
    })
    const allWorkspaceIds = memberships.map(m => m.workspaceId)

    if (allWorkspaceIds.length === 0) {
      return new Response("You don't have any memories yet.", {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }

    // Fetch workspace names for attribution
    const workspaces = await db.query.workspaces.findMany({
      where: inArray(schema.workspaces.id, allWorkspaceIds),
    })
    const wsNameMap = new Map(workspaces.map(ws => [ws.id, ws.name]))

    const keywords = extractKeywords(question)
    const lowerQ = question.toLowerCase()

    // Fetch recent records across ALL workspaces
    const allRecords = await db.query.records.findMany({
      where: inArray(schema.records.workspaceId, allWorkspaceIds),
      orderBy: desc(schema.records.createdAt),
      limit: 200,
    })

    // Score by keyword match
    const scored = allRecords.map(r => {
      const searchText = [r.title, r.summary || '', r.tags || '', r.content || ''].join(' ').toLowerCase()
      let score = 0
      for (const kw of keywords) {
        if (r.title.toLowerCase().includes(kw)) score += 2
        else if (searchText.includes(kw)) score++
      }

      // Type boost
      if (lowerQ.includes('decision') && r.type === 'decision') score += 3
      if (lowerQ.includes('meeting') && r.type === 'meeting') score += 3
      if (lowerQ.includes('task') && r.type === 'tasklike') score += 3
      if (lowerQ.includes('idea') && r.type === 'idea') score += 3
      if (lowerQ.includes('insight') && r.type === 'insight') score += 3
      if (lowerQ.includes('board') && r.tags?.includes('board:')) score += 3

      // Recency boost
      if (/this week|today|recent|latest|last few/i.test(question)) {
        const days = (Date.now() - new Date(r.createdAt).getTime()) / 86400000
        if (days < 7) score += 2
        if (days < 1) score += 1
      }

      return { record: r, score }
    })

    // Semantic search across all workspaces
    const llm = getLLM()
    try {
      const queryVector = await llm.embed(question)
      const allEmbeddings = await db.query.embeddings.findMany({
        where: inArray(schema.embeddings.workspaceId, allWorkspaceIds),
      })
      const similarities = allEmbeddings
        .map(emb => ({
          recordId: emb.recordId,
          sim: cosineSimilarity(queryVector, JSON.parse(emb.vector) as number[]),
        }))
        .filter(s => s.sim > 0.3)
        .sort((a, b) => b.sim - a.sim)
        .slice(0, 5)

      for (const s of similarities) {
        const existing = scored.find(x => x.record.id === s.recordId)
        if (existing) existing.score += s.sim * 5
      }
    } catch {
      // Continue without semantic
    }

    scored.sort((a, b) => b.score - a.score)
    let top = scored.filter(s => s.score > 0).slice(0, 5).map(s => s.record)
    if (top.length === 0) top = allRecords.slice(0, 3)

    if (top.length === 0) {
      return new Response("You don't have any memories yet.", {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }

    // Fetch linked records for richer context
    const topIds = top.map(r => r.id)
    let linkedContext = ''
    try {
      const links = await db.query.recordLinks.findMany({
        where: and(
          inArray(schema.recordLinks.workspaceId, allWorkspaceIds),
          or(
            inArray(schema.recordLinks.fromRecordId, topIds),
            inArray(schema.recordLinks.toRecordId, topIds),
          ),
        ),
        limit: 15,
      })

      if (links.length > 0) {
        const linkedIds = new Set<string>()
        for (const link of links) {
          if (!topIds.includes(link.fromRecordId)) linkedIds.add(link.fromRecordId)
          if (!topIds.includes(link.toRecordId)) linkedIds.add(link.toRecordId)
        }

        const linkedRecords = linkedIds.size > 0
          ? await Promise.all(
              Array.from(linkedIds).slice(0, 5).map(id =>
                db.query.records.findFirst({ where: eq(schema.records.id, id) })
              )
            )
          : []

        const allById = new Map<string, { title: string; workspaceId: string }>()
        for (const r of [...top, ...linkedRecords.filter(Boolean)]) {
          if (r) allById.set(r.id, { title: r.title, workspaceId: r.workspaceId })
        }

        const connectionLines = links.slice(0, 8).map(link => {
          const from = allById.get(link.fromRecordId)?.title || 'Unknown'
          const to = allById.get(link.toRecordId)?.title || 'Unknown'
          const kind = link.kind.replace(/_/g, ' ')
          return `  "${from}" → [${kind}] → "${to}"${link.explanation ? ` (${link.explanation})` : ''}`
        })

        if (connectionLines.length > 0) {
          linkedContext = '\n\nConnections (knowledge graph):\n' + connectionLines.join('\n')
        }

        const extraRecords = linkedRecords.filter(Boolean).filter(r => r && !topIds.includes(r.id))
        if (extraRecords.length > 0) {
          linkedContext += '\n\nRelated memories:\n' + extraRecords.map(r => {
            const wsName = wsNameMap.get(r!.workspaceId) || 'Unknown'
            return `- [${r!.type}] ${r!.title} (from "${wsName}" workspace)${r!.summary ? ': ' + r!.summary.slice(0, 150) : ''}`
          }).join('\n')
        }
      }
    } catch {
      // Continue without links
    }

    // Build context with workspace attribution
    const hasMultipleWorkspaces = allWorkspaceIds.length > 1
    const context = top.map((r, i) => {
      const isBoard = r.tags?.includes('board:')
      const label = isBoard ? `${r.type}/board` : r.type
      const wsName = wsNameMap.get(r.workspaceId) || 'Unknown'
      const wsLabel = hasMultipleWorkspaces ? ` (from "${wsName}" workspace)` : ''
      return `${i + 1}. [${label}] ${r.title}${wsLabel}${r.summary ? '\n   ' + r.summary.slice(0, 500) : ''}${r.content ? '\n   Content: ' + r.content.slice(0, 600) : ''}`
    }).join('\n')

    const wsInstruction = hasMultipleWorkspaces
      ? ' When a memory comes from a specific workspace, mention it briefly.'
      : ''

    const prompt = `You are Reattend's memory assistant. Answer using ONLY the memories provided below.

Rules:
- Answer directly — never start with "From your memories", "Based on your notes", or similar preamble
- Quote all numbers, IDs, account numbers, dates, and names EXACTLY as written — never paraphrase or shorten them
- For factual questions: 1-2 sentences is enough
- If the answer is in the memories, state it plainly. Do not say "it's not specified" when it is there.
- If genuinely not found: say "I don't see this in your saved memories. You can add it by saving a new memory."
- Never invent or guess facts not explicitly in the memories${wsInstruction}

Memories:
${context}${linkedContext}

User: ${question}
Assistant:`

    const stream = await llm.generateTextStream(prompt)

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
