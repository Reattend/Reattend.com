import { z } from 'zod'

// Provider-agnostic LLM interface
export interface LLMProvider {
  generateJSON<T>(prompt: string, schema: z.ZodType<T>): Promise<T>
  generateText(prompt: string): Promise<string>
  generateTextStream(prompt: string): Promise<ReadableStream<Uint8Array>>
  embed(text: string): Promise<number[]>
}

// ─── Normalize LLM output ───────────────────────────────
// Models sometimes output slightly different structures
function normalizeTriageOutput(raw: any): any {
  if (!raw || typeof raw !== 'object') return raw

  // Fix entities: convert {"people": [...], "organizations": [...]} to [{kind, name}]
  if (raw.entities && !Array.isArray(raw.entities)) {
    const entities: Array<{ kind: string; name: string }> = []
    const kindMap: Record<string, string> = {
      people: 'person', persons: 'person', person: 'person',
      organizations: 'org', organisation: 'org', orgs: 'org', org: 'org',
      topics: 'topic', topic: 'topic',
      products: 'product', product: 'product',
      projects: 'project', project: 'project',
    }
    for (const [key, values] of Object.entries(raw.entities)) {
      const kind = kindMap[key.toLowerCase()] || 'topic'
      if (Array.isArray(values)) {
        for (const v of values) {
          if (typeof v === 'string') {
            entities.push({ kind, name: v })
          } else if (v && typeof v === 'object' && v.name) {
            entities.push({ kind: v.kind || kind, name: v.name })
          }
        }
      }
    }
    raw.entities = entities
  }

  // Ensure entities items have valid kind values
  if (Array.isArray(raw.entities)) {
    const validKinds = ['person', 'org', 'topic', 'product', 'project', 'custom']
    raw.entities = raw.entities.map((e: any) => {
      if (typeof e === 'string') return { kind: 'topic', name: e }
      if (!e || typeof e !== 'object') return null
      const kind = validKinds.includes(e.kind) ? e.kind : 'topic'
      return { kind, name: e.name || String(e) }
    }).filter(Boolean)
  }

  // Fix record_type: normalize to valid enum values
  if (raw.record_type) {
    const typeMap: Record<string, string> = {
      'meeting summary': 'meeting', 'meeting_summary': 'meeting',
      'task': 'tasklike', 'todo': 'tasklike', 'action item': 'tasklike',
      'information': 'context', 'info': 'context', 'background': 'context',
      'observation': 'insight', 'learning': 'insight', 'finding': 'insight',
    }
    const normalized = typeMap[raw.record_type.toLowerCase()]
    if (normalized) raw.record_type = normalized
  }

  // Fix proposed_projects: convert strings to objects
  if (Array.isArray(raw.proposed_projects)) {
    raw.proposed_projects = raw.proposed_projects.map((p: any) => {
      if (typeof p === 'string') return { name: p, confidence: 0.7, reason: 'Mentioned in content' }
      if (p && typeof p === 'object' && p.name) return {
        name: p.name,
        confidence: typeof p.confidence === 'number' ? p.confidence : 0.7,
        reason: p.reason || 'Related to content',
      }
      return null
    }).filter(Boolean)
  }

  // Fix suggested_links: ensure proper structure
  if (Array.isArray(raw.suggested_links)) {
    raw.suggested_links = raw.suggested_links.map((l: any) => {
      if (typeof l === 'string') return { query_text: l, reason: 'Related content' }
      if (l && typeof l === 'object' && l.query_text) return l
      return null
    }).filter(Boolean)
  }

  // Ensure tags is an array of strings
  if (!Array.isArray(raw.tags)) raw.tags = []
  raw.tags = raw.tags.filter((t: any) => typeof t === 'string')

  // Ensure confidence is a number
  if (typeof raw.confidence !== 'number') raw.confidence = 0.7

  // Ensure dates is an array of objects with date, label, type
  if (!Array.isArray(raw.dates)) raw.dates = []
  raw.dates = raw.dates.map((d: any) => {
    if (typeof d === 'string') return { date: d, label: d, type: 'event' }
    if (d && typeof d === 'object' && d.date) return {
      date: d.date,
      label: d.label || d.description || d.date,
      type: d.type || 'event',
    }
    return null
  }).filter(Boolean)

  return raw
}

