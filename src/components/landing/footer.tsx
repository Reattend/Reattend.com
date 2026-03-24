import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Pricing', href: '/pricing' },
      { label: 'Use Cases', href: '/use-case' },
      { label: 'Free Tools', href: '/tool' },
      { label: 'Free Games', href: '/game' },
      { label: 'Help Center', href: '/help' },
    ],
  },
  {
    title: 'Compare',
    links: [
      { label: 'vs Notion', href: '/compare/reattend-vs-notion' },
      { label: 'vs Confluence', href: '/compare/reattend-vs-confluence' },
      { label: 'vs Obsidian', href: '/compare/reattend-vs-obsidian' },
      { label: 'vs Roam Research', href: '/compare/reattend-vs-roam-research' },
      { label: 'All comparisons', href: '/compare' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Contact', href: 'mailto:pb@reattend.ai' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Refund Policy', href: '/refund' },
    ],
  },
]

function SocialIcon({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <a
      href="#"
      aria-label={label}
      className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
    >
      {children}
    </a>
  )
}

export function Footer() {
  return (
    <footer className="bg-[#0B0B0F] text-white" role="contentinfo">
      <div className="max-w-[1200px] mx-auto px-5 pt-16 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10 pb-12 border-b border-white/10">
          {/* Brand column */}
          <div className="col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-4" aria-label="Reattend home">
              <Image src="/logo_white.svg" alt="Reattend" width={28} height={28} className="h-7 w-7" />
              <span className="text-[16px] font-semibold tracking-tight">Reattend</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed max-w-[280px]">
              Your decisions, preserved. AI-powered decision intelligence for teams.
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('/') || link.href.startsWith('mailto') ? (
                      <Link
                        href={link.href}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom line */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Reattend. All rights reserved.
          </p>
          <p className="text-xs text-gray-500">
            Questions? <a href="mailto:pb@reattend.ai" className="text-gray-400 hover:text-white transition-colors">pb@reattend.ai</a>
          </p>
        </div>
      </div>
    </footer>
  )
}
