'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  Sparkles,
  Search,
  Zap,
  Shield,
  Lock,
  Eye,
  Check,
  Brain,
  Download,
  Monitor,
  Mic,
  UserCheck,
  MessageSquare,
  FileText,
  Lightbulb,
  Clock,
  BarChart3,
  Layers,
} from 'lucide-react'
import { Navbar } from '@/components/landing/navbar'
import { FAQAccordion } from '@/components/landing/faq'
import { Footer } from '@/components/landing/footer'


/* ─── Animated headline ─── */
function AnimatedHeadline({ text, className = '', delay = 0 }: { text: string; className?: string; delay?: number }) {
  const words = text.split(' ')
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, delay: delay + i * 0.08 }}
          className="inline-block mr-[0.3em]"
        >
          {word}
        </motion.span>
      ))}
    </span>
  )
}


/* ─── Scroll reveal ─── */
function ScrollReveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}


/* ─── Animated counter ─── */
function AnimatedNumber({ target, suffix = '', duration = 2 }: { target: number; suffix?: string; duration?: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return
    let start = 0
    const step = target / (duration * 60)
    const timer = setInterval(() => {
      start += step
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 1000 / 60)
    return () => clearInterval(timer)
  }, [isInView, target, duration])

  return <span ref={ref}>{count}{suffix}</span>
}