// ─── Groq Provider (LLM) ───────────────────────────────
class GroqProvider {
  private apiKey: string
  private model: string

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey
    this.model = model || 'llama-3.3-70b-versatile'
  }

  async generateJSON<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. Respond ONLY with valid JSON matching the requested schema. No markdown, no code fences, no explanation, just raw JSON.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
        max_tokens: 2048,
      }),
      signal: AbortSignal.timeout(30_000),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Groq generateJSON failed (${res.status}): ${errText}`)
    }

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content || '{}'
    const parsed = JSON.parse(text)
    const normalized = normalizeTriageOutput(parsed)
    return schema.parse(normalized)
  }

  async generateText(prompt: string): Promise<string> {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant for the Reattend memory system. Be concise and specific.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 512,
      }),
      signal: AbortSignal.timeout(30_000),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Groq generateText failed (${res.status}): ${errText}`)
    }

    const data = await res.json()
    return data.choices?.[0]?.message?.content || ''
  }

  async generateTextStream(prompt: string): Promise<ReadableStream<Uint8Array>> {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: 'Be concise.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 300,
        stream: true,
      }),
      signal: AbortSignal.timeout(30_000),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Groq generateTextStream failed (${res.status}): ${errText}`)
    }

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    const encoder = new TextEncoder()

    return new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          const { done, value } = await reader.read()
          if (done) {
            controller.close()
            return
          }
          const chunk = decoder.decode(value, { stream: true })
          // Groq streams SSE: data: {...}\n\n
          for (const line of chunk.split('\n')) {
            const trimmed = line.trim()
            if (!trimmed || !trimmed.startsWith('data: ')) continue
            const jsonStr = trimmed.slice(6)
            if (jsonStr === '[DONE]') {
              controller.close()
              return
            }
            try {
              const json = JSON.parse(jsonStr)
              const token = json.choices?.[0]?.delta?.content
              if (token) {
                controller.enqueue(encoder.encode(token))
              }
            } catch {
              // skip malformed lines
            }
          }
        } catch (err) {
          controller.error(err)
        }
      },
    })
  }
}

// ─── FastEmbed Singleton ─────────────────────────────────
// Lazily initialized local embedding model (nomic-embed-text-v1.5, 768-dim)
let _fastEmbedInstance: any = null
let _fastEmbedInitPromise: Promise<any> | null = null

async function getFastEmbed(): Promise<any> {
  if (_fastEmbedInstance) return _fastEmbedInstance
  if (_fastEmbedInitPromise) return _fastEmbedInitPromise

  _fastEmbedInitPromise = (async () => {
    const { FlagEmbedding, EmbeddingModel } = await import('fastembed')
    const model = await FlagEmbedding.init({
      model: EmbeddingModel.BGEBaseENV15,
      cacheDir: 'data/models',
    })
    _fastEmbedInstance = model
    return model
  })()

  return _fastEmbedInitPromise
}

// ─── Combined Provider ──────────────────────────────────
// Uses Groq for LLM + fastembed (local) for embeddings
class GroqFastEmbedProvider implements LLMProvider {
  private groq: GroqProvider

  constructor(groqApiKey: string, groqModel?: string) {
    this.groq = new GroqProvider(groqApiKey, groqModel)
  }

  generateJSON<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
    return this.groq.generateJSON(prompt, schema)
  }

  generateText(prompt: string): Promise<string> {
    return this.groq.generateText(prompt)
  }

  generateTextStream(prompt: string): Promise<ReadableStream<Uint8Array>> {
    return this.groq.generateTextStream(prompt)
  }

  async embed(text: string): Promise<number[]> {
    const model = await getFastEmbed()
    const truncated = text.slice(0, 8000)
    const gen = model.embed([truncated])
    for await (const batch of gen) {
      return Array.from(batch[0])
    }
    return []
  }
}

// ─── Ollama Provider (fallback) ─────────────────────────
class OllamaProvider implements LLMProvider {
  private baseUrl: string
  private model: string
  private embedModel: string

  constructor(baseUrl: string, model?: string, embedModel?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.model = model || 'llama3.2:3b'
    this.embedModel = embedModel || 'nomic-embed-text'
  }

  async generateJSON<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. Respond ONLY with valid JSON matching the requested schema. No markdown, no code fences, no explanation, just raw JSON.',
          },
          { role: 'user', content: prompt },
        ],
        stream: false,
        options: { temperature: 0.3 },
        format: 'json',
      }),
      signal: AbortSignal.timeout(120_000),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Ollama generateJSON failed (${res.status}): ${errText}`)
    }

    const data = await res.json()
    const text = data.message?.content || '{}'
    const parsed = JSON.parse(text)
    const normalized = normalizeTriageOutput(parsed)
    return schema.parse(normalized)
  }

  async generateText(prompt: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant for the Reattend memory system. Be concise and specific.',
          },
          { role: 'user', content: prompt },
        ],
        stream: false,
        options: { temperature: 0.5 },
      }),
      signal: AbortSignal.timeout(120_000),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Ollama generateText failed (${res.status}): ${errText}`)
    }

    const data = await res.json()
    return data.message?.content || ''
  }

  async generateTextStream(prompt: string): Promise<ReadableStream<Uint8Array>> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: 'Be concise.' },
          { role: 'user', content: prompt },
        ],
        stream: true,
        options: { temperature: 0.5, num_predict: 200 },
      }),
      signal: AbortSignal.timeout(120_000),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Ollama generateTextStream failed (${res.status}): ${errText}`)
    }

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    const encoder = new TextEncoder()

    return new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          const { done, value } = await reader.read()
          if (done) {
            controller.close()
            return
          }
          const chunk = decoder.decode(value, { stream: true })
          for (const line of chunk.split('\n')) {
            if (!line.trim()) continue
            try {
              const json = JSON.parse(line)
              if (json.message?.content) {
                controller.enqueue(encoder.encode(json.message.content))
              }
              if (json.done) {
                controller.close()
                return
              }
            } catch {
              // skip malformed lines
            }
          }
        } catch (err) {
          controller.error(err)
        }
      },
    })
  }

  async embed(text: string): Promise<number[]> {
    const res = await fetch(`${this.baseUrl}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.embedModel,
        input: text.slice(0, 8000),
      }),
      signal: AbortSignal.timeout(60_000),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Ollama embed failed (${res.status}): ${errText}`)
    }

    const data = await res.json()
    return data.embeddings[0]
  }
}

// ─── Provider Factory ───────────────────────────────────
export function getLLM(): LLMProvider {
  // Prefer Groq + fastembed (local embeddings, no external embedding API needed)
  const groqKey = process.env.GROQ_API_KEY
  if (groqKey) {
    return new GroqFastEmbedProvider(groqKey, process.env.GROQ_MODEL)
  }

  // Fallback to Ollama (self-hosted)
  const baseUrl = process.env.OLLAMA_BASE_URL
  if (baseUrl) {
    return new OllamaProvider(
      baseUrl,
      process.env.OLLAMA_MODEL,
      process.env.OLLAMA_EMBED_MODEL,
    )
  }

  throw new Error('No AI provider configured. Set GROQ_API_KEY or OLLAMA_BASE_URL.')
}
