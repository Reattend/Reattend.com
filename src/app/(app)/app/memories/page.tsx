'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Brain,
  Search,
  Plus,
  Lock,
  Grid3X3,
  List,
  Network,
  GanttChart,
  Loader2,
  Paperclip,
  Upload,
  FileText,
  X,
  Scale,
  Users,
  Flame,
  Lightbulb,
  CircleCheckBig,
  PenLine,
  Mic,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { TourTooltip } from '@/components/app/tour-tooltip'
import { useRouter } from 'next/navigation'

type MemoryRecord = {
  id: string
  title: string
  type: string
  summary: string | null
  content: string | null
  confidence: number | null
  tags: string | null
  locked: boolean | null
  createdAt: string
}

type Project = {
  id: string
  name: string
  color: string | null
  isDefault: boolean | null
}

const typeColors: Record<string, string> = {
  decision: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  meeting: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  idea: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  insight: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  context: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  tasklike: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  note: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
  transcript: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
}

const typeIcons: Record<string, any> = {
  decision: Scale, meeting: Users, idea: Flame, insight: Lightbulb,
  context: FileText, tasklike: CircleCheckBig, note: PenLine, transcript: Mic,
}

function parseTags(tags: string | null): string[] {
  if (!tags) return []
  try { return JSON.parse(tags) } catch { return [] }
}

