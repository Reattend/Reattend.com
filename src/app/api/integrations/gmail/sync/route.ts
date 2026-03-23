import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
import {
  getValidAccessToken,
  listMessages,
  getMessage,
  extractEmailBody,
  extractHeader,
  extractSenderDomain,
  refreshAccessToken,
} from '@/lib/google'

export async function POST(req: NextRequest) {
  try {
    const { userId, workspaceId } = await requireAuth()

    const connection = await db.query.integrationsConnections.findFirst({
      where: and(
        eq(schema.integrationsConnections.userId, userId),
        eq(schema.integrationsConnections.integrationKey, 'gmail'),
      ),
    })

    if (!connection || connection.status !== 'connected') {
      return NextResponse.json({ error: 'Gmail not connected' }, { status: 400 })
    }

    if (!connection.refreshToken) {
      return NextResponse.json({ error: 'No refresh token — please reconnect Gmail' }, { status: 400 })
    }

    const settings = connection.settings ? JSON.parse(connection.settings) : {}
    const domainWhitelist: string[] = (settings.domainWhitelist || []).map((d: string) => d.toLowerCase())

    if (domainWhitelist.length === 0) {
      return NextResponse.json({ error: 'No domains whitelisted. Add at least one domain to sync.' }, { status: 400 })
    }

    // Find or create a Gmail source for this workspace
    let gmailSource = await db.query.sources.findFirst({
      where: and(
        eq(schema.sources.workspaceId, workspaceId),
        eq(schema.sources.kind, 'email'),
        eq(schema.sources.label, 'Gmail'),
      ),
    })

    if (!gmailSource) {
      const sourceId = crypto.randomUUID()
      await db.insert(schema.sources).values({
        id: sourceId,
        workspaceId,
        kind: 'email',
        label: 'Gmail',
      })
      gmailSource = { id: sourceId } as any
    }

    // Get valid access token (refresh if needed)
    let accessToken: string
    try {
      accessToken = await getValidAccessToken(connection.refreshToken, connection.accessToken, connection.tokenExpiresAt)

      // If we refreshed, update the stored token
      if (accessToken !== connection.accessToken) {
        const refreshResult = await refreshAccessToken(connection.refreshToken)
        await db.update(schema.integrationsConnections)
          .set({
            accessToken: refreshResult.access_token,
            tokenExpiresAt: new Date(Date.now() + refreshResult.expires_in * 1000).toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(schema.integrationsConnections.id, connection.id))
        accessToken = refreshResult.access_token
      }
    } catch (tokenError: any) {
      await db.update(schema.integrationsConnections)
        .set({ status: 'error', syncError: `Token error: ${tokenError.message}`, updatedAt: new Date().toISOString() })
        .where(eq(schema.integrationsConnections.id, connection.id))
      return NextResponse.json({ error: 'Failed to refresh token. Please reconnect Gmail.' }, { status: 401 })
    }

    // Build query — only emails from whitelisted domains, after last sync
    // Use Gmail's {} grouping for OR (more reliable than OR keyword)
    const domainQueries = domainWhitelist.map(d => `from:${d}`).join(' ')
    let query = `{${domainQueries}}`

    if (connection.lastSyncedAt) {
      const afterTimestamp = Math.floor(new Date(connection.lastSyncedAt).getTime() / 1000)
      query += ` after:${afterTimestamp}`
    }

    // List messages
    const list = await listMessages(accessToken, query, 50)
    const messageIds = list.messages || []

    if (messageIds.length === 0) {
      await db.update(schema.integrationsConnections)
        .set({ lastSyncedAt: new Date().toISOString(), syncError: null, updatedAt: new Date().toISOString() })
        .where(eq(schema.integrationsConnections.id, connection.id))
      return NextResponse.json({ synced: 0, message: 'No new emails found matching your filters.' })
    }

    // Fetch and ingest each message into raw_items
    let synced = 0
    let errors = 0

    for (const { id: msgId } of messageIds) {
      try {
        // Dedup by externalId in raw_items
        const existingRawItem = await db.query.rawItems.findFirst({
          where: and(
            eq(schema.rawItems.workspaceId, workspaceId),
            eq(schema.rawItems.externalId, msgId),
          ),
        })
        if (existingRawItem) continue

        // Also check records for backward compat with pre-migration emails
        const existingRecord = await db.query.records.findFirst({
          where: and(
            eq(schema.records.workspaceId, workspaceId),
            eq(schema.records.sourceId, msgId),
          ),
        })
        if (existingRecord) continue

        const message = await getMessage(accessToken, msgId)

        // Double-check sender domain
        const senderDomain = extractSenderDomain(message)
        if (!domainWhitelist.includes(senderDomain)) continue

        const subject = extractHeader(message, 'Subject') || '(No Subject)'
        const from = extractHeader(message, 'From')
        const date = extractHeader(message, 'Date')
        const body = extractEmailBody(message)

        // Truncate body to first 5000 chars
        const truncatedBody = body.length > 5000 ? body.substring(0, 5000) + '...' : body

        const content = `From: ${from}\nDate: ${date}\nSubject: ${subject}\n\n${truncatedBody}`

        // Insert into raw_items staging area
        await db.insert(schema.rawItems).values({
          workspaceId,
          sourceId: gmailSource!.id,
          externalId: msgId,
          author: JSON.stringify({ name: from, email: from }),
          occurredAt: date ? new Date(date).toISOString() : new Date(parseInt(message.internalDate)).toISOString(),
          text: content,
          metadata: JSON.stringify({
            gmailMessageId: msgId,
            threadId: message.threadId,
            from,
            subject,
            senderDomain,
          }),
          status: 'new',
        })

        synced++
      } catch (msgError: any) {
        console.error(`[Gmail Sync] Error processing message ${msgId}:`, msgError.message)
        errors++
      }
    }

    // Update last synced timestamp
    await db.update(schema.integrationsConnections)
      .set({
        lastSyncedAt: new Date().toISOString(),
        syncError: errors > 0 ? `${errors} messages failed to process` : null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.integrationsConnections.id, connection.id))

    return NextResponse.json({
      synced,
      errors,
      total: messageIds.length,
      inboxUrl: '/app/inbox?source=gmail',
    })
  } catch (error: any) {
    console.error('[Gmail Sync Error]', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
