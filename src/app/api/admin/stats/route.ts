import { NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq, sql } from 'drizzle-orm'
import { requireAdminAuth } from '@/lib/admin/auth'

export async function GET() {
  try {
    await requireAdminAuth()

    // Total users
    const totalUsersResult = await db.select({ count: sql<number>`count(*)` }).from(schema.users)
    const totalUsers = totalUsersResult[0]?.count ?? 0

    // Subscription breakdown
    const allSubs = await db.select({
      planKey: schema.subscriptions.planKey,
      status: schema.subscriptions.status,
    }).from(schema.subscriptions)

    let paidUsers = 0
    let trialingUsers = 0
    let freeUsers = 0
    for (const sub of allSubs) {
      if (sub.planKey === 'smart' && sub.status === 'active') paidUsers++
      else if (sub.planKey === 'smart' && sub.status === 'trialing') trialingUsers++
      else freeUsers++
    }

    // Total memories (records)
    const memoriesResult = await db.select({ count: sql<number>`count(*)` }).from(schema.records)
    const totalMemories = memoriesResult[0]?.count ?? 0

    // Total teams (team workspaces)
    const teamsResult = await db.select({ count: sql<number>`count(*)` }).from(schema.workspaces).where(eq(schema.workspaces.type, 'team'))
    const totalTeams = teamsResult[0]?.count ?? 0

    // Total workspaces
    const workspacesResult = await db.select({ count: sql<number>`count(*)` }).from(schema.workspaces)
    const totalWorkspaces = workspacesResult[0]?.count ?? 0

    // Total projects
    const projectsResult = await db.select({ count: sql<number>`count(*)` }).from(schema.projects)
    const totalProjects = projectsResult[0]?.count ?? 0

    // Total integrations connected
    const integrationsResult = await db.select({ count: sql<number>`count(*)` }).from(schema.integrationsConnections).where(eq(schema.integrationsConnections.status, 'connected'))
    const totalIntegrations = integrationsResult[0]?.count ?? 0

    // Inbox items
    const inboxResult = await db.select({ count: sql<number>`count(*)` }).from(schema.rawItems)
    const totalInboxItems = inboxResult[0]?.count ?? 0

    // Users signed up in last 7 days
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
    const recentUsersResult = await db.select({ count: sql<number>`count(*)` }).from(schema.users).where(sql`${schema.users.createdAt} >= ${weekAgo}`)
    const recentSignups = recentUsersResult[0]?.count ?? 0

    // API tokens (desktop/extension users)
    const apiTokensResult = await db.select({ count: sql<number>`count(*)` }).from(schema.apiTokens)
    const totalApiTokens = apiTokensResult[0]?.count ?? 0

    // Job queue health
    const pendingJobsResult = await db.select({ count: sql<number>`count(*)` }).from(schema.jobQueue).where(eq(schema.jobQueue.status, 'pending'))
    const pendingJobs = pendingJobsResult[0]?.count ?? 0

    const failedJobsResult = await db.select({ count: sql<number>`count(*)` }).from(schema.jobQueue).where(eq(schema.jobQueue.status, 'failed'))
    const failedJobs = failedJobsResult[0]?.count ?? 0

    // Users list (last 50) with per-user engagement counts
    const usersList = await db.all(sql`
      SELECT
        u.id,
        u.email,
        u.name,
        u.created_at as createdAt,
        COALESCE(s.plan_key, 'normal') as plan,
        COALESCE(s.status, 'active') as status,
        s.trial_ends_at as trialEndsAt,
        COALESCE(mc.memory_count, 0) as memoryCount,
        COALESCE(wc.workspace_count, 0) as workspaceCount,
        COALESCE(
          NULLIF(
            MAX(mc.last_memory, wc.last_workspace),
            ''
          ),
          u.created_at
        ) as lastActive
      FROM users u
      LEFT JOIN subscriptions s ON s.user_id = u.id
      LEFT JOIN (
        SELECT created_by, COUNT(*) as memory_count, MAX(created_at) as last_memory
        FROM records
        GROUP BY created_by
      ) mc ON mc.created_by = u.id
      LEFT JOIN (
        SELECT wm.user_id, COUNT(*) as workspace_count, MAX(wm.created_at) as last_workspace
        FROM workspace_members wm
        GROUP BY wm.user_id
      ) wc ON wc.user_id = u.id
      ORDER BY u.created_at DESC
      LIMIT 50
    `) as any[]

    return NextResponse.json({
      stats: {
        totalUsers,
        paidUsers,
        trialingUsers,
        freeUsers,
        totalMemories,
        totalTeams,
        totalWorkspaces,
        totalProjects,
        totalIntegrations,
        totalInboxItems,
        recentSignups,
        totalApiTokens,
        pendingJobs,
        failedJobs,
      },
      recentUsers: usersList,
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
