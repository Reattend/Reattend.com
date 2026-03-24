import { NextRequest } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq, and, desc, or, inArray, like, ne } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
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

interface ChatMessage {
  role: 'user' | 'ai'
  content: string
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth()
    const { question, history } = await req.json() as { question: string; history?: ChatMessage[] }

    if (!question) {
      return new Response(JSON.stringify({ error: 'question is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get ALL workspaces this user belongs to (cross-workspace search)
    const memberships = await db.query.workspaceMembers.findMany({
      where: eq(schema.workspaceMembers.userId, userId),
    })
    const allWorkspaceIds = memberships.map(m => m.workspaceId)

    if (allWorkspaceIds.length === 0) {
      return new Response(JSON.stringify({ error: 'No workspaces found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Fetch workspace names for attribution
    const workspaces = await db.query.workspaces.findMany({
      where: inArray(schema.workspaces.id, allWorkspaceIds),
    })
    const wsNameMap = new Map(workspaces.map(ws => [ws.id, ws.name]))

    // Build search query from current question + recent conversation context
    const recentHistory = (history || []).slice(-6)
    const conversationContext = recentHistory
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join(' ')
    const fullSearchText = `${conversationContext} ${question}`
    const keywords = extractKeywords(fullSearchText)
    const lowerQ = question.toLowerCase()

    // Fetch recent records across ALL workspaces
    const recentRecords = await db.query.records.findMany({
      where: and(
        inArray(schema.records.workspaceId, allWorkspaceIds),
        ne(schema.records.triageStatus, 'needs_review'),
      ),
      orderBy: desc(schema.records.createdAt),
      limit: 150,
    })

    // Also do a keyword-level SQL search across ALL workspaces (no recency cutoff)
    // This ensures older records in team workspaces are never missed
    let keywordRecords: typeof recentRecords = []
    if (keywords.length > 0) {
      const keywordConditions = keywords.flatMap(kw => [
        like(schema.records.title, `%${kw}%`),
        like(schema.records.summary, `%${kw}%`),
        like(schema.records.tags, `%${kw}%`),
      ])
      keywordRecords = await db.query.records.findMany({
        where: and(
          inArray(schema.records.workspaceId, allWorkspaceIds),
          ne(schema.records.triageStatus, 'needs_review'),
          or(...keywordConditions),
        ),
        limit: 50,
      })
    }

    // Merge: recent records + keyword matches, deduplicated
    const seenIds = new Set<string>()
    const allRecords: typeof recentRecords = []
    for (const r of [...keywordRecords, ...recentRecords]) {
      if (!seenIds.has(r.id)) {
        seenIds.add(r.id)
        allRecords.push(r)
      }
    }

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
      if (/this week|today|recent|latest|last few/i.test(fullSearchText)) {
        const days = (Date.now() - new Date(r.createdAt).getTime()) / 86400000
        if (days < 7) score += 2
        if (days < 1) score += 1
      }

      return { record: r, score }
    })

    // Semantic search across all workspaces
    const llm = getLLM()
    try {
      const queryVector = await llm.embed(fullSearchText)
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
        if (existing) {
          existing.score += s.sim * 5
        }
      }
    } catch {
      // Embedding search failed, continue with keyword results
    }

    scored.sort((a, b) => b.score - a.score)
    let top = scored.filter(s => s.score > 0).slice(0, 5).map(s => s.record)
    if (top.length === 0) top = allRecords.slice(0, 3)

    if (top.length === 0) {
      const encoder = new TextEncoder()
      return new Response(encoder.encode("You don't have any memories yet. Add some and I'll be able to answer your questions!"), {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }

    // Fetch linked records across all workspaces
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
      // Links query failed, continue without
    }

    // Build main context with workspace attribution
    const hasMultipleWorkspaces = allWorkspaceIds.length > 1
    const context = top.map((r, i) => {
      const isBoard = r.tags?.includes('board:')
      const label = isBoard ? `${r.type}/board` : r.type
      const wsName = wsNameMap.get(r.workspaceId) || 'Unknown'
      const wsLabel = hasMultipleWorkspaces ? ` (from "${wsName}" workspace)` : ''
      return `${i + 1}. [${label}] ${r.title}${wsLabel}${r.summary ? '\n   ' + r.summary.slice(0, 300) : ''}${r.content ? '\n   Content: ' + r.content.slice(0, 200) : ''}`
    }).join('\n')

    // Build conversation history
    const historyText = recentHistory.length > 0
      ? '\nPrevious conversation:\n' + recentHistory.map(m =>
          m.role === 'user' ? `User: ${m.content}` : `Assistant: ${m.content}`
        ).join('\n') + '\n'
      : ''

    const sourceAttribution = hasMultipleWorkspaces
      ? ' If a memory comes from a specific workspace/project, mention it naturally (e.g., "From your X workspace..." or "In your Y project...").'
      : ''

    const prompt = `You are the AI assistant for Reattend, a personal memory app. Answer based ONLY on the user's memories and their connections below. Be conversational and helpful in 2-4 sentences. If memories have connections (links), use them to provide richer context.${sourceAttribution}

After your answer, on a new line write "---FOLLOWUPS---" then provide exactly 2 short follow-up questions the user might want to ask next, each on its own line starting with "- ". Make them specific to the memories and connections found.

Memories:
${context}${linkedContext}
${historyText}
User: ${question}
Assistant:`

    const stream = await llm.generateTextStream(prompt)
    const sourcesJson = JSON.stringify(top.map(r => ({
      id: r.id,
      title: r.title,
      type: r.type,
      workspace: wsNameMap.get(r.workspaceId) || 'Personal',
    })))

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
        'X-Sources': sourcesJson,
        'Access-Control-Expose-Headers': 'X-Sources',
      },
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