/* ─── Animated screen capture demo ─── */
function ScreenCaptureAnimation() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!isInView) return
    const timer = setInterval(() => setStep(s => (s + 1) % 4), 2200)
    return () => clearInterval(timer)
  }, [isInView])

  const apps = [
    { name: 'Chrome', color: '#4285F4', text: 'Q1 pricing: $12/mo for Pro tier, enterprise custom...', tag: 'decision' },
    { name: 'Slack', color: '#E01E5A', text: 'Sarah: Let\'s ship the MVP by Friday. John: Agreed.', tag: 'action item' },
    { name: 'Gmail', color: '#EA4335', text: 'Re: Partnership — They agreed to 30% rev share...', tag: 'insight' },
    { name: 'Notion', color: '#000', text: 'Sprint retro: Need better error handling in auth flow', tag: 'context' },
  ]

  const current = apps[step]

  return (
    <div ref={ref} className="relative w-full h-full">
      {/* Mini browser */}
      <div className="absolute inset-0 rounded-xl bg-white border border-gray-200/80 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50/80 border-b border-gray-100">
          <span className="w-2 h-2 rounded-full bg-red-400" />
          <span className="w-2 h-2 rounded-full bg-yellow-400" />
          <span className="w-2 h-2 rounded-full bg-green-400" />
          <AnimatePresence mode="wait">
            <motion.span
              key={current.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="ml-2 text-[10px] font-medium text-gray-400"
            >
              {current.name}
            </motion.span>
          </AnimatePresence>
        </div>
        {/* Content area */}
        <div className="flex-1 p-3 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-1.5">
                <div className="h-1.5 bg-gray-100 rounded-full w-full" />
                <div className="h-1.5 bg-gray-100 rounded-full w-4/5" />
                <div className="h-1.5 bg-gray-100 rounded-full w-3/5" />
              </div>
              <p className="text-[9px] text-gray-500 mt-2 leading-relaxed line-clamp-2">{current.text}</p>
            </motion.div>
          </AnimatePresence>
          {/* Capture indicator */}
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mt-2"
          >
            <div className="flex items-center gap-1.5">
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"
              />
              <span className="text-[8px] text-gray-400">Captured</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.span
                key={current.tag}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${
                  current.tag === 'decision' ? 'text-emerald-600 bg-emerald-50' :
                  current.tag === 'action item' ? 'text-indigo-600 bg-indigo-50' :
                  current.tag === 'insight' ? 'text-amber-600 bg-amber-50' :
                  'text-blue-600 bg-blue-50'
                }`}
              >
                {current.tag}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
      {/* Scanning line */}
      <motion.div
        animate={{ y: ['0%', '100%', '0%'] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
        className="absolute left-1 right-1 h-[2px] bg-gradient-to-r from-transparent via-[#4F46E5]/40 to-transparent rounded-full"
        style={{ top: '30%' }}
      />
    </div>
  )
}


/* ─── Meeting recording animation ─── */
function MeetingAnimation() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (!isInView) return
    const timer = setInterval(() => setSeconds(s => (s + 1) % 60), 1000)
    return () => clearInterval(timer)
  }, [isInView])

  const waveformBars = 24

  return (
    <div ref={ref} className="relative w-full h-full rounded-xl bg-gradient-to-br from-[#4F46E5]/[0.03] to-white border border-gray-200/80 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <div className="flex items-center gap-1.5">
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="w-2 h-2 rounded-full bg-red-500"
          />
          <span className="text-[9px] font-semibold text-red-500">REC</span>
        </div>
        <span className="text-[10px] font-mono text-gray-400">
          {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}
        </span>
      </div>
      {/* Waveform */}
      <div className="flex-1 flex items-center justify-center px-3 gap-[2px]">
        {Array.from({ length: waveformBars }).map((_, i) => (
          <motion.div
            key={i}
            animate={{
              height: isInView ? ['8px', `${12 + Math.random() * 20}px`, '8px'] : '8px',
            }}
            transition={{
              repeat: Infinity,
              duration: 0.6 + Math.random() * 0.8,
              delay: i * 0.05,
              ease: 'easeInOut',
            }}
            className="w-[3px] rounded-full bg-gradient-to-t from-[#4F46E5] to-[#818CF8]"
            style={{ minHeight: '4px' }}
          />
        ))}
      </div>
      {/* Transcript preview */}
      <div className="px-3 pb-2">
        <div className="bg-gray-50 rounded-lg px-2 py-1.5">
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-[8px] text-gray-400"
          >
            Transcribing...
          </motion.div>
          <p className="text-[9px] text-gray-600 mt-0.5 line-clamp-1">&ldquo;Let&rsquo;s finalize the pricing and ship by Friday&rdquo;</p>
        </div>
      </div>
    </div>
  )
}


/* ─── Search animation ─── */
function SearchAnimation() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })
  const [typedText, setTypedText] = useState('')
  const [showResults, setShowResults] = useState(false)
  const fullText = 'pricing decision?'

  useEffect(() => {
    if (!isInView) return
    let i = 0
    setTypedText('')
    setShowResults(false)
    const typeTimer = setInterval(() => {
      i++
      setTypedText(fullText.slice(0, i))
      if (i >= fullText.length) {
        clearInterval(typeTimer)
        setTimeout(() => setShowResults(true), 400)
      }
    }, 80)
    return () => clearInterval(typeTimer)
  }, [isInView])

  const results = [
    { title: 'Q1 pricing sync', match: '98%', type: 'decision' },
    { title: 'User research feedback', match: '89%', type: 'insight' },
    { title: 'Competitor analysis', match: '85%', type: 'context' },
  ]

  return (
    <div ref={ref} className="relative w-full h-full rounded-xl bg-white border border-gray-200/80 overflow-hidden flex flex-col">
      {/* Search bar */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-2 border border-gray-200/60">
          <Search className="h-3 w-3 text-[#4F46E5]" />
          <span className="text-[10px] text-gray-700">{typedText}</span>
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.6 }}
            className="w-[1px] h-3 bg-[#4F46E5]"
          />
        </div>
      </div>
      {/* Results */}
      <div className="flex-1 px-3 pb-3 space-y-1.5 overflow-hidden">
        {results.map((r, i) => (
          <motion.div
            key={r.title}
            initial={{ opacity: 0, y: 8 }}
            animate={showResults ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.3, delay: i * 0.12 }}
            className="flex items-center justify-between bg-gray-50/80 rounded-lg px-2.5 py-1.5 border border-gray-100/80"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                r.type === 'decision' ? 'bg-emerald-500' :
                r.type === 'insight' ? 'bg-amber-500' : 'bg-blue-500'
              }`} />
              <span className="text-[9px] text-gray-600 truncate">{r.title}</span>
            </div>
            <span className="text-[8px] font-semibold text-[#4F46E5] shrink-0 ml-2">{r.match}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}


