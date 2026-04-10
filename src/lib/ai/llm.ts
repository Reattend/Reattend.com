import { z } from 'zod'

// Provider-agnostic LLM interface
export interface LLMProvider {
  generateJSON<T>(prompt: string, schema: z.ZodType<T>): Promise<T>
  generateText(prompt: string, maxTokens?: number): Promise<string>
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

  async generateText(prompt: string, maxTokens?: number): Promise<string> {
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
        max_tokens: maxTokens ?? 512,
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
          { role: 'system', content: 'You are a precise personal memory assistant. Follow every instruction in the user message exactly — including structure, formatting, and depth. Never truncate your answer.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
        stream: true,
      }),
      signal: AbortSignal.timeout(90_000),
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
    try {
      const { FlagEmbedding, EmbeddingModel } = await import('fastembed')
      const initPromise = FlagEmbedding.init({
        model: EmbeddingModel.BGEBaseENV15,
        cacheDir: 'data/models',
      })
      // Timeout after 20s — prevents route from hanging if model loading is stuck
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('FastEmbed init timed out after 20s')), 20_000)
      )
      const model = await Promise.race([initPromise, timeout])
      _fastEmbedInstance = model
      return model
    } catch (err) {
      // Reset so next request can retry instead of reusing a rejected promise
      _fastEmbedInitPromise = null
      throw err
    }
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

  generateText(prompt: string, maxTokens?: number): Promise<string> {
    return this.groq.generateText(prompt, maxTokens)
  }

  generateTextStream(prompt: string): Promise<ReadableStream<Uint8Array>> {
    return this.groq.generateTextStream(prompt)
  }

  async embed(text: string): Promise<number[]> {
    const model = await getFastEmbed()
    const truncated = text.slice(0, 8000)
    const embedPromise = (async () => {
      const gen = model.embed([truncated])
      for await (const batch of gen) {
        return Array.from(batch[0]) as number[]
      }
      return [] as number[]
    })()
    const timeout = new Promise<number[]>((_, reject) =>
      setTimeout(() => reject(new Error('Embed timed out after 15s')), 15_000)
    )
    return Promise.race([embedPromise, timeout])
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

  async generateText(prompt: string, maxTokens?: number): Promise<string> {
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
        options: { temperature: 0.5, num_predict: maxTokens ?? 512 },
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

// ─── OpenAI Provider (for Ask — primary) ─────────────────────
class OpenAIProvider {
  private apiKey: string
  private model: string

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey
    this.model = model || 'gpt-4o-mini'
  }

  async generateJSON<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: 'Respond ONLY with valid JSON. No markdown, no code fences, no explanation, just raw JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
        max_tokens: 2048,
      }),
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) throw new Error(`OpenAI generateJSON failed (${res.status})`)
    const data = await res.json()
    const text = data.choices?.[0]?.message?.content || '{}'
    const parsed = JSON.parse(text)
    const normalized = normalizeTriageOutput(parsed)
    return schema.parse(normalized)
  }

  async generateText(prompt: string, maxTokens?: number): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant for the Reattend memory system. Be concise and specific.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: maxTokens ?? 1024,
      }),
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) throw new Error(`OpenAI generateText failed (${res.status})`)
    const data = await res.json()
    return data.choices?.[0]?.message?.content || ''
  }

  async generateTextStream(prompt: string): Promise<ReadableStream<Uint8Array>> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a precise personal memory assistant. Follow every instruction in the user message exactly — including structure, formatting, and depth. Never truncate your answer.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
        stream: true,
      }),
      signal: AbortSignal.timeout(120_000),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`OpenAI generateTextStream failed (${res.status}): ${errText}`)
    }

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    const encoder = new TextEncoder()

    return new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          const { done, value } = await reader.read()
          if (done) { controller.close(); return }
          const chunk = decoder.decode(value, { stream: true })
          for (const line of chunk.split('\n')) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data: ')) continue
            const jsonStr = trimmed.slice(6)
            if (jsonStr === '[DONE]') { controller.close(); return }
            try {
              const json = JSON.parse(jsonStr)
              const token = json.choices?.[0]?.delta?.content
              if (token) controller.enqueue(encoder.encode(token))
            } catch { /* skip malformed lines */ }
          }
        } catch (err) { controller.error(err) }
      },
    })
  }
}

// ─── OpenAI + FastEmbed ───────────────────────────────────────
class OpenAIFastEmbedProvider implements LLMProvider {
  private openai: OpenAIProvider

  constructor(apiKey: string, model?: string) {
    this.openai = new OpenAIProvider(apiKey, model)
  }

  generateJSON<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
    return this.openai.generateJSON(prompt, schema)
  }

  generateText(prompt: string, maxTokens?: number): Promise<string> {
    return this.openai.generateText(prompt, maxTokens)
  }

  generateTextStream(prompt: string): Promise<ReadableStream<Uint8Array>> {
    return this.openai.generateTextStream(prompt)
  }

  async embed(text: string): Promise<number[]> {
    const model = await getFastEmbed()
    const truncated = text.slice(0, 8000)
    const embedPromise = (async () => {
      const gen = model.embed([truncated])
      for await (const batch of gen) {
        return Array.from(batch[0]) as number[]
      }
      return [] as number[]
    })()
    const timeout = new Promise<number[]>((_, reject) =>
      setTimeout(() => reject(new Error('Embed timed out after 15s')), 15_000)
    )
    return Promise.race([embedPromise, timeout])
  }
}

