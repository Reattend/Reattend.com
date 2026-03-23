'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FolderKanban,
  Brain,
  Network,
  LayoutDashboard,
  Users,
  Sparkles,
  CheckCircle2,
  Circle,
  X,
  ArrowRight,
  Rocket,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/stores/app-store'
import Link from 'next/link'

interface OnboardingChecklistProps {
  onComplete: () => void
  onSkip: () => void
}

interface StepStatus {
  hasProject: boolean
  hasMemory: boolean
  hasBoard: boolean
  hasTeam: boolean
}

const STEPS = [
  {
    key: 'hasProject',
    icon: FolderKanban,
    title: 'Create your first project',
    description: 'Organize memories into meaningful groups.',
    href: '/app/projects',
    cta: 'Go to Projects',
  },
  {
    key: 'hasMemory',
    icon: Brain,
    title: 'Add your first memory',
    description: 'Capture a thought, decision, or note via the inbox.',
    href: '/app/inbox',
    cta: 'Go to Inbox',
  },
  {
    key: 'visitedGraph',
    icon: Network,
    title: 'Explore the memory graph',
    description: 'See how your memories connect to each other.',
    href: '/app/board',
    cta: 'Open Board',
  },
  {
    key: 'hasBoard',
    icon: LayoutDashboard,
    title: 'Try the whiteboard',
    description: 'Spatially organize memories on a canvas.',
    href: '/app/board',
    cta: 'Open Board',
  },
  {
    key: 'hasTeam',
    icon: Users,
    title: 'Create or join a team',
    description: 'Collaborate with others on shared memories.',
    href: null, // triggers create team modal
    cta: 'Create Team',
  },
  {
    key: 'visitedAsk',
    icon: Sparkles,
    title: 'Explore Ask AI',
    description: 'Ask questions about your memories using AI.',
    href: null, // triggers ask panel
    cta: 'Try Ask AI',
  },
]

export function OnboardingChecklist({ onComplete, onSkip }: OnboardingChecklistProps) {
  const [stepStatus, setStepStatus] = useState<StepStatus>({ hasProject: false, hasMemory: false, hasBoard: false, hasTeam: false })
  const [loading, setLoading] = useState(true)
  const { setCreateTeamOpen, setAskOpen } = useAppStore()

  useEffect(() => {
    fetchSteps()
  }, [])

  const fetchSteps = async () => {
    try {
      const res = await fetch('/api/user/onboarding')
      const data = await res.json()
      if (data.steps) setStepStatus(data.steps)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const isStepComplete = (key: string): boolean => {
    if (key === 'visitedGraph') return typeof window !== 'undefined' && localStorage.getItem('visited_graph') === '1'
    if (key === 'visitedAsk') return typeof window !== 'undefined' && localStorage.getItem('visited_ask') === '1'
    return (stepStatus as any)[key] ?? false
  }

  const completedCount = STEPS.filter(s => isStepComplete(s.key)).length
  const allDone = completedCount === STEPS.length

  useEffect(() => {
    if (allDone && !loading) {
      fetch('/api/user/onboarding', { method: 'POST' })
      setTimeout(onComplete, 1500)
    }
  }, [allDone, loading, onComplete])

  const handleStepClick = (step: typeof STEPS[0]) => {
    if (step.key === 'hasTeam') {
      setCreateTeamOpen(true)
    } else if (step.key === 'visitedAsk') {
      setAskOpen(true)
      localStorage.setItem('visited_ask', '1')
    }
  }

  if (loading) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl shadow-[0_4px_20px_rgba(79,70,229,0.08)] p-6 relative overflow-hidden"
    >
      {/* Subtle accent gradient */}
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-gradient-to-bl from-[#4F46E5]/5 to-transparent pointer-events-none" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4F46E5]/10">
              <Rocket className="h-4.5 w-4.5 text-[#4F46E5]" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Get started with Reattend</h3>
              <p className="text-xs text-muted-foreground">{completedCount}/{STEPS.length} steps completed</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={onSkip}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Skip
          </Button>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-muted/50 mb-5 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#4F46E5] to-[#818CF8]"
            initial={{ width: 0 }}
            animate={{ width: `${(completedCount / STEPS.length) * 100}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {STEPS.map((step) => {
            const done = isStepComplete(step.key)
            const Icon = step.icon

            return (
              <div
                key={step.key}
                className={`flex items-start gap-3 rounded-xl px-3.5 py-3 transition-colors ${
                  done
                    ? 'bg-emerald-500/5 dark:bg-emerald-500/10'
                    : 'bg-muted/20 hover:bg-muted/40'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {done ? (
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                  ) : (
                    <Circle className="h-4.5 w-4.5 text-muted-foreground/40" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <p className={`text-xs font-medium ${done ? 'line-through text-muted-foreground' : ''}`}>
                      {step.title}
                    </p>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mb-1.5">{step.description}</p>
                  {!done && (
                    step.href ? (
                      <Link
                        href={step.href}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#4F46E5] hover:text-[#4338CA] transition-colors"
                      >
                        {step.cta}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleStepClick(step)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#4F46E5] hover:text-[#4338CA] transition-colors"
                      >
                        {step.cta}
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {allDone && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-4 py-2"
          >
            <p className="text-sm font-medium text-emerald-600">All done! You&apos;re all set.</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
