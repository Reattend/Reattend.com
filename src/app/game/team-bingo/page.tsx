import { Suspense } from 'react'
import { Metadata } from 'next'
import { TeamBingo } from './bingo'

export const metadata: Metadata = {
  title: 'Team Bingo Generator - Free Team Game | Reattend',
  description: 'Generate "Find someone who..." bingo cards for team bonding. Custom or pre-made prompts. Print or play on screen. Free, no signup required.',
  openGraph: {
    title: 'Team Bingo Generator - Free Team Game | Reattend',
    description: 'Generate team bonding bingo cards. Free game for offices.',
    type: 'website',
    siteName: 'Reattend',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Team Bingo Generator - Free Team Game | Reattend',
    description: 'Generate team bingo cards for office bonding. Free game.',
  },
  alternates: { canonical: 'https://reattend.com/game/team-bingo' },
}

export default function Page() {
  return <Suspense><TeamBingo /></Suspense>
}
