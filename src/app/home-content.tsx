'use client'

import React, { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import {
  ArrowRight, Brain, Mail, Calendar,
  Search, Inbox, GitBranch, Shield, Globe, Zap, Check,
} from 'lucide-react'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'

/* ─── Scroll reveal ─── */
function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ─── Section label ─── */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#2563EB] mb-4">
      <span className="h-1 w-4 rounded-full bg-[#2563EB]" />
      {children}
    </span>
  )
}

/* ─── Active integrations ─── */
const ACTIVE_INTEGRATIONS = [
  { name: 'Gmail', color: '#EA4335', bg: '#FEF2F2', icon: '✉' },
  { name: 'Calendar', color: '#1a73e8', bg: '#EFF6FF', icon: '📅' },
  { name: 'Slack', color: '#E01E5A', bg: '#FDF2F8', icon: '#' },
  { name: 'Notion', color: '#191919', bg: '#F8F8F8', icon: 'N' },
]

/* ─── All other integrations (coming soon) ─── */
const OTHER_INTEGRATIONS = [
  'Jira', 'Linear', 'GitHub', 'GitLab', 'Confluence', 'Asana',
  'Trello', 'Monday.com', 'ClickUp', 'Salesforce', 'HubSpot',
  'Pipedrive', 'Intercom', 'Zendesk', 'Figma', 'Miro', 'Zoom',
  'Google Meet', 'Microsoft Teams', 'Outlook', 'OneDrive', 'Google Drive',
  'Dropbox', 'Box', 'Airtable', 'Coda', 'Roam Research', 'Obsidian',
  'Evernote', 'Todoist', 'Things', 'Apple Notes', 'OneNote', 'Basecamp',
  'Height', 'Shortcut', 'Productboard', 'Amplitude', 'Mixpanel', 'Segment',
  'Stripe', 'QuickBooks', 'Xero', 'DocuSign', 'Calendly', 'Loom',
  'Otter.ai', 'Superhuman', 'Front', 'Notion AI',
]

/* ─── Features ─── */
const FEATURES = [
  {
    icon: Mail,
    color: '#EA4335',
    bg: '#FEF2F2',
    title: 'Auto-capture from Gmail',
    desc: 'Every important email thread is read, understood, and stored as a memory — automatically.',
  },
  {
    icon: Calendar,
    color: '#1a73e8',
    bg: '#EFF6FF',
    title: 'Calendar intelligence',
    desc: 'Meetings, events, and follow-ups sync in real time. Never forget what was discussed or decided.',
  },
  {
    icon: Brain,
    color: '#7C3AED',
    bg: '#F5F3FF',
    title: 'AI triage & review',
    desc: 'AI classifies every memory — decisions, insights, tasks. You approve what matters.',
  },
  {
    icon: Search,
    color: '#2563EB',
    bg: '#EFF6FF',
    title: 'Ask anything',
    desc: 'Chat with your entire knowledge base in natural language. Get answers with source references.',
  },
  {
    icon: GitBranch,
    color: '#059669',
    bg: '#ECFDF5',
    title: 'Knowledge graph',
    desc: 'Entities, people, and topics are linked automatically. See how everything connects.',
  },
  {
    icon: Shield,
    color: '#0F172A',
    bg: '#F1F5F9',
    title: 'Private & secure',
    desc: 'Your data is encrypted, never used to train AI models, and stays fully under your control.',
  },
]

/* ─── How it works steps ─── */
const STEPS = [
  {
    n: '01',
    icon: Zap,
    title: 'Connect your tools',
    desc: 'Link Gmail and Google Calendar in one click. Slack, Notion, and more coming soon.',
    color: '#2563EB',
  },
  {
    n: '02',
    icon: Brain,
    title: 'Memories build automatically',
    desc: 'Reattend reads, triages, and structures every email thread, meeting, and note into searchable memories.',
    color: '#7C3AED',
  },
  {
    n: '03',
    icon: Search,
    title: 'Ask anything, instantly',
    desc: 'Open the web app or Globe extension and ask any question. Get precise answers from your own knowledge.',
    color: '#059669',
  },
]

