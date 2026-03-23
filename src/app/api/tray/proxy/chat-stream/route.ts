import { NextRequest } from 'next/server'
import { resolveAuth, checkAllowed, recordUsage, rateLimitResponse } from '@/lib/metering'

/**
 * POST /api/tray/proxy/chat-stream
 * Proxies chat completion requests to Groq with streaming.
 * Accepts X-Device-Id (anonymous) or Authorization: Bearer rat_xxx (authenticated).
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await resolveAuth(req.headers)

    if (!auth.deviceId && !auth.userId) {
      return Response.json({ error: 'X-Device-Id header or Authorization required' }, { status: 401 })
    }

    // Check usage limits
    const usage = await checkAllowed(auth.deviceId, auth.userId, auth.tier)
    if (!usage.allowed) {
      return rateLimitResponse(auth.tier, usage.used, usage.limit)
    }

    const body = await req.json()
    const { messages, model, temperature, max_tokens } = body

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'messages array is required' }, { status: 400 })
    }

    const groqKey = process.env.GROQ_API_KEY
    if (!groqKey) {
      return Response.json({ error: 'AI provider not configured' }, { status: 503 })
    }

    // Proxy to Groq with streaming
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: model || process.env.GROQ_CHAT_MODEL || 'llama-3.3-70b-versatile',
        messages,
        temperature: temperature ?? 0.5,
        max_tokens: max_tokens ?? 512,
        stream: true,
      }),
      signal: AbortSignal.timeout(60_000),
    })

    if (!groqRes.ok) {
      const errText = await groqRes.text()
      return Response.json(
        { error: `AI provider error (${groqRes.status})`, details: errText },
        { status: groqRes.status >= 500 ? 502 : groqRes.status },
      )
    }

    // Record usage
    await recordUsage(auth.deviceId, auth.userId, auth.tier, 'chat')

    // Stream the response through
    return new Response(groqRes.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
        'X-Usage-Remaining': String(Math.max(0, usage.remaining - 1)),
        'X-Usage-Tier': auth.tier,
      },
    })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
