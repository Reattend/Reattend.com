import { Suspense } from 'react'
import { Metadata } from 'next'
import { TeamSuperlatives } from './game'

export const metadata: Metadata = {
  title: 'Team Superlatives - Free Team Game | Reattend',
  description: '"Most likely to..." - Vote on fun categories and crown your team\'s superstars. Free game for TGIF and team bonding. No signup required.',
  openGraph: {
    title: 'Team Superlatives - Free Team Game | Reattend',
    description: 'Vote on "Most likely to..." team superlatives. Free game.',
    type: 'website',
    siteName: 'Reattend',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Team Superlatives - Free Team Game | Reattend',
    description: 'Team superlatives voting game. Free.',
  },
  alternates: { canonical: 'https://reattend.com/game/team-superlatives' },
}

export default function Page() {
  return <Suspense><TeamSuperlatives /></Suspense>
}