/* ─── Big animated hero illustration ─── */
function HeroIllustration() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const [activeMemory, setActiveMemory] = useState(0)

  useEffect(() => {
    if (!isInView) return
    const timer = setInterval(() => setActiveMemory(s => (s + 1) % 5), 3000)
    return () => clearInterval(timer)
  }, [isInView])

  const memories = [
    { icon: MessageSquare, label: 'Slack: Ship MVP by Friday', color: '#E01E5A', type: 'action item' },
    { icon: FileText, label: 'Email: 30% rev share agreed', color: '#EA4335', type: 'decision' },
    { icon: Mic, label: 'Meeting: Q1 pricing finalized', color: '#4F46E5', type: 'meeting' },
    { icon: Lightbulb, label: 'Idea: Freemium conversion funnel', color: '#F59E0B', type: 'insight' },
    { icon: Monitor, label: 'Code: Auth flow refactored', color: '#10B981', type: 'context' },
  ]

  return (
    <div ref={ref} className="relative w-full max-w-[860px] mx-auto">
      {/* Main card */}
      <div className="relative rounded-2xl overflow-hidden shadow-[0_16px_50px_rgba(0,0,0,0.06)] border border-gray-200/60 bg-white">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#FAFAFA] border-b border-gray-100">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-1.5 px-3 py-0.5 bg-white rounded border border-gray-200/60 text-[10px] text-gray-400 font-medium">
              <Lock className="h-2.5 w-2.5" /> Reattend
            </div>
          </div>
        </div>

        {/* Dashboard body */}
        <div className="grid grid-cols-[180px_1fr] min-h-[320px]">
          {/* Sidebar */}
          <div className="bg-[#FAFAFA] border-r border-gray-100 p-3">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-[#4F46E5] flex items-center justify-center">
                <Brain className="h-3 w-3 text-white" />
              </div>
              <span className="text-[11px] font-bold text-gray-700">Reattend</span>
            </div>
            {['Memories', 'Meetings', 'Search', 'Graph'].map((item, i) => (
              <div key={item} className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[10px] mb-0.5 ${i === 0 ? 'bg-[#4F46E5]/8 text-[#4F46E5] font-semibold' : 'text-gray-400'}`}>
                {i === 0 ? <Layers className="h-3 w-3" /> : i === 1 ? <Mic className="h-3 w-3" /> : i === 2 ? <Search className="h-3 w-3" /> : <BarChart3 className="h-3 w-3" />}
                {item}
              </div>
            ))}
            {/* Stats */}
            <div className="mt-4 pt-3 border-t border-gray-200/60 space-y-2">
              <div className="text-[9px] text-gray-400">This week</div>
              <div className="text-[20px] font-bold text-gray-800 leading-none">
                <AnimatedNumber target={247} />
              </div>
              <div className="text-[9px] text-gray-400">memories captured</div>
            </div>
          </div>

          {/* Main content */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[12px] font-bold text-gray-700">Recent Memories</h3>
              <div className="flex items-center gap-1">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"
                />
                <span className="text-[9px] text-gray-400">Capturing</span>
              </div>
            </div>

            {/* Memory items */}
            <div className="space-y-2">
              {memories.map((mem, i) => (
                <motion.div
                  key={mem.label}
                  animate={{
                    backgroundColor: activeMemory === i ? 'rgba(79,70,229,0.04)' : 'rgba(0,0,0,0)',
                    borderColor: activeMemory === i ? 'rgba(79,70,229,0.2)' : 'rgba(229,231,235,0.6)',
                  }}
                  transition={{ duration: 0.4 }}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 border"
                >
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${mem.color}15` }}
                  >
                    <mem.icon className="h-3 w-3" style={{ color: mem.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-medium text-gray-700 truncate">{mem.label}</div>
                    <div className="text-[8px] text-gray-400 flex items-center gap-1">
                      <Clock className="h-2 w-2" /> 2m ago
                    </div>
                  </div>
                  <span className={`text-[7px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
                    mem.type === 'action item' ? 'text-rose-600 bg-rose-50' :
                    mem.type === 'decision' ? 'text-emerald-600 bg-emerald-50' :
                    mem.type === 'meeting' ? 'text-indigo-600 bg-indigo-50' :
                    mem.type === 'insight' ? 'text-amber-600 bg-amber-50' :
                    'text-blue-600 bg-blue-50'
                  }`}>{mem.type}</span>
                  {activeMemory === i && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-1.5 h-1.5 rounded-full bg-[#4F46E5]"
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating notification */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        className="absolute -top-4 -right-3 md:right-4 bg-white rounded-xl shadow-lg border border-gray-200/80 px-3 py-2 flex items-center gap-2"
      >
        <div className="w-6 h-6 rounded-full bg-[#22C55E]/10 flex items-center justify-center">
          <Check className="h-3 w-3 text-[#22C55E]" />
        </div>
        <div>
          <div className="text-[9px] font-semibold text-gray-700">Memory saved</div>
          <div className="text-[8px] text-gray-400">Q1 pricing decision</div>
        </div>
      </motion.div>

      {/* Floating AI badge */}
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 1 }}
        className="absolute -bottom-3 -left-2 md:left-6 bg-[#111] rounded-xl shadow-lg px-3 py-2 flex items-center gap-2"
      >
        <Sparkles className="h-3 w-3 text-[#818CF8]" />
        <span className="text-[9px] font-semibold text-white">AI organized 12 memories today</span>
      </motion.div>
    </div>
  )
}


/* ─── Feature card with animated demo ─── */
function FeatureDemo({ type }: { type: 'capture' | 'meeting' | 'search' }) {
  return (
    <div className="w-full h-[180px]">
      {type === 'capture' && <ScreenCaptureAnimation />}
      {type === 'meeting' && <MeetingAnimation />}
      {type === 'search' && <SearchAnimation />}
    </div>
  )
}


/* ─── Data ─── */

const faqItems = [
  { question: 'What is Reattend?', answer: 'Reattend is a desktop app for Mac and Windows that acts as your second brain. It runs in your menu bar (or system tray), passively captures what\'s on your screen via OCR, records meetings, detects when you\'re writing, and turns everything into AI-organized, searchable memories.' },
  { question: 'How does it capture memories?', answer: 'Reattend runs silently in your menu bar. It captures your screen via OCR every few seconds, detects app switches, monitors your clipboard, and can record meetings. AI automatically triages each capture — deciding what\'s worth remembering, extracting entities, and linking related memories.' },
  { question: 'Is my data private?', answer: 'Yes. All memories are stored locally on your device — never on our servers. Screen captures and meeting recordings stay on-device. Only the AI triage step calls our server (encrypted), and we never store your content.' },
  { question: 'How does the free trial work?', answer: 'Download the app and get 60 days of full access — ambient capture, meeting recording, AI triage, semantic search, writing assist, and more. No credit card required.' },
  { question: 'What happens after the trial?', answer: 'Your memories are always yours — stored locally. After 60 days, you can upgrade to Pro ($20/month) for unlimited AI features, or keep using Reattend forever as a free notetaker. You can always browse and export your existing memories.' },
  { question: 'Does it work with any app?', answer: 'Yes. Reattend captures from any app on your screen — browsers, email, Slack, Notion, Google Docs, Figma, and more. It uses OCR to read text from your screen, so it works everywhere without integrations.' },
  { question: 'Does it work on Windows?', answer: 'Yes! Reattend is available for both macOS and Windows. The download button automatically detects your platform.' },
  { question: 'Do you offer refunds?', answer: 'Yes. Contact us within 15 days of your purchase for a full refund.' },
]

const plans = [
  { name: 'Free Trial', desc: '2 months of everything. No credit card.', price: 0, priceLabel: 'for 60 days', features: ['Ambient screen capture & OCR', 'AI triage & auto-classification', 'Semantic search & knowledge graph', 'Meeting recording & transcription', 'Writing assist', 'Ask AI over your memories'], popular: true },
  { name: 'Pro', desc: 'Unlimited AI. Your permanent second brain.', price: 20, priceLabel: '/mo per user', features: ['Everything in Free Trial', 'Unlimited AI processing forever', 'Unlimited memories & captures', 'Priority support', 'Early access to new features'], popular: false },
  { name: 'Free Forever', desc: 'Keep your memories. No AI.', price: 0, priceLabel: 'forever', features: ['Browse & export all memories', 'Manual note-taking', 'Local storage (your data is yours)', 'No AI capture or triage', 'No semantic search', 'No meeting transcription'], popular: false },
]


/* ─── Page ─── */

export default function LandingPage() {
  const [isWindows, setIsWindows] = useState(false)

  useEffect(() => {
    setIsWindows(navigator.platform?.toLowerCase().includes('win') || navigator.userAgent?.toLowerCase().includes('windows'))
  }, [])

  const downloadUrl = isWindows ? '/download/Reattend_x64-setup.exe' : '/download/Reattend.dmg'
  const downloadLabel = isWindows ? 'Download for Windows' : 'Download for Mac'

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111] overflow-x-hidden">
      <Navbar />

      {/* ══════════ HERO ══════════ */}
      <section className="relative pt-16 md:pt-24 pb-6 md:pb-10 px-5">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-gradient-to-br from-[#4F46E5]/6 via-[#818CF8]/4 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-[1000px] mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-gray-200/80 shadow-sm text-[13px] font-medium text-gray-600 mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            Available for {isWindows ? 'Windows & Mac' : 'Mac & Windows'}
          </motion.div>

          <h1 className="text-[44px] sm:text-[60px] md:text-[76px] font-bold leading-[1.0] tracking-[-0.04em]">
            <AnimatedHeadline text="Remember" delay={0.2} />
            <br />
            <AnimatedHeadline text="everything." className="text-[#4F46E5]" delay={0.5} />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="text-[17px] md:text-[19px] text-gray-500 leading-relaxed max-w-[500px] mx-auto mt-5"
          >
            Reattend captures your screen, records your meetings, and turns it all into searchable, AI-organized memory.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.1 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-7"
          >
            <a
              href={downloadUrl}
              className="inline-flex items-center gap-2.5 text-[15px] font-semibold text-white bg-[#4F46E5] hover:bg-[#4338CA] active:scale-[0.97] transition-all px-7 py-3.5 rounded-full shadow-[0_8px_30px_rgba(79,70,229,0.35)]"
            >
              <Download className="h-4 w-4" />
              {downloadLabel}
            </a>
            <span className="text-[13px] text-gray-400">Free for 60 days. No credit card.</span>
          </motion.div>
        </div>
      </section>

      {/* ══════════ HERO ILLUSTRATION ══════════ */}
      <section className="px-5 pb-12 md:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-[1000px] mx-auto"
        >
          <HeroIllustration />
        </motion.div>
      </section>


      {/* ══════════ SOCIAL PROOF BAR ══════════ */}
      <section className="py-8 px-5 border-y border-gray-200/60 bg-white">
        <div className="max-w-[900px] mx-auto flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
          <div className="text-center">
            <div className="text-[28px] font-bold text-[#111]"><AnimatedNumber target={1200} suffix="+" /></div>
            <div className="text-[12px] text-gray-400 font-medium">Memories captured daily</div>
          </div>
          <div className="hidden sm:block w-px h-8 bg-gray-200" />
          <div className="text-center">
            <div className="text-[28px] font-bold text-[#111]"><AnimatedNumber target={98} suffix="%" /></div>
            <div className="text-[12px] text-gray-400 font-medium">Local & private</div>
          </div>
          <div className="hidden sm:block w-px h-8 bg-gray-200" />
          <div className="text-center">
            <div className="text-[28px] font-bold text-[#111]">&lt;3s</div>
            <div className="text-[12px] text-gray-400 font-medium">Avg. search time</div>
          </div>
        </div>
      </section>


      {/* ══════════ HOW IT WORKS — 3 STEPS ══════════ */}
      <section id="how-it-works" className="py-14 md:py-20 px-5">
        <div className="max-w-[1060px] mx-auto">
          <ScrollReveal className="text-center mb-10">
            <h2 className="text-[32px] md:text-[46px] font-bold tracking-[-0.03em] leading-[1.1]">
              Your second brain,{' '}
              <span className="text-[#4F46E5]">3 steps</span>
            </h2>
            <p className="text-[16px] text-gray-500 mt-3 max-w-sm mx-auto">
              Install it. Forget about it. Everything important is captured automatically.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { num: 1, title: 'Install Reattend', desc: 'Download for Mac or Windows. Lives in your menu bar, running silently.', demo: 'capture' as const },
              { num: 2, title: 'It captures everything', desc: 'Screen text, meetings, clipboard — AI decides what\'s worth remembering.', demo: 'meeting' as const },
              { num: 3, title: 'Search & recall', desc: 'Ask "what was decided yesterday?" and get the answer in seconds.', demo: 'search' as const },
            ].map((step, i) => (
              <ScrollReveal key={step.num} delay={i * 0.1}>
                <div className="bg-white rounded-2xl border border-gray-200/60 p-5 h-full group hover:shadow-md hover:border-[#4F46E5]/20 transition-all duration-300">
                  <div className="mb-4">
                    <FeatureDemo type={step.demo} />
                  </div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-[13px] font-bold text-[#4F46E5] bg-[#4F46E5]/8 w-7 h-7 rounded-full flex items-center justify-center shrink-0">{step.num}</span>
                    <h3 className="text-[18px] font-bold">{step.title}</h3>
                  </div>
                  <p className="text-[14px] text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════ BIG STATEMENT ══════════ */}
      <section className="py-12 md:py-16 px-5">
        <div className="max-w-[800px] mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-[28px] sm:text-[36px] md:text-[46px] font-bold leading-[1.15] tracking-[-0.03em]">
              You had an important insight during a meeting.
              You read a critical email last week.{' '}
              <span className="text-gray-300">Now it&apos;s gone.</span>
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.15}>
            <p className="text-[17px] text-[#4F46E5] font-semibold mt-4">
              Reattend makes that impossible.
            </p>
          </ScrollReveal>
        </div>
      </section>


      {/* ══════════ FEATURES ══════════ */}
      <section id="features" className="py-14 md:py-20 px-5 bg-white">
        <div className="max-w-[1060px] mx-auto">
          <ScrollReveal className="text-center mb-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#4F46E5]/15 bg-[#4F46E5]/5 text-[12px] font-medium text-[#4F46E5] mb-4">
              <Sparkles className="h-3 w-3" /> Features
            </span>
            <h2 className="text-[32px] md:text-[44px] font-bold tracking-[-0.03em]">
              Never forget a meeting.<br />
              <span className="text-[#4F46E5]">Never lose a decision.</span>
            </h2>
          </ScrollReveal>

          {/* Meeting feature — large card */}
          <ScrollReveal className="mb-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-gray-200/60 bg-gradient-to-br from-[#4F46E5]/[0.03] to-white">
              <div className="p-7 md:p-10 flex flex-col justify-center">
                <div className="w-9 h-9 rounded-xl bg-[#4F46E5]/10 flex items-center justify-center mb-4">
                  <Mic className="h-4.5 w-4.5 text-[#4F46E5]" />
                </div>
                <h3 className="text-[24px] md:text-[28px] font-bold tracking-[-0.02em] leading-tight mb-2">
                  Record any meeting.<br />Get notes automatically.
                </h3>
                <p className="text-[15px] text-gray-500 leading-relaxed mb-5">
                  Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[12px] font-mono border border-gray-200">&#8984;&#8679;M</kbd> to start recording. AI transcribes, extracts action items, decisions, and key points.
                </p>
                <ul className="space-y-1.5">
                  {['One-click meeting recording', 'AI-powered transcription', 'Auto-extracted action items & decisions', 'Share via email or link'].map(f => (
                    <li key={f} className="flex items-center gap-2 text-[13px] text-gray-600">
                      <Check className="h-3.5 w-3.5 text-[#4F46E5] shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-6 md:p-8 flex items-center justify-center">
                <div className="w-full max-w-[320px] h-[240px]">
                  <MeetingAnimation />
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* 2 feature cards side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <ScrollReveal delay={0.1}>
              <div className="rounded-2xl border border-gray-200/60 bg-white p-6 h-full">
                <div className="w-9 h-9 rounded-xl bg-[#4F46E5]/10 flex items-center justify-center mb-4">
                  <Monitor className="h-4.5 w-4.5 text-[#4F46E5]" />
                </div>
                <h3 className="text-[20px] font-bold tracking-[-0.01em] mb-1.5">Ambient screen capture</h3>
                <p className="text-[14px] text-gray-500 leading-relaxed mb-4">
                  Reads your screen every few seconds via OCR. Emails, Slack, articles, code — captured without you lifting a finger.
                </p>
                <div className="h-[140px]">
                  <ScreenCaptureAnimation />
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <div className="rounded-2xl border border-gray-200/60 bg-white p-6 h-full">
                <div className="w-9 h-9 rounded-xl bg-[#4F46E5]/10 flex items-center justify-center mb-4">
                  <Search className="h-4.5 w-4.5 text-[#4F46E5]" />
                </div>
                <h3 className="text-[20px] font-bold tracking-[-0.01em] mb-1.5">Search by meaning</h3>
                <p className="text-[14px] text-gray-500 leading-relaxed mb-4">
                  &ldquo;What did we decide about pricing?&rdquo; — search by meaning, not keywords. AI finds relevant memories instantly.
                </p>
                <div className="h-[140px]">
                  <SearchAnimation />
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* 3 smaller feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { icon: Brain, title: 'Ask your memory', desc: 'Chat with AI grounded in your actual memories. Get answers about past meetings, decisions, and ideas in seconds.' },
              { icon: Zap, title: 'Writing assist', desc: 'Detects when you\'re writing and proactively suggests relevant context from your past — like Grammarly for memory.' },
              { icon: Sparkles, title: 'Knowledge graph', desc: 'AI links related memories, maps people and topics, and builds a visual graph that grows over time.' },
            ].map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 0.1}>
                <div className="rounded-2xl border border-gray-200/60 bg-white p-5 h-full hover:shadow-md hover:border-[#4F46E5]/20 transition-all duration-300">
                  <div className="w-9 h-9 rounded-xl bg-[#4F46E5]/10 flex items-center justify-center mb-3">
                    <f.icon className="h-4.5 w-4.5 text-[#4F46E5]" />
                  </div>
                  <h3 className="text-[16px] font-bold mb-1.5">{f.title}</h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════ WORKS EVERYWHERE ══════════ */}
      <section className="py-12 md:py-16 px-5">
        <div className="max-w-[800px] mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-[28px] md:text-[40px] font-bold tracking-[-0.03em] mb-3">
              Works with <span className="text-[#4F46E5]">every app</span>
            </h2>
            <p className="text-[15px] text-gray-500 mb-8 max-w-sm mx-auto">
              No integrations needed. Reattend reads your screen — it works everywhere.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {['Slack', 'Notion', 'Google Drive', 'Zoom', 'Gmail', 'GitHub', 'Jira', 'Linear', 'Teams', 'Figma', 'VS Code', 'Chrome'].map((app, i) => (
                <motion.span
                  key={app}
                  whileHover={{ scale: 1.05, borderColor: 'rgba(79,70,229,0.3)' }}
                  className="px-3.5 py-1.5 rounded-full bg-white border border-gray-200/60 text-[12px] font-medium text-gray-500 shadow-sm cursor-default"
                >
                  {app}
                </motion.span>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>


      {/* ══════════ SECURITY ══════════ */}
      <section id="security" className="py-14 md:py-20 px-5 bg-white">
        <div className="max-w-[1060px] mx-auto">
          <ScrollReveal>
            <div className="rounded-2xl bg-[#111] p-8 md:p-14 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#4F46E5]/20 via-transparent to-[#818CF8]/10" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-5">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-[28px] md:text-[40px] font-bold text-white tracking-[-0.03em] mb-3">
                  Your data never leaves your device
                </h2>
                <p className="text-[15px] text-gray-400 max-w-md mx-auto mb-8">
                  All memories, screen captures, and recordings are stored locally. Only AI processing calls our API (encrypted). We never see or store your content.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-xl mx-auto">
                  {[
                    { icon: Eye, title: 'Local-first', desc: 'SQLite on your device. No cloud.' },
                    { icon: Lock, title: 'Encrypted', desc: 'TLS for all API calls. Zero-knowledge.' },
                    { icon: UserCheck, title: 'You own it', desc: 'Snooze, delete, export. Full control.' },
                  ].map(item => (
                    <div key={item.title} className="text-center">
                      <item.icon className="h-4.5 w-4.5 text-[#818CF8] mx-auto mb-2" />
                      <h3 className="text-[14px] font-semibold text-white mb-0.5">{item.title}</h3>
                      <p className="text-[12px] text-gray-500">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>


      {/* ══════════ PRICING ══════════ */}
      <section id="pricing" className="py-14 md:py-20 px-5">
        <div className="max-w-[960px] mx-auto">
          <ScrollReveal className="text-center mb-10">
            <h2 className="text-[32px] md:text-[44px] font-bold tracking-[-0.03em]">
              Simple <span className="text-[#4F46E5]">pricing</span>
            </h2>
            <p className="text-[15px] text-gray-500 mt-2">2 months free. Then choose your path.</p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan, i) => (
              <ScrollReveal key={plan.name} delay={i * 0.1}>
                <div className={`relative flex flex-col rounded-2xl border p-5 h-full bg-white ${plan.popular ? 'border-[#4F46E5] shadow-[0_8px_40px_rgba(79,70,229,0.12)]' : 'border-gray-200/60'}`}>
                  {plan.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-semibold text-white bg-[#4F46E5] px-3 py-0.5 rounded-full">Start Here</span>}
                  <h3 className="text-[17px] font-bold">{plan.name}</h3>
                  <p className="text-[12px] text-gray-500 mt-0.5">{plan.desc}</p>
                  <div className="mt-3 mb-4">
                    <span className="text-[32px] font-bold">${plan.price}</span>
                    <span className="text-[12px] text-gray-400 ml-1">{plan.priceLabel}</span>
                  </div>
                  <ul className="space-y-2 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-[12px] text-gray-600">
                        <Check className="h-3.5 w-3.5 text-[#4F46E5] mt-0.5 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5">
                    <a href={downloadUrl} className={`flex items-center justify-center gap-2 w-full text-center text-[13px] font-semibold rounded-full py-2.5 transition-all active:scale-[0.97] ${plan.popular ? 'bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-[0_4px_14px_rgba(79,70,229,0.3)]' : 'border border-gray-200/60 hover:border-[#4F46E5]/30 bg-gray-50 hover:bg-[#4F46E5]/5'}`}>
                      <Download className="h-3.5 w-3.5" /> {plan.popular ? 'Download Free' : plan.price > 0 ? 'Download Free' : 'Download'}
                    </a>
                    {plan.popular && <p className="text-center text-[11px] text-gray-400 mt-1.5">No credit card required</p>}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════ FAQ ══════════ */}
      <section id="faq" className="py-14 md:py-20 px-5 bg-white">
        <div className="max-w-[660px] mx-auto">
          <ScrollReveal className="text-center mb-10">
            <h2 className="text-[32px] md:text-[40px] font-bold tracking-[-0.03em]">
              Frequently asked <span className="text-[#4F46E5]">questions</span>
            </h2>
            <p className="text-gray-500 mt-2 text-[15px]">
              Can&apos;t find your answer? <a href="mailto:pb@reattend.ai" className="text-[#4F46E5] font-medium hover:underline">Email us</a>
            </p>
          </ScrollReveal>
          <FAQAccordion items={faqItems} />
        </div>
      </section>


      {/* ══════════ FINAL CTA ══════════ */}
      <section className="py-14 md:py-20 px-5">
        <div className="max-w-[660px] mx-auto text-center">
          <ScrollReveal>
            <div className="rounded-2xl border border-gray-200/60 bg-white p-8 md:p-12 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
              <div className="w-12 h-12 rounded-xl bg-[#4F46E5]/10 flex items-center justify-center mx-auto mb-5">
                <Brain className="h-6 w-6 text-[#4F46E5]" />
              </div>
              <h2 className="text-[26px] md:text-[36px] font-bold tracking-[-0.03em] leading-[1.15]">
                Stop forgetting.<br />Start remembering.
              </h2>
              <p className="text-[15px] text-gray-500 mt-3 max-w-sm mx-auto">
                Every meeting, every email, every decision — <strong className="text-[#111]">permanent, searchable, and yours</strong>.
              </p>
              <a
                href={downloadUrl}
                className="inline-flex items-center gap-2 text-[15px] font-semibold text-white bg-[#4F46E5] hover:bg-[#4338CA] active:scale-[0.97] transition-all px-8 py-3.5 rounded-full shadow-[0_8px_30px_rgba(79,70,229,0.35)] mt-7"
              >
                <Download className="h-4 w-4" /> {downloadLabel}
              </a>
              <p className="text-[12px] text-gray-400 mt-3">
                Free for 60 days. Available for Mac & Windows.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>


      <Footer />
    </div>
  )
}
