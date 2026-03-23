import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
import {
  getValidSlackToken,
  refreshSlackToken,
  listConversations,
  getConversationHistory,
  createUserResolver,
} from '@/lib/slack'

export async function POST(req: NextRequest) {
  try {
    const { userId, workspaceId } = await requireAuth()

    const connection = await db.query.integrationsConnections.findFirst({
      where: and(
        eq(schema.integrationsConnections.userId, userId),
        eq(schema.integrationsConnections.integrationKey, 'slack'),
      ),
    })

    if (!connection || connection.status !== 'connected') {
      return NextResponse.json({ error: 'Slack not connected' }, { status: 400 })
    }

    if (!connection.accessToken) {
      return NextResponse.json({ error: 'No access token — please reconnect Slack' }, { status: 400 })
    }

    // Find or create Slack source
    let slackSource = await db.query.sources.findFirst({
      where: and(
        eq(schema.sources.workspaceId, workspaceId),
        eq(schema.sources.kind, 'chat'),
        eq(schema.sources.label, 'Slack'),
      ),
    })

    if (!slackSource) {
      const sourceId = crypto.randomUUID()
      await db.insert(schema.sources).values({
        id: sourceId,
        workspaceId,
        kind: 'chat',
        label: 'Slack',
      })
      slackSource = { id: sourceId } as any
    }

    // Get valid access token
    let accessToken: string
    try {
      accessToken = await getValidSlackToken(connection.refreshToken, connection.accessToken, connection.tokenExpiresAt)

      // If token was refreshed, update stored tokens
      if (connection.refreshToken && accessToken !== connection.accessToken) {
        const refreshResult = await refreshSlackToken(connection.refreshToken)
        await db.update(schema.integrationsConnections)
          .set({
            accessToken: refreshResult.access_token,
            refreshToken: refreshResult.refresh_token || connection.refreshToken,
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
      return NextResponse.json({ error: 'Failed to validate token. Please reconnect Slack.' }, { status: 401 })
    }

    const settings = connection.settings ? JSON.parse(connection.settings) : {}
    const channelFilter: string[] = settings.channels || []

    // Fetch channels
    let channels
    try {
      channels = await listConversations(accessToken, 30)
    } catch (e: any) {
      return NextResponse.json({ error: `Failed to fetch channels: ${e.message}` }, { status: 500 })
    }

    // Filter to selected channels if any are configured
    if (channelFilter.length > 0) {
      channels = channels.filter(c => channelFilter.includes(c.id))
    }

    const sinceDate = connection.lastSyncedAt || undefined
    const resolveUser = createUserResolver(accessToken)

    let synced = 0
    let errors = 0

    for (const channel of channels) {
      try {
        const messages = await getConversationHistory(accessToken, channel.id, 25, sinceDate)

        for (const msg of messages) {
          // Skip bot messages, system messages, and empty messages
          if (msg.subtype) continue
          if (!msg.text?.trim()) continue
          if (!msg.user) continue

          const externalId = `slack-${channel.id}-${msg.ts}`

          // Dedup
          const existing = await db.query.rawItems.findFirst({
            where: and(
              eq(schema.rawItems.workspaceId, workspaceId),
              eq(schema.rawItems.externalId, externalId),
            ),
          })
          if (existing) continue

          const senderName = await resolveUser(msg.user)

          // Truncate to 5000 chars
          const truncated = msg.text.length > 5000 ? msg.text.substring(0, 5000) + '...' : msg.text

          const content = `Channel: #${channel.name}\nFrom: ${senderName}\nDate: ${new Date(parseFloat(msg.ts) * 1000).toISOString()}\n\n${truncated}`

          await db.insert(schema.rawItems).values({
            workspaceId,
            sourceId: slackSource!.id,
            externalId,
            author: JSON.stringify({ name: senderName, id: msg.user }),
            occurredAt: new Date(parseFloat(msg.ts) * 1000).toISOString(),
            text: content,
            metadata: JSON.stringify({
              slackMessageTs: msg.ts,
              channelId: channel.id,
              channelName: channel.name,
              senderName,
              senderId: msg.user,
              threadTs: msg.thread_ts || null,
            }),
            status: 'new',
          })

          synced++
        }
      } catch (channelError: any) {
        console.error(`[Slack Sync] Error processing channel ${channel.name}:`, channelError.message)
        errors++
      }
    }

    // Update last synced
    await db.update(schema.integrationsConnections)
      .set({
        lastSyncedAt: new Date().toISOString(),
        syncError: errors > 0 ? `${errors} channels failed to process` : null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.integrationsConnections.id, connection.id))

    return NextResponse.json({
      synced,
      errors,
      total: channels.length,
      inboxUrl: '/app/inbox?source=slack',
    })
  } catch (error: any) {
    console.error('[Slack Sync Error]', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
