import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing - 60-Day Free Trial, Pro at $20/month',
  description: 'Reattend pricing: 60-day free trial with all AI features. Pro plan at $20/month for unlimited AI memory. Free forever as a notetaker. Available for Mac & Windows.',
  alternates: {
    canonical: 'https://reattend.com/pricing',
  },
  openGraph: {
    title: 'Reattend Pricing - 60-Day Free Trial',
    description: '60-day free trial with all features. Pro: $20/month for unlimited AI. Or free forever as a notetaker. Mac & Windows.',
    url: 'https://reattend.com/pricing',
  },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