// ─── Rabbit Provider (proprietary memory AI) ─────────────────
// Rabbit serves an OpenAI-compatible API at RABBIT_API_URL.
// Uses the same /v1/chat/completions format but with Rabbit's
// 15 specialized memory signals under the hood.
class RabbitProvider {
  private apiUrl: string
  private apiKey: string

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl.replace(/\/$/, '')
    this.apiKey = apiKey
  }

  async generateJSON<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
    const res = await fetch(`${this.apiUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'rabbit-v1.3',
        messages: [
          { role: 'system', content: 'Respond ONLY with valid JSON. No markdown, no code fences, no explanation.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.05,
        max_tokens: 512,
      }),
      signal: AbortSignal.timeout(60_000),
    })
    if (!res.ok) throw new Error(`Rabbit generateJSON failed (${res.status})`)
    const data = await res.json()
    const text = data.choices?.[0]?.message?.content || '{}'
    const parsed = JSON.parse(text)
    const normalized = normalizeTriageOutput(parsed)
    return schema.parse(normalized)
  }

  async generateText(prompt: string, maxTokens?: number): Promise<string> {
    const res = await fetch(`${this.apiUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'rabbit-v1.3',
        messages: [
          { role: 'system', content: 'You are Rabbit, a precise organizational memory assistant. Follow every instruction exactly.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: maxTokens ?? 1024,
      }),
      signal: AbortSignal.timeout(120_000),
    })
    if (!res.ok) throw new Error(`Rabbit generateText failed (${res.status})`)
    const data = await res.json()
    return data.choices?.[0]?.message?.content || ''
  }

  async generateTextStream(prompt: string): Promise<ReadableStream<Uint8Array>> {
    // Rabbit doesn't support streaming yet — fall back to non-streaming
    // and wrap the result as a stream for compatibility
    const text = await this.generateText(prompt)
    const encoder = new TextEncoder()
    return new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(text))
        controller.close()
      },
    })
  }
}

class RabbitFastEmbedProvider implements LLMProvider {
  private rabbit: RabbitProvider

  constructor(apiUrl: string, apiKey: string) {
    this.rabbit = new RabbitProvider(apiUrl, apiKey)
  }

  generateJSON<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
    return this.rabbit.generateJSON(prompt, schema)
  }

  generateText(prompt: string, maxTokens?: number): Promise<string> {
    return this.rabbit.generateText(prompt, maxTokens)
  }

  generateTextStream(prompt: string): Promise<ReadableStream<Uint8Array>> {
    return this.rabbit.generateTextStream(prompt)
  }

  async embed(text: string): Promise<number[]> {
    const model = await getFastEmbed()
    const truncated = text.slice(0, 8000)
    const embedPromise = (async () => {
      const gen = model.embed([truncated])
      for await (const batch of gen) {
        return Array.from(batch[0]) as number[]
      }
      return [] as number[]
    })()
    const timeout = new Promise<number[]>((_, reject) =>
      setTimeout(() => reject(new Error('Embed timed out after 15s')), 15_000)
    )
    return Promise.race([embedPromise, timeout])
  }
}

