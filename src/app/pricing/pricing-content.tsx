'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Check, Brain, Download, Sparkles } from 'lucide-react'
import { motion, useInView } from 'framer-motion'
import { Navbar } from '@/components/landing/navbar'
import { FAQAccordion } from '@/components/landing/faq'
import { Footer } from '@/components/landing/footer'


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


/* ─── Data ─── */

const plans = [
  {
    key: 'trial',
    name: 'Free Trial',
    desc: '2 months of everything. No credit card.',
    price: 0,
    priceLabel: 'for 60 days',
    features: [
      'Ambient screen capture & OCR',
      'AI triage & auto-classification',
      'Entity extraction (people, orgs, topics)',
      'Semantic search & knowledge graph',
      'Meeting recording & transcription',
      'Writing assist (Grammarly for memory)',
      'Ask AI over your memories',
      'Board view & whiteboard',
    ],
    cta: 'Download Free',
    popular: true,
    enterprise: false,
    note: 'No credit card required.',
  },
  {
    key: 'pro',
    name: 'Pro',
    desc: 'Unlimited AI. Your permanent second brain.',
    price: 20,
    priceLabel: '/mo per user',
    features: [
      'Everything in Free Trial',
      'Unlimited AI processing forever',
      'Unlimited memories & captures',
      'Ambient capture + AI triage',
      'Meeting transcription & action items',
      'Semantic search & Ask AI',
      'Priority support',
      'Early access to new features',
    ],
    cta: 'Download Free',
    popular: false,
    enterprise: false,
  },
  {
    key: 'free-forever',
    name: 'Free Forever',
    desc: 'Keep your memories. No AI.',
    price: 0,
    priceLabel: 'forever',
    features: [
      'Browse & export all memories',
      'Manual note-taking',
      'Local storage (your data is yours)',
      'No AI capture or triage',
      'No semantic search',
      'No meeting transcription',
    ],
    cta: 'Download',
    popular: false,
    enterprise: false,
  },
]


const faqs = [
  { question: 'What does Reattend do?', answer: 'Reattend is a desktop app that acts as your second brain. It captures what\'s on your screen, records meetings, detects what you\'re writing, and turns everything into searchable, AI-organized memories with entities, tags, and a knowledge graph.' },
  { question: 'How does the free trial work?', answer: 'Download the app and get 60 days of full access to all features — ambient capture, meeting recording, AI triage, semantic search, and more. No credit card required.' },
  { question: 'What happens after the trial?', answer: 'You have two choices: upgrade to Pro ($20/month) for unlimited AI features, or keep using Reattend forever as a free notetaker. Your memories are always yours — stored locally on your device. You can always browse and export them.' },
  { question: 'What\'s included in the free forever plan?', answer: 'You keep all memories captured during your trial. You can browse, search (keyword-only), and export them. You can take manual notes. But AI features — ambient capture, triage, semantic search, meeting transcription, and Ask AI — require Pro.' },
  { question: 'Is my data private?', answer: 'Yes. All your memories are stored locally on your device — never on our servers. Screen captures, meeting recordings, and AI processing happen on-device. Only the AI triage step calls our server (encrypted), and we never store your content.' },
  { question: 'Does it work on Mac and Windows?', answer: 'Yes! Reattend is available for both macOS and Windows. The download button automatically detects your platform.' },
  { question: 'Do you offer refunds?', answer: 'Yes. If you\'re not satisfied, contact us within 15 days of your purchase for a full refund.' },
]


/* ─── Page ─── */

