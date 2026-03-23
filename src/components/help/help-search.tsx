'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, ArrowRight } from 'lucide-react'
import { HELP_CATEGORIES, searchArticles } from '@/lib/help/data'

export function HelpSearch() {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    if (query.trim().length < 2) return null
    return searchArticles(query)
  }, [query])

  const filteredCategories = useMemo(() => {
    if (!query.trim()) return HELP_CATEGORIES
    const q = query.toLowerCase()
    return HELP_CATEGORIES.filter(
      c =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.articles.some(a => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q))
    )
  }, [query])

  return (
    <div>
      {/* Search input */}
      <div className="relative max-w-xl mx-auto mb-10">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground/60" />
        <input
          type="text"
          placeholder="Search articles..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/70 dark:bg-white/5 backdrop-blur-sm border border-white/80 dark:border-white/10 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]/30 transition-all shadow-sm"
        />
      </div>

      {/* Search results */}
      {results && results.length > 0 && (
        <div className="max-w-xl mx-auto mb-10">
          <p className="text-xs text-muted-foreground mb-3">{results.length} result{results.length !== 1 ? 's' : ''}</p>
          <div className="space-y-2">
            {results.map(a => (
              <Link
                key={`${a.category}/${a.slug}`}
                href={`/help/${a.category}/${a.slug}`}
                className="flex items-center justify-between gap-3 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-white/80 dark:border-white/10 px-4 py-3 hover:bg-white/80 dark:hover:bg-white/10 transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{a.categoryTitle}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-[#4F46E5] transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {results && results.length === 0 && (
        <div className="max-w-xl mx-auto mb-10 text-center py-8">
          <p className="text-sm text-muted-foreground">No articles found for &quot;{query}&quot;</p>
        </div>
      )}

      {/* Category grid — filtered if searching */}
      {(!results || results.length === 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map(cat => (
            <Link
              key={cat.slug}
              href={`/help/${cat.slug}`}
              className="group rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 p-5 hover:shadow-[0_4px_20px_rgba(79,70,229,0.08)] transition-all"
            >
              <div className="flex items-center gap-3 mb-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4F46E5]/10 shrink-0">
                  <CategoryIcon name={cat.icon} />
                </div>
                <h3 className="font-semibold text-sm text-foreground group-hover:text-[#4F46E5] transition-colors">
                  {cat.title}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-2">{cat.description}</p>
              <p className="text-[11px] text-muted-foreground/60">{cat.articles.length} article{cat.articles.length !== 1 ? 's' : ''}</p>
            </Link>
          ))}
          {filteredCategories.length === 0 && (
            <div className="col-span-full text-center py-8">
              <p className="text-sm text-muted-foreground">No categories match your search.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* Inline icon resolver — avoids dynamic import overhead */
import {
  Rocket, Inbox, Brain, FolderKanban, LayoutDashboard,
  Search as SearchIcon, Sparkles, Users, Plug, Settings,
} from 'lucide-react'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Rocket, Inbox, Brain, FolderKanban, LayoutDashboard,
  Search: SearchIcon, Sparkles, Users, Plug, Settings,
}

function CategoryIcon({ name }: { name: string }) {
  const Icon = ICON_MAP[name]
  if (!Icon) return null
  return <Icon className="h-4 w-4 text-[#4F46E5]" />
}
