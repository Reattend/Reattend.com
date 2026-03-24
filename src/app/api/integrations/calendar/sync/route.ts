import { NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
import { getValidAccessToken, listCalendarEvents, refreshAccessToken } from '@/lib/google'

export async function POST() {
  try {
    const { userId, workspaceId } = await requireAuth()

    const connection = await db.query.integrationsConnections.findFirst({
      where: and(
        eq(schema.integrationsConnections.userId, userId),
        eq(schema.integrationsConnections.integrationKey, 'google-calendar'),
      ),
    })

    if (!connection || connection.status !== 'connected') {
      return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 })
    }
    if (!connection.refreshToken) {
      return NextResponse.json({ error: 'No refresh token — reconnect Google Calendar' }, { status: 400 })
    }

    const settings = connection.settings ? JSON.parse(connection.settings) : {}
    const syncDays: number = settings.syncDays ?? 30
    const selectedCalendars: string[] = settings.selectedCalendars || []

    // Get valid access token (refresh if needed)
    let accessToken = await getValidAccessToken(connection.refreshToken, connection.accessToken, connection.tokenExpiresAt)

    // Persist refreshed token
    if (accessToken !== connection.accessToken) {
      const refreshed = await refreshAccessToken(connection.refreshToken)
      const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
      await db.update(schema.integrationsConnections)
        .set({ accessToken: refreshed.access_token, tokenExpiresAt: newExpiresAt, updatedAt: new Date().toISOString() })
        .where(eq(schema.integrationsConnections.id, connection.id))
      accessToken = refreshed.access_token
    }

    // Determine sync time window
    // Look back syncDays into the past AND 60 days into the future to capture upcoming meetings
    const timeMax = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
    const timeMin = connection.lastSyncedAt
      ? new Date(new Date(connection.lastSyncedAt).getTime() - 24 * 60 * 60 * 1000).toISOString() // 1 day overlap to avoid gaps
      : new Date(Date.now() - syncDays * 24 * 60 * 60 * 1000).toISOString()

    // Determine which calendars to sync (default: primary)
    const calendarIds = selectedCalendars.length > 0 ? selectedCalendars : ['primary']

    // Find or create a Calendar source in this workspace
    let calendarSource = await db.query.sources.findFirst({
      where: and(
        eq(schema.sources.workspaceId, workspaceId),
        eq(schema.sources.kind, 'calendar'),
      ),
    })
    if (!calendarSource) {
      const [inserted] = await db.insert(schema.sources)
        .values({ workspaceId, kind: 'calendar', label: 'Google Calendar' })
        .returning()
      calendarSource = inserted
    }

    let synced = 0
    let errors = 0

    for (const calendarId of calendarIds) {
      try {
        const { items } = await listCalendarEvents(accessToken, calendarId, timeMin, timeMax, 100)

        for (const event of items) {
          if (!event.summary) continue // skip events with no title
          if (event.status === 'cancelled') continue

          // Skip events where user declined
          const selfAttendee = event.attendees?.find(a => a.self)
          if (selfAttendee?.responseStatus === 'declined') continue

          const externalId = `gcal:${event.id}`

          // Dedup
          const existing = await db.query.rawItems.findFirst({
            where: and(
              eq(schema.rawItems.workspaceId, workspaceId),
              eq(schema.rawItems.externalId, externalId),
            ),
          })
          if (existing) continue

          // Build text representation for triage
          const start = event.start.dateTime || event.start.date || ''
          const end = event.end.dateTime || event.end.date || ''
          const attendeeNames = (event.attendees || [])
            .filter(a => !a.self)
            .map(a => a.displayName || a.email)
            .slice(0, 10)
            .join(', ')

          const text = [
            `Meeting: ${event.summary}`,
            start ? `When: ${new Date(start).toLocaleString()}` : '',
            attendeeNames ? `Attendees: ${attendeeNames}` : '',
            event.location ? `Location: ${event.location}` : '',
            event.description ? `Description: ${event.description.slice(0, 1000)}` : '',
          ].filter(Boolean).join('\n')

          const metadata = JSON.stringify({
            source: 'google-calendar',
            calendarId,
            eventId: event.id,
            start,
            end,
            attendees: event.attendees?.map(a => ({ email: a.email, name: a.displayName, self: a.self })) || [],
            organizer: event.organizer,
            htmlLink: event.htmlLink,
          })

          await db.insert(schema.rawItems).values({
            workspaceId,
            sourceId: calendarSource.id,
            externalId,
            occurredAt: start,
            text,
            metadata,
            status: 'new',
          })

          // Queue triage job immediately (auto-pipeline)
          const [rawItem] = await db.select({ id: schema.rawItems.id })
            .from(schema.rawItems)
            .where(and(
              eq(schema.rawItems.workspaceId, workspaceId),
              eq(schema.rawItems.externalId, externalId),
            ))
            .limit(1)

          if (rawItem) {
            await db.insert(schema.jobQueue).values({
              workspaceId,
              type: 'triage',
              payload: JSON.stringify({ rawItemId: rawItem.id }),
            })
          }

          synced++
        }
      } catch (e: any) {
        console.error(`[Calendar Sync] Calendar ${calendarId} error:`, e.message)
        errors++
      }
    }

    // Update lastSyncedAt
    await db.update(schema.integrationsConnections)
      .set({
        lastSyncedAt: new Date().toISOString(),
        syncError: errors > 0 ? `${errors} calendar(s) had errors during sync` : null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.integrationsConnections.id, connection.id))

    // Kick off background job processing
    try {
      const origin = process.env.NEXTAUTH_URL || process.env.APP_URL || 'http://localhost:3000'
      fetch(`${origin}/api/jobs/process`, { method: 'POST' }).catch(() => {})
    } catch {}

    return NextResponse.json({ synced, errors, message: synced > 0 ? `Synced ${synced} calendar event${synced !== 1 ? 's' : ''}` : 'No new events found' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
