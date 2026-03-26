'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { initializePaddle, type Paddle } from '@paddle/paddle-js'
import {
  Check,
  Sparkles,
  CreditCard,
  Loader2,
  Brain,
  Shield,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface UserInfo {
  id: string
  email: string
  name: string
}

const freeFeatures = [
  'Unlimited memories',
  '10 AI queries / day',
  '1 integration of your choice',
  '2 meeting recordings / day',
  'Desktop app + browser extension',
  'Keyword search',
]

const proFeatures = [
  'Unlimited AI queries',
  'All integrations',
  'Unlimited meeting recordings',
  'Semantic search + knowledge graph',
  'Writing assist',
  'Priority support',
  'Early access to new features',
]

const teamsFeatures = [
  'Everything in Pro',
  'Shared memory spaces',
  'Team knowledge base',
  'Admin dashboard',
  'Bulk onboarding',
  'Min. 3 users',
]

// Static map — Next.js inlines NEXT_PUBLIC_ vars at build time; dynamic process.env[key] doesn't work
const PADDLE_PRICE_IDS: Record<string, string | undefined> = {
  NEXT_PUBLIC_PADDLE_PRICE_ID: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID,
  NEXT_PUBLIC_PADDLE_PRO_ANNUAL_PRICE_ID: process.env.NEXT_PUBLIC_PADDLE_PRO_ANNUAL_PRICE_ID,
  NEXT_PUBLIC_PADDLE_TEAMS_PRICE_ID: process.env.NEXT_PUBLIC_PADDLE_TEAMS_PRICE_ID,
  NEXT_PUBLIC_PADDLE_TEAMS_ANNUAL_PRICE_ID: process.env.NEXT_PUBLIC_PADDLE_TEAMS_ANNUAL_PRICE_ID,
}

export default function BillingPage() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [teamCount, setTeamCount] = useState(0)
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const paddleRef = useRef<Paddle | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/user')
      const data = await res.json()
      if (data.user) setUser(data.user)
      if (data.workspaces) {
        const teams = data.workspaces.filter((w: any) => w.type === 'team')
        setTeamCount(teams.length)
      }
    } catch {
      toast.error('Failed to load billing data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
    if (!clientToken) return
    initializePaddle({
      token: clientToken,
      eventCallback: (event) => {
        if (event.name === 'checkout.completed') {
          toast.success('Subscription activated!')
          setTimeout(() => fetchData(), 3000)
        }
      },
    }).then((paddle) => {
      if (paddle) paddleRef.current = paddle
    })
  }, [fetchData])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'true') {
      toast.success('Payment successful!')
      window.history.replaceState({}, '', '/app/billing')
      setTimeout(() => fetchData(), 3000)
    }
  }, [fetchData])

  const openCheckout = (priceIdEnv: string) => {
    const priceId = PADDLE_PRICE_IDS[priceIdEnv]
    if (!paddleRef.current || !priceId || !user) {
      toast.error('Payment system not ready. Please refresh the page.')
      return
    }
    paddleRef.current.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: { email: user.email },
      customData: { userId: user.id },
      settings: {
        displayMode: 'overlay',
        theme: 'light',
        successUrl: `${window.location.origin}/app/billing?success=true`,
      },
    })
  }

  const handleSubscribePro = () => {
    const key = billing === 'annual'
      ? 'NEXT_PUBLIC_PADDLE_PRO_ANNUAL_PRICE_ID'
      : 'NEXT_PUBLIC_PADDLE_PRICE_ID'
    openCheckout(key)
  }

  const handleSubscribeTeams = () => {
    const key = billing === 'annual'
      ? 'NEXT_PUBLIC_PADDLE_TEAMS_ANNUAL_PRICE_ID'
      : 'NEXT_PUBLIC_PADDLE_TEAMS_PRICE_ID'
    openCheckout(key)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const isFreeTeams = teamCount <= 3

  // Prices per billing period
  const proPrice = billing === 'annual' ? '$75' : '$9'
  const proPeriod = billing === 'annual' ? '/ year' : '/ month'
  const proNote = billing === 'annual' ? 'billed annually - save 2 months' : '$75 / year - save 2 months'

  const teamsPrice = billing === 'annual' ? '$56' : '$7'
  const teamsPeriod = billing === 'annual' ? '/ user / year' : '/ user / month'
  const teamsNote = billing === 'annual' ? 'billed annually - save 2 months' : '$56 / user / year - save 2 months'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-4xl"
    >
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your plan and subscription.
        </p>
      </div>

      {/* Current Plan */}
      <Card className="border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Brain className="h-4.5 w-4.5 text-emerald-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">Free</h3>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10">
                      Free Forever
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="pl-[46px]">
                <p className="text-sm text-muted-foreground">
                  Unlimited memories, 10 AI queries/day, 1 integration, 2 meeting recordings/day.
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-3xl font-bold">$0</p>
              <p className="text-xs text-muted-foreground">/ forever</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teams Status */}
      {teamCount > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                  <Users className="h-4.5 w-4.5 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Teams</h3>
                  <p className="text-xs text-muted-foreground">
                    {teamCount} team{teamCount !== 1 ? 's' : ''} - {isFreeTeams ? `${3 - teamCount} free remaining` : 'Active plan'}
                  </p>
                </div>
              </div>
              {!isFreeTeams && (
                <div className="text-right">
                  <p className="text-lg font-bold">$7</p>
                  <p className="text-[10px] text-muted-foreground">/user/mo</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Comparison */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Compare Plans</h2>
          {/* Billing toggle pill */}
          <div className="flex items-center gap-1 p-1 rounded-full bg-muted border text-sm">
            <button
              onClick={() => setBilling('monthly')}
              className={cn(
                'px-4 py-1 rounded-full text-sm font-medium transition-colors',
                billing === 'monthly'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={cn(
                'px-4 py-1 rounded-full text-sm font-medium transition-colors',
                billing === 'annual'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Annual
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Free */}
          <Card className="relative transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="h-4.5 w-4.5 text-gray-500" />
                <CardTitle className="text-base">Free</CardTitle>
              </div>
              <div className="mt-1">
                <span className="text-3xl font-bold">$0</span>
                <span className="text-sm text-muted-foreground"> / forever</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Forever free. No credit card.
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <Separator className="mb-4" />
              <ul className="space-y-2.5">
                {freeFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-sm">
                    <Check className="h-4 w-4 text-gray-400 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="pt-2">
              <Button variant="outline" className="w-full" disabled>
                Current Plan
              </Button>
            </CardFooter>
          </Card>

          {/* Pro */}
          <Card className="relative transition-all hover:shadow-md border-indigo-500/30 bg-indigo-500/[0.02]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4.5 w-4.5 text-indigo-500" />
                  <CardTitle className="text-base">Pro</CardTitle>
                </div>
                <Badge className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 text-[10px]">Popular</Badge>
              </div>
              <div className="mt-1">
                <span className="text-3xl font-bold">{proPrice}</span>
                <span className="text-sm text-muted-foreground"> {proPeriod}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{proNote}</p>
              <p className="text-sm text-muted-foreground mt-1">
                60-day free trial. No credit card needed.
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <Separator className="mb-4" />
              <ul className="space-y-2.5">
                {proFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-sm">
                    <Check className="h-4 w-4 text-indigo-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="pt-2">
              <Button className="w-full" onClick={handleSubscribePro}>
                <CreditCard className="h-4 w-4 mr-2" />
                Upgrade to Pro
              </Button>
            </CardFooter>
          </Card>

          {/* Teams */}
          <Card className="relative transition-all hover:shadow-md border-sky-500/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4.5 w-4.5 text-sky-500" />
                <CardTitle className="text-base">Teams</CardTitle>
              </div>
              <div className="mt-1">
                <span className="text-3xl font-bold">{teamsPrice}</span>
                <span className="text-sm text-muted-foreground"> {teamsPeriod}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{teamsNote}</p>
              <p className="text-sm text-muted-foreground mt-1">
                For teams that never lose context.
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <Separator className="mb-4" />
              <ul className="space-y-2.5">
                {teamsFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-sm">
                    <Check className="h-4 w-4 text-sky-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="pt-2">
              <Button className="w-full bg-sky-600 hover:bg-sky-700" onClick={handleSubscribeTeams}>
                <CreditCard className="h-4 w-4 mr-2" />
                Get Teams
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Payment Info */}
      <Card className="bg-muted/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
              <Shield className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold">Secure Payments via Paddle</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Payments are securely processed by Paddle, our Merchant of Record.
                Paddle handles billing, invoices, taxes, and compliance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
