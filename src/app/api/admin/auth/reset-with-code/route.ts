import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { hashPassword } from '@/lib/admin/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, code, newPassword } = await req.json()
    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: 'Email, code, and new password are required' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Find valid reset code (stored with admin: prefix)
    const otp = await db.query.otpCodes.findFirst({
      where: and(
        eq(schema.otpCodes.email, `admin:${normalizedEmail}`),
        eq(schema.otpCodes.code, code),
        eq(schema.otpCodes.used, false),
      ),
    })

    if (!otp) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 })
    }

    if (new Date(otp.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Code expired' }, { status: 401 })
    }

    // Mark code as used
    await db.update(schema.otpCodes)
      .set({ used: true })
      .where(eq(schema.otpCodes.id, otp.id))

    // Verify admin exists
    const admin = await db.query.adminUsers.findFirst({
      where: eq(schema.adminUsers.email, normalizedEmail),
    })

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    // Update password
    const hash = await hashPassword(newPassword)
    await db.update(schema.adminUsers)
      .set({ passwordHash: hash })
      .where(eq(schema.adminUsers.id, admin.id))

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}
