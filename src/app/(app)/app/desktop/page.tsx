'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Monitor,
  Apple,
  Download,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  Trash2,
  Loader2,
  Shield,
  Zap,
  Brain,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface ApiToken {
  id: string
  name: string
  prefix: string
  lastUsedAt: string | null
  createdAt: string
}

export default function DesktopAppPage() {
  const [apiTokens, setApiTokens] = useState<ApiToken[]>([])
  const [generatingToken, setGeneratingToken] = useState(false)
  const [newToken, setNewToken] = useState<string | null>(null)
  const [tokenCopied, setTokenCopied] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [tokenName, setTokenName] = useState('Desktop App')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTokens()
  }, [])

  const fetchTokens = async () => {
    try {
      const res = await fetch('/api/tray/tokens')
      const data = await res.json()
      if (data.tokens) setApiTokens(data.tokens)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateToken = async () => {
    setGeneratingToken(true)
    try {
      const res = await fetch('/api/tray/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tokenName || 'Desktop App' }),
      })
      const data = await res.json()
      if (res.ok && data.token) {
        setNewToken(data.token)
        setShowToken(true)
        setApiTokens(prev => [{ id: data.id, name: tokenName || 'Desktop App', prefix: data.prefix, lastUsedAt: null, createdAt: new Date().toISOString() }, ...prev])
        setTokenName('Desktop App')
        toast.success('Token generated — copy it now, it won\'t be shown again')
      } else {
        toast.error(data.error || 'Failed to generate token')
      }
    } catch {
      toast.error('Failed to generate token')
    } finally {
      setGeneratingToken(false)
    }
  }

  const handleRevokeToken = async (tokenId: string) => {
    if (!confirm('Revoke this token? Any device using it will lose access.')) return
    try {
      const res = await fetch('/api/tray/tokens', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tokenId }),
      })
      if (res.ok) {
        setApiTokens(prev => prev.filter(t => t.id !== tokenId))
        toast.success('Token revoked')
      }
    } catch {
      toast.error('Failed to revoke token')
    }
  }

  const handleCopyToken = () => {
    if (newToken) {
      navigator.clipboard.writeText(newToken)
      setTokenCopied(true)
      setTimeout(() => setTokenCopied(false), 2000)
    }
  }

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-4xl"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
          <Monitor className="h-6 w-6 text-[#4F46E5]" />
          Install Reattend
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Install the Chrome extension to passively capture memories and get ambient recall while you work.
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-start gap-3 p-4 rounded-xl border bg-card">
          <div className="h-9 w-9 rounded-lg bg-[#4F46E5]/10 flex items-center justify-center shrink-0">
            <Brain className="h-4.5 w-4.5 text-[#4F46E5]" />
          </div>
          <div>
            <p className="text-sm font-semibold">Passive Capture</p>
            <p className="text-xs text-muted-foreground mt-0.5">Silently captures what you read and write. No manual work needed.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 rounded-xl border bg-card">
          <div className="h-9 w-9 rounded-lg bg-[#4F46E5]/10 flex items-center justify-center shrink-0">
            <Zap className="h-4.5 w-4.5 text-[#4F46E5]" />
          </div>
          <div>
            <p className="text-sm font-semibold">Ambient Recall</p>
            <p className="text-xs text-muted-foreground mt-0.5">Surfaces relevant memories as you work, like Grammarly for your brain.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 rounded-xl border bg-card">
          <div className="h-9 w-9 rounded-lg bg-[#4F46E5]/10 flex items-center justify-center shrink-0">
            <Shield className="h-4.5 w-4.5 text-[#4F46E5]" />
          </div>
          <div>
            <p className="text-sm font-semibold">Private & Smart</p>
            <p className="text-xs text-muted-foreground mt-0.5">Skips sensitive apps. AI filters noise so only meaningful content is saved.</p>
          </div>
        </div>
      </div>

      {/* Download Section */}
      <div className="grid grid-cols-3 gap-4">
        {/* Chrome Extension — primary */}
        <Card className="relative overflow-hidden ring-2 ring-emerald-500/30">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/5 to-transparent rounded-bl-full" />
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" fill="#4285F4"/>
                <circle cx="12" cy="12" r="4" fill="white"/>
                <path d="M12 2a10 10 0 0 1 8.66 5H12V2z" fill="#EA4335"/>
                <path d="M20.66 7A10 10 0 0 1 12 22V12h8.66z" fill="#34A853" opacity="0.9"/>
                <path d="M12 22A10 10 0 0 1 3.34 7H12v15z" fill="#FBBC05" opacity="0.9"/>
              </svg>
              Chrome Extension
            </CardTitle>
            <CardDescription>
              Lightweight browser extension. No install needed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <a href="https://chromewebstore.google.com/detail/laadgmehnfecpdpooegebadmbhdbbjfh" target="_blank" rel="noopener">
              <Button className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-700 hover:to-emerald-600 shadow-[0_2px_8px_rgba(16,185,129,0.25)]">
                <ExternalLink className="h-4 w-4 mr-2" />
                Add to Chrome
              </Button>
            </a>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>v0.1.0</span>
              <Badge variant="secondary" className="text-[10px]">Chrome</Badge>
            </div>
          </CardContent>
        </Card>

        {/* macOS — coming soon */}
        <Card className="relative overflow-hidden opacity-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Apple className="h-5 w-5" />
              macOS
              <Badge variant="secondary" className="text-[10px] ml-auto">Coming Soon</Badge>
            </CardTitle>
            <CardDescription>
              Apple Silicon (M1/M2/M3/M4). Requires macOS 13+.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button disabled className="w-full" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download for Mac
            </Button>
          </CardContent>
        </Card>

        {/* Windows — coming soon */}
        <Card className="relative overflow-hidden opacity-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
              </svg>
              Windows
              <Badge variant="secondary" className="text-[10px] ml-auto">Coming Soon</Badge>
            </CardTitle>
            <CardDescription>
              Windows 10/11 (64-bit).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button disabled className="w-full" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download for Windows
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Chrome Extension Installation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" fill="#4285F4"/>
              <circle cx="12" cy="12" r="4" fill="white"/>
              <path d="M12 2a10 10 0 0 1 8.66 5H12V2z" fill="#EA4335"/>
              <path d="M20.66 7A10 10 0 0 1 12 22V12h8.66z" fill="#34A853" opacity="0.9"/>
              <path d="M12 22A10 10 0 0 1 3.34 7H12v15z" fill="#FBBC05" opacity="0.9"/>
            </svg>
            Chrome Extension Installation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="h-7 w-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">1</div>
                <div className="w-px flex-1 bg-border mt-1" />
              </div>
              <div className="pb-4">
                <p className="text-sm font-semibold">Download and unzip</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click the download button above. Unzip the file to a folder on your computer.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="h-7 w-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">2</div>
                <div className="w-px flex-1 bg-border mt-1" />
              </div>
              <div className="pb-4">
                <p className="text-sm font-semibold">Load in Chrome</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Open <code className="bg-background px-1.5 py-0.5 rounded text-[11px]">chrome://extensions</code>, enable &quot;Developer mode&quot; (top-right toggle), click &quot;Load unpacked&quot;, and select the unzipped folder.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="h-7 w-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">3</div>
              </div>
              <div>
                <p className="text-sm font-semibold">Connect your account</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click the Reattend extension icon, then open Settings. Generate an API token below, paste it in the extension settings, and click Save.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Token Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4" /> API Tokens
          </CardTitle>
          <CardDescription>
            Generate tokens to connect apps and extensions to your account. Each device should have its own token.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Generate token */}
          <div className="flex gap-2">
            <Input
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              placeholder="Token name (e.g. MacBook Pro)"
              className="flex-1"
            />
            <Button onClick={handleGenerateToken} disabled={generatingToken} size="sm">
              {generatingToken ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Key className="h-3.5 w-3.5 mr-1.5" />}
              Generate Token
            </Button>
          </div>

          {/* Show new token */}
          {newToken && (
            <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 space-y-2">
              <p className="text-sm font-semibold text-primary">Your new API token</p>
              <p className="text-xs text-muted-foreground">Copy this token now. It will not be shown again.</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-background border rounded-md px-3 py-2 text-xs font-mono break-all">
                  {showToken ? newToken : newToken.slice(0, 12) + '\u2022'.repeat(40)}
                </code>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowToken(!showToken)}>
                  {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopyToken}>
                  {tokenCopied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                  {tokenCopied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <Button variant="ghost" size="sm" className="text-xs mt-1" onClick={() => setNewToken(null)}>
                Dismiss
              </Button>
            </div>
          )}

          {/* Active tokens list */}
          {apiTokens.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground border rounded-lg border-dashed">
              <Key className="h-5 w-5 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No API tokens yet. Generate one to connect the desktop app.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {apiTokens.map((token) => (
                <div key={token.id} className="flex items-center justify-between py-2.5 px-3 rounded-md border">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Monitor className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{token.name}</p>
                      <p className="text-xs text-muted-foreground">
                        <code className="font-mono">{token.prefix}...</code>
                        {' · '}
                        {token.lastUsedAt ? `Last used ${formatTime(token.lastUsedAt)}` : 'Never used'}
                        {' · Created '}
                        {formatTime(token.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleRevokeToken(token.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
