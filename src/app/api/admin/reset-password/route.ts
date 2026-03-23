import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { requireAdminAuth, requireSuperAdmin, hashPassword } from '@/lib/admin/auth'

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminAuth()
    const { currentPassword, newPassword, targetAdminId } = await req.json()

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 })
    }

    // If changing another admin's password, must be super_admin
    if (targetAdminId && targetAdminId !== admin.id) {
      await requireSuperAdmin()
    }

    const targetId = targetAdminId || admin.id
    const hash = await hashPassword(newPassword)

    await db.update(schema.adminUsers)
      .set({ passwordHash: hash })
      .where(eq(schema.adminUsers.id, targetId))

    return NextResponse.json({ ok: true, message: 'Password updated' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