export default function PricingPage() {
  const [isWindows, setIsWindows] = useState(false)

  useEffect(() => {
    setIsWindows(navigator.platform?.toLowerCase().includes('win') || navigator.userAgent?.toLowerCase().includes('windows'))
  }, [])

  const downloadUrl = isWindows ? '/download/Reattend_x64-setup.exe' : '/download/Reattend.dmg'
  const downloadLabel = isWindows ? 'Download for Windows' : 'Download for Mac'

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111] overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-16 md:pt-24 pb-10 md:pb-14 px-5 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-gradient-to-br from-[#4F46E5]/6 via-[#818CF8]/4 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-[1000px] mx-auto text-center">
          <ScrollReveal>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#4F46E5]/15 bg-[#4F46E5]/5 text-[12px] font-medium text-[#4F46E5] mb-4">
              <Sparkles className="h-3 w-3" /> Pricing
            </span>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h1 className="text-[36px] sm:text-[46px] md:text-[56px] font-bold tracking-[-0.03em] leading-[1.1] mt-2">
              2 months free.{' '}
              <span className="text-[#4F46E5]">Then choose.</span>
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <p className="text-gray-500 mt-4 text-[17px] md:text-[19px] max-w-lg mx-auto">
              Try everything for 60 days. Then upgrade to Pro for AI, or keep using Reattend free forever.
            </p>
          </ScrollReveal>
        </div>
      </section>


      {/* Plans */}
      <section className="px-5 pb-14 md:pb-20">
        <div className="max-w-[960px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan, i) => (
            <ScrollReveal key={plan.key} delay={i * 0.1}>
              <div
                className={`relative flex flex-col rounded-2xl border p-6 h-full bg-white transition-all duration-300 hover:shadow-md ${
                  plan.popular
                    ? 'border-[#4F46E5] shadow-[0_8px_40px_rgba(79,70,229,0.12)]'
                    : 'border-gray-200/60 hover:border-[#4F46E5]/20'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-semibold text-white bg-[#4F46E5] px-3 py-0.5 rounded-full">
                    Start Here
                  </span>
                )}

                <h3 className="text-[18px] font-bold">{plan.name}</h3>
                <p className="text-[12px] text-gray-500 mt-0.5">{plan.desc}</p>

                <div className="mt-4 mb-5">
                  <span className="text-[36px] font-bold tracking-tight">
                    ${plan.price}
                  </span>
                  <span className="text-[12px] text-gray-400 ml-1">{plan.priceLabel}</span>
                </div>

                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13px] text-gray-600">
                      <Check className="h-3.5 w-3.5 text-[#4F46E5] mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  <a
                    href={downloadUrl}
                    className={`flex items-center justify-center gap-2 w-full text-center text-[14px] font-semibold rounded-full py-3 transition-all active:scale-[0.97] ${
                      plan.popular
                        ? 'bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-[0_4px_14px_rgba(79,70,229,0.3)]'
                        : 'border border-gray-200/60 hover:border-[#4F46E5]/30 bg-gray-50 hover:bg-[#4F46E5]/5'
                    }`}
                  >
                    <Download className="h-3.5 w-3.5" />
                    {plan.cta}
                  </a>
                  {plan.note && (
                    <p className="text-[11px] text-gray-400 text-center mt-2">{plan.note}</p>
                  )}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>


      {/* How it works after trial */}
      <section className="px-5 pb-14 md:pb-20">
        <div className="max-w-[800px] mx-auto">
          <ScrollReveal>
            <div className="rounded-2xl border border-gray-200/60 bg-white p-6 md:p-10">
              <h3 className="text-[22px] md:text-[28px] font-bold tracking-[-0.02em] mb-6 text-center">
                How it works after your trial
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-[#4F46E5]/8 flex items-center justify-center mx-auto mb-3">
                    <span className="text-[14px] font-bold text-[#4F46E5]">1</span>
                  </div>
                  <h4 className="text-[14px] font-bold mb-1">60 days free</h4>
                  <p className="text-[12px] text-gray-500 leading-relaxed">Every feature unlocked. Build your memory graph.</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-[#4F46E5]/8 flex items-center justify-center mx-auto mb-3">
                    <span className="text-[14px] font-bold text-[#4F46E5]">2</span>
                  </div>
                  <h4 className="text-[14px] font-bold mb-1">Trial ends</h4>
                  <p className="text-[12px] text-gray-500 leading-relaxed">AI features pause. Your memories stay local & safe.</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-[#4F46E5]/8 flex items-center justify-center mx-auto mb-3">
                    <span className="text-[14px] font-bold text-[#4F46E5]">3</span>
                  </div>
                  <h4 className="text-[14px] font-bold mb-1">You choose</h4>
                  <p className="text-[12px] text-gray-500 leading-relaxed">Upgrade to Pro ($20/mo) for AI, or keep free forever.</p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>


      {/* FAQ */}
      <section className="px-5 pb-14 md:pb-20">
        <div className="max-w-[660px] mx-auto">
          <ScrollReveal className="text-center mb-10">
            <h2 className="text-[32px] md:text-[40px] font-bold tracking-[-0.03em]">
              Frequently asked <span className="text-[#4F46E5]">questions</span>
            </h2>
            <p className="text-gray-500 mt-2 text-[15px]">
              Can&apos;t find your answer?{' '}
              <a href="mailto:pb@reattend.ai" className="text-[#4F46E5] font-medium hover:underline">Email us</a>
            </p>
          </ScrollReveal>
          <FAQAccordion items={faqs} />
        </div>
      </section>


      {/* CTA */}
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
                Every decision, meeting, and insight becomes <strong className="text-[#111]">permanent, connected, and searchable</strong>.
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
