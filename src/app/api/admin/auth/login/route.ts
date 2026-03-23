import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
import {
  hashPassword,
  verifyPassword,
  createAdminToken,
  isSuperAdminEmail,
} from '@/lib/admin/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if any admin exists — if not, allow first-time setup for super admin
    const anyAdmin = await db.query.adminUsers.findFirst()

    if (!anyAdmin && isSuperAdminEmail(normalizedEmail)) {
      // First-time setup: create super admin
      if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
      }

      const hash = await hashPassword(password)
      const id = crypto.randomUUID()

      await db.insert(schema.adminUsers).values({
        id,
        email: normalizedEmail,
        name: 'Partha',
        passwordHash: hash,
        role: 'super_admin',
      })

      await createAdminToken({ id, email: normalizedEmail, role: 'super_admin' })

      return NextResponse.json({
        ok: true,
        setup: true,
        admin: { id, email: normalizedEmail, name: 'Partha', role: 'super_admin' },
      })
    }

    // Normal login
    const admin = await db.query.adminUsers.findFirst({
      where: eq(schema.adminUsers.email, normalizedEmail),
    })

    if (!admin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const valid = await verifyPassword(password, admin.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    await createAdminToken({ id: admin.id, email: admin.email, role: admin.role })

    return NextResponse.json({
      ok: true,
      admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    })
  } catch (error: any) {
    console.error('Admin login error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
