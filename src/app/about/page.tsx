import React from 'react'
import Link from 'next/link'
import { Metadata } from 'next'
import { ArrowRight } from 'lucide-react'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'


export const metadata: Metadata = {
 title: 'About Reattend - AI Decision Intelligence for Teams',
 description:
   'Reattend captures every team decision, catches contradictions, and makes your knowledge searchable forever. Stop re-deciding. Start building.',
 openGraph: {
   title: 'About Reattend',
   description: 'AI decision intelligence for teams. Capture decisions, catch contradictions, and make your knowledge searchable.',
   url: 'https://reattend.com/about',
 },
 alternates: { canonical: 'https://reattend.com/about' },
}


export default function AboutPage() {
 return (
   <div className="min-h-screen bg-[#FAFAFA] text-[#111] overflow-x-hidden">
     <Navbar />


     <main className="relative py-16 md:py-24 px-5 overflow-hidden">
       {/* Background gradient blobs */}
       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-gradient-to-br from-[#4F46E5]/8 via-[#818CF8]/5 to-transparent blur-3xl pointer-events-none" />
       <div className="absolute top-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#4F46E5]/5 blur-3xl pointer-events-none" />


       <div className="relative z-10 max-w-[680px] mx-auto">
         {/* Header */}
         <div className="text-center mb-12">
           <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#4F46E5]/15 bg-white/70 backdrop-blur-sm text-[13px] font-medium text-[#4F46E5]">
             <span className="w-2 h-2 rounded-full bg-[#4F46E5]" />
             Our Story
           </span>
           <h1 className="text-[32px] md:text-[46px] font-bold tracking-[-0.03em] leading-[1.1] mt-5">
             About <span className="text-[#4F46E5]">Reattend</span>
           </h1>
           <p className="text-gray-500 text-[15px] mt-3">AI decision intelligence for teams</p>
         </div>


         {/* Content */}
         <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-2xl shadow-[0_8px_32px_rgba(79,70,229,0.06)] p-8 md:p-10">
           <div className="space-y-8">
             <section>
               <h2 className="text-[20px] font-bold mb-3 text-[#1a1a2e]">The Problem</h2>
               <p className="text-[15px] text-gray-600 leading-relaxed">
                 Every team has the same problem: decisions disappear. Your team decided something last month -
                 then someone contradicted it this week. Nobody noticed. Context from last quarter is gone.
                 The person who knew why something was built a certain way just left. Teams lose weeks of
                 productivity every year re-debating things they already decided.
               </p>
             </section>


             <section>
               <h2 className="text-[20px] font-bold mb-3 text-[#1a1a2e]">What We&apos;re Building</h2>
               <p className="text-[15px] text-gray-600 leading-relaxed mb-4">
                 Reattend is the AI that catches what your team forgot. It captures decisions, meeting outcomes,
                 and context from your work - then organizes them into a living knowledge graph that catches
                 contradictions and grows smarter over time.
               </p>
               <p className="text-[15px] text-gray-600 leading-relaxed">
                 Instead of searching through Slack threads, email chains, and scattered docs, you ask Reattend.
                 It knows what was decided, who decided it, and why - and flags when a new decision contradicts
                 an old one. Your team stops re-debating and starts building.
               </p>
             </section>


             <section>
               <h2 className="text-[20px] font-bold mb-3 text-[#1a1a2e]">How It Works</h2>
               <ul className="space-y-3 text-[15px] text-gray-600 leading-relaxed">
                 <li className="flex items-start gap-3">
                   <span className="w-6 h-6 rounded-full bg-[#4F46E5]/10 flex items-center justify-center text-[#4F46E5] text-[12px] font-bold flex-shrink-0 mt-0.5">1</span>
                   <span><strong className="text-[#1a1a2e]">Capture</strong> - Drop in decisions, meeting notes, context, or anything worth tracking. Type it, paste it, or let integrations pull it in.</span>
                 </li>
                 <li className="flex items-start gap-3">
                   <span className="w-6 h-6 rounded-full bg-[#4F46E5]/10 flex items-center justify-center text-[#4F46E5] text-[12px] font-bold flex-shrink-0 mt-0.5">2</span>
                   <span><strong className="text-[#1a1a2e]">Connect</strong> - AI extracts decisions, tags, and entities - then links related items and catches contradictions. No folder management needed.</span>
                 </li>
                 <li className="flex items-start gap-3">
                   <span className="w-6 h-6 rounded-full bg-[#4F46E5]/10 flex items-center justify-center text-[#4F46E5] text-[12px] font-bold flex-shrink-0 mt-0.5">3</span>
                   <span><strong className="text-[#1a1a2e]">Recall</strong> - Ask "what did we decide about X?" and get a sourced answer in seconds. Explore the knowledge graph. Never lose a decision again.</span>
                 </li>
               </ul>
             </section>


             <section>
               <h2 className="text-[20px] font-bold mb-3 text-[#1a1a2e]">Our Principles</h2>
               <ul className="space-y-3 text-[15px] text-gray-600 leading-relaxed">
                 <li>
                   <strong className="text-[#1a1a2e]">Privacy first.</strong> Your knowledge is yours. We don&apos;t sell data, we don&apos;t train on your content, and we give you full control over what&apos;s stored.
                 </li>
                 <li>
                   <strong className="text-[#1a1a2e]">Simple by default.</strong> Capturing a decision should be as easy as sending a message. If it takes more than 10 seconds, we&apos;ve failed.
                 </li>
                 <li>
                   <strong className="text-[#1a1a2e]">AI that serves you.</strong> The AI works in the background - triaging, linking, organizing. You never have to prompt it or learn a new workflow.
                 </li>
                 <li>
                   <strong className="text-[#1a1a2e]">Free tools, no strings.</strong> We build genuinely useful free tools for teams. They work standalone. If you want the full decision intelligence platform, great. If not, the free tools are still yours.
                 </li>
               </ul>
             </section>


             <section>
               <h2 className="text-[20px] font-bold mb-3 text-[#1a1a2e]">Get in Touch</h2>
               <p className="text-[15px] text-gray-600 leading-relaxed">
                 Have questions, feedback, or just want to say hi? Reach out at{' '}
                 <a href="mailto:pb@reattend.ai" className="text-[#4F46E5] font-medium hover:underline">
                   pb@reattend.ai
                 </a>
               </p>
             </section>


             {/* CTA */}
             <div className="pt-4 border-t border-gray-100 text-center">
               <p className="text-[15px] text-gray-600 mb-4">
                 Ready to stop re-deciding?
               </p>
               <Link
                 href="/register"
                 className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-[14px] transition-colors shadow-[0_4px_14px_rgba(79,70,229,0.3)] active:scale-[0.98]"
               >
                 Try Reattend free <ArrowRight className="w-4 h-4" />
               </Link>
             </div>
           </div>
         </div>
       </div>
     </main>


     <Footer />
   </div>
 )
}



