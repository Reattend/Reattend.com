'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'

const navLinks = [
  { label: 'Features', href: '/#features' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Integrations', href: '/#integrations' },
  { label: 'Pricing', href: '/pricing' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-2xl shadow-[0_1px_0_0_rgba(0,0,0,0.06)]'
          : 'bg-transparent'
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-[1200px] mx-auto px-5 flex items-center justify-between h-[68px]">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="Reattend home">
          <Image src="/black_logo.svg" alt="Reattend" width={30} height={30} className="h-7 w-7" priority />
          <span className="text-[17px] font-bold text-gray-900 tracking-tight">Reattend</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13.5px] text-gray-500 hover:text-gray-900 font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-all"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden lg:flex items-center gap-2.5">
          <Link
            href="/auth/signin"
            className="text-[13.5px] font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all"
          >
            Log in
          </Link>
          <Link
            href="/auth/signup"
            className="text-[13.5px] font-semibold text-white bg-[#2563EB] hover:bg-[#1d4ed8] px-5 py-2.5 rounded-full shadow-[0_2px_8px_rgba(37,99,235,0.3)] transition-all hover:shadow-[0_4px_16px_rgba(37,99,235,0.4)] active:scale-[0.97]"
          >
            Get Started Free
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="lg:hidden p-2 -mr-1 text-gray-600 hover:text-gray-900"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 top-[68px] bg-black/20 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
              className="absolute top-[68px] left-0 right-0 bg-white border-b border-gray-100 shadow-lg z-50 lg:hidden"
            >
              <div className="px-5 py-4 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="text-[15px] text-gray-600 hover:text-gray-900 py-2.5 font-medium transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="border-t border-gray-100 mt-2 pt-3 flex flex-col gap-2">
                  <Link href="/auth/signin" onClick={() => setMobileOpen(false)}
                    className="text-[15px] text-center font-medium text-gray-700 py-2.5 rounded-full border border-gray-200"
                  >
                    Log in
                  </Link>
                  <Link href="/auth/signup" onClick={() => setMobileOpen(false)}
                    className="text-[15px] text-center font-semibold text-white bg-[#2563EB] py-2.5 rounded-full"
                  >
                    Get Started Free
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  )
}
