'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap,
  Eye,
  EyeOff,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  RotateCcw,
  Inbox,
  Loader2,
  Mail,
  MessageSquare,
  FolderOpen,
  Crown,
  ArrowRight,
  Brain,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { TourTooltip } from '@/components/app/tour-tooltip'

interface RawItem {
  id: string
  text: string
  status: 'new' | 'triaged' | 'ignored'
  sourceId: string | null
  externalId: string | null
  author: string | null
  metadata: string | null
  occurredAt: string | null
  createdAt: string
  source: {
    kind: string
    label: string
  } | null
}

interface Project {
  id: string
  name: string
  color: string | null
  isDefault: boolean
}

const statusConfig = {
  new: { label: 'New', icon: Clock, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  triaged: { label: 'Triaged', icon: CheckCircle2, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  ignored: { label: 'Ignored', icon: XCircle, color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400' },
}

const sourceFilters = [
  { key: null, label: 'All Sources', icon: Inbox },
  { key: 'gmail', label: 'Gmail', sourceKind: 'email', icon: Mail },
  { key: 'teams', label: 'Teams', sourceKind: 'chat', icon: MessageSquare },
  { key: 'slack', label: 'Slack', sourceKind: 'chat', icon: MessageSquare },
]

export default function InboxPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <InboxContent />
    </Suspense>
  )
}

function InboxContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sourceFilter = searchParams.get('source')

  const [items, setItems] = useState<RawItem[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showIgnored, setShowIgnored] = useState(false)
  const [triaging, setTriaging] = useState<Set<string>>(new Set())

  // Project picker state
  const [triageTargetItem, setTriageTargetItem] = useState<string | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (sourceFilter) {
        const sf = sourceFilters.find(f => f.key === sourceFilter)
        if (sf?.sourceKind) params.set('sourceKind', sf.sourceKind)
      }
      const res = await fetch(`/api/raw-items?${params.toString()}`)
      const data = await res.json()
      if (data.items) setItems(data.items)
    } catch {
      toast.error('Failed to load inbox')
    } finally {
      setLoading(false)
    }
  }, [sourceFilter])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        if (data.projects) setProjects(data.projects)
      })
      .catch(() => {})
  }, [])

  const filteredItems = items.filter(item =>
    showIgnored ? true : item.status !== 'ignored'
  )

  const newCount = items.filter(i => i.status === 'new').length
  const triagedCount = items.filter(i => i.status === 'triaged').length

  const handleTriageClick = (id: string) => {
    setTriageTargetItem(id)
    setSelectedProjectId(null)
  }

  const typeLabels: Record<string, string> = {
    decision: 'Decision', insight: 'Insight', meeting: 'Meeting',
    idea: 'Idea', context: 'Context', tasklike: 'Task', note: 'Note',
  }

  const handleTriage = async (id: string, projectId?: string) => {
    setTriaging(prev => new Set(prev).add(id))
    try {
      const res = await fetch('/api/raw-items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'triaged', projectId }),
      })
      if (res.ok) {
        const data = await res.json()
        setItems(prev => prev.map(item =>
          item.id === id ? { ...item, status: 'triaged' as const } : item
        ))

        // Show rich feedback with what AI created
        if (data.record) {
          const typeLabel = typeLabels[data.record.type] || data.record.type
          toast(
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 shrink-0">
                <Brain className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Memory created</p>
                <p className="text-xs text-muted-foreground truncate">
                  {typeLabel}: {data.record.title}
                  {data.projectName ? ` → ${data.projectName}` : ''}
                </p>
              </div>
              <Link
                href={`/app/memories/${data.record.id}`}
                className="shrink-0 text-xs font-medium text-primary hover:underline flex items-center gap-0.5"
              >
                View <ArrowRight className="h-3 w-3" />
              </Link>
            </div>,
          )
        } else if (data.result && !data.result.should_store) {
          toast('AI determined this item doesn\'t need to be stored.', { icon: '🗑️' })
          setItems(prev => prev.map(item =>
            item.id === id ? { ...item, status: 'ignored' as const } : item
          ))
        } else {
          toast.success('Item triaged successfully')
        }
      } else {
        const data = await res.json()
        if (data.upgrade) {
          toast(
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500 shrink-0" />
              <div>
                <p className="font-medium text-sm">Pro plan required</p>
                <p className="text-xs text-muted-foreground">AI Triage is available on the Pro plan ($20/mo).</p>
              </div>
              <Link href="/app/billing" className="shrink-0 text-xs font-medium text-primary hover:underline ml-2">
                Upgrade
              </Link>
            </div>,
          )
        } else {
          toast.error(data.error || 'Triage failed')
        }
      }
    } catch {
      toast.error('Failed to triage')
    } finally {
      setTriaging(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const handleBulkTriage = () => {
    const newItems = items.filter(i => i.status === 'new')
    for (const item of newItems) {
      handleTriage(item.id)
    }
  }

  const handleIgnore = async (id: string) => {
    try {
      const res = await fetch('/api/raw-items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'ignored' }),
      })
      if (res.ok) {
        setItems(prev => prev.map(item =>
          item.id === id ? { ...item, status: 'ignored' as const } : item
        ))
        toast('Item ignored')
      }
    } catch {
      toast.error('Failed to ignore item')
    }
  }

  const handleRestore = async (id: string) => {
    try {
      const res = await fetch('/api/raw-items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'new' }),
      })
      if (res.ok) {
        setItems(prev => prev.map(item =>
          item.id === id ? { ...item, status: 'new' as const } : item
        ))
        toast.success('Item restored')
      }
    } catch {
      toast.error('Failed to restore')
    }
  }

  const setSourceFilter = (key: string | null) => {
    const params = new URLSearchParams()
    if (key) params.set('source', key)
    router.push(`/app/inbox${params.toString() ? `?${params.toString()}` : ''}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-4xl"
    >
      <div className="flex items-center justify-between">
        <div>
          <TourTooltip
            tourKey="inbox"
            title="Your Inbox"
            description="Items from your connected integrations appear here. Use AI triage to process them into structured memories."
          >
            <h1 className="text-2xl font-bold tracking-tight">Inbox</h1>
          </TourTooltip>
          <p className="text-sm text-muted-foreground mt-1">
            Raw captures waiting for review. {newCount} new, {triagedCount} processed.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowIgnored(!showIgnored)}
          >
            {showIgnored ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            {showIgnored ? 'Hide' : 'Show'} Ignored
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkTriage}
            disabled={newCount === 0}
          >
            <Zap className="h-4 w-4 mr-1" />
            Triage All ({newCount})
          </Button>
        </div>
      </div>

      {/* Source Filter Bar */}
      <div className="flex gap-2">
        {sourceFilters.map((sf) => {
          const Icon = sf.icon
          return (
            <Button
              key={sf.key || 'all'}
              variant={sourceFilter === sf.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSourceFilter(sf.key)}
              className="text-xs"
            >
              <Icon className="h-3.5 w-3.5 mr-1.5" />
              {sf.label}
            </Button>
          )
        })}
      </div>

      {/* Items List */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="new">New ({newCount})</TabsTrigger>
          <TabsTrigger value="triaged">Triaged ({triagedCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-2 mt-4">
          <AnimatePresence>
            {filteredItems.map((item) => (
              <InboxItem
                key={item.id}
                item={item}
                isTriaging={triaging.has(item.id)}
                onTriage={() => handleTriageClick(item.id)}
                onIgnore={() => handleIgnore(item.id)}
                onRestore={() => handleRestore(item.id)}
              />
            ))}
          </AnimatePresence>
          {filteredItems.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Inbox className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>{sourceFilter ? `No items from ${sourceFilter}.` : 'Your inbox is empty. Items from integrations will appear here.'}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="new" className="space-y-2 mt-4">
          {items.filter(i => i.status === 'new').map((item) => (
            <InboxItem
              key={item.id}
              item={item}
              isTriaging={triaging.has(item.id)}
              onTriage={() => handleTriageClick(item.id)}
              onIgnore={() => handleIgnore(item.id)}
              onRestore={() => handleRestore(item.id)}
            />
          ))}
          {items.filter(i => i.status === 'new').length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>All caught up! No new items.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="triaged" className="space-y-2 mt-4">
          {items.filter(i => i.status === 'triaged').map((item) => (
            <InboxItem
              key={item.id}
              item={item}
              isTriaging={false}
              onTriage={() => handleTriageClick(item.id)}
              onIgnore={() => handleIgnore(item.id)}
              onRestore={() => handleRestore(item.id)}
            />
          ))}
          {items.filter(i => i.status === 'triaged').length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Inbox className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No triaged items yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Project Picker Dialog */}
      <Dialog open={!!triageTargetItem} onOpenChange={() => setTriageTargetItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Approve & Assign
            </DialogTitle>
            <DialogDescription>
              Choose a project for this memory, or let AI decide.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
            <button
              className={cn(
                'w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-left transition-colors',
                selectedProjectId === null
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              )}
              onClick={() => setSelectedProjectId(null)}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Let AI decide
            </button>
            {projects.map(p => (
              <button
                key={p.id}
                className={cn(
                  'w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-left transition-colors',
                  selectedProjectId === p.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                )}
                onClick={() => setSelectedProjectId(p.id)}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: p.color || '#6366f1' }}
                />
                {p.name}
                {p.isDefault && <Badge variant="secondary" className="text-[9px] ml-auto">Default</Badge>}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setTriageTargetItem(null)}>Cancel</Button>
            <Button
              size="sm"
              onClick={() => {
                if (triageTargetItem) {
                  handleTriage(triageTargetItem, selectedProjectId || undefined)
                }
                setTriageTargetItem(null)
              }}
            >
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

function InboxItem({
  item,
  isTriaging,
  onTriage,
  onIgnore,
  onRestore,
}: {
  item: RawItem
  isTriaging: boolean
  onTriage: () => void
  onIgnore: () => void
  onRestore: () => void
}) {
  const config = statusConfig[item.status]
  const StatusIcon = config.icon
  const isEmail = item.source?.kind === 'email'
  const isChat = item.source?.kind === 'chat'
  const metadata = item.metadata ? JSON.parse(item.metadata) : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        'group flex gap-3 rounded-lg border p-4 transition-all hover:shadow-sm',
        isTriaging && 'border-primary/30 bg-primary/5'
      )}
    >
      <div className="mt-0.5 shrink-0">
        {isTriaging ? (
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
        ) : isEmail ? (
          <Mail className="h-4 w-4 text-muted-foreground" />
        ) : isChat ? (
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        ) : (
          <StatusIcon className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        {isEmail && metadata ? (
          <>
            <p className="text-sm font-medium truncate">{metadata.subject || '(No Subject)'}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              From: {metadata.from}
            </p>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {item.text.split('\n\n').slice(1).join(' ').substring(0, 200)}
            </p>
          </>
        ) : isChat && metadata ? (
          <>
            <p className="text-sm font-medium truncate">{metadata.chatTopic || 'Teams Chat'}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              From: {metadata.senderName || 'Unknown'}
              {metadata.chatType && <span className="ml-2 opacity-60">({metadata.chatType === 'oneOnOne' ? '1:1' : metadata.chatType})</span>}
            </p>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {item.text.split('\n\n').slice(1).join(' ').substring(0, 200)}
            </p>
          </>
        ) : (
          <p className="text-sm leading-relaxed">{item.text}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary" className={cn('text-[10px]', config.color)}>
            {config.label}
          </Badge>
          {item.source && (
            <Badge variant="outline" className="text-[10px]">
              {item.source.label}
            </Badge>
          )}
          <span className="text-[10px] text-muted-foreground">
            {new Date(item.occurredAt || item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {item.status === 'new' && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onTriage}
            disabled={isTriaging}
          >
            <Zap className="h-3 w-3 mr-1" />
            Triage
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {item.status === 'new' && (
              <DropdownMenuItem onClick={onTriage}>
                <Zap className="mr-2 h-4 w-4" /> Run Triage
              </DropdownMenuItem>
            )}
            {item.status !== 'ignored' && (
              <DropdownMenuItem onClick={onIgnore}>
                <XCircle className="mr-2 h-4 w-4" /> Ignore
              </DropdownMenuItem>
            )}
            {item.status === 'ignored' && (
              <DropdownMenuItem onClick={onRestore}>
                <RotateCcw className="mr-2 h-4 w-4" /> Restore
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  )
}
