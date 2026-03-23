import { Suspense } from 'react'
import { Metadata } from 'next'
import { WouldYouRather } from './game'

export const metadata: Metadata = {
  title: 'Would You Rather - Work Edition | Free Team Game | Reattend',
  description: 'Work-themed "Would You Rather" questions for team bonding. Vote, see the split, and debate. Free game for TGIF, team meetings, and office fun.',
  openGraph: {
    title: 'Would You Rather - Work Edition | Free Team Game | Reattend',
    description: 'Work-themed Would You Rather for teams. Vote and see the split. Free.',
    type: 'website',
    siteName: 'Reattend',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Would You Rather - Work Edition | Free Team Game | Reattend',
    description: 'Work-themed Would You Rather for teams. Free game.',
  },
  alternates: { canonical: 'https://reattend.com/game/would-you-rather' },
}

export default function Page() {
  return <Suspense><WouldYouRather /></Suspense>
}
