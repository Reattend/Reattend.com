'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { AppSidebar } from '@/components/app/sidebar'
import { AppTopbar } from '@/components/app/topbar'
import { QuickCapture } from '@/components/app/quick-capture'
import { useAppStore } from '@/stores/app-store'
import { cn } from '@/lib/utils'

// Pages that need to fill the full content area with no padding (canvas / chat)
const FULL_BLEED_PATHS = ['/app', '/app/board']

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useAppStore()
  const pathname = usePathname()
  const isFullBleed = FULL_BLEED_PATHS.includes(pathname)

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <QuickCapture />
      <motion.main
        initial={false}
        animate={{ marginLeft: sidebarCollapsed ? 64 : 240 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="flex flex-col min-h-screen"
      >
        <AppTopbar />
        <div className={cn(
          'flex-1 overflow-hidden flex flex-col',
          !isFullBleed && 'p-6 overflow-y-auto'
        )}>
          {children}
        </div>
      </motion.main>
    </div>
  )
}
