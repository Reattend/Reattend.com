import { Suspense } from 'react'
import { Metadata } from 'next'
import { IcebreakerSpinner } from './spinner'

export const metadata: Metadata = {
  title: 'Icebreaker Spinner - Free Team Game | Reattend',
  description: 'Spin the wheel and answer fun icebreaker questions. 4 categories from fun to deep. Perfect for TGIF, team meetings, and office gatherings. Free, no signup.',
  openGraph: {
    title: 'Icebreaker Spinner - Free Team Game | Reattend',
    description: 'Spin the wheel and answer icebreaker questions. Free team bonding game for offices.',
    type: 'website',
    siteName: 'Reattend',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Icebreaker Spinner - Free Team Game | Reattend',
    description: 'Spin the wheel and answer icebreaker questions. Free team game.',
  },
  alternates: { canonical: 'https://reattend.com/game/icebreaker-spinner' },
}

export default function Page() {
  return <Suspense><IcebreakerSpinner /></Suspense>
}
