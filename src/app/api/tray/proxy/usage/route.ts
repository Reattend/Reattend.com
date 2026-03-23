import { NextRequest } from 'next/server'
import { resolveAuth, getUsageStats } from '@/lib/metering'

/**
 * GET /api/tray/proxy/usage
 * Returns current usage stats for the device/user.
 * Accepts X-Device-Id (anonymous) or Authorization: Bearer rat_xxx (authenticated).
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await resolveAuth(req.headers)

    if (!auth.deviceId && !auth.userId) {
      return Response.json({ error: 'X-Device-Id header or Authorization required' }, { status: 401 })
    }

    const stats = await getUsageStats(auth.deviceId, auth.userId, auth.tier)

    return Response.json(stats)
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
