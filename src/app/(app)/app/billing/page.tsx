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
  Building2,
  CheckCircle2,
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

const trialFeatures = [
  'Ambient screen capture & OCR',
  'AI triage & auto-classification',
  'Meeting recording & transcription',
  'Semantic search & Ask AI',
  'Knowledge graph & entity extraction',
  'Writing assist',
  'Board view & whiteboard',
]

const proFeatures = [
  'Everything in Free Trial',
  'Unlimited AI processing forever',
  'Unlimited memories & captures',
  'Team workspaces',
  'Priority support',
  'Early access to new features',
]

const enterpriseFeatures = [
  'Everything in Teams',
  'Unlimited users & teams',
  'SSO / SAML authentication',
  'Custom data retention policies',
  'Dedicated support & onboarding',
  'SLA & uptime guarantees',
  'Custom integrations',
  'On-premise deployment option',
]

export default function BillingPage() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [teamCount, setTeamCount] = useState(0)
  const paddleRef = useRef<Paddle | null>(null)
  const [enterpriseSubmitted, setEnterpriseSubmitted] = useState(false)
  const [enterpriseSubmitting, setEnterpriseSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/user')
      const data = await res.json()
      if (data.user) setUser(data.user)
      if (data.workspaces) {
        // Count team workspaces (type = 'team')
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

  // Initialize Paddle.js
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

  // Handle ?success=true from checkout redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'true') {
      toast.success('Payment successful!')
      window.history.replaceState({}, '', '/app/billing')
      setTimeout(() => fetchData(), 3000)
    }
  }, [fetchData])

  const handleSubscribeTeams = () => {
    const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID
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

  const handleEnterprise = async () => {
    setEnterpriseSubmitting(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'enterprise_inquiry',
          message: `Enterprise inquiry from ${user?.name || 'user'} (${user?.email || 'unknown'}). Currently has ${teamCount} team(s).`,
        }),
      })
      if (res.ok) {
        setEnterpriseSubmitted(true)
        toast.success('We\'ll reach out to you soon!')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setEnterpriseSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const isFreeTeams = teamCount <= 3

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
                    <h3 className="text-lg font-semibold">Personal</h3>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10">
                      Free Forever
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="pl-[46px]">
                <p className="text-sm text-muted-foreground">
                  Full AI-powered memory. Unlimited memories, semantic search, entity extraction, and more.
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-3xl font-bold">$0</p>
              <p className="text-xs text-muted-foreground">/month</p>
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
                    {teamCount} team{teamCount !== 1 ? 's' : ''} — {isFreeTeams ? `${3 - teamCount} free remaining` : 'Unlimited plan'}
                  </p>
                </div>
              </div>
              {!isFreeTeams && (
                <div className="text-right">
                  <p className="text-lg font-bold">$20</p>
                  <p className="text-[10px] text-muted-foreground">/user/mo</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Comparison */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Compare Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Free Trial */}
          <Card className="relative transition-all border-primary/30 bg-primary/[0.02]">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4.5 w-4.5 text-emerald-500" />
                <CardTitle className="text-base">Free Trial</CardTitle>
              </div>
              <div className="mt-1">
                <span className="text-3xl font-bold">$0</span>
                <span className="text-sm text-muted-foreground"> for 60 days</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                All features unlocked. No credit card.
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <Separator className="mb-4" />
              <ul className="space-y-2.5">
                {trialFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-sm">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
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
          <Card className="relative transition-all hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4.5 w-4.5 text-blue-500" />
                <CardTitle className="text-base">Pro</CardTitle>
              </div>
              <div className="mt-1">
                <span className="text-3xl font-bold">$20</span>
                <span className="text-sm text-muted-foreground">/user/month</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Unlimited AI. Your permanent second brain.
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <Separator className="mb-4" />
              <ul className="space-y-2.5">
                {proFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-sm">
                    <Check className="h-4 w-4 text-blue-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="pt-2">
              <Button className="w-full" onClick={handleSubscribeTeams}>
                <CreditCard className="h-4 w-4 mr-2" />
                Upgrade to Teams
              </Button>
            </CardFooter>
          </Card>

          {/* Enterprise */}
          <Card className="relative transition-all hover:shadow-md border-purple-500/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-4.5 w-4.5 text-purple-500" />
                <CardTitle className="text-base">Enterprise</CardTitle>
              </div>
              <div className="mt-1">
                <span className="text-3xl font-bold">Custom</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                For organizations that need advanced security and scale.
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <Separator className="mb-4" />
              <ul className="space-y-2.5">
                {enterpriseFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-sm">
                    <Check className="h-4 w-4 text-purple-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="pt-2">
              {enterpriseSubmitted ? (
                <Button variant="outline" className="w-full" disabled>
                  <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
                  We&apos;ll reach out soon
                </Button>
              ) : (
                <Button variant="outline" className="w-full border-purple-500/30 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20" onClick={handleEnterprise} disabled={enterpriseSubmitting}>
                  {enterpriseSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Building2 className="h-4 w-4 mr-2" />}
                  Talk to Sales
                </Button>
              )}
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
