import { NextRequest } from 'next/server'
import { db, schema, sqlite, vecLoaded } from '@/lib/db'
import { eq, and, desc, or, inArray, like } from 'drizzle-orm'
import { validateApiToken } from '@/lib/auth/token'
import { getUserSubscription } from '@/lib/auth'
import { recordUsage } from '@/lib/metering'
import { getAskLLM } from '@/lib/ai/llm'
import { cosineSimilarity } from '@/lib/utils'

const AI_QUERY_LIMIT = 10

// ─── Keyword extraction ───────────────────────────────────────────────────────
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

// ─── Proper noun extraction ───────────────────────────────────────────────────
const COMMON_CAPS = new Set([
  'I', 'The', 'A', 'An', 'In', 'On', 'At', 'To', 'For', 'Of', 'With',
  'What', 'Who', 'When', 'Where', 'Why', 'How', 'Is', 'Are', 'Was', 'Were',
  'Can', 'Could', 'Did', 'Do', 'Does', 'Has', 'Have', 'Had', 'Will', 'Would',
  'Tell', 'Me', 'My', 'We', 'Our', 'Please', 'Any', 'All', 'This', 'That',
])
function extractProperNouns(text: string): string[] {
  const words = text.split(/\s+/)
    .filter(w => /^[A-Z][a-z]/.test(w) && !COMMON_CAPS.has(w) && w.length > 2)
    .map(w => w.toLowerCase().replace(/[^a-z]/g, ''))
    .filter(w => w.length > 2)
  return Array.from(new Set(words))
}

// ─── Fuzzy name matching ─────────────────────────────────────────────────────
const NICKNAME_MAP: Record<string, string[]> = {
  mike: ['michael', 'mick', 'mickey'], michael: ['mike', 'mick'],
  bob: ['robert', 'rob', 'bobby'], robert: ['bob', 'rob'], rob: ['robert', 'bob'],
  bill: ['william', 'will', 'billy'], william: ['bill', 'will'], will: ['william', 'bill'],
  jim: ['james', 'jimmy'], james: ['jim', 'jimmy'],
  tom: ['thomas', 'tommy'], thomas: ['tom', 'tommy'],
  dave: ['david'], david: ['dave'],
  chris: ['christopher'], christopher: ['chris'],
  dan: ['daniel', 'danny'], daniel: ['dan', 'danny'],
  matt: ['matthew'], matthew: ['matt'],
  joe: ['joseph', 'joey'], joseph: ['joe'],
  nick: ['nicholas'], nicholas: ['nick'],
  alex: ['alexander', 'alexandra'], alexander: ['alex'],
  sam: ['samuel', 'samantha'], samuel: ['sam'], samantha: ['sam'],
  ben: ['benjamin'], benjamin: ['ben'],
  liz: ['elizabeth', 'beth'], elizabeth: ['liz', 'beth'], beth: ['elizabeth', 'liz'],
  kate: ['katherine', 'kathy', 'katie'], katherine: ['kate', 'kathy'], kathy: ['katherine', 'kate'],
  jen: ['jennifer', 'jenny'], jennifer: ['jen', 'jenny'],
  pat: ['patricia', 'patrick'], patricia: ['pat'], patrick: ['pat'],
  raj: ['rajesh'], rajesh: ['raj'],
  don: ['donald'], donald: ['don'],
  sue: ['susan', 'susanne'], susan: ['sue'],
  ann: ['anne', 'anna', 'annie'], anne: ['ann', 'anna'], anna: ['ann', 'anne'],
  tony: ['anthony'], anthony: ['tony'],
  andy: ['andrew'], andrew: ['andy'],
  ron: ['ronald'], ronald: ['ron'],
  ken: ['kenneth'], kenneth: ['ken'],
  steve: ['steven', 'stephen'], steven: ['steve'], stephen: ['steve'],
  ed: ['edward', 'edgar'], edward: ['ed', 'eddie'], eddie: ['edward', 'ed'],
  greg: ['gregory'], gregory: ['greg'],
  jeff: ['jeffrey'], jeffrey: ['jeff'],
  rick: ['richard'], richard: ['rick', 'rich', 'dick'], rich: ['richard'],
  tim: ['timothy'], timothy: ['tim'],
  jay: ['jason'], jason: ['jay'],
  mark: ['marcus'], marcus: ['mark'],
}

function getNameVariants(name: string): string[] {
  const lower = name.toLowerCase()
  const variants = new Set<string>([lower])
  for (const v of (NICKNAME_MAP[lower] || [])) variants.add(v)
  const parts = lower.split(/\s+/).filter(p => p.length > 2)
  if (parts.length > 1) {
    for (const part of parts) {
      variants.add(part)
      for (const v of (NICKNAME_MAP[part] || [])) variants.add(v)
    }
  }
  return Array.from(variants)
}

