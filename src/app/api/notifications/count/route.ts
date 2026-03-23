import { NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq, and, sql, or, isNull } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  try {
    const { userId } = await requireAuth()

    const now = new Date().toISOString()

    // Count unread notifications across ALL workspaces for this user
    // Exclude snoozed notifications (snoozedUntil is in the future)
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.inboxNotifications)
      .where(
        and(
          eq(schema.inboxNotifications.userId, userId),
          eq(schema.inboxNotifications.status, 'unread'),
          or(
            isNull(schema.inboxNotifications.snoozedUntil),
            sql`${schema.inboxNotifications.snoozedUntil} <= ${now}`,
          ),
        )
      )

    const count = result[0]?.count ?? 0

    return NextResponse.json({ count })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
