import { Suspense } from 'react'
import { Metadata } from 'next'
import { HotTakes } from './game'

export const metadata: Metadata = {
  title: 'Hot Takes Board - Free Team Game | Reattend',
  description: 'Submit anonymous hot takes and vote agree or disagree. Discover your team\'s most controversial opinions. Free game for TGIF and team bonding.',
  openGraph: {
    title: 'Hot Takes Board - Free Team Game | Reattend',
    description: 'Anonymous hot takes and voting for teams. Free game.',
    type: 'website',
    siteName: 'Reattend',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hot Takes Board - Free Team Game | Reattend',
    description: 'Anonymous hot takes for team bonding. Free game.',
  },
  alternates: { canonical: 'https://reattend.com/game/hot-takes' },
}

export default function Page() {
  return <Suspense><HotTakes /></Suspense>
}
