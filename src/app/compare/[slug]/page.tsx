import React from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Check, X, Minus, ArrowRight, ChevronRight, Sparkles } from 'lucide-react'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { COMPETITORS, getCompetitorBySlug } from '@/lib/compare/data'

export function generateStaticParams() {
  return COMPETITORS.map(c => ({ slug: c.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const comp = getCompetitorBySlug(params.slug)
  if (!comp) return {}
  return {
    title: `${comp.tagline} | Reattend`,
    description: comp.description,
    openGraph: {
      title: comp.tagline,
      description: comp.description,
      url: `https://reattend.com/compare/${comp.slug}`,
    },
    alternates: { canonical: `https://reattend.com/compare/${comp.slug}` },
  }
}

function FeatureCell({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
      </span>
    )
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30">
        <X className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
      </span>
    )
  }
  return (
    <span className="text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
      {value}
    </span>
  )
}

export default function ComparePage({ params }: { params: { slug: string } }) {
  const comp = getCompetitorBySlug(params.slug)
  if (!comp) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: comp.tagline,
    description: comp.description,
    url: `https://reattend.com/compare/${comp.slug}`,
    publisher: {
      '@type': 'Organization',
      name: 'Reattend',
      url: 'https://reattend.com',
    },
  }

  const otherComparisons = COMPETITORS.filter(c => c.slug !== comp.slug)

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-background">
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#4F46E5]/8 to-[#818CF8]/5 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#818CF8]/6 to-[#C084FC]/4 blur-3xl" />
      </div>

      <Navbar />

      <main className="max-w-[900px] mx-auto px-5 pt-12 pb-24">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/compare" className="hover:text-foreground transition-colors">Compare</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">vs {comp.name}</span>
        </nav>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-[#4F46E5] bg-[#4F46E5]/10 px-3 py-1 rounded-full mb-4">
            <Sparkles className="w-3 h-3" />
            Comparison
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
            Reattend vs {comp.name}
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            {comp.description}
          </p>
        </div>

        {/* Feature comparison table */}
        <div className="rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 overflow-hidden mb-10">
          <div className="px-6 py-4 border-b border-gray-200/50 dark:border-white/10">
            <h2 className="text-lg font-semibold text-foreground">Feature comparison</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200/50 dark:border-white/10">
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                    Feature
                  </th>
                  <th className="text-center text-xs font-semibold text-[#4F46E5] uppercase tracking-wider px-4 py-3 w-[140px]">
                    Reattend
                  </th>
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 w-[140px]">
                    {comp.name}
                  </th>
                </tr>
              </thead>
              <tbody>
                {comp.features.map((f, i) => (
                  <tr
                    key={f.name}
                    className={`border-b border-gray-100/50 dark:border-white/5 ${
                      i % 2 === 0 ? 'bg-white/30 dark:bg-white/[0.02]' : ''
                    }`}
                  >
                    <td className="text-sm text-foreground px-6 py-3">{f.name}</td>
                    <td className="text-center px-4 py-3">
                      <div className="flex justify-center">
                        <FeatureCell value={f.reattend} />
                      </div>
                    </td>
                    <td className="text-center px-4 py-3">
                      <div className="flex justify-center">
                        <FeatureCell value={f.competitor} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Wins sections */}
        <div className="grid sm:grid-cols-2 gap-5 mb-10">
          <div className="rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 p-6">
            <h3 className="text-sm font-semibold text-[#4F46E5] mb-4">Where Reattend shines</h3>
            <ul className="space-y-3">
              {comp.reattendWins.map(w => (
                <li key={w} className="flex gap-2.5 text-sm text-foreground">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 p-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4">Where {comp.name} shines</h3>
            <ul className="space-y-3">
              {comp.competitorWins.map(w => (
                <li key={w} className="flex gap-2.5 text-sm text-foreground">
                  <Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Best for */}
        <div className="rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 p-6 mb-10">
          <h2 className="text-lg font-semibold text-foreground mb-5">Who should use what?</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <div className="text-xs font-semibold text-[#4F46E5] uppercase tracking-wider mb-2">
                Choose Reattend if...
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{comp.bestFor.reattend}</p>
            </div>
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Choose {comp.name} if...
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{comp.bestFor.competitor}</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] p-8 text-center text-white mb-12">
          <h2 className="text-xl font-bold mb-2">Ready to try Reattend?</h2>
          <p className="text-sm text-white/80 mb-5 max-w-md mx-auto">
            Start capturing and connecting your team&apos;s knowledge with AI. Free to get started, no credit card required.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-[#4F46E5] font-semibold text-sm px-6 py-2.5 rounded-full hover:bg-white/90 transition-colors"
          >
            Get started free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Other comparisons */}
        {otherComparisons.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Other comparisons</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {otherComparisons.map(c => (
                <Link
                  key={c.slug}
                  href={`/compare/${c.slug}`}
                  className="flex items-center justify-between gap-3 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 px-5 py-3.5 hover:shadow-[0_4px_20px_rgba(79,70,229,0.08)] transition-all group"
                >
                  <span className="text-sm font-medium text-foreground group-hover:text-[#4F46E5] transition-colors">
                    Reattend vs {c.name}
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-[#4F46E5] transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  )
}