// ─── Intent classification ────────────────────────────────────────────────────
type QueryIntent = 'factual' | 'entity' | 'temporal' | 'synthesis' | 'actions' | 'history' | 'aggregation'

function classifyIntentRegex(question: string): QueryIntent {
  const q = question.toLowerCase()
  if (/\b(total|how much|how many|sum|count|tally|aggregate|combined|altogether|add up|average|avg|budget|cost|spend|spent|revenue|expense|invoice|payment|paid|charged|owe|earned|profit|loss|price|fee|salary|rate|hours?|days?|weeks?|months?|number of|quantity|amount)\b/.test(q)
    && /\b(total|sum|how much|how many|count|tally|all|combined|altogether|add up|average|avg|entire|across all|in total|overall)\b/.test(q))
    return 'aggregation'
  if (/\b(has worked|have worked|worked on|has done|have done|has completed|has handled|has addressed|has been working|has delivered|has provided|has updated|has sent|has shared|has fixed|has resolved|has investigated|has built|has created|has prepared|has presented|has reviewed)\b/.test(q)
    || /\bwhat (did|has) .{1,30} (do|done|work|accomplish|complete|deliver|handle|address|build|create|prepare)\b/.test(q)
    || /\b(list|give me|provide).{0,30}\b(has|have).{0,20}(done|worked|completed|delivered)\b/.test(q)
    || /\bpoints?.{0,20}(worked|completed|done|delivered|addressed)\b/.test(q))
    return 'history'
  if (/\b(action items?|open tasks?|to-?dos?|pending|follow-?ups?|outstanding|what.*need.*done|what.*should.*do|what.*left|not.*completed|unresolved|needs? to|should do|must do|take action|assigned to)\b/.test(q))
    return 'actions'
  if (/\b(last|this|next)\s+(week|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december|year|quarter)\b|\b(today|yesterday)\b|\bwhen\b.{1,30}\b(did|was|were|happened)\b|\bon\s+\w+\s+\d/.test(q))
    return 'temporal'
  if (/^(who|what)\s+is\b|^tell me about\s/.test(q) || (/\bwho\b/.test(q) && q.split(' ').length <= 6))
    return 'entity'
  if (/\b(discuss|summarize|summary|what happened|what was|what were|explain|describe|give me|overview|recap|everything|list|what did|how did|pattern|suggest|recommend|analyz|compare|across|all the|walk me|catch me up)\b/.test(q))
    return 'synthesis'
  return 'factual'
}

async function classifyIntentLLM(question: string, llm: import('@/lib/ai/llm').LLMProvider): Promise<QueryIntent> {
  const prompt = `Classify this user question into exactly one of these 6 intent types:

factual     — single specific fact: name, date, number, yes/no, did X happen
entity      — profile of a person, org, project: "who is X", "tell me about X"
temporal    — time-bounded: "last week", "in March", "what happened on..."
synthesis   — broad summary, comparison, full recap: "summarize", "what happened with X", "give me a list"
actions     — pending/open tasks: "what needs to be done", "action items", "open tasks"
history     — completed past work: "what has X done", "what did X work on", "X's contributions"
aggregation — numerical totals/counts: "how much in total", "how many hours", "total budget", "sum of all"

Question: "${question}"

Reply with ONE word only (the intent type):`

  try {
    const raw = await llm.generateText(prompt, 15)
    const word = raw.trim().toLowerCase().replace(/[^a-z]/g, '')
    const valid: QueryIntent[] = ['factual', 'entity', 'temporal', 'synthesis', 'actions', 'history', 'aggregation']
    if (valid.includes(word as QueryIntent)) return word as QueryIntent
  } catch { /* fall through */ }
  return classifyIntentRegex(question)
}

// ─── Multi-hop reasoning ─────────────────────────────────────────────────────
interface MultiHopPlan { hop1: string; hop2: string; bridge: string }

