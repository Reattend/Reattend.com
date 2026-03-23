'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, Shield, ArrowLeft } from 'lucide-react'

type View = 'login' | 'forgot' | 'reset'

export default function AdminLoginPage() {
  const router = useRouter()
  const [view, setView] = useState<View>('login')

  // Login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState('')
  const [sendingCode, setSendingCode] = useState(false)
  const [codeSent, setCodeSent] = useState(false)

  // Reset password
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    fetch('/api/admin/auth/me')
      .then(res => {
        if (res.ok) router.replace('/admin/dashboard')
        else setChecking(false)
      })
      .catch(() => setChecking(false))
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }

      router.push('/admin/dashboard')
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSendingCode(true)

    try {
      const res = await fetch('/api/admin/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to send reset code')
        return
      }

      setCodeSent(true)
      setView('reset')
      setError('')
    } catch {
      setError('Something went wrong')
    } finally {
      setSendingCode(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResetting(true)

    try {
      const res = await fetch('/api/admin/auth/reset-with-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, code: resetCode, newPassword }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to reset password')
        return
      }

      setSuccessMsg('Password reset successfully. You can now sign in.')
      setView('login')
      setEmail(forgotEmail)
      setForgotEmail('')
      setResetCode('')
      setNewPassword('')
      setCodeSent(false)
    } catch {
      setError('Something went wrong')
    } finally {
      setResetting(false)
    }
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30">
      <Card className="w-full max-w-sm mx-4">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-foreground">
              <Shield className="h-6 w-6 text-background" />
            </div>
          </div>
          <CardTitle className="text-xl">
            {view === 'login' && 'Admin Panel'}
            {view === 'forgot' && 'Forgot Password'}
            {view === 'reset' && 'Reset Password'}
          </CardTitle>
          <CardDescription>
            {view === 'login' && 'Sign in to access the admin dashboard'}
            {view === 'forgot' && 'Enter your admin email to receive a reset code'}
            {view === 'reset' && 'Enter the code sent to your email'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Login Form */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              {successMsg && (
                <p className="text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 rounded-md px-3 py-2">{successMsg}</p>
              )}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setSuccessMsg('') }}
                  placeholder="admin@example.com"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  First time? Enter your desired password to set up the account.
                </p>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
              <button
                type="button"
                onClick={() => { setView('forgot'); setError(''); setSuccessMsg('') }}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Forgot password?
              </button>
            </form>
          )}

          {/* Forgot Password Form */}
          {view === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Admin Email</label>
                <Input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="admin@example.com"
                  autoFocus
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={sendingCode}>
                {sendingCode ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending code...
                  </>
                ) : (
                  'Send Reset Code'
                )}
              </Button>
              <button
                type="button"
                onClick={() => { setView('login'); setError('') }}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to sign in
              </button>
            </form>
          )}

          {/* Reset Password Form */}
          {view === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-sm text-muted-foreground bg-muted rounded-md px-3 py-2">
                A 6-digit code has been sent to <span className="font-medium text-foreground">{forgotEmail}</span>
              </p>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Reset Code</label>
                <Input
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">New Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={resetting || newPassword.length < 6}>
                {resetting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
              <button
                type="button"
                onClick={() => { setView('login'); setError('') }}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to sign in
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
