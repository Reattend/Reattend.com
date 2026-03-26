'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  Brain,
  FolderKanban,
  Plug,
  Inbox,
  UserPlus,
  Crown,
  Shield,
  Loader2,
  LogOut,
  Gift,
  Trash2,
  Key,
  TrendingUp,
  MessageCircle,
  Building2,
  CheckCircle2,
  Eye,
  Monitor,
  AlertTriangle,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface AdminUser {
  id: string
  email: string
  name: string
  role: string
}

interface FeedbackRequest {
  id: string
  email: string
  name: string | null
  type: string
  message: string
  status: string
  createdAt: string
}

interface IntegrationRequest {
  id: string
  appName: string
  email: string | null
  status: string
  createdAt: string
}

interface Stats {
  totalUsers: number
  paidUsers: number
  trialingUsers: number
  freeUsers: number
  totalMemories: number
  totalTeams: number
  totalWorkspaces: number
  totalProjects: number
  totalIntegrations: number
  totalInboxItems: number
  recentSignups: number
  totalApiTokens: number
  pendingJobs: number
  failedJobs: number
}

interface RecentUser {
  id: string
  email: string
  name: string
  createdAt: string
  plan: string
  status: string
  trialEndsAt: string | null
  memoryCount: number
  workspaceCount: number
  lastActive: string | null
}

