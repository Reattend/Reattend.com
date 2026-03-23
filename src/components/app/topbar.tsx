'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  Command,
  Moon,
  Sun,
  X,
  CheckCircle2,
  Clock,
  Sparkles,
  Send,
  Loader2,
  MessageCircle,
  RotateCcw,
  Bot,
  User,
  Check,
  ChevronsUpDown,
  Plus,
  Users,
  UserPlus,
  FolderKanban,
  Brain,
  ArrowRight,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/stores/app-store'
import { toast } from 'sonner'

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  objectType: string | null
  objectId: string | null
  status: 'unread' | 'read' | 'done'
  createdAt: string
  workspaceName?: string
}

export function AppTopbar() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { inboxPanelOpen, setInboxPanelOpen, subscription, workspaceName, workspaceType, allWorkspaces, currentWorkspaceId, createTeamOpen, setCreateTeamOpen, setInviteOpen } = useAppStore()

  // Create team
  const [newTeamName, setNewTeamName] = useState('')
  const [creatingTeam, setCreatingTeam] = useState(false)
  const [teamCreated, setTeamCreated] = useState(false)

  // Feedback
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackType, setFeedbackType] = useState<'feedback' | 'feature_request' | 'bug_report'>('feedback')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [feedbackSending, setFeedbackSending] = useState(false)
  const [feedbackSent, setFeedbackSent] = useState(false)

  // Real notifications
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notifLoading, setNotifLoading] = useState(false)
  const [globalUnreadCount, setGlobalUnreadCount] = useState(0)

  const handleSwitchWorkspace = async (wsId: string) => {
    try {
      const res = await fetch('/api/workspaces/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: wsId }),
      })
      if (res.ok) {
        window.location.href = '/app'
      } else {
        toast.error('Failed to switch workspace')
      }
    } catch {
      toast.error('Failed to switch workspace')
    }
  }

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return
    setCreatingTeam(true)
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Team "${newTeamName.trim()}" created!`)
        setNewTeamName('')
        setTeamCreated(true)
      } else {
        toast.error(data.message || data.error || 'Failed to create team')
      }
    } catch {
      toast.error('Failed to create team')
    } finally {
      setCreatingTeam(false)
    }
  }

  const fetchNotifications = useCallback(async () => {
    setNotifLoading(true)
    try {
      const res = await fetch('/api/notifications?status=unread&limit=20&global=true')
      const data = await res.json()
      if (data.notifications) setNotifications(data.notifications)
    } catch {
      // silent
    } finally {
      setNotifLoading(false)
    }
  }, [])

  const fetchGlobalCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/count')
      const data = await res.json()
      if (typeof data.count === 'number') setGlobalUnreadCount(data.count)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    fetchGlobalCount()
  }, [fetchNotifications, fetchGlobalCount])

  // Poll global count every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchGlobalCount, 30_000)
    return () => clearInterval(interval)
  }, [fetchGlobalCount])

  const handleMarkDone = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'done' }),
      })
      setNotifications(prev => prev.filter(n => n.id !== id))
      setGlobalUnreadCount(prev => Math.max(0, prev - 1))
    } catch {
      // silent
    }
  }

  const handleSnooze = async (id: string) => {
    try {
      const snoozedUntil = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'unread', snoozedUntil }),
      })
      setNotifications(prev => prev.filter(n => n.id !== id))
      setGlobalUnreadCount(prev => Math.max(0, prev - 1))
    } catch {
      // silent
    }
  }

    const handleFeedbackSubmit = async () => {
    if (!feedbackMessage.trim()) return
    setFeedbackSending(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: feedbackType, message: feedbackMessage }),
      })
      if (res.ok) {
        setFeedbackSent(true)
        setFeedbackMessage('')
        setTimeout(() => {
          setFeedbackSent(false)
          setFeedbackOpen(false)
        }, 2000)
      }
    } catch {
      // silent
    } finally {
      setFeedbackSending(false)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 backdrop-blur-sm px-4">
        {/* Left: Personal / Team pills */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            className={cn(
              'px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all',
              workspaceType !== 'team'
                ? 'bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white shadow-[0_2px_8px_rgba(79,70,229,0.25)]'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
            onClick={() => {
              const personal = allWorkspaces.find(ws => ws.type === 'personal')
              if (personal && personal.id !== currentWorkspaceId) handleSwitchWorkspace(personal.id)
            }}
          >
            Personal
          </button>
          <button
            className={cn(
              'px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all',
              workspaceType === 'team'
                ? 'bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white shadow-[0_2px_8px_rgba(79,70,229,0.25)]'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
            onClick={() => {
              const team = allWorkspaces.find(ws => ws.type === 'team')
              if (team && team.id !== currentWorkspaceId) handleSwitchWorkspace(team.id)
            }}
          >
            Team
          </button>
        </div>

        {/* Center: Current workspace dropdown */}
        <div className="flex-1 flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="group inline-flex items-center gap-2.5 px-3.5 py-2 rounded-full border border-white/10 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md shadow-[0_2px_12px_rgba(79,70,229,0.12)] hover:shadow-[0_2px_16px_rgba(79,70,229,0.2)] hover:border-primary/25 hover:bg-white/80 dark:hover:bg-white/8 transition-all duration-200 min-w-[180px] max-w-[300px]">
                <div className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-bold shrink-0 shadow-sm',
                  workspaceType === 'team'
                    ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white'
                    : 'bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white'
                )}>
                  {(workspaceName || 'W')[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-foreground truncate flex-1 text-left">{workspaceName || 'Loading...'}</span>
                {workspaceType === 'team' && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 shrink-0 tracking-wide uppercase">Team</span>
                )}
                <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-muted-foreground shrink-0 transition-colors" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-56">
              {allWorkspaces.map((ws) => (
                <DropdownMenuItem
                  key={ws.id}
                  onClick={() => {
                    if (ws.id !== currentWorkspaceId) handleSwitchWorkspace(ws.id)
                  }}
                  className="cursor-pointer"
                >
                  <div className={cn(
                    'flex h-6 w-6 items-center justify-center rounded text-xs font-bold mr-2 shrink-0',
                    ws.type === 'team' ? 'bg-indigo-500 text-white' : 'bg-primary text-primary-foreground'
                  )}>
                    {ws.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm truncate block">{ws.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground">{ws.type === 'team' ? 'Team' : 'Personal'}</span>
                      {ws.type === 'team' && (
                        <span className={cn(
                          'text-[9px] font-semibold px-1.5 rounded-full leading-relaxed',
                          ws.role === 'owner'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : ws.role === 'admin'
                            ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                            : 'bg-muted text-muted-foreground'
                        )}>
                          {ws.role === 'owner' ? 'Owner' : ws.role === 'admin' ? 'Admin' : 'Member'}
                        </span>
                      )}
                    </div>
                  </div>
                  {ws.id === currentWorkspaceId && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              {workspaceType === 'team' && (
                <DropdownMenuItem
                  onClick={() => setInviteOpen(true)}
                  className="cursor-pointer"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-500/10 mr-2 shrink-0">
                    <UserPlus className="h-3.5 w-3.5 text-indigo-500" />
                  </div>
                  <span className="text-sm font-medium">Invite People</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => setCreateTeamOpen(true)}
                className="cursor-pointer text-indigo-600 dark:text-indigo-400"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-500/10 mr-2 shrink-0">
                  <Plus className="h-3.5 w-3.5 text-indigo-500" />
                </div>
                <span className="text-sm font-medium">Create Team</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Invite shortcut for team workspaces */}
          {workspaceType === 'team' && (
            <button
              onClick={() => setInviteOpen(true)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors"
              title="Invite people"
            >
              <UserPlus className="h-3.5 w-3.5 text-indigo-500" />
            </button>
          )}
        </div>

        {/* Right: Action icons */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Quick Capture */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => useAppStore.getState().setCommandOpen(true)}
            title="Quick capture"
          >
            <Command className="h-4 w-4 text-muted-foreground" />
          </Button>

          {/* Notifications */}
          <Button
            variant={inboxPanelOpen ? 'secondary' : 'ghost'}
            size="icon-sm"
            className="relative"
            onClick={() => {
              setInboxPanelOpen(!inboxPanelOpen)
              setFeedbackOpen(false)
              if (!inboxPanelOpen) fetchNotifications()
            }}
          >
            <Bell className="h-4 w-4 text-amber-500" />
            {globalUnreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold">
                {globalUnreadCount > 9 ? '9+' : globalUnreadCount}
              </span>
            )}
          </Button>

          {/* Feedback */}
          <Button
            variant={feedbackOpen ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => {
              setFeedbackOpen(!feedbackOpen)
              setInboxPanelOpen(false)
            }}
          >
            <MessageCircle className="h-4 w-4 text-pink-500" />
          </Button>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-4 w-4 text-amber-500 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 text-indigo-400 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
      </header>


      {/* Notification Panel */}
      <AnimatePresence>
        {inboxPanelOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed right-0 top-14 z-50 h-[calc(100vh-3.5rem)] w-80 border-l bg-background shadow-xl"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h3 className="font-semibold text-sm">Notifications</h3>
                <Button variant="ghost" size="icon-sm" onClick={() => setInboxPanelOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-2">
                  {notifLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Bell className="h-6 w-6 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No notifications</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="flex gap-3 rounded-md p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => {
                          if (notif.objectType === 'record' && notif.objectId) {
                            setInboxPanelOpen(false)
                            router.push(`/app/memories/${notif.objectId}`)
                          }
                        }}
                      >
                        <div className="mt-0.5">
                          {notif.type === 'todo' && <CheckCircle2 className="h-4 w-4 text-blue-500" />}
                          {notif.type === 'suggestion' && <Sparkles className="h-4 w-4 text-primary" />}
                          {notif.type === 'decision_pending' && <Clock className="h-4 w-4 text-amber-500" />}
                          {!['todo', 'suggestion', 'decision_pending'].includes(notif.type) && (
                            <Bell className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {notif.workspaceName && (
                            <p className="text-[10px] text-muted-foreground/70 mb-0.5">{notif.workspaceName}</p>
                          )}
                          <p className="text-sm font-medium">{notif.title}</p>
                          {notif.body && (
                            <p className="text-xs text-muted-foreground mt-0.5">{notif.body}</p>
                          )}
                          {notif.objectType === 'record' && notif.objectId && (
                            <p className="text-[11px] text-primary mt-1">View memory →</p>
                          )}
                          <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => handleMarkDone(notif.id)}
                            >
                              Done
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => handleSnooze(notif.id)}
                            >
                              Later
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback Panel */}
      <AnimatePresence>
        {feedbackOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed right-0 top-14 z-50 h-[calc(100vh-3.5rem)] w-80 border-l bg-background shadow-xl"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-pink-500" />
                  <h3 className="font-semibold text-sm">Send Feedback</h3>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => setFeedbackOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 p-4 space-y-4">
                {feedbackSent ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-3" />
                    <p className="text-sm font-medium">Thanks for your feedback!</p>
                    <p className="text-xs text-muted-foreground mt-1">We&apos;ll review it shortly.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Type</label>
                      <div className="flex gap-1.5">
                        {([
                          { value: 'feedback' as const, label: 'Feedback' },
                          { value: 'feature_request' as const, label: 'Feature' },
                          { value: 'bug_report' as const, label: 'Bug' },
                        ]).map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setFeedbackType(opt.value)}
                            className={cn(
                              'text-xs px-3 py-1.5 rounded-full border transition-colors',
                              feedbackType === opt.value
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-muted/50 hover:bg-muted border-transparent'
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Message</label>
                      <textarea
                        value={feedbackMessage}
                        onChange={(e) => setFeedbackMessage(e.target.value)}
                        placeholder={
                          feedbackType === 'feature_request'
                            ? 'Describe the feature you\'d like...'
                            : feedbackType === 'bug_report'
                            ? 'What went wrong? Steps to reproduce...'
                            : 'Tell us what you think...'
                        }
                        className="w-full min-h-[120px] rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                        disabled={feedbackSending}
                      />
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleFeedbackSubmit}
                      disabled={!feedbackMessage.trim() || feedbackSending}
                    >
                      {feedbackSending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      {feedbackSending ? 'Sending...' : 'Send'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Team Dialog */}
      <AnimatePresence>
        {createTeamOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => { setCreateTeamOpen(false); setTeamCreated(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-background rounded-2xl border shadow-2xl w-full max-w-md mx-4 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {teamCreated ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    <h3 className="font-semibold text-base">Team created!</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Here&apos;s what to do next:</p>
                  <div className="space-y-2">
                    {[
                      { num: 1, text: 'Invite your team members', Icon: UserPlus },
                      { num: 2, text: 'Create your first team project', Icon: FolderKanban },
                      { num: 3, text: 'Start adding shared memories', Icon: Brain },
                    ].map((step) => (
                      <div key={step.num} className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2.5">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/10 text-xs font-bold text-indigo-500">
                          {step.num}
                        </div>
                        <step.Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{step.text}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white"
                    onClick={() => { setCreateTeamOpen(false); setTeamCreated(false); window.location.href = '/app' }}
                  >
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10">
                      <Users className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base">Create Team Workspace</h3>
                      <p className="text-xs text-muted-foreground">Collaborate with your team on shared memories.</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Team Name</label>
                      <Input
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        placeholder="e.g. Acme Corp, Product Team"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') handleCreateTeam() }}
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="ghost" size="sm" onClick={() => { setCreateTeamOpen(false); setNewTeamName('') }}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="bg-indigo-500 hover:bg-indigo-600 text-white"
                        disabled={!newTeamName.trim() || creatingTeam}
                        onClick={handleCreateTeam}
                      >
                        {creatingTeam ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
                        {creatingTeam ? 'Creating...' : 'Create Team'}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}