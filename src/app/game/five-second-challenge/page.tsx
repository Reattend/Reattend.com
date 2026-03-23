import { Suspense } from 'react'
import { Metadata } from 'next'
import { FiveSecondChallenge } from './game'

export const metadata: Metadata = {
  title: '5-Second Challenge - Free Team Game | Reattend',
  description: 'Name 3 things in 5 seconds. Random categories, maximum pressure, pure fun. Free team game for TGIF and office gatherings. No signup required.',
  openGraph: {
    title: '5-Second Challenge - Free Team Game | Reattend',
    description: 'Name 3 things in 5 seconds. Free team game for offices.',
    type: 'website',
    siteName: 'Reattend',
  },
  twitter: {
    card: 'summary_large_image',
    title: '5-Second Challenge - Free Team Game | Reattend',
    description: 'Name 3 things in 5 seconds. Free team game.',
  },
  alternates: { canonical: 'https://reattend.com/game/five-second-challenge' },
}

export default function Page() {
  return <Suspense><FiveSecondChallenge /></Suspense>
}