export default function AdminDashboard() {
  const router = useRouter()
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [loading, setLoading] = useState(true)

  // Extend trial
  const [showExtendTrial, setShowExtendTrial] = useState(false)
  const [trialEmail, setTrialEmail] = useState('')
  const [trialMonths, setTrialMonths] = useState('1')
  const [extending, setExtending] = useState(false)

  // Add admin
  const [showAddAdmin, setShowAddAdmin] = useState(false)
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [newAdminName, setNewAdminName] = useState('')
  const [addingAdmin, setAddingAdmin] = useState(false)
  const [adminList, setAdminList] = useState<AdminUser[]>([])

  // Feedback & inquiries
  const [feedbackList, setFeedbackList] = useState<FeedbackRequest[]>([])

  // Integration requests
  const [integrationRequests, setIntegrationRequests] = useState<IntegrationRequest[]>([])

  const isSuperAdmin = admin?.role === 'super_admin'

  const fetchAdmin = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/auth/me')
      if (!res.ok) {
        router.replace('/admin/login')
        return
      }
      const data = await res.json()
      setAdmin(data.admin)
    } catch {
      router.replace('/admin/login')
    }
  }, [router])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats')
      if (!res.ok) return
      const data = await res.json()
      setStats(data.stats)
      setRecentUsers(data.recentUsers)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAdmins = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/admins')
      if (!res.ok) return
      const data = await res.json()
      setAdminList(data.admins)
    } catch {
      // silent
    }
  }, [])

  const fetchFeedback = useCallback(async () => {
    try {
      const res = await fetch('/api/feedback')
      if (!res.ok) return
      const data = await res.json()
      setFeedbackList(data.requests || [])
    } catch {
      // silent
    }
  }, [])

  const fetchIntegrationRequests = useCallback(async () => {
    try {
      const res = await fetch('/api/integration-requests')
      if (!res.ok) return
      const data = await res.json()
      setIntegrationRequests(data.requests || [])
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchAdmin().then(() => {
      fetchStats()
      fetchAdmins()
      fetchFeedback()
      fetchIntegrationRequests()
    })
  }, [fetchAdmin, fetchStats, fetchAdmins, fetchFeedback, fetchIntegrationRequests])

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    router.replace('/admin/login')
  }

  const handleExtendTrial = async () => {
    setExtending(true)
    try {
      const res = await fetch('/api/admin/extend-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trialEmail, months: parseInt(trialMonths) }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to extend trial')
        return
      }
      toast.success(data.message)
      setShowExtendTrial(false)
      setTrialEmail('')
      setTrialMonths('1')
      fetchStats()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setExtending(false)
    }
  }

  const handleAddAdmin = async () => {
    setAddingAdmin(true)
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newAdminEmail, name: newAdminName }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to add admin')
        return
      }
      toast.success(`${data.admin.email} can now log in via OTP`)
      setShowAddAdmin(false)
      setNewAdminEmail('')
      setNewAdminName('')
      fetchAdmins()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setAddingAdmin(false)
    }
  }

  const handleDeleteAdmin = async (adminId: string, adminEmail: string) => {
    if (!confirm(`Remove admin access for ${adminEmail}?`)) return
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to remove admin')
        return
      }
      toast.success(`Removed ${adminEmail}`)
      fetchAdmins()
    } catch {
      toast.error('Something went wrong')
    }
  }


  const handleMarkIntegrationReviewed = async (id: string) => {
    try {
      await fetch('/api/integration-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'reviewed' }),
      })
      setIntegrationRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'reviewed' } : r))
    } catch {
      toast.error('Failed to update')
    }
  }

  const handleMarkFeedbackReviewed = async (id: string) => {
    try {
      await fetch('/api/feedback', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'reviewed' }),
      })
      setFeedbackList(prev => prev.map(f => f.id === id ? { ...f, status: 'reviewed' } : f))
    } catch {
      toast.error('Failed to update')
    }
  }

  const handleExtendFromRow = (email: string) => {
    setTrialEmail(email)
    setShowExtendTrial(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground">
            <Shield className="h-5 w-5 text-background" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {admin?.email}
              {isSuperAdmin && (
                <Badge className="ml-2 text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/10">
                  Super Admin
                </Badge>
              )}
              {!isSuperAdmin && (
                <Badge className="ml-2 text-[10px]" variant="secondary">Viewer</Badge>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled title="Login is OTP-only">
            <Key className="h-4 w-4 mr-1" />
            OTP Login
          </Button>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-1" />
            Logout
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total Users" value={stats.totalUsers} icon={Users} />
          <StatCard label="Paid Users" value={stats.paidUsers} icon={Crown} highlight />
          <StatCard label="Trialing" value={stats.trialingUsers} icon={Gift} />
          <StatCard label="Free Users" value={stats.freeUsers} icon={Users} />
          <StatCard label="Memories" value={stats.totalMemories} icon={Brain} />
          <StatCard label="Teams" value={stats.totalTeams} icon={Users} />
          <StatCard label="Projects" value={stats.totalProjects} icon={FolderKanban} />
          <StatCard label="Integrations" value={stats.totalIntegrations} icon={Plug} />
          <StatCard label="Inbox Items" value={stats.totalInboxItems} icon={Inbox} />
          <StatCard label="Workspaces" value={stats.totalWorkspaces} icon={FolderKanban} />
          <StatCard label="Signups (7d)" value={stats.recentSignups} icon={TrendingUp} highlight />
          <StatCard
            label="Conversion"
            value={stats.totalUsers > 0 ? `${Math.round(((stats.paidUsers + stats.trialingUsers) / stats.totalUsers) * 100)}%` : '0%'}
            icon={TrendingUp}
          />
          <StatCard label="Desktop/Ext" value={stats.totalApiTokens} icon={Monitor} />
          <StatCard label="Pending Jobs" value={stats.pendingJobs} icon={Clock} highlight={stats.pendingJobs > 0} />
          <StatCard label="Failed Jobs" value={stats.failedJobs} icon={AlertTriangle} highlight={stats.failedJobs > 0} />
          <StatCard label="Feedback" value={feedbackList.filter(f => f.type !== 'enterprise_inquiry').length} icon={MessageCircle} highlight={feedbackList.some(f => f.status === 'new' && f.type !== 'enterprise_inquiry')} />
          <StatCard label="Enterprise" value={feedbackList.filter(f => f.type === 'enterprise_inquiry').length} icon={Building2} highlight={feedbackList.some(f => f.status === 'new' && f.type === 'enterprise_inquiry')} />
          <StatCard label="Integration Req" value={integrationRequests.length} icon={Plug} highlight={integrationRequests.some(r => r.status === 'new')} />
        </div>
      )}

      {/* Actions Row (super admin only) */}
      {isSuperAdmin && (
        <div className="flex gap-3">
          <Button onClick={() => setShowExtendTrial(true)}>
            <Gift className="h-4 w-4 mr-2" />
            Extend Free Trial
          </Button>
          <Button variant="outline" onClick={() => setShowAddAdmin(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Admin
          </Button>
        </div>
      )}

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Recent Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium text-muted-foreground">Email</th>
                  <th className="pb-2 font-medium text-muted-foreground">Name</th>
                  <th className="pb-2 font-medium text-muted-foreground">Plan</th>
                  <th className="pb-2 font-medium text-muted-foreground">Status</th>
                  <th className="pb-2 font-medium text-muted-foreground text-center">Memories</th>
                  <th className="pb-2 font-medium text-muted-foreground text-center">Workspaces</th>
                  <th className="pb-2 font-medium text-muted-foreground">Last Active</th>
                  <th className="pb-2 font-medium text-muted-foreground">Trial Ends</th>
                  <th className="pb-2 font-medium text-muted-foreground">Joined</th>
                  {isSuperAdmin && <th className="pb-2 font-medium text-muted-foreground">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentUsers.map((u) => {
                  const trialDays = u.trialEndsAt
                    ? Math.max(0, Math.ceil((new Date(u.trialEndsAt).getTime() - Date.now()) / 86400000))
                    : null
                  return (
                    <tr key={u.id} className="hover:bg-muted/50">
                      <td className="py-2.5 font-mono text-xs">{u.email}</td>
                      <td className="py-2.5">{u.name}</td>
                      <td className="py-2.5">
                        <Badge variant={u.plan === 'smart' ? 'default' : 'secondary'} className="text-[10px]">
                          {u.plan === 'smart' ? 'Smart' : 'Normal'}
                        </Badge>
                      </td>
                      <td className="py-2.5">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            u.status === 'trialing' ? 'border-blue-500/30 text-blue-600' :
                            u.status === 'active' && u.plan === 'smart' ? 'border-emerald-500/30 text-emerald-600' :
                            ''
                          }`}
                        >
                          {u.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-center">
                        <span className={`text-xs font-medium ${u.memoryCount > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {u.memoryCount}
                        </span>
                      </td>
                      <td className="py-2.5 text-center">
                        <span className={`text-xs font-medium ${u.workspaceCount > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {u.workspaceCount}
                        </span>
                      </td>
                      <td className="py-2.5 text-xs text-muted-foreground">
                        {u.lastActive ? formatRelativeTime(u.lastActive) : '—'}
                      </td>
                      <td className="py-2.5 text-xs text-muted-foreground">
                        {trialDays !== null ? (
                          <span className={trialDays <= 7 ? 'text-amber-600 font-medium' : ''}>
                            {trialDays}d left
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-2.5 text-xs text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      {isSuperAdmin && (
                        <td className="py-2.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleExtendFromRow(u.email)}
                          >
                            <Gift className="h-3 w-3 mr-1" />
                            Trial
                          </Button>
                        </td>
                      )}
                    </tr>
                  )
                })}
                {recentUsers.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-muted-foreground">
                      No users yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Feedback & Inquiries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Feedback & Enterprise Inquiries
            {feedbackList.filter(f => f.status === 'new').length > 0 && (
              <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-[10px]">
                {feedbackList.filter(f => f.status === 'new').length} new
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {feedbackList.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No feedback yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-muted-foreground">Type</th>
                    <th className="pb-2 font-medium text-muted-foreground">From</th>
                    <th className="pb-2 font-medium text-muted-foreground">Message</th>
                    <th className="pb-2 font-medium text-muted-foreground">Status</th>
                    <th className="pb-2 font-medium text-muted-foreground">Date</th>
                    <th className="pb-2 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {feedbackList.map((fb) => (
                    <tr key={fb.id} className={`hover:bg-muted/50 ${fb.status === 'new' ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''}`}>
                      <td className="py-2.5">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${
                            fb.type === 'enterprise_inquiry' ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' :
                            fb.type === 'feature_request' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                            fb.type === 'bug_report' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                            ''
                          }`}
                        >
                          {fb.type === 'enterprise_inquiry' ? 'Enterprise' :
                           fb.type === 'feature_request' ? 'Feature' :
                           fb.type === 'bug_report' ? 'Bug' : 'Feedback'}
                        </Badge>
                      </td>
                      <td className="py-2.5">
                        <div className="text-xs">{fb.name || '—'}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{fb.email}</div>
                      </td>
                      <td className="py-2.5 max-w-[400px]">
                        <p className="text-xs whitespace-pre-wrap break-words">{fb.message}</p>
                      </td>
                      <td className="py-2.5">
                        {fb.status === 'new' ? (
                          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">New</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Reviewed
                          </Badge>
                        )}
                      </td>
                      <td className="py-2.5 text-xs text-muted-foreground">
                        {new Date(fb.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5">
                        {fb.status === 'new' && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleMarkFeedbackReviewed(fb.id)}>
                            <Eye className="h-3 w-3 mr-1" />
                            Mark Reviewed
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Integration Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plug className="h-4 w-4" />
            Integration Requests
            {integrationRequests.filter(r => r.status === 'new').length > 0 && (
              <Badge className="bg-violet-500/10 text-violet-600 border-violet-500/20 text-[10px]">
                {integrationRequests.filter(r => r.status === 'new').length} new
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {integrationRequests.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No integration requests yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-muted-foreground">App Name</th>
                    <th className="pb-2 font-medium text-muted-foreground">Email</th>
                    <th className="pb-2 font-medium text-muted-foreground">Status</th>
                    <th className="pb-2 font-medium text-muted-foreground">Date</th>
                    <th className="pb-2 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {integrationRequests.map((req) => (
                    <tr key={req.id} className={`hover:bg-muted/50 ${req.status === 'new' ? 'bg-violet-50/50 dark:bg-violet-950/10' : ''}`}>
                      <td className="py-2.5 font-medium text-sm">{req.appName}</td>
                      <td className="py-2.5 text-xs font-mono text-muted-foreground">{req.email || '—'}</td>
                      <td className="py-2.5">
                        {req.status === 'new' ? (
                          <Badge className="bg-violet-500/10 text-violet-600 border-violet-500/20 text-[10px]">New</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Reviewed
                          </Badge>
                        )}
                      </td>
                      <td className="py-2.5 text-xs text-muted-foreground">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5">
                        {req.status === 'new' && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleMarkIntegrationReviewed(req.id)}>
                            <Eye className="h-3 w-3 mr-1" />
                            Mark Reviewed
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Users */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Admin Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {adminList.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
                    {a.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.email}</p>
                  </div>
                  <Badge
                    variant={a.role === 'super_admin' ? 'default' : 'secondary'}
                    className="text-[10px]"
                  >
                    {a.role === 'super_admin' ? 'Super Admin' : 'Viewer'}
                  </Badge>
                </div>
                {isSuperAdmin && a.id !== admin?.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    onClick={() => handleDeleteAdmin(a.id, a.email)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Extend Trial Dialog */}
      <Dialog open={showExtendTrial} onOpenChange={setShowExtendTrial}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-violet-500" />
              Extend Free Trial
            </DialogTitle>
            <DialogDescription>
              Grant a user free Smart Memories access. They will receive an email notification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">User Email</label>
              <Input
                type="email"
                value={trialEmail}
                onChange={(e) => setTrialEmail(e.target.value)}
                placeholder="user@example.com"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Duration (months)</label>
              <Input
                type="number"
                min={1}
                max={24}
                value={trialMonths}
                onChange={(e) => setTrialMonths(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowExtendTrial(false)}>Cancel</Button>
            <Button
              onClick={handleExtendTrial}
              disabled={!trialEmail.trim() || extending}
            >
              {extending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  Extending...
                </>
              ) : (
                <>
                  <Gift className="h-4 w-4 mr-1" />
                  Extend Trial
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Admin Dialog */}
      <Dialog open={showAddAdmin} onOpenChange={setShowAddAdmin}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add Admin
            </DialogTitle>
            <DialogDescription>
              Add a viewer admin. They can see stats but cannot make changes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">They will log in via email OTP — no password needed.</p>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <Input
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="admin@example.com"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Name</label>
              <Input
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
                placeholder="Name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddAdmin(false)}>Cancel</Button>
            <Button
              onClick={handleAddAdmin}
              disabled={!newAdminEmail.trim() || addingAdmin}
            >
              {addingAdmin ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-1" />
                  Add Admin
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

function StatCard({
  label,
  value,
  icon: Icon,
  highlight,
}: {
  label: string
  value: number | string
  icon: React.ElementType
  highlight?: boolean
}) {
  return (
    <Card className={highlight ? 'border-primary/20 bg-primary/[0.02]' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-2xl font-bold mt-2">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </CardContent>
    </Card>
  )
}
