'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Search as SearchIcon,
  Sparkles,
  ArrowRight,
  Loader2,
  Send,
  Bot,
  User,
  RotateCcw,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const typeColors: Record<string, string> = {
  decision: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  meeting: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  idea: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  insight: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  context: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  tasklike: 'bg-red-500/10 text-red-600 dark:text-red-400',
  note: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
  project: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  'entity:person': 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  'entity:topic': 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  'entity:organization': 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
}

interface SearchResult {
  id: string
  type: string
  title: string
  summary: string | null
  score: number
  source: 'text' | 'semantic'
}

interface AskMessage {
  role: 'user' | 'ai'
  content: string
  followUps?: string[]
}

export default function SearchPage() {
  const [activeTab, setActiveTab] = useState<'search' | 'ask'>('search')

  // Search state
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searchMode, setSearchMode] = useState<'hybrid' | 'text' | 'semantic'>('hybrid')
  const [hasSearched, setHasSearched] = useState(false)
  const [searching, setSearching] = useState(false)

  // Ask AI state
  const [askInput, setAskInput] = useState('')
  const [askMessages, setAskMessages] = useState<AskMessage[]>([])
  const [askLoading, setAskLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [askMessages])

  const handleSearch = async (q?: string) => {
    const searchQuery = q || query
    if (!searchQuery.trim()) return
    setQuery(searchQuery)
    setHasSearched(true)
    setSearching(true)

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&mode=${searchMode}`)
      const data = await res.json()
      if (data.results) {
        setResults(data.results)
      } else {
        setResults([])
      }
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleAsk = async (overrideQuestion?: string) => {
    const question = overrideQuestion || askInput.trim()
    if (!question) return
    setAskInput('')

    const history = askMessages.map(m => ({ role: m.role, content: m.content }))
    setAskMessages(prev => [...prev, { role: 'user', content: question }])
    setAskLoading(true)
    setAskMessages(prev => [...prev, { role: 'ai', content: '' }])

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, history }),
      })

      if (!res.ok) {
        const data = await res.json()
        setAskMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'ai', content: data.error || 'Sorry, I could not find an answer.' }
          return updated
        })
        return
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No stream')

      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        const displayText = accumulated.split('---FOLLOWUPS---')[0].trim()
        setAskMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'ai', content: displayText }
          return updated
        })
      }

      const parts = accumulated.split('---FOLLOWUPS---')
      const answerText = parts[0].trim()
      let followUps: string[] = []
      if (parts[1]) {
        followUps = parts[1]
          .split('\n')
          .map(line => line.replace(/^-\s*/, '').trim())
          .filter(line => line.length > 5 && line.length < 100)
          .slice(0, 2)
      }

      setAskMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'ai',
          content: answerText || 'I don\'t have enough context in your memories to answer that yet.',
          followUps: followUps.length > 0 ? followUps : undefined,
        }
        return updated
      })
    } catch {
      setAskMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'ai', content: 'Sorry, something went wrong. Please try again.' }
        return updated
      })
    } finally {
      setAskLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-3xl mx-auto"
    >
      <div className="text-center space-y-2 pt-8">
        <h1 className="text-2xl font-bold tracking-tight">Search Your Memory</h1>
        <p className="text-sm text-muted-foreground">
          Find memories or ask AI questions about your knowledge.
        </p>
      </div>

      {/* Tab Toggle */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1">
          <button
            onClick={() => setActiveTab('search')}
            className={cn(
              'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all',
              activeTab === 'search'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <SearchIcon className="h-4 w-4" />
            Search
          </button>
          <button
            onClick={() => setActiveTab('ask')}
            className={cn(
              'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all',
              activeTab === 'ask'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Sparkles className="h-4 w-4" />
            Ask AI
          </button>
        </div>
      </div>

      {/* Search Tab */}
      {activeTab === 'search' && (
        <>
          {/* Search Bar */}
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search anything in your memory..."
              className="h-12 pl-12 pr-4 text-base rounded-xl"
              autoFocus
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <Button
                variant={searchMode === 'hybrid' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 text-[10px]"
                onClick={() => setSearchMode('hybrid')}
              >
                Hybrid
              </Button>
              <Button
                variant={searchMode === 'semantic' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 text-[10px]"
                onClick={() => setSearchMode('semantic')}
              >
                <Sparkles className="h-3 w-3 mr-1" /> Semantic
              </Button>
            </div>
          </div>

          {/* Results */}
          {hasSearched && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {searching ? 'Searching...' : `${results.length} results for "${query}"`}
                </p>
              </div>

              {searching ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <AnimatePresence>
                  {results.map((result, i) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link href={
                        result.type === 'project'
                          ? `/app/projects/${result.id}`
                          : result.type.startsWith('entity')
                            ? `/app/search`
                            : `/app/memories/${result.id}`
                      }>
                        <Card className="hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group">
                          <CardContent className="p-4 flex gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="secondary" className={cn('text-[10px]', typeColors[result.type])}>
                                  {result.type.replace('entity:', '')}
                                </Badge>
                                <Badge variant="outline" className="text-[9px]">
                                  {result.source === 'semantic' ? 'semantic' : 'text'}
                                </Badge>
                              </div>
                              <h3 className="text-sm font-medium group-hover:text-primary transition-colors">
                                {result.title}
                              </h3>
                              {result.summary && (
                                <p className="text-xs text-muted-foreground mt-0.5">{result.summary}</p>
                              )}
                            </div>
                            <div className="flex items-center shrink-0">
                              <span className="text-xs text-muted-foreground">{Math.round(result.score * 100)}%</span>
                              <ArrowRight className="h-4 w-4 ml-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}

              {!searching && results.length === 0 && (
                <div className="text-center py-12">
                  <SearchIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-muted-foreground text-sm">No results found. Try a different query.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Ask AI Tab */}
      {activeTab === 'ask' && (
        <div className="flex flex-col rounded-xl border bg-background shadow-sm" style={{ minHeight: '460px' }}>
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: '500px' }}>
            {askMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 mb-4">
                  <Sparkles className="h-6 w-6 text-violet-500/60" />
                </div>
                <p className="text-sm font-medium mb-1">Ask your memory anything</p>
                <p className="text-xs text-muted-foreground mb-5 max-w-[300px]">
                  Get AI-powered answers from your memories, meetings, and decisions.
                </p>
                <div className="flex flex-col gap-2 w-full max-w-[320px]">
                  {['What decisions did I make this week?', 'Summarize my meeting notes', 'What are my open tasks?'].map((q) => (
                    <button
                      key={q}
                      onClick={() => handleAsk(q)}
                      className="group text-left text-xs px-3.5 py-2.5 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted hover:border-border transition-all text-muted-foreground hover:text-foreground"
                    >
                      <span className="opacity-70 group-hover:opacity-100 transition-opacity">{q}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {askMessages.map((msg, i) => (
                  <React.Fragment key={i}>
                    <div className={cn('flex gap-2.5', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                      <div className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5',
                        msg.role === 'user' ? 'bg-primary/10' : 'bg-violet-500/10'
                      )}>
                        {msg.role === 'user' ? (
                          <User className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <Bot className="h-3.5 w-3.5 text-violet-500" />
                        )}
                      </div>
                      <div className={cn(
                        'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-tr-md'
                          : 'bg-muted/70 border border-border/40 rounded-tl-md'
                      )}>
                        {msg.role === 'ai' && msg.content === '' && askLoading ? (
                          <div className="flex items-center gap-2 py-0.5">
                            <div className="flex gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-violet-500/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="h-1.5 w-1.5 rounded-full bg-violet-500/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="h-1.5 w-1.5 rounded-full bg-violet-500/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-muted-foreground text-xs">Searching memories...</span>
                          </div>
                        ) : (
                          <>
                            {msg.content}
                            {msg.role === 'ai' && askLoading && i === askMessages.length - 1 && (
                              <span className="inline-block w-1 h-4 bg-violet-500/50 animate-pulse ml-0.5 align-text-bottom rounded-sm" />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    {msg.role === 'ai' && msg.followUps && msg.followUps.length > 0 && !askLoading && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                        className="flex flex-wrap gap-1.5 ml-9"
                      >
                        {msg.followUps.map((fq, fi) => (
                          <button
                            key={fi}
                            onClick={() => handleAsk(fq)}
                            className="text-[11px] px-3 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10 text-violet-600 dark:text-violet-400 transition-all hover:border-violet-500/30 text-left"
                          >
                            {fq}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </React.Fragment>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="border-t bg-muted/20 p-3 rounded-b-xl">
            <form
              onSubmit={(e) => { e.preventDefault(); handleAsk() }}
              className="flex gap-2"
            >
              <Input
                value={askInput}
                onChange={(e) => setAskInput(e.target.value)}
                placeholder="Ask anything about your memories..."
                className="flex-1 bg-background border-border/60 focus-visible:ring-violet-500/30"
                disabled={askLoading}
                autoFocus={activeTab === 'ask'}
              />
              {askMessages.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setAskMessages([])}
                  title="Reset chat"
                  className="text-muted-foreground hover:text-foreground shrink-0"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
              <Button
                type="submit"
                size="icon"
                disabled={!askInput.trim() || askLoading}
                className="bg-violet-500 hover:bg-violet-600 text-white shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  )
}