async function detectMultiHop(
  question: string,
  llm: import('@/lib/ai/llm').LLMProvider,
): Promise<MultiHopPlan | null> {
  const q = question.toLowerCase()
  const hasSingleHopStart = /^(what is|who is|when did|tell me about|what did|list all|how many|total|summarize|what has|give me|what are)\s/.test(q)
  const hasMultiHopSignal = /\b(the (person|one|team|client|project|company|member) (who|that|responsible for|managing|handling|assigned to|leading|running)|after (the|that|this)|following (the|that)|based on (the|that)|which (led to|caused|resulted in)|the (outcome|result|decision|conclusion) (of|from)|since (the|that)|whoever|whichever)\b/.test(q)
  if (hasSingleHopStart && !hasMultiHopSignal) return null
  if (!hasMultiHopSignal) return null

  const prompt = `Determine if this question requires multi-hop reasoning — finding one fact first, then using it to answer the real question.

Question: "${question}"

Multi-hop means: you cannot answer directly without first resolving an intermediate fact.
Examples:
- "What has the person handling Goodwill been working on?" → hop1: "Who handles the Goodwill account?", hop2: "What has [name] worked on?", bridge: entity
- "What decisions followed the budget audit meeting?" → hop1: "What happened in the budget audit meeting?", hop2: "What decisions came after?", bridge: event

Single-hop (answer directly):
- "What did Mike work on this week?" — direct
- "List all open tasks for the Goodwill project" — direct

Output JSON:
{"multiHop": true, "hop1": "first sub-question to resolve", "hop2": "second sub-question that uses hop1 result", "bridge": "entity|event|decision|date"}
{"multiHop": false}`

  try {
    const raw = await llm.generateText(prompt, 150)
    const match = raw.match(/\{[\s\S]*?\}/)
    if (!match) return null
    const parsed = JSON.parse(match[0])
    if (!parsed.multiHop || !parsed.hop1 || !parsed.hop2) return null
    return { hop1: parsed.hop1, hop2: parsed.hop2, bridge: parsed.bridge || 'entity' }
  } catch { return null }
}

// ─── Query expansion ─────────────────────────────────────────────────────────
async function expandQueryTerms(question: string, llm: import('@/lib/ai/llm').LLMProvider): Promise<string[]> {
  const prompt = `Given this search query for a personal memory system, list 2-3 short alternative phrasings that might match how the same information was written down differently.

Query: "${question}"

Rules:
- Focus on synonym substitutions and role/context variations (e.g. "budget" → "cost", "pricing"; "meeting" → "call", "sync", "discussion")
- Keep each phrasing short (3-6 words max)
- Return ONLY a JSON array of strings, e.g. ["alt phrasing 1", "alt phrasing 2"]`

  try {
    const raw = await llm.generateText(prompt, 80)
    const match = raw.match(/\[[\s\S]*?\]/)
    if (!match) return []
    const arr = JSON.parse(match[0])
    if (Array.isArray(arr)) return arr.filter((s: any) => typeof s === 'string').slice(0, 3)
  } catch { /* fall through */ }
  return []
}

// ─── Date range extraction ────────────────────────────────────────────────────
interface DateRange { start: Date; end: Date; label: string }

function extractDateRange(question: string): DateRange | null {
  const now = new Date()
  const q = question.toLowerCase()
  const MONTHS = ['january','february','march','april','may','june','july','august','september','october','november','december']

  if (/\btoday\b/.test(q)) {
    const s = new Date(now); s.setHours(0, 0, 0, 0)
    const e = new Date(now); e.setHours(23, 59, 59, 999)
    return { start: s, end: e, label: 'today' }
  }
  if (/\byesterday\b/.test(q)) {
    const s = new Date(now); s.setDate(s.getDate() - 1); s.setHours(0, 0, 0, 0)
    const e = new Date(s); e.setHours(23, 59, 59, 999)
    return { start: s, end: e, label: 'yesterday' }
  }
  if (/\bthis week\b/.test(q)) {
    const s = new Date(now); s.setDate(s.getDate() - s.getDay()); s.setHours(0, 0, 0, 0)
    return { start: s, end: now, label: 'this week' }
  }
  if (/\blast week\b/.test(q)) {
    const e = new Date(now); e.setDate(e.getDate() - e.getDay() - 1); e.setHours(23, 59, 59, 999)
    const s = new Date(e); s.setDate(s.getDate() - 6); s.setHours(0, 0, 0, 0)
    return { start: s, end: e, label: 'last week' }
  }
  if (/\blast month\b/.test(q)) {
    const s = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const e = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
    return { start: s, end: e, label: 'last month' }
  }
  if (/\bthis month\b/.test(q)) {
    const s = new Date(now.getFullYear(), now.getMonth(), 1)
    return { start: s, end: now, label: 'this month' }
  }
  if (/\blast\s+(3|three)\s+months?\b/.test(q)) {
    const s = new Date(now); s.setMonth(s.getMonth() - 3)
    return { start: s, end: now, label: 'last 3 months' }
  }
  if (/\blast\s+(6|six)\s+months?\b/.test(q)) {
    const s = new Date(now); s.setMonth(s.getMonth() - 6)
    return { start: s, end: now, label: 'last 6 months' }
  }
  if (/\blast year\b/.test(q)) {
    const s = new Date(now.getFullYear() - 1, 0, 1)
    const e = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999)
    return { start: s, end: e, label: `${now.getFullYear() - 1}` }
  }
  if (/\bthis year\b/.test(q)) {
    const s = new Date(now.getFullYear(), 0, 1)
    return { start: s, end: now, label: `${now.getFullYear()}` }
  }
  for (let i = 0; i < MONTHS.length; i++) {
    const month = MONTHS[i]
    if (!q.includes(month)) continue
    const yearMatch = q.match(new RegExp(`${month}\\s+(20\\d{2})|(20\\d{2})\\s+${month}`))
    let year = now.getFullYear()
    if (yearMatch) {
      year = parseInt(yearMatch[1] || yearMatch[2])
    } else {
      if (i > now.getMonth()) year--
      if (q.includes(`last ${month}`) && i <= now.getMonth()) year--
    }
    const s = new Date(year, i, 1)
    const e = new Date(year, i + 1, 0, 23, 59, 59, 999)
    return { start: s, end: e, label: `${month} ${year}` }
  }
  return null
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
  } catch { return '' }
}

