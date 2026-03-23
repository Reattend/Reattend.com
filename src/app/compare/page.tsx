import React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { COMPETITORS } from '@/lib/compare/data'

export const metadata: Metadata = {
  title: 'Compare Reattend - How We Stack Up Against Alternatives',
  description:
    'See how Reattend compares to Notion, Confluence, Obsidian, Roam Research, Mem, Slite, Microsoft Loop, and Coda. Feature-by-feature comparisons.',
  openGraph: {
    title: 'Compare Reattend - How We Stack Up',
    description: 'Feature-by-feature comparisons of Reattend vs popular knowledge management tools.',
    url: 'https://reattend.com/compare',
  },
  alternates: { canonical: 'https://reattend.com/compare' },
}

const compareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Compare Reattend',
  description: 'Feature-by-feature comparisons of Reattend vs popular knowledge management tools.',
  url: 'https://reattend.com/compare',
  publisher: {
    '@type': 'Organization',
    name: 'Reattend',
    url: 'https://reattend.com',
  },
}

export default function CompareIndexPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-background">
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#4F46E5]/8 to-[#818CF8]/5 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#818CF8]/6 to-[#C084FC]/4 blur-3xl" />
      </div>

      <Navbar />

      <main className="max-w-[900px] mx-auto px-5 pt-16 pb-24">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-[#4F46E5] bg-[#4F46E5]/10 px-3 py-1 rounded-full mb-4">
            <Sparkles className="w-3 h-3" />
            Comparisons
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
            How Reattend compares
          </h1>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            Reattend is the AI decision intelligence platform for teams. See how it stacks up against
            popular knowledge management and note-taking tools.
          </p>
        </div>

        {/* Comparison cards */}
        <div className="grid sm:grid-cols-2 gap-4">
          {COMPETITORS.map(c => (
            <Link
              key={c.slug}
              href={`/compare/${c.slug}`}
              className="group rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 p-6 hover:shadow-[0_8px_32px_rgba(79,70,229,0.08)] transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-foreground group-hover:text-[#4F46E5] transition-colors">
                  Reattend vs {c.name}
                </h2>
                <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-[#4F46E5] transition-colors shrink-0" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                {c.description}
              </p>
              <div className="mt-3 text-xs text-muted-foreground/60">
                {c.features.length} features compared
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Ready to see Reattend in action?
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-sm px-6 py-2.5 rounded-full transition-colors shadow-[0_4px_14px_rgba(79,70,229,0.3)]"
          >
            Get started free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <Footer />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(compareJsonLd) }}
      />
    </div>
  )
}