// ─── Claude Provider (for Ask — secondary) ───────────────────
class ClaudeProvider {
  private apiKey: string
  private model: string

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey
    this.model = model || 'claude-sonnet-4-6'
  }

  async generateJSON<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': this.apiKey,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt + '\n\nRespond with JSON only.' }],
      }),
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) throw new Error(`Claude generateJSON failed (${res.status})`)
    const data = await res.json()
    const text = data.content?.[0]?.text || '{}'
    const parsed = JSON.parse(text)
    const normalized = normalizeTriageOutput(parsed)
    return schema.parse(normalized)
  }

  async generateText(prompt: string, maxTokens?: number): Promise<string> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': this.apiKey,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: maxTokens ?? 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) throw new Error(`Claude generateText failed (${res.status})`)
    const data = await res.json()
    return data.content?.[0]?.text || ''
  }

  async generateTextStream(prompt: string): Promise<ReadableStream<Uint8Array>> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': this.apiKey,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 2000,
        stream: true,
        system: 'You are a precise personal memory assistant. Follow every instruction in the user message exactly — including structure, formatting, and depth. Never truncate your answer.',
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(60_000),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Claude generateTextStream failed (${res.status}): ${errText}`)
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
            const trimmed = line.trim()
            if (!trimmed.startsWith('data: ')) continue
            const jsonStr = trimmed.slice(6)
            try {
              const json = JSON.parse(jsonStr)
              if (json.type === 'content_block_delta' && json.delta?.type === 'text_delta') {
                const token = json.delta.text
                if (token) controller.enqueue(encoder.encode(token))
              }
              if (json.type === 'message_stop') {
                controller.close()
                return
              }
            } catch { /* skip malformed SSE lines */ }
          }
        } catch (err) {
          controller.error(err)
        }
      },
    })
  }
}

// ─── Claude + FastEmbed (Ask queries) ────────────────────────
class ClaudeFastEmbedProvider implements LLMProvider {
  private claude: ClaudeProvider

  constructor(anthropicApiKey: string, claudeModel?: string) {
    this.claude = new ClaudeProvider(anthropicApiKey, claudeModel)
  }

  generateJSON<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
    return this.claude.generateJSON(prompt, schema)
  }

  generateText(prompt: string, maxTokens?: number): Promise<string> {
    return this.claude.generateText(prompt, maxTokens)
  }

  generateTextStream(prompt: string): Promise<ReadableStream<Uint8Array>> {
    return this.claude.generateTextStream(prompt)
  }

  async embed(text: string): Promise<number[]> {
    const model = await getFastEmbed()
    const truncated = text.slice(0, 8000)
    const embedPromise = (async () => {
      const gen = model.embed([truncated])
      for await (const batch of gen) {
        return Array.from(batch[0]) as number[]
      }
      return [] as number[]
    })()
    const timeout = new Promise<number[]>((_, reject) =>
      setTimeout(() => reject(new Error('Embed timed out after 15s')), 15_000)
    )
    return Promise.race([embedPromise, timeout])
  }
}

// ─── Provider Factory (pipeline jobs) ────────────────────────
// Groq is fast and excellent for structured JSON extraction (triage, linking, summaries).
// Keep this for all background agents — no need for Claude here.
export function getLLM(): LLMProvider {
  // Rabbit first (if configured) — proprietary memory AI
  const rabbitUrl = process.env.RABBIT_API_URL
  const rabbitKey = process.env.RABBIT_API_KEY
  if (rabbitUrl && rabbitKey) {
    return new RabbitFastEmbedProvider(rabbitUrl, rabbitKey)
  }
  const groqKey = process.env.GROQ_API_KEY
  if (groqKey) {
    return new GroqFastEmbedProvider(groqKey, process.env.GROQ_MODEL)
  }
  const baseUrl = process.env.OLLAMA_BASE_URL
  if (baseUrl) {
    return new OllamaProvider(baseUrl, process.env.OLLAMA_MODEL, process.env.OLLAMA_EMBED_MODEL)
  }
  throw new Error('No AI provider configured. Set RABBIT_API_URL, GROQ_API_KEY, or OLLAMA_BASE_URL.')
}

// ─── Pre-processing LLM (always fast) ────────────────────────
// Used for intent classification, query expansion, multi-hop, extraction, conflict detection.
// Prefers Groq (~200-400ms) over OpenAI to keep time-to-first-token low.
// Falls back to getAskLLM() if Groq is not configured.
export function getPreProcessingLLM(): LLMProvider {
  // Rabbit for preprocessing if configured
  const rabbitUrl = process.env.RABBIT_API_URL
  const rabbitKey = process.env.RABBIT_API_KEY
  if (rabbitUrl && rabbitKey) {
    return new RabbitFastEmbedProvider(rabbitUrl, rabbitKey)
  }
  const groqKey = process.env.GROQ_API_KEY
  if (groqKey) {
    return new GroqFastEmbedProvider(groqKey, process.env.GROQ_MODEL)
  }
  return getAskLLM()
}

// ─── Ask-specific provider factory ───────────────────────────
// Priority: OpenAI (gpt-4o) → Anthropic (claude-sonnet) → Groq → Ollama
// OpenAI and Claude are both excellent for reasoning/synthesis.
// Groq (Llama-3.3-70b) handles all background pipeline jobs (triage, linking, summaries).
export function getAskLLM(): LLMProvider {
  // Rabbit first for Ask if configured
  const rabbitUrl = process.env.RABBIT_API_URL
  const rabbitKey = process.env.RABBIT_API_KEY
  if (rabbitUrl && rabbitKey) {
    return new RabbitFastEmbedProvider(rabbitUrl, rabbitKey)
  }
  const openaiKey = process.env.OPENAI_API_KEY
  if (openaiKey) {
    return new OpenAIFastEmbedProvider(openaiKey, process.env.OPENAI_MODEL)
  }
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (anthropicKey) {
    return new ClaudeFastEmbedProvider(anthropicKey, process.env.CLAUDE_MODEL)
  }
  const groqKey = process.env.GROQ_API_KEY
  if (groqKey) {
    return new GroqFastEmbedProvider(groqKey, process.env.GROQ_MODEL)
  }
  const baseUrl = process.env.OLLAMA_BASE_URL
  if (baseUrl) {
    return new OllamaProvider(baseUrl, process.env.OLLAMA_MODEL, process.env.OLLAMA_EMBED_MODEL)
  }
  throw new Error('No AI provider configured. Set RABBIT_API_URL, OPENAI_API_KEY, ANTHROPIC_API_KEY, GROQ_API_KEY, or OLLAMA_BASE_URL.')
}
