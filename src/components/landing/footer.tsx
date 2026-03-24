import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/#features' },
      { label: 'How it works', href: '/#how-it-works' },
      { label: 'Integrations', href: '/#integrations' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Help Center', href: '/help' },
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

export function Footer() {
  return (
    <footer className="bg-[#0A0A0F] text-white" role="contentinfo">
      <div className="max-w-[1200px] mx-auto px-5 pt-16 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 pb-12 border-b border-white/8">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-5" aria-label="Reattend home">
              <Image src="/white_logo.svg" alt="Reattend" width={28} height={28} className="h-7 w-7" />
              <span className="text-[16px] font-bold tracking-tight">Reattend</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed max-w-[260px] mb-6">
              Your AI memory layer. Captures everything from Gmail, Calendar, and your tools — answers any question instantly.
            </p>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Web App Live
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-400 bg-blue-400/10 px-2.5 py-1 rounded-full border border-blue-400/20">
                Chrome Extension
              </span>
            </div>
          </div>

          {/* Links */}
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} Reattend. All rights reserved.
          </p>
          <p className="text-xs text-gray-600">
            <a href="mailto:pb@reattend.ai" className="hover:text-gray-400 transition-colors">pb@reattend.ai</a>
          </p>
        </div>
      </div>
    </footer>
  )
}
