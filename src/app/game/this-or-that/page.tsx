import { Suspense } from 'react'
import { Metadata } from 'next'
import { ThisOrThat } from './game'

export const metadata: Metadata = {
  title: 'This or That - Free Team Game | Reattend',
  description: 'Rapid-fire binary choices for teams. Coffee or tea? Tabs or spaces? See where your team splits. Free game for TGIF and office gatherings.',
  openGraph: {
    title: 'This or That - Free Team Game | Reattend',
    description: 'Rapid-fire binary choices for teams. Free office game.',
    type: 'website',
    siteName: 'Reattend',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'This or That - Free Team Game | Reattend',
    description: 'Rapid-fire binary choices for teams. Free game.',
  },
  alternates: { canonical: 'https://reattend.com/game/this-or-that' },
}

export default function Page() {
  return <Suspense><ThisOrThat /></Suspense>
}
