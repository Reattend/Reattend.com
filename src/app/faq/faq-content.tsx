'use client'


import React, { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, ArrowRight, MessageSquare } from 'lucide-react'


// ─── FAQ data by category ────────────────────────────────
const categories = [
 {
   label: 'General',
   slug: 'general',
   questions: [
     {
       q: 'What is Reattend?',
       a: 'Reattend is the AI that catches what your team forgot. It captures every decision, meeting outcome, and piece of context, then organizes them with AI, catches contradictions, and makes everything searchable through a living knowledge graph.',
     },
     {
       q: 'Who is Reattend for?',
       a: 'Reattend is built for teams and individuals who lose track of decisions, context, and knowledge across tools. Whether you\'re a startup, a remote team, or a solo professional - if things fall through the cracks, Reattend helps.',
     },
     {
       q: 'How is Reattend different from Notion or Google Docs?',
       a: 'Notion and Google Docs require you to manually organize everything. Reattend uses AI to automatically capture decisions, categorize them, link related items, catch contradictions, and surface knowledge when you need it. It\'s a living decision log - not a static document.',
     },
     {
       q: 'Do I need to install anything?',
       a: 'Yes. Reattend is a desktop app for Mac and Windows. Download it, sign in, and it starts capturing automatically. It runs quietly in your menu bar and builds your memory in the background.',
     },
   ],
 },
 {
   label: 'Pricing & Plans',
   slug: 'pricing',
   questions: [
     {
       q: 'How much does Reattend cost?',
       a: 'Reattend offers a 60-day free trial with all features — ambient capture, meeting recording, AI triage, semantic search, and more. After the trial, Pro is $20/month per user for unlimited AI. Or keep using Reattend free forever as a notetaker.',
     },
     {
       q: 'Can I use Reattend for free?',
       a: 'Yes. You get a 60-day free trial with every feature unlocked — no credit card required. After the trial, you can upgrade to Pro ($20/month) or keep using Reattend free forever as a notetaker. Your memories are always yours.',
     },
     {
       q: 'What happens after the trial?',
       a: 'After 60 days, AI features pause — ambient capture, triage, semantic search, meeting transcription, and Ask AI. Your memories stay safe on your device. You can upgrade to Pro ($20/month) to continue with AI, or keep using Reattend free forever as a notetaker.',
     },
     {
       q: 'What payment methods do you accept?',
       a: 'We accept all major credit and debit cards through Paddle, our payment processor. Paddle also supports PayPal in select regions.',
     },
     {
       q: 'Can I cancel anytime?',
       a: 'Absolutely. There are no contracts or commitments. You can cancel your subscription at any time from your settings, and you\'ll keep access until the end of your billing period.',
     },
   ],
 },
 {
   label: 'Features & Product',
   slug: 'features',
   questions: [
     {
       q: 'What does the AI actually do?',
       a: 'The AI triages incoming information, auto-generates summaries and tags, extracts decisions and action items, links related decisions together, catches contradictions, suggests project groupings, and powers semantic search so you can ask questions in natural language.',
     },
     {
       q: 'What is the Knowledge Graph?',
       a: 'The Knowledge Graph is an interactive visualization that shows how your team\'s decisions are connected. Decisions link to meetings, insights connect to projects, and contradictions are highlighted - you can explore relationships visually and discover patterns.',
     },
     {
       q: 'What are Boards?',
       a: 'Boards are Miro-like canvases where you can spatially arrange decisions, add sticky notes, draw connections, and collaborate visually. Think of it as a whiteboard overlay on top of your team\'s knowledge.',
     },
     {
       q: 'Can I search across all my memories?',
       a: 'Yes. During your trial and on Pro, you get semantic search powered by AI embeddings — search by meaning, not just exact words. Ask "What did we decide about pricing?" and get relevant results. The free plan includes keyword search.',
     },
     {
       q: 'Does Reattend support workspaces for teams?',
       a: 'Yes. You can create personal and team workspaces. Team members can be assigned Owner, Admin, or Member roles with different permission levels.',
     },
   ],
 },
 {
   label: 'Integrations',
   slug: 'integrations',
   questions: [
     {
       q: 'What integrations does Reattend support?',
       a: 'We\'re building integrations with 100+ tools across communication (Slack, Teams, Zoom), docs (Notion, Confluence), project management (Jira, Linear, GitHub), email (Gmail, Outlook), and more. Check our integrations page for the full list.',
     },
     {
       q: 'Are integrations included in the free plan?',
       a: 'Yes. All integrations are included in every Reattend plan at no extra cost. There are no per-integration charges.',
     },
     {
       q: 'Can I request an integration?',
       a: 'Absolutely. Visit our integrations page and use the request form at the bottom. We prioritize integrations based on user demand, so your vote matters.',
     },
     {
       q: 'How do integrations work?',
       a: 'Once connected, integrations automatically capture relevant information from your tools - decisions from Slack, meeting notes from Zoom, tasks from Jira. The AI then organizes, links, and checks everything for contradictions.',
     },
   ],
 },
 {
   label: 'Security & Privacy',
   slug: 'security',
   questions: [
     {
       q: 'Is my data encrypted?',
       a: 'Yes. All data is encrypted at rest using AES-256 and in transit using TLS 1.3. Your data is protected by industry-standard encryption at every level.',
     },
     {
       q: 'Does Reattend sell or share my data?',
       a: 'Never. Your data belongs to you. We do not sell, share, or use your data for advertising or training models. Reattend only processes your data to deliver the service to you.',
     },
     {
       q: 'Is Reattend GDPR compliant?',
       a: 'Yes. We\'re fully GDPR compliant. You can export or delete all your data at any time. We process only the minimum data required to deliver the service.',
     },
     {
       q: 'Can I delete all my data?',
       a: 'Yes. You can delete your account and all associated data at any time from your settings. Deletion is permanent and we purge everything from our systems.',
     },
     {
       q: 'Where is my data stored?',
       a: 'Your memories are stored locally on your device — not on our servers. Screen captures, meeting recordings, and the knowledge graph all stay on your machine. Only the AI triage step calls our server (encrypted), and we never store your content.',
     },
   ],
 },
 {
   label: 'Getting Started',
   slug: 'getting-started',
   questions: [
     {
       q: 'How do I get started?',
       a: 'Download Reattend for Mac or Windows from reattend.com. Open the app, sign in with your email, and you\'re ready to go. Your 60-day free trial starts automatically.',
     },
     {
       q: 'How do I add team members?',
       a: 'Go to Settings in your workspace, then Invite Members. Enter their email addresses and assign roles. They\'ll receive an invitation to join your workspace.',
     },
     {
       q: 'What should I capture first?',
       a: 'Start with decisions your team has made recently, key meeting outcomes, or important context that keeps getting lost. The AI will start connecting and organizing everything as you add more.',
     },
     {
       q: 'Can I import existing data?',
       a: 'Currently you can capture data manually or through integrations. We\'re building bulk import features for common formats. If you have a specific need, contact us at pb@reattend.ai.',
     },
   ],
 },
]


