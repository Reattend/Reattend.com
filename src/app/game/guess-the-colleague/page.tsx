import { Suspense } from 'react'
import { Metadata } from 'next'
import { GuessTheColleague } from './game'

export const metadata: Metadata = {
  title: 'Guess the Colleague - Free Team Game | Reattend',
  description: 'Everyone submits a fun fact anonymously. The team guesses who said what. The team game that builds real connections. Free, no signup.',
  openGraph: {
    title: 'Guess the Colleague - Free Team Game | Reattend',
    description: 'Guess who said the fun fact. Free team bonding game.',
    type: 'website',
    siteName: 'Reattend',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Guess the Colleague - Free Team Game | Reattend',
    description: 'Guess the colleague from fun facts. Free game.',
  },
  alternates: { canonical: 'https://reattend.com/game/guess-the-colleague' },
}

export default function Page() {
  return <Suspense><GuessTheColleague /></Suspense>
}
