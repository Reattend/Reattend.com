import React from 'react'
import { Metadata } from 'next'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'

export const metadata: Metadata = {
  title: 'Refund Policy',
  description: 'Reattend refund policy. 60-day free trial with no charge. Subscription and cancellation details. Billing handled by Paddle.',
  alternates: { canonical: 'https://reattend.com/refund' },
}

export default function RefundPage() {
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
              Legal
            </span>
            <h1 className="text-[32px] md:text-[46px] font-bold tracking-[-0.03em] leading-[1.1] mt-5">
              Refund <span className="text-[#4F46E5]">Policy</span>
            </h1>
            <p className="text-gray-500 text-[15px] mt-3">Last updated: February 18, 2026</p>
          </div>

          {/* Highlight box */}
          <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(79,70,229,0.06)] p-5 mb-6">
            <p className="text-[15px] text-gray-600 leading-relaxed">
              <strong className="text-[#111]">TL;DR:</strong> 60-day free trial. Cancel anytime.
              After payment, subscriptions are non-refundable.
              Cancel to avoid future charges. Your data always remains accessible.
            </p>
          </div>

          {/* Merchant of Record notice */}
          <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(79,70,229,0.06)] p-5 mb-10">
            <p className="text-[15px] text-gray-600 leading-relaxed">
              Reattend is sold and billed through{' '}
              <a href="https://paddle.com" target="_blank" rel="noopener noreferrer" className="text-[#4F46E5] hover:underline font-medium">Paddle</a>,
              our authorized reseller and Merchant of Record. All payments, refunds, and billing-related matters are
              processed in accordance with Paddle&apos;s Consumer Terms, in addition to this policy.
            </p>
          </div>

          {/* Content */}
          <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-2xl shadow-[0_8px_32px_rgba(79,70,229,0.06)] p-8 md:p-10">
            <div className="space-y-8">
              <section>
                <h2 className="text-[20px] font-bold mb-3 text-[#111]">1. Free Plan</h2>
                <p className="text-[15px] text-gray-600 leading-relaxed">
                  Reattend offers a <strong className="text-[#111]">Free Forever</strong> plan with unlimited
                  standard (non-AI) memories and workspaces. No payment is required and no refund applies.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-bold mb-3 text-[#111]">2. 60-Day Free Trial (Pro Features)</h2>
                <p className="text-[15px] text-gray-600 leading-relaxed mb-3">
                  Reattend offers a <strong className="text-[#111]">60-day free trial</strong> of all Pro features.
                </p>
                <ul className="space-y-2 ml-5">
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc">You will <strong className="text-[#111]">not be charged</strong> during the trial period.</li>
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc">You may cancel anytime before the trial ends.</li>
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc">If you cancel before the trial ends, no payment is taken.</li>
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc">Once the trial converts to a paid subscription, standard refund rules apply.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-[20px] font-bold mb-3 text-[#111]">3. Paid Subscriptions (Pro)</h2>
                <p className="text-[15px] text-gray-600 leading-relaxed mb-3">
                  Pro are billed on a <strong className="text-[#111]">monthly subscription basis</strong>.
                  Once a paid subscription begins:
                </p>
                <ul className="space-y-2 ml-5 mb-4">
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc"><strong className="text-[#111]">All sales are final.</strong></li>
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc">No refunds are provided for unused time.</li>
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc">Cancelling a subscription stops future billing but does <strong className="text-[#111]">not</strong> trigger a refund for the current billing period.</li>
                </ul>
                <p className="text-[15px] text-gray-600 leading-relaxed">
                  This applies whether you used the product fully or partially, forgot to cancel before renewal, or changed your mind after subscribing.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-bold mb-3 text-[#111]">4. Consumer Right of Withdrawal (EU / UK)</h2>
                <p className="text-[15px] text-gray-600 leading-relaxed mb-3">
                  If you are a consumer located in the UK or EU, you have a <strong className="text-[#111]">14-day statutory right to cancel</strong>.
                  However, this right is waived once:
                </p>
                <ul className="space-y-2 ml-5 mb-4">
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc">Digital services are activated, and</li>
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc">AI-powered features (Pro) begin processing.</li>
                </ul>
                <p className="text-[15px] text-gray-600 leading-relaxed">
                  By starting a Pro subscription or trial, you explicitly consent to immediate performance
                  of digital services and acknowledge that you lose the right of withdrawal once AI processing begins.
                  This is required under EU digital content regulations and mirrors Paddle&apos;s policy.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-bold mb-3 text-[#111]">5. Exceptions</h2>
                <p className="text-[15px] text-gray-600 leading-relaxed mb-3">
                  Refunds are handled at Paddle&apos;s discretion and may be granted in limited cases, including:
                </p>
                <ul className="space-y-2 ml-5 mb-4">
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc">Duplicate charges</li>
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc">Billing errors</li>
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc">Technical failure preventing access to Reattend</li>
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc">Charges taken in error</li>
                </ul>
                <p className="text-[15px] text-gray-600 leading-relaxed mb-3">
                  Refunds will <strong className="text-[#111]">not</strong> be granted if:
                </p>
                <ul className="space-y-2 ml-5">
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc">AI services were actively used</li>
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc">There is evidence of abuse, fraud, or repeated refund requests</li>
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc">The request is made after extensive usage</li>
                </ul>
              </section>

              <section>
                <h2 className="text-[20px] font-bold mb-3 text-[#111]">6. Team & Workspace Usage</h2>
                <ul className="space-y-2 ml-5">
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc">Smart Memory access is <strong className="text-[#111]">user-based</strong>, not workspace-based.</li>
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc">Refunds are evaluated per user subscription.</li>
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc">Mixed teams (free + paid users) do not qualify for partial or shared refunds.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-[20px] font-bold mb-3 text-[#111]">7. Taxes & VAT</h2>
                <ul className="space-y-2 ml-5">
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc">Taxes (VAT, GST, etc.) are collected by Paddle where applicable.</li>
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc">Tax refunds are subject to local regulations.</li>
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc">Requests must be made within 60 days of purchase.</li>
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc">Valid tax registration details may be required.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-[20px] font-bold mb-3 text-[#111]">8. How to Request a Refund</h2>
                <p className="text-[15px] text-gray-600 leading-relaxed mb-3">
                  All refund requests must be submitted directly to Paddle:
                </p>
                <ul className="space-y-2 ml-5 mb-4">
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc">
                    <a href="https://paddle.com/help" target="_blank" rel="noopener noreferrer" className="text-[#4F46E5] hover:underline">paddle.com/help</a>
                  </li>
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc">Or via the receipt email issued by Paddle</li>
                </ul>
                <p className="text-[15px] text-gray-600 leading-relaxed mb-3">Please include:</p>
                <ul className="space-y-2 ml-5">
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc">Order number</li>
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc">Email used during purchase</li>
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc">Reason for the request</li>
                </ul>
              </section>

              <section>
                <h2 className="text-[20px] font-bold mb-3 text-[#111]">9. Abuse & Fraud</h2>
                <p className="text-[15px] text-gray-600 leading-relaxed">
                  Reattend and Paddle reserve the right to deny refund requests involving abuse or manipulation,
                  and to suspend or terminate accounts involved in fraudulent behavior.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-bold mb-3 text-[#111]">10. After a Refund</h2>
                <p className="text-[15px] text-gray-600 leading-relaxed mb-3">If a refund is processed:</p>
                <ul className="space-y-2 ml-5">
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc">Your account will revert to the Free Forever plan.</li>
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc">All AI-generated metadata (titles, summaries, tags, entities) remains visible.</li>
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc">Your data is never deleted as a result of a refund or cancellation.</li>
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc">You can re-subscribe to Pro at any time.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-[20px] font-bold mb-3 text-[#111]">11. Changes to This Policy</h2>
                <p className="text-[15px] text-gray-600 leading-relaxed">
                  We may update this Refund Policy from time to time. Any changes will apply prospectively
                  and will be communicated where required.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-bold mb-3 text-[#111]">12. Contact Us</h2>
                <p className="text-[15px] text-gray-600 leading-relaxed mb-2">
                  For billing questions not related to refunds, you can also reach us at:
                </p>
                <p className="text-[15px] mb-3">
                  <strong className="text-[#111]">Email:</strong>{' '}
                  <a href="mailto:pb@reattend.ai" className="text-[#4F46E5] hover:underline">pb@reattend.ai</a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
