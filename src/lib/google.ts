// Google OAuth + Gmail API helpers

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!

function getRedirectUri() {
  const base = process.env.NEXTAUTH_URL || process.env.APP_URL || 'http://localhost:3000'
  return `${base}/api/integrations/gmail/callback`
}

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
]

export function getGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: getRedirectUri(),
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Token exchange failed: ${err}`)
  }
  return res.json()
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string
  expires_in: number
}> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Token refresh failed: ${err}`)
  }
  return res.json()
}

export async function getValidAccessToken(refreshToken: string, currentToken: string | null, expiresAt: string | null): Promise<string> {
  // If current token is still valid (with 5min buffer), use it
  if (currentToken && expiresAt && new Date(expiresAt).getTime() > Date.now() + 5 * 60 * 1000) {
    return currentToken
  }
  const result = await refreshAccessToken(refreshToken)
  return result.access_token
}

// Gmail API types
interface GmailMessage {
  id: string
  threadId: string
  snippet: string
  payload: {
    headers: Array<{ name: string; value: string }>
    body?: { data?: string }
    parts?: Array<{
      mimeType: string
      body?: { data?: string }
      parts?: Array<{ mimeType: string; body?: { data?: string } }>
    }>
  }
  internalDate: string
}

interface GmailListResponse {
  messages?: Array<{ id: string; threadId: string }>
  nextPageToken?: string
  resultSizeEstimate?: number
}

export async function listMessages(accessToken: string, query: string, maxResults: number = 50): Promise<GmailListResponse> {
  const params = new URLSearchParams({ q: query, maxResults: String(maxResults) })
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gmail list failed: ${err}`)
  }
  return res.json()
}

export async function getMessage(accessToken: string, messageId: string): Promise<GmailMessage> {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gmail get message failed: ${err}`)
  }
  return res.json()
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(base64, 'base64').toString('utf-8')
}

export function extractEmailBody(message: GmailMessage): string {
  // Try to get plain text body
  if (message.payload.body?.data) {
    return decodeBase64Url(message.payload.body.data)
  }
  if (message.payload.parts) {
    for (const part of message.payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBase64Url(part.body.data)
      }
      // Check nested parts (multipart/alternative inside multipart/mixed)
      if (part.parts) {
        for (const sub of part.parts) {
          if (sub.mimeType === 'text/plain' && sub.body?.data) {
            return decodeBase64Url(sub.body.data)
          }
        }
      }
    }
    // Fallback to HTML if no plain text
    for (const part of message.payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        const html = decodeBase64Url(part.body.data)
        return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      }
    }
  }
  return message.snippet || ''
}

export function extractHeader(message: GmailMessage, name: string): string {
  return message.payload.headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || ''
}

export function extractSenderDomain(message: GmailMessage): string {
  const from = extractHeader(message, 'From')
  const match = from.match(/@([a-zA-Z0-9.-]+)/)
  return match ? match[1].toLowerCase() : ''
}
