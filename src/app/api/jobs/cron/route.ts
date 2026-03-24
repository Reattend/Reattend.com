import { NextRequest, NextResponse } from 'next/server'
import { processAllPendingJobs } from '@/lib/jobs/worker'

const CRON_SECRET = process.env.CRON_SECRET || '655468654457899876768dfffgd890'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const processed = await processAllPendingJobs()
    return NextResponse.json({ processed, ts: new Date().toISOString() })
  } catch (error: any) {
    console.error('[Cron] processAllPendingJobs error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