export default function FaqContent() {
 const [activeCategory, setActiveCategory] = useState('general')
 const [openQuestion, setOpenQuestion] = useState<string | null>(null)


 const currentCategory = categories.find(c => c.slug === activeCategory) || categories[0]


 const toggleQuestion = (q: string) => {
   setOpenQuestion(prev => prev === q ? null : q)
 }


 return (
   <main className="relative py-16 md:py-24 px-5 overflow-hidden">
     {/* Background */}
     <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-gradient-to-br from-[#4F46E5]/6 via-[#818CF8]/4 to-transparent blur-3xl pointer-events-none" />


     <div className="relative z-10 max-w-[1100px] mx-auto">
       {/* Header */}
       <div className="mb-14">
         <motion.h1
           initial={{ opacity: 0, y: 12 }}
           animate={{ opacity: 1, y: 0 }}
           className="text-[36px] md:text-[52px] font-bold tracking-[-0.03em] leading-[1.08]"
         >
           Frequently Asked
           <br />
           Questions
         </motion.h1>
       </div>


       {/* Two-column layout */}
       <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
         {/* Left - Category navigation */}
         <motion.nav
           initial={{ opacity: 0, x: -16 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.1 }}
           className="lg:w-[280px] shrink-0"
         >
           <div className="lg:sticky lg:top-[100px] space-y-1">
             {categories.map((cat) => {
               const isActive = activeCategory === cat.slug
               return (
                 <button
                   key={cat.slug}
                   onClick={() => { setActiveCategory(cat.slug); setOpenQuestion(null) }}
                   className={`w-full text-left px-4 py-3 rounded-xl text-[15px] font-medium transition-all flex items-center gap-2.5 ${
                     isActive
                       ? 'bg-white/80 backdrop-blur-xl border border-white/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)] text-[#1a1a2e]'
                       : 'text-gray-500 hover:text-[#1a1a2e] hover:bg-white/40'
                   }`}
                 >
                   {isActive && (
                     <span className="text-[#4F46E5]">
                       <ArrowRight className="w-4 h-4" />
                     </span>
                   )}
                   {cat.label}
                 </button>
               )
             })}


             {/* Contact link */}
             <div className="pt-6 mt-6 border-t border-gray-200/50">
               <p className="text-[13px] text-gray-400 mb-2">Still have questions?</p>
               <a
                 href="mailto:pb@reattend.ai"
                 className="inline-flex items-center gap-2 text-[14px] font-medium text-[#4F46E5] hover:text-[#4338CA] transition-colors"
               >
                 <MessageSquare className="w-4 h-4" />
                 Contact us
               </a>
             </div>
           </div>
         </motion.nav>


         {/* Right - Questions accordion */}
         <motion.div
           initial={{ opacity: 0, y: 16 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.15 }}
           className="flex-1 min-w-0"
         >
           <div className="divide-y divide-gray-200/60">
             {currentCategory.questions.map((item) => {
               const isOpen = openQuestion === item.q
               return (
                 <div key={item.q}>
                   <button
                     onClick={() => toggleQuestion(item.q)}
                     className={`w-full flex items-center justify-between gap-4 py-5 text-left transition-colors group ${
                       isOpen ? 'text-[#1a1a2e]' : 'text-gray-600 hover:text-[#1a1a2e]'
                     }`}
                   >
                     <span className="text-[15px] md:text-[16px] font-semibold leading-snug pr-4">
                       {item.q}
                     </span>
                     <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                       isOpen
                         ? 'bg-[#4F46E5] text-white'
                         : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                     }`}>
                       {isOpen ? (
                         <X className="w-3.5 h-3.5" />
                       ) : (
                         <Plus className="w-3.5 h-3.5" />
                       )}
                     </span>
                   </button>
                   <AnimatePresence initial={false}>
                     {isOpen && (
                       <motion.div
                         initial={{ height: 0, opacity: 0 }}
                         animate={{ height: 'auto', opacity: 1 }}
                         exit={{ height: 0, opacity: 0 }}
                         transition={{ duration: 0.25, ease: 'easeInOut' }}
                         className="overflow-hidden"
                       >
                         <div className="pb-6 pr-12">
                           <p className="text-[14px] md:text-[15px] text-gray-500 leading-relaxed">
                             {item.a}
                           </p>
                         </div>
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>
               )
             })}
           </div>
         </motion.div>
       </div>


       {/* CTA */}
       <motion.div
         initial={{ opacity: 0, y: 20 }}
         whileInView={{ opacity: 1, y: 0 }}
         viewport={{ once: true }}
         className="mt-20 text-center"
       >
         <h2 className="text-[24px] md:text-[32px] font-bold tracking-[-0.02em]">
           Ready to try Reattend?
         </h2>
         <p className="text-gray-500 text-[15px] mt-3 max-w-md mx-auto">
           Free for 60 days. No credit card required.
         </p>
         <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
           <Link
             href="/download"
             className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-[14px] transition-colors shadow-[0_4px_14px_rgba(79,70,229,0.3)] active:scale-[0.98]"
           >
             Download free <ArrowRight className="w-4 h-4" />
           </Link>
           <Link
             href="/pricing"
             className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border-2 border-[#4F46E5]/20 hover:border-[#4F46E5]/40 text-[#4F46E5] font-bold text-[14px] transition-colors"
           >
             View pricing <ArrowRight className="w-4 h-4" />
           </Link>
         </div>
       </motion.div>
     </div>
   </main>
 )
}