export default function MemoriesPage() {
  const router = useRouter()
  const [records, setRecords] = useState<MemoryRecord[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'timeline'>('grid')

  // Create memory state
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [creating, setCreating] = useState(false)
  const [createMode, setCreateMode] = useState<'text' | 'file'>('text')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([fetchRecords(), fetchProjects()])
  }, [])

  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/records?limit=50&offset=0')
      const data = await res.json()
      if (data.records) setRecords(data.records)
      if (data.total !== undefined) setTotal(data.total)
      setOffset(50)
    } catch {
      toast.error('Failed to load memories')
    } finally {
      setLoading(false)
    }
  }

  const loadMore = async () => {
    setLoadingMore(true)
    try {
      const res = await fetch(`/api/records?limit=50&offset=${offset}`)
      const data = await res.json()
      if (data.records) setRecords(prev => [...prev, ...data.records])
      setOffset(prev => prev + 50)
    } catch {
      toast.error('Failed to load more')
    } finally {
      setLoadingMore(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      if (data.projects) setProjects(data.projects)
    } catch { /* silent */ }
  }

  const handleCreateMemory = async () => {
    if (createMode === 'file') {
      if (!selectedFile) return
      setCreating(true)
      try {
        const formData = new FormData()
        formData.append('file', selectedFile)
        if (selectedProjectId) formData.append('project_id', selectedProjectId)
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        const data = await res.json()
        if (!res.ok) { toast.error(data.error || 'Failed to upload'); return }
        if (data.record) setRecords(prev => [data.record, ...prev])
        toast.success('File uploaded! AI is enriching it in the background.')
        setShowCreateDialog(false)
        setNewContent('')
        setSelectedFile(null)
        setSelectedProjectId('')
        setCreateMode('text')
      } catch {
        toast.error('Failed to upload file')
      } finally {
        setCreating(false)
      }
      return
    }

    if (!newContent.trim()) return
    setCreating(true)

    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newContent.trim(),
          project_id: selectedProjectId || undefined,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to create memory')
        return
      }

      if (data.record) {
        setRecords(prev => [data.record, ...prev])
      }

      toast.success('Memory saved! AI is enriching it in the background.')
      setShowCreateDialog(false)
      setNewContent('')
      setSelectedProjectId('')
    } catch {
      toast.error('Failed to create memory')
    } finally {
      setCreating(false)
    }
  }

  const groupByDate = (recs: MemoryRecord[]) => {
    const map = new Map<string, MemoryRecord[]>()
    for (const r of recs) {
      const key = new Date(r.createdAt).toDateString()
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(r)
    }
    const now = new Date()
    const today = new Date(now.toDateString())
    return Array.from(map.entries()).map(([key, items]) => {
      const d = new Date(key)
      const diff = Math.floor((today.getTime() - d.getTime()) / 86400000)
      let label: string
      if (diff === 0) label = 'Today'
      else if (diff === 1) label = 'Yesterday'
      else if (diff < 7) label = d.toLocaleDateString('en-US', { weekday: 'long' })
      else label = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', ...(diff > 365 ? { year: 'numeric' } : {}) })
      return { label, key, items }
    })
  }

  const filtered = records.filter(r => {
    if (typeFilter !== 'all' && r.type !== typeFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const tags = parseTags(r.tags)
      return r.title.toLowerCase().includes(q) ||
        (r.summary && r.summary.toLowerCase().includes(q)) ||
        tags.some(t => t.includes(q))
    }
    return true
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-6xl"
    >
      <div className="flex items-center justify-between">
        <div>
          <TourTooltip
            tourKey="memories"
            title="Your Memories"
            description="All your processed memories live here. Click one to see details, edit tags, or explore connections."
          >
            <h1 className="text-2xl font-bold tracking-tight">Memories</h1>
          </TourTooltip>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? 'Loading...' : `${total} curated memories across your workspace.`}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-1" />
          New Memory
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memories..."
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="decision">Decisions</SelectItem>
            <SelectItem value="meeting">Meetings</SelectItem>
            <SelectItem value="idea">Ideas</SelectItem>
            <SelectItem value="insight">Insights</SelectItem>
            <SelectItem value="context">Context</SelectItem>
            <SelectItem value="tasklike">Tasks</SelectItem>
            <SelectItem value="note">Notes</SelectItem>
            <SelectItem value="transcript">Transcripts</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex border rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setViewMode('list')}
            title="List view"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'timeline' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setViewMode('timeline')}
            title="Timeline view"
          >
            <GanttChart className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push('/app/board')}
            title="Board view"
          >
            <Network className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Records */}
      {!loading && viewMode === 'list' && (
        <div className="space-y-2">
          {filtered.map((record, i) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link href={`/app/memories/${record.id}`}>
                <Card className="hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group">
                  <CardContent className="p-4 flex gap-4">
                    <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg shrink-0', typeColors[record.type]?.split(' ').find(c => c.startsWith('bg-')) || 'bg-muted')}>
                      {(() => { const Icon = typeIcons[record.type] || PenLine; return <Icon className={cn('h-4 w-4', typeColors[record.type]?.split(' ').find(c => c.startsWith('text-')) || '')} /> })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                          {record.title}
                        </h3>
                        {parseTags(record.tags).includes('attachment') && <Paperclip className="h-3 w-3 text-primary/60" />}
                        {record.locked && <Lock className="h-3 w-3 text-muted-foreground" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {record.summary || record.content || 'No summary'}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className={cn('text-[10px]', typeColors[record.type] || '')}>
                          {record.type}
                        </Badge>
                        {parseTags(record.tags).slice(0, 3).map(tag => (
                          <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(record.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      {record.confidence != null && (
                        <div className="flex items-center gap-1">
                          <Progress value={record.confidence * 100} className="w-12 h-1" />
                          <span className="text-[10px] text-muted-foreground">{Math.round(record.confidence * 100)}%</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((record, i) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link href={`/app/memories/${record.id}`}>
                <Card className="hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className={cn('text-[10px] flex items-center gap-1', typeColors[record.type] || '')}>
                        {(() => { const Icon = typeIcons[record.type] || PenLine; return <Icon className="h-3 w-3" /> })()}
                        {record.type}
                      </Badge>
                      {record.locked && <Lock className="h-3 w-3 text-muted-foreground" />}
                    </div>
                    <h3 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">
                      {record.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {record.summary || record.content || 'No summary'}
                    </p>
                    <div className="flex items-center gap-1 mt-3 flex-wrap">
                      {parseTags(record.tags).slice(0, 2).map(tag => (
                        <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(record.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      {record.confidence != null && (
                        <div className="flex items-center gap-1">
                          <Progress value={record.confidence * 100} className="w-10 h-1" />
                          <span className="text-[10px] text-muted-foreground">{Math.round(record.confidence * 100)}%</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && viewMode === 'timeline' && (
        <div>
          {groupByDate(filtered).map((group) => (
            <div key={group.key} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  {group.label}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="relative pl-7">
                <div className="absolute left-2.5 top-0 bottom-0 w-px bg-border/70" />
                <div className="space-y-3">
                  {group.items.map((record, i) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="relative"
                    >
                      <div className="absolute -left-[18px] top-4 h-2.5 w-2.5 rounded-full border-2 border-primary bg-background" />
                      <Link href={`/app/memories/${record.id}`}>
                        <Card className="hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group">
                          <CardContent className="p-3.5 flex gap-3">
                            <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg shrink-0', typeColors[record.type]?.split(' ').find(c => c.startsWith('bg-')) || 'bg-muted')}>
                              {(() => { const Icon = typeIcons[record.type] || PenLine; return <Icon className={cn('h-3.5 w-3.5', typeColors[record.type]?.split(' ').find(c => c.startsWith('text-')) || '')} /> })()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-1">
                                  {record.title}
                                </h3>
                                <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                                  {new Date(record.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {record.summary || record.content || 'No summary'}
                              </p>
                              <div className="flex items-center gap-1.5 mt-2">
                                <Badge variant="secondary" className={cn('text-[10px]', typeColors[record.type] || '')}>
                                  {record.type}
                                </Badge>
                                {parseTags(record.tags).slice(0, 3).map(tag => (
                                  <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                                ))}
                                {record.locked && <Lock className="h-3 w-3 text-muted-foreground ml-auto" />}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {!loading && records.length < total && filtered.length > 0 && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Load more ({total - records.length} remaining)
          </Button>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16">
          <Brain className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground">
            {records.length === 0 ? 'No memories yet. Create your first one!' : 'No memories found matching your filters.'}
          </p>
          {records.length === 0 && (
            <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Create Memory
            </Button>
          )}
        </div>
      )}

      {/* Create Memory Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open)
        if (!open) { setCreateMode('text'); setSelectedFile(null); setNewContent('') }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              New Memory
            </DialogTitle>
            <DialogDescription>
              Add text or upload a document. AI enriches it in the background.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Mode toggle */}
            <div className="flex border rounded-lg p-0.5 bg-muted/30">
              <button
                onClick={() => setCreateMode('text')}
                className={cn('flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors', createMode === 'text' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground')}
              >
                <FileText className="h-3.5 w-3.5" /> Text
              </button>
              <button
                onClick={() => setCreateMode('file')}
                className={cn('flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors', createMode === 'file' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground')}
              >
                <Upload className="h-3.5 w-3.5" /> Upload File
              </button>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 flex items-center gap-1">Project</label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full inline-block"
                          style={{ backgroundColor: p.color || '#6366f1' }}
                        />
                        {p.name}
                        {p.isDefault && ' (Default)'}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {createMode === 'text' ? (
              <div>
                <label className="text-sm font-medium mb-1.5 flex items-center gap-1">Content</label>
                <Textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="e.g., Decided to use React Flow for the memory graph. It supports interactive nodes, edges, and canvas interactions. Sarah agreed this was the best option after evaluating D3 and vis.js."
                  rows={5}
                  autoFocus
                />
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium mb-1.5 flex items-center gap-1">Document</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.md,.csv,image/*"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                {selectedFile ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                    <Paperclip className="h-5 w-5 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(0)} KB &middot; {selectedFile.type || 'unknown type'}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon-sm" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex flex-col items-center gap-2 p-8 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30 transition-colors"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground/50" />
                    <div className="text-center">
                      <p className="text-sm font-medium">Click to upload a file</p>
                      <p className="text-xs text-muted-foreground mt-0.5">PDF, Word, text, images (max 20MB)</p>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button
              onClick={handleCreateMemory}
              disabled={(createMode === 'text' ? !newContent.trim() : !selectedFile) || creating}
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  {createMode === 'file' ? 'Uploading...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  {createMode === 'file' ? 'Upload' : 'Submit'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
