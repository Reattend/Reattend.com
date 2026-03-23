import { Suspense } from 'react'
import { Metadata } from 'next'
import { TeamTrivia } from './game'

export const metadata: Metadata = {
  title: 'Team Trivia Maker - Free Team Game | Reattend',
  description: 'Create custom trivia quizzes about your team or company. Share a link and play together. Free game for TGIF and team bonding.',
  openGraph: {
    title: 'Team Trivia Maker - Free Team Game | Reattend',
    description: 'Create custom trivia for your team. Free game.',
    type: 'website',
    siteName: 'Reattend',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Team Trivia Maker - Free Team Game | Reattend',
    description: 'Create custom trivia for teams. Free game.',
  },
  alternates: { canonical: 'https://reattend.com/game/team-trivia' },
}

export default function Page() {
  return <Suspense><TeamTrivia /></Suspense>
}
