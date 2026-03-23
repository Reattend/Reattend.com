import React from 'react'
import Link from 'next/link'
import { Metadata } from 'next'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Reattend Terms of Service. Account usage, subscriptions, billing, content ownership, AI features, data privacy, and cancellation policies.',
  alternates: { canonical: 'https://reattend.com/terms' },
}

export default function TermsPage() {
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
              Terms &amp; <span className="text-[#4F46E5]">Conditions</span>
            </h1>
            <p className="text-gray-500 text-[15px] mt-3">Last updated: February 18, 2026</p>
          </div>

          {/* Content */}
          <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-2xl shadow-[0_8px_32px_rgba(79,70,229,0.06)] p-8 md:p-10">
            <div className="space-y-8">
              <p className="text-[15px] text-gray-600 leading-relaxed">
                These Terms and Conditions (&ldquo;Terms&rdquo;) govern your use of the Reattend platform (&ldquo;Service&rdquo;),
                operated by Reattend (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;). By accessing or using the Service, you agree to
                be bound by these Terms.
              </p>

              <section>
                <h2 className="text-[20px] font-bold mb-3 text-[#1a1a2e]">1. Acceptance of Terms</h2>
                <p className="text-[15px] text-gray-600 leading-relaxed">
                  By creating an account or using the Service, you confirm that you are at least 18 years old and
                  agree to comply with these Terms. If you do not agree, you must not use the Service.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-bold mb-3 text-[#1a1a2e]">2. Account Registration</h2>
                <p className="text-[15px] text-gray-600 leading-relaxed">
                  You must provide a valid email address to create an account. You are responsible for maintaining
                  the security of your account credentials and for all activities that occur under your account.
                  You must notify us immediately at{' '}
                  <a href="mailto:pb@reattend.ai" className="text-[#4F46E5] hover:underline">pb@reattend.ai</a>{' '}
                  if you suspect unauthorized access to your account.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-bold mb-3 text-[#1a1a2e]">3. Use of the Service</h2>
                <p className="text-[15px] text-gray-600 leading-relaxed mb-3">You agree to use the Service only for lawful purposes. You must not:</p>
                <ul className="space-y-2 ml-5">
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc">Use the Service to store, transmit, or distribute any illegal, harmful, or offensive content.</li>
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc">Attempt to gain unauthorized access to any part of the Service or its systems.</li>
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc">Interfere with or disrupt the integrity or performance of the Service.</li>
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc">Reverse-engineer, decompile, or disassemble any aspect of the Service.</li>
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc">Use the Service for any purpose that competes with Reattend.</li>
                  <li className="text-[15px] text-gray-600 leading-relaxed list-disc">Share your account credentials with third parties.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-[20px] font-bold mb-3 text-[#1a1a2e]">4. Subscriptions and Billing</h2>
                <p className="text-[15px] text-gray-600 leading-relaxed mb-3">
                  The Service offers free and paid subscription plans. Paid plans are billed on a monthly or annual
                  basis, as selected at the time of purchase. By subscribing to a paid plan, you authorize us to
                  charge your payment method on a recurring basis until you cancel.
                </p>
                <p className="text-[15px] text-gray-600 leading-relaxed">
                  Prices may change with 30 days&apos; notice. Any changes will not affect your current billing cycle.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-bold mb-3 text-[#1a1a2e]">5. Free Trial</h2>
                <p className="text-[15px] text-gray-600 leading-relaxed">
                  New users receive a free trial period of 60 days. During the trial, you have full
                  access to all features. If you do not subscribe before the trial ends,
                  your account will revert to the Free Forever plan.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-bold mb-3 text-[#1a1a2e]">6. Cancellation and Refunds</h2>
                <p className="text-[15px] text-gray-600 leading-relaxed mb-3">
                  You may cancel your subscription at any time through your account settings. Upon cancellation,
                  you will retain access to paid features until the end of your current billing period.
                </p>
                <p className="text-[15px] text-gray-600 leading-relaxed">
                  Refunds for duplicate charges or billing errors are handled by Paddle. Please refer to
                  our <Link href="/refund" className="text-[#4F46E5] hover:underline">Refund Policy</Link> for details.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-bold mb-3 text-[#1a1a2e]">7. Your Content</h2>
                <p className="text-[15px] text-gray-600 leading-relaxed mb-3">
                  You retain ownership of all content you upload or create on the Service (&ldquo;Your Content&rdquo;).
                  By using the Service, you grant us a limited license to process Your Content solely for the
                  purpose of providing and improving the Service.
                </p>
                <p className="text-[15px] text-gray-600 leading-relaxed">
                  We do not use Your Content to train AI models. Your memories and data are private by default.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-bold mb-3 text-[#1a1a2e]">8. Team Workspaces</h2>
                <p className="text-[15px] text-gray-600 leading-relaxed">
                  If you create or join a team workspace, the workspace administrator controls access and
                  permissions. The administrator may add or remove members, change roles, and manage shared
                  content. You acknowledge that content shared in a team workspace is visible to all workspace members.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-bold mb-3 text-[#1a1a2e]">9. AI-Powered Features</h2>
                <p className="text-[15px] text-gray-600 leading-relaxed">
                  The Service uses artificial intelligence to enrich, tag, and connect your memories. While we
                  strive for accuracy, AI-generated content (summaries, tags, action items) may contain errors.
                  You are responsible for reviewing AI-generated outputs.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-bold mb-3 text-[#1a1a2e]">10. Privacy</h2>
                <p className="text-[15px] text-gray-600 leading-relaxed">
                  Your use of the Service is also governed by our{' '}
                  <Link href="/privacy" className="text-[#4F46E5] hover:underline">Privacy Policy</Link>,
                  which explains how we collect, use, and protect your information.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-bold mb-3 text-[#1a1a2e]">11. Intellectual Property</h2>
                <p className="text-[15px] text-gray-600 leading-relaxed">
                  The Service, including its design, code, features, and branding, is owned by Reattend and
                  protected by intellectual property laws. You may not copy, modify, or distribute any part of
                  the Service without our written consent.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-bold mb-3 text-[#1a1a2e]">12. Limitation of Liability</h2>
                <p className="text-[15px] text-gray-600 leading-relaxed">
                  To the maximum extent permitted by law, Reattend shall not be liable for any indirect,
                  incidental, special, consequential, or punitive damages arising from your use of the Service.
                  Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-bold mb-3 text-[#1a1a2e]">13. Disclaimer of Warranties</h2>
                <p className="text-[15px] text-gray-600 leading-relaxed">
                  The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, either
                  express or implied, including but not limited to warranties of merchantability, fitness for a
                  particular purpose, or non-infringement.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-bold mb-3 text-[#1a1a2e]">14. Termination</h2>
                <p className="text-[15px] text-gray-600 leading-relaxed">
                  We may suspend or terminate your account if you violate these Terms or engage in conduct that
                  we determine is harmful to the Service or other users. You may delete your account at any time
                  by contacting us at{' '}
                  <a href="mailto:pb@reattend.ai" className="text-[#4F46E5] hover:underline">pb@reattend.ai</a>.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-bold mb-3 text-[#1a1a2e]">15. Modifications to Terms</h2>
                <p className="text-[15px] text-gray-600 leading-relaxed">
                  We reserve the right to update these Terms at any time. We will notify you of material changes
                  via email or through the Service. Your continued use of the Service after changes take effect
                  constitutes acceptance of the updated Terms.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-bold mb-3 text-[#1a1a2e]">16. Governing Law</h2>
                <p className="text-[15px] text-gray-600 leading-relaxed">
                  These Terms shall be governed by and construed in accordance with applicable laws.
                  Any disputes arising from these Terms shall be resolved through good-faith negotiation
                  or, if necessary, through binding arbitration.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-bold mb-3 text-[#1a1a2e]">17. Contact Us</h2>
                <p className="text-[15px] text-gray-600 leading-relaxed mb-2">
                  If you have any questions about these Terms, please contact us at:
                </p>
                <p className="text-[15px]">
                  <strong className="text-[#1a1a2e]">Email:</strong>{' '}
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