/* ─── Animated product preview ─── */
function ProductPreview() {
  return (
    <div className="relative w-full max-w-3xl mx-auto mt-16">
      {/* Glow */}
      <div className="absolute -inset-4 bg-gradient-to-b from-blue-500/10 via-indigo-500/5 to-transparent rounded-3xl blur-2xl" />

      {/* Window chrome */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-2xl border border-gray-200/80 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.10)] overflow-hidden"
      >
        {/* Titlebar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
          <span className="w-3 h-3 rounded-full bg-red-400" />
          <span className="w-3 h-3 rounded-full bg-yellow-400" />
          <span className="w-3 h-3 rounded-full bg-green-400" />
          <span className="ml-3 flex-1 bg-gray-100 rounded-md h-5 text-[10px] text-gray-400 flex items-center px-2">
            app.reattend.com
          </span>
        </div>

        {/* App layout */}
        <div className="flex" style={{ minHeight: 340 }}>
          {/* Sidebar */}
          <div className="w-[180px] shrink-0 border-r border-gray-100 bg-gray-50/50 p-3 flex flex-col gap-1">
            {['Chat', 'Memories', 'Inbox', 'Explore', 'Integrations'].map((item, i) => (
              <div key={item} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium ${i === 0 ? 'bg-white shadow-sm text-gray-900 border border-gray-100' : 'text-gray-400'}`}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: i === 0 ? '#2563EB' : '#D1D5DB' }} />
                {item}
              </div>
            ))}
            <div className="mt-auto pt-3 border-t border-gray-100 space-y-1">
              <div className="flex items-center gap-1.5 px-2 py-1">
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600" />
                <span className="text-[10px] text-gray-400 font-medium">Gmail</span>
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1">
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-400 to-sky-500" />
                <span className="text-[10px] text-gray-400 font-medium">Calendar</span>
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
            </div>
          </div>

          {/* Main chat */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 p-4 space-y-4 overflow-hidden">
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex justify-end"
              >
                <div className="bg-[#2563EB] text-white text-xs rounded-2xl rounded-tr-sm px-3.5 py-2 max-w-[65%]">
                  What decisions did I make about the SoraGPT deal?
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="flex gap-2.5"
              >
                <Image src="/black_logo.svg" alt="R" width={24} height={24} className="h-6 w-6 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Based on your Gmail threads, you agreed to a <span className="font-semibold text-gray-900">$2,400 sale</span> of the SoraGPT.net domain on March 12th. The payment was confirmed via inward remittance. Key contacts: <span className="text-[#2563EB] font-medium">Farhan (buyer)</span>, <span className="text-[#2563EB] font-medium">HDFC remittance team</span>.
                  </p>
                  <div className="flex gap-1.5 mt-2">
                    {['Gmail thread · Mar 12', 'Remittance approval'].map(s => (
                      <span key={s} className="text-[9px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="flex justify-end"
              >
                <div className="bg-[#2563EB] text-white text-xs rounded-2xl rounded-tr-sm px-3.5 py-2 max-w-[65%]">
                  Any follow-up actions needed?
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
                className="flex gap-2.5"
              >
                <Image src="/black_logo.svg" alt="R" width={24} height={24} className="h-6 w-6 shrink-0 mt-0.5" />
                <p className="text-xs text-gray-700 leading-relaxed">
                  Yes — the <span className="font-semibold">DNS transfer is still pending</span>. Your last email mentions you need to initiate it from the registrar dashboard. I've added this as a task in your inbox.
                </p>
              </motion.div>
            </div>

            {/* Input bar */}
            <div className="p-3 border-t border-gray-100">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                <span className="text-[11px] text-gray-400 flex-1">Ask me anything about your memories...</span>
                <div className="w-6 h-6 rounded-lg bg-[#2563EB] flex items-center justify-center">
                  <ArrowRight className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/* ─── Main page ─── */
export default function LandingPage() {
  return (
    <div className="bg-[#FAFAFA] text-gray-900 antialiased overflow-x-hidden">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-5 pt-16 pb-8 overflow-hidden">
        {/* Background gradients */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-b from-blue-100/60 via-indigo-50/30 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-20 left-1/4 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-48 h-48 bg-indigo-200/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 mb-8"
          >
            <span className="inline-flex items-center gap-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 px-3.5 py-1.5 rounded-full shadow-sm">
              <Globe className="h-3.5 w-3.5 text-[#4285F4]" />
              Web App · Globe Extension
              <span className="h-3 w-px bg-gray-300" />
              <span className="text-gray-400">Desktop coming soon</span>
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-[72px] font-bold text-gray-900 tracking-tight leading-[1.08] mb-6"
          >
            Your AI memory layer<br />
            <span className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] bg-clip-text text-transparent">
              for everything you do.
            </span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-gray-500 leading-relaxed max-w-2xl mb-10"
          >
            Reattend connects to Gmail, Calendar, and your tools to build a living knowledge base of your work.
            Ask any question — get answers instantly, with sources.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-3 mb-4"
          >
            <Link
              href="/auth/signup"
              className="group inline-flex items-center gap-2 text-[15px] font-semibold text-white bg-[#2563EB] hover:bg-[#1d4ed8] px-7 py-3.5 rounded-full shadow-[0_4px_16px_rgba(37,99,235,0.35)] hover:shadow-[0_8px_24px_rgba(37,99,235,0.45)] transition-all active:scale-[0.97]"
            >
              Start for free
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/#how-it-works"
              className="inline-flex items-center gap-2 text-[15px] font-medium text-gray-600 hover:text-gray-900 px-6 py-3.5 rounded-full border border-gray-200 bg-white hover:border-gray-300 transition-all"
            >
              See how it works
            </Link>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-gray-400 flex items-center gap-1.5"
          >
            <Check className="h-3 w-3 text-emerald-500" /> Free to start · No credit card required
          </motion.p>

          {/* Product preview */}
          <ProductPreview />
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-28 px-5 bg-white">
        <div className="max-w-[1100px] mx-auto">
          <Reveal className="text-center mb-16">
            <Label>How it works</Label>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
              Three steps to a<br />perfect memory.
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-12 left-[calc(16.5%+24px)] right-[calc(16.5%+24px)] h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

            {STEPS.map((step, i) => (
              <Reveal key={step.n} delay={i * 0.12}>
                <div className="relative flex flex-col items-start p-8 rounded-2xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-lg transition-all duration-300 group">
                  <div className="flex items-center justify-between w-full mb-6">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: step.color + '15' }}>
                      <step.icon className="h-5 w-5" style={{ color: step.color }} />
                    </div>
                    <span className="text-[48px] font-bold text-gray-100 leading-none group-hover:text-gray-200 transition-colors">
                      {step.n}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-28 px-5 bg-[#FAFAFA]">
        <div className="max-w-[1100px] mx-auto">
          <Reveal className="text-center mb-16">
            <Label>Features</Label>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
              Everything in one place.
            </h2>
            <p className="text-lg text-gray-500 mt-4 max-w-xl mx-auto">
              From inbox to insights — Reattend handles the full lifecycle of your knowledge.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.07}>
                <div className="group p-7 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 h-full">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ background: f.bg }}>
                    <f.icon className="h-5 w-5" style={{ color: f.color }} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 text-[15px]">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Integrations ── */}
      <section id="integrations" className="py-28 px-5 bg-white">
        <div className="max-w-[1100px] mx-auto">
          <Reveal className="text-center mb-16">
            <Label>Integrations</Label>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
              Connects to your<br />entire workflow.
            </h2>
            <p className="text-lg text-gray-500 mt-4 max-w-xl mx-auto">
              Start with Gmail and Calendar. More integrations rolling out every week.
            </p>
          </Reveal>

          {/* Active integrations */}
          <Reveal className="mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-5">Live now</p>
            <div className="flex flex-wrap gap-3">
              {ACTIVE_INTEGRATIONS.map((intg) => (
                <div
                  key={intg.name}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border font-semibold text-sm shadow-sm transition-all hover:shadow-md cursor-default"
                  style={{ background: intg.bg, borderColor: intg.color + '30', color: intg.color }}
                >
                  <span className="text-base leading-none">{intg.icon}</span>
                  {intg.name}
                  <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </span>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Coming soon */}
          <Reveal delay={0.1}>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-5">Coming soon</p>
            <div className="flex flex-wrap gap-2">
              {OTHER_INTEGRATIONS.map((name) => (
                <span
                  key={name}
                  className="text-[12px] font-medium text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg hover:text-gray-600 hover:border-gray-200 transition-colors cursor-default"
                >
                  {name}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Platform features strip ── */}
      <section className="py-16 px-5 bg-[#FAFAFA] border-y border-gray-100">
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Globe, label: 'Web App', sub: 'Full product, any browser' },
              { icon: Globe, label: 'Globe Extension', sub: 'Capture from anywhere' },
              { icon: Inbox, label: 'Smart Inbox', sub: 'AI triage, you approve' },
              { icon: Shield, label: 'Private by design', sub: 'Your data, your control' },
            ].map(({ icon: Icon, label, sub }) => (
              <Reveal key={label}>
                <div className="flex items-start gap-3.5 p-5 rounded-xl bg-white border border-gray-100">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-[#2563EB]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA section ── */}
      <section className="py-28 px-5 bg-white">
        <div className="max-w-[860px] mx-auto">
          <Reveal>
            <div className="relative rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#1e2d5e] to-[#0F172A] p-14 text-center overflow-hidden">
              {/* Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/4 w-[200px] h-[150px] bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-400 mb-4">Get started today</p>
                <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-tight mb-5">
                  Your second brain,<br />already waiting.
                </h2>
                <p className="text-gray-400 text-lg leading-relaxed max-w-lg mx-auto mb-10">
                  Connect Gmail and Calendar in 60 seconds. Reattend starts building your memory layer immediately — no setup, no configuration.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/auth/signup"
                    className="group inline-flex items-center gap-2 text-[15px] font-semibold text-gray-900 bg-white hover:bg-gray-50 px-8 py-3.5 rounded-full shadow-lg transition-all hover:shadow-xl active:scale-[0.97]"
                  >
                    Start for free
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link
                    href="/auth/signin"
                    className="text-[15px] font-medium text-gray-400 hover:text-white px-6 py-3.5 transition-colors"
                  >
                    Already have an account →
                  </Link>
                </div>
                <p className="text-xs text-gray-600 mt-5 flex items-center justify-center gap-1.5">
                  <Check className="h-3 w-3 text-emerald-400" /> Free to start · No credit card required
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  )
}