// ─── Intent-based prompt instructions ────────────────────────────────────────
function buildDepthInstruction(intent: QueryIntent, dateRange: DateRange | null): string {
  switch (intent) {
    case 'history':
      return `FORMAT — Work Summary (past tense):
- Open: one sentence on person's role/context
- ## headers by project/area
- Bullet what they DID in past tense ("Updated Excel formulas...", "Identified 297-entry discrepancy...")
- Bold key outcomes: **spreadsheet sent Mar 17**
- [n] citations; end with ## Summary (1-2 sentences)`

    case 'actions':
      return `FORMAT — Pending Action Items (open/incomplete only):
- Open: who owns these and from which meeting/note
- Numbered list of ONLY pending tasks: **task** — deadline if known [n]
- Do NOT list completed items; note "status unclear" if uncertain
- End: **X open items**
- Exhaustive — list every unresolved item`

    case 'temporal':
      return `FORMAT — Timeline:
- Open: "Here's what happened ${dateRange ? `during ${dateRange.label}` : ''}:"
- Chronological — bold dates: "**Mon, Mar 24** — event [n]"
- ## DATE headers for multiple days`

    case 'entity':
      return `FORMAT — Profile:
## Who They Are
## Recent Interactions
## Decisions & Commitments
## Open Items
Cite [n] after each fact.`

    case 'synthesis':
      return `FORMAT — Synthesis:
- First line: who was involved and when (e.g. "Meeting with Brian, Anjan, Misha on Mar 16, 2026 [1]:")
- ## headers by theme
- Bullet every detail: names, facts, decisions, outcomes — exhaustive
- Bold critical items: **audit target: 27th**
- [n] citations on key facts — do NOT repeat date on every bullet
- End: ## Key Takeaways (2-3 sentences)`

    case 'aggregation':
      return `FORMAT — Numerical Aggregation:
- Open with the direct answer bolded: **Total: $12,500** or **Count: 7 meetings**
- Show the breakdown: each number, what it's for, date if known, [n] citation
- If summing: show the math — "$5,000 [1] + $3,500 [2] + $4,000 [3] = **$12,500**"
- Note ambiguities: different currencies, overlapping periods, unclear duplicates`

    case 'factual':
    default:
      return `FORMAT — Direct:
- 1-3 sentences, precise
- Quote exact value, add [n] citation`
  }
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

    // Check subscription tier and enforce daily AI query limit for free users
    const sub = await getUserSubscription(auth.userId)
    if (!sub.isSmartActive) {
      const today = new Date().toISOString().slice(0, 10)
      const usage = await db.query.usageDaily.findFirst({
        where: and(
          eq(schema.usageDaily.userId, auth.userId),
          eq(schema.usageDaily.date, today),
        ),
      })
      const used = usage?.opsCount ?? 0
      if (used >= AI_QUERY_LIMIT) {
        return Response.json(
          { error: 'quota_exceeded', used, limit: AI_QUERY_LIMIT },
          { status: 429 },
        )
      }
      await recordUsage(null, auth.userId, 'registered', 'ai_query')
    }

    const { question } = await req.json() as { question: string }
    if (!question) {
      return new Response(JSON.stringify({ error: 'question is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const memberships = await db.query.workspaceMembers.findMany({
      where: eq(schema.workspaceMembers.userId, auth.userId),
    })
    const allWorkspaceIds = memberships.map(m => m.workspaceId)

    if (allWorkspaceIds.length === 0) {
      return new Response("You don't have any memories yet.", {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }

    const workspaces = await db.query.workspaces.findMany({
      where: inArray(schema.workspaces.id, allWorkspaceIds),
    })
    const wsNameMap = new Map(workspaces.map(ws => [ws.id, ws.name]))

    const keywords = extractKeywords(question)
    const properNouns = extractProperNouns(question)
    const lowerQ = question.toLowerCase()
    const dateRange = extractDateRange(question)

    const llm = getAskLLM()
    // Start all LLM analysis tasks in parallel with SQL retrieval
    const intentPromise = classifyIntentLLM(question, llm)
    const expansionPromise = expandQueryTerms(question, llm)
    const multiHopPromise = detectMultiHop(question, llm)

    // Fetch recent records across ALL workspaces
    const recentRecords = await db.query.records.findMany({
      where: inArray(schema.records.workspaceId, allWorkspaceIds),
      orderBy: desc(schema.records.createdAt),
      limit: 150,
    })

    // Keyword search using original question terms
    let keywordRecords: typeof recentRecords = []
    if (keywords.length > 0) {
      const keywordConditions = keywords.flatMap(kw => [
        like(schema.records.title, `%${kw}%`),
        like(schema.records.summary, `%${kw}%`),
        like(schema.records.tags, `%${kw}%`),
        like(schema.records.content, `%${kw}%`),
      ])
      keywordRecords = await db.query.records.findMany({
        where: and(
          inArray(schema.records.workspaceId, allWorkspaceIds),
          or(...keywordConditions),
        ),
        limit: 50,
      })
    }

    // Query expansion: extra SQL pass with alternate phrasings
    const expandedPhrases = await expansionPromise
    let expandedRecords: typeof recentRecords = []
    if (expandedPhrases.length > 0) {
      const expandedKeywords = Array.from(new Set(
        expandedPhrases.flatMap(phrase => extractKeywords(phrase))
          .filter(kw => !keywords.includes(kw))
      ))
      if (expandedKeywords.length > 0) {
        const expandedConditions = expandedKeywords.flatMap(kw => [
          like(schema.records.title, `%${kw}%`),
          like(schema.records.summary, `%${kw}%`),
          like(schema.records.content, `%${kw}%`),
        ])
        expandedRecords = await db.query.records.findMany({
          where: and(
            inArray(schema.records.workspaceId, allWorkspaceIds),
            or(...expandedConditions),
          ),
          limit: 30,
        })
      }
    }

    // Merge: keyword + expanded + recent, deduplicated
    const seenIds = new Set<string>()
    const allRecords: typeof recentRecords = []
    for (const r of [...keywordRecords, ...expandedRecords, ...recentRecords]) {
      if (!seenIds.has(r.id)) {
        seenIds.add(r.id)
        allRecords.push(r)
      }
    }

    // Score by keyword + entity match
    const scored = allRecords.map(r => {
      const searchText = [r.title, r.summary || '', r.tags || '', r.content || ''].join(' ').toLowerCase()
      const titleLower = r.title.toLowerCase()
      let score = 0

      for (const kw of keywords) {
        if (titleLower.includes(kw)) score += 2
        else if (searchText.includes(kw)) score++
      }

      // Proper noun entity boost — with fuzzy name variant matching
      for (const pn of properNouns) {
        const variants = getNameVariants(pn)
        if (titleLower.includes(pn)) score += 10
        else if (variants.some(v => v !== pn && titleLower.includes(v))) score += 7
        else if (searchText.includes(pn)) score += 5
        else if (variants.some(v => v !== pn && searchText.includes(v))) score += 3
      }

      // Compressed summary boost
      const rTags: string[] = JSON.parse(r.tags || '[]')
      if (rTags.includes('auto-compressed')) score += 4
      if (rTags.includes('compressed:source')) score = Math.max(0, score - 3)

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

      // Temporal date range boost
      if (dateRange) {
        const recordDate = new Date(r.occurredAt || r.createdAt)
        if (recordDate >= dateRange.start && recordDate <= dateRange.end) {
          score += 8
        } else if (intent === 'temporal') {
          score = Math.max(0, score - 2)
        }
      }

      return { record: r, score }
    })

    // Await intent classification before it's needed for scoring + extraction
    const intent = await intentPromise

    // Semantic search
    try {
      const queryVector = await llm.embed(question)

      let similarities: Array<{ recordId: string; sim: number }>
      if (vecLoaded) {
        const wsSet = new Set(allWorkspaceIds)
        const rows = sqlite.prepare(`
          SELECT m.record_id, m.workspace_id, v.distance
          FROM vec_embeddings v
          JOIN vec_rowid_map m ON m.rowid = v.rowid
          WHERE v.embedding MATCH ?
            AND v.k = 50
          ORDER BY v.distance
        `).all(JSON.stringify(queryVector)) as Array<{ record_id: string; workspace_id: string; distance: number }>
        similarities = rows
          .filter(r => wsSet.has(r.workspace_id))
          .map(r => ({ recordId: r.record_id, sim: 1 - r.distance }))
          .filter(s => s.sim > 0.3)
          .slice(0, 10)
      } else {
        const allEmbeddings = await db.query.embeddings.findMany({
          where: inArray(schema.embeddings.workspaceId, allWorkspaceIds),
        })
        similarities = allEmbeddings
          .map(emb => ({
            recordId: emb.recordId,
            sim: cosineSimilarity(queryVector, JSON.parse(emb.vector) as number[]),
          }))
          .filter(s => s.sim > 0.3)
          .sort((a, b) => b.sim - a.sim)
          .slice(0, 10)
      }

      // Boost existing candidates
      for (const s of similarities) {
        const existing = scored.find(x => x.record.id === s.recordId)
        if (existing) existing.score += s.sim * 5
      }

      // Add new candidates from outside the recent window
      const existingIds = new Set(scored.map(x => x.record.id))
      const newSemanticIds = similarities
        .filter(s => !existingIds.has(s.recordId))
        .map(s => s.recordId)
        .slice(0, 5)

      if (newSemanticIds.length > 0) {
        const newRecords = await Promise.all(
          newSemanticIds.map(id => db.query.records.findFirst({ where: eq(schema.records.id, id) }))
        )
        for (let j = 0; j < newRecords.length; j++) {
          const r = newRecords[j]
          if (!r) continue
          const s = similarities.find(x => x.recordId === r.id)!
          scored.push({ record: r, score: s.sim * 5 })
        }
      }
    } catch {
      // Continue without semantic
    }

    scored.sort((a, b) => b.score - a.score)

    const topScore = scored[0]?.score ?? 0
    const minScore = properNouns.length > 0 ? Math.max(topScore * 0.4, 3) : 1
    // Step 1: widen to 20 — extraction pass filters to relevant ones
    let top = scored
      .filter(s => s.score >= minScore)
      .slice(0, 20)
      .map(s => s.record)

    // Deduplicate by normalized title
    const seenTitles = new Set<string>()
    top = top.filter(r => {
      const key = r.title.toLowerCase().replace(/\s+/g, ' ').trim()
      if (seenTitles.has(key)) return false
      seenTitles.add(key)
      return true
    })

    if (top.length === 0) top = allRecords.slice(0, 3)

    if (top.length === 0) {
      return new Response("You don't have any memories yet.", {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }

    // ── Multi-hop reasoning ──────────────────────────────────────────────────
    let multiHopContext = ''
    try {
      const multiHopPlan = await multiHopPromise
      if (multiHopPlan) {
        const hop1Snippet = top.slice(0, 10).map((r, i) =>
          `[${i + 1}] ${r.title}: ${(r.summary || r.content || '').slice(0, 300)}`
        ).join('\n')

        const hop1Prompt = `From these memories, answer this specific question in 1-2 sentences. Quote exact names and values.

Question: "${multiHopPlan.hop1}"

Memories:
${hop1Snippet}

Answer (or "not found" if genuinely absent):`

        const hop1Answer = await llm.generateText(hop1Prompt, 120)

        if (hop1Answer && !hop1Answer.toLowerCase().includes('not found')) {
          const hop2Keywords = extractKeywords(multiHopPlan.hop2 + ' ' + hop1Answer)
          const hop2ProperNouns = extractProperNouns(hop1Answer)
          const hop2Terms = Array.from(new Set([...hop2Keywords, ...hop2ProperNouns
            .flatMap(pn => getNameVariants(pn))]))

          if (hop2Terms.length > 0) {
            const hop2Conditions = hop2Terms.slice(0, 8).flatMap(kw => [
              like(schema.records.title, `%${kw}%`),
              like(schema.records.summary, `%${kw}%`),
              like(schema.records.content, `%${kw}%`),
            ])
            const hop2Records = await db.query.records.findMany({
              where: and(
                inArray(schema.records.workspaceId, allWorkspaceIds),
                or(...hop2Conditions),
              ),
              limit: 10,
            })
            const existingIds = new Set(top.map(r => r.id))
            const newFromHop2 = hop2Records.filter(r => !existingIds.has(r.id))
            if (newFromHop2.length > 0) {
              top = [...top.slice(0, 15), ...newFromHop2.slice(0, 5)]
            }
          }

          multiHopContext = `\n\nMULTI-HOP CHAIN:\nStep 1 — ${multiHopPlan.hop1}: ${hop1Answer}\nStep 2 — now answer: ${multiHopPlan.hop2} (using memories below)`
        }
      }
    } catch { /* fall through to single-hop */ }

    // Fetch knowledge graph links
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
          ? await Promise.all(Array.from(linkedIds).slice(0, 5).map(id =>
              db.query.records.findFirst({ where: eq(schema.records.id, id) })
            ))
          : []

        const allById = new Map<string, { title: string }>()
        for (const r of [...top, ...linkedRecords.filter(Boolean)]) {
          if (r) allById.set(r.id, { title: r.title })
        }

        const connectionLines = links.slice(0, 6).map(link => {
          const from = allById.get(link.fromRecordId)?.title || 'Unknown'
          const to = allById.get(link.toRecordId)?.title || 'Unknown'
          return `"${from}" → [${link.kind.replace(/_/g, ' ')}] → "${to}"`
        })

        if (connectionLines.length > 0) {
          linkedContext = '\n\n--- CONNECTIONS ---\n' + connectionLines.join('\n')
        }
      }
    } catch {
      // Continue without links
    }

    // ── Steps 2, 3, 4 & 5: Entity profiles + extraction + numbers + conflict detection ──
    const needsExtraction = top.length >= 5 &&
      (intent === 'synthesis' || intent === 'history' || intent === 'actions' || intent === 'temporal' || intent === 'aggregation')

    const memoriesSnippet = top.map((r, i) => {
      const dateStr = formatDate(r.occurredAt || r.createdAt)
      const body = [r.summary, r.content].filter(Boolean).join(' ').slice(0, 1200)
      return `[${i + 1}] ${r.type.toUpperCase()}: ${r.title}${dateStr ? ` (${dateStr})` : ''}\n${body}`
    }).join('\n\n---\n\n')

    const extractionPrompt = (needsExtraction && intent !== 'aggregation') ? `You are a fact extractor for a memory assistant.

QUESTION: ${question}

From each memory below, extract ONLY the facts that directly answer this question.
Output JSON: {"1": ["fact a", "fact b"], "3": ["fact c"]} — keys are memory numbers.
Omit a memory entirely if it has zero relevant facts. Be terse, 1-4 facts per memory max.

MEMORIES:
${memoriesSnippet}

JSON output only:` : null

    const numberExtractionPrompt = intent === 'aggregation' ? `You are a number extractor for a memory assistant.

QUESTION: ${question}

From each memory below, extract ALL numbers, amounts, counts, or financial figures relevant to this question.
For each: note value, unit/currency, what it refers to, date if known.
Output JSON: {"numbers": [{"value": 5000, "unit": "$", "description": "marketing spend Q1", "date": "2026-01", "memory": 1}]}

MEMORIES:
${memoriesSnippet}

JSON output only:` : null

    // Conflict detection prompt (multi-memory intents only)
    const needsConflictCheck = top.length >= 3 &&
      (intent === 'synthesis' || intent === 'history' || intent === 'entity' || intent === 'temporal')

    const conflictPrompt = needsConflictCheck ? `You are a contradiction detector for a memory assistant.

Find any DIRECT CONFLICTS or CONTRADICTIONS across these memories — cases where two memories state incompatible facts about the same subject.

Types to find:
- Date conflicts: same event has different dates in different memories
- Status conflicts: task/project described as done in one memory, pending in another
- Assignment conflicts: different people assigned to the same role/task
- Number conflicts: different figures for the same metric/amount
- Decision reversals: a decision was made, then changed or reversed

Output JSON: {"conflicts": [{"description": "brief description", "memories": [1, 3], "type": "date|status|assignment|number|decision"}]}
Return {"conflicts": []} if no clear contradictions exist. Only flag REAL conflicts, not just updates.

MEMORIES:
${memoriesSnippet}

JSON output only:` : null

    const [profilesResult, extractionResult, numberResult, conflictResult] = await Promise.all([
      (async () => {
        try {
          const allProfiles = await db.query.entityProfiles.findMany({
            where: inArray(schema.entityProfiles.workspaceId, allWorkspaceIds),
          })
          const questionLower = question.toLowerCase()
          return allProfiles.filter(ep => {
            if (!ep.summary || ep.summary.length <= 10) return false
            const variants = getNameVariants(ep.entityName)
            return variants.some(v => questionLower.includes(v))
          })
        } catch { return [] }
      })(),
      (async (): Promise<Record<string, string[]>> => {
        if (!extractionPrompt) return {}
        try {
          const raw = await llm.generateText(extractionPrompt, 1500)
          const jsonMatch = raw.match(/\{[\s\S]*\}/)
          return jsonMatch ? JSON.parse(jsonMatch[0]) : {}
        } catch { return {} }
      })(),
      (async (): Promise<Array<{ value: number; unit: string; description: string; date?: string; memory: number }>> => {
        if (!numberExtractionPrompt) return []
        try {
          const raw = await llm.generateText(numberExtractionPrompt, 800)
          const jsonMatch = raw.match(/\{[\s\S]*\}/)
          if (!jsonMatch) return []
          const parsed = JSON.parse(jsonMatch[0])
          return Array.isArray(parsed.numbers) ? parsed.numbers : []
        } catch { return [] }
      })(),
      (async (): Promise<Array<{ description: string; memories: number[]; type: string }>> => {
        if (!conflictPrompt) return []
        try {
          const raw = await llm.generateText(conflictPrompt, 600)
          const jsonMatch = raw.match(/\{[\s\S]*\}/)
          if (!jsonMatch) return []
          const parsed = JSON.parse(jsonMatch[0])
          return Array.isArray(parsed.conflicts) ? parsed.conflicts : []
        } catch { return [] }
      })(),
    ])

    const entityProfileContext = profilesResult.length > 0
      ? '\n\nENTITY PROFILES (pre-aggregated summaries):\n'
        + profilesResult.map(ep => `[${ep.entityName}] (${ep.entityType}): ${ep.summary}`).join('\n')
      : ''

    const numberContext = numberResult.length > 0
      ? '\n\nEXTRACTED NUMBERS (for aggregation):\n'
        + numberResult.map(n =>
            `• ${n.unit || ''}${n.value} — ${n.description}${n.date ? ` (${n.date})` : ''} [${n.memory}]`
          ).join('\n')
      : ''

    const conflictContext = conflictResult.length > 0
      ? '\n\n⚠️ CONFLICTS DETECTED (surface these explicitly in your answer):\n'
        + conflictResult.map(c =>
            `• [${c.type.toUpperCase()}] ${c.description} — see memories [${c.memories.join('] [')}]`
          ).join('\n')
      : ''

    const extractedFacts = extractionResult

    const hasExtractions = Object.keys(extractedFacts).length > 0

    // Build context — extracted facts when available, else full content
    const hasMultipleWorkspaces = allWorkspaceIds.length > 1
    const context = top.map((r, i) => {
      const memNum = String(i + 1)
      const isBoard = r.tags?.includes('board:')
      const typeLabel = (isBoard ? `${r.type}/board` : r.type).toUpperCase()
      const wsName = wsNameMap.get(r.workspaceId) || 'Unknown'
      const wsLabel = hasMultipleWorkspaces ? ` · ${wsName}` : ''
      const dateStr = formatDate(r.occurredAt || r.createdAt)
      const dateLine = dateStr ? `\nDate: ${dateStr}` : ''

      if (hasExtractions) {
        const facts = extractedFacts[memNum]
        if (!facts || facts.length === 0) return null // extraction said: irrelevant
        return `[${i + 1}] ${typeLabel}: ${r.title}${wsLabel}${dateLine}\n${facts.map(f => `• ${f}`).join('\n')}`
      }

      const stripMarkdown = (text: string) =>
        text
          .replace(/^#{1,6}\s+/gm, '')
          .replace(/\*\*([^*]+)\*\*/g, '$1')
          .replace(/\*([^*]+)\*/g, '$1')
          .replace(/^\s*[-*]\s+/gm, '• ')
          .replace(/\n{3,}/g, '\n\n')
          .trim()

      const summaryLine = r.summary ? `\nSummary: ${stripMarkdown(r.summary).slice(0, 1500)}` : ''
      const contentLine = !r.summary && r.content
        ? `\nContent: ${stripMarkdown(r.content).slice(0, 2000)}`
        : (r.content ? `\nContent: ${stripMarkdown(r.content).slice(0, 1500)}` : '')
      return `[${i + 1}] ${typeLabel}: ${r.title}${wsLabel}${dateLine}${summaryLine}${contentLine}`
    }).filter(Boolean).join('\n\n---\n\n')

    const wsInstruction = hasMultipleWorkspaces
      ? '\n- When a memory is from a specific workspace, attribute it: "In your [Workspace] workspace, ..."'
      : ''

    const depthInstruction = buildDepthInstruction(intent, dateRange)

    const prompt = `You are Reattend — the user's personal AI memory assistant and thinking partner.

CRITICAL RULES:
- Start directly — no preamble like "Based on your memories" or "From your notes"
- Quote names, dates, numbers, and IDs EXACTLY as written — never paraphrase
- ONLY reference memories that directly answer the question — completely IGNORE unrelated memories
- Never invent any fact not in the memories
- If not found: one sentence — "I don't have this saved yet."
- NEVER respond with questions. Write in declarative statements only. Never say "Can you confirm...", "How does X plan to...", "Will X be able to...". If a status is uncertain, write "Status unclear as of [date]."
- When asked about what someone HAS DONE (past), focus on completed work. When asked about what someone NEEDS TO DO (pending), focus only on open tasks.
- NEVER reproduce memory content verbatim — always synthesise into clean prose. No raw headers, no markdown in your answer.${wsInstruction}

${depthInstruction}
${entityProfileContext}${numberContext}${conflictContext}${multiHopContext}
MEMORIES:
${context}${linkedContext}

USER QUESTION: ${question}

ANSWER:`

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
