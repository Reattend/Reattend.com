import { Suspense } from 'react'
import { Metadata } from 'next'
import { TwoTruthsOneLie } from './game'

export const metadata: Metadata = {
  title: 'Two Truths & A Lie - Free Team Game | Reattend',
  description: 'The classic icebreaker game, digitized. Each person enters two truths and one lie. The team guesses which is the lie. Free, no signup required.',
  openGraph: {
    title: 'Two Truths & A Lie - Free Team Game | Reattend',
    description: 'Classic icebreaker game for teams. Free, no signup.',
    type: 'website',
    siteName: 'Reattend',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Two Truths & A Lie - Free Team Game | Reattend',
    description: 'Two Truths & A Lie for teams. Free game.',
  },
  alternates: { canonical: 'https://reattend.com/game/two-truths-one-lie' },
}

export default function Page() {
  return <Suspense><TwoTruthsOneLie /></Suspense>
}
