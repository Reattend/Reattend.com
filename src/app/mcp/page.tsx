import { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'

export const metadata: Metadata = {
  title: 'MCP Server - Persistent Memory for Claude, Cursor, and AI Tools',
  description: 'Connect Reattend to Claude Desktop, Cursor, and any MCP-compatible AI tool. Your meetings, notes, and decisions become searchable memory in every AI conversation.',
  alternates: { canonical: 'https://reattend.com/mcp' },
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-[#0d0d14] border border-white/10 rounded-xl p-5 overflow-x-auto text-sm text-gray-300 font-mono leading-relaxed">
      <code>{children}</code>
    </pre>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-5">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold mt-0.5">
        {n}
      </div>
      <div className="flex-1">
        <h3 className="text-white font-semibold text-base mb-2">{title}</h3>
        <div className="text-gray-400 text-sm leading-relaxed space-y-3">{children}</div>
      </div>
    </div>
  )
}

export default function McpPage() {
  return (
    <div className="min-h-screen bg-[#07070C] text-white">
      <Navbar />

      {/* Hero */}
      <section className="max-w-[860px] mx-auto px-5 pt-28 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-950/60 border border-indigo-500/30 rounded-full px-4 py-1.5 text-xs text-indigo-300 font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
          Model Context Protocol
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight mb-5">
          Persistent memory for<br />
          <span className="text-indigo-400">Claude, Cursor, and every AI tool</span>
        </h1>
        <p className="text-lg text-gray-400 max-w-[600px] mx-auto leading-relaxed mb-8">
          Every AI conversation starts blank. Reattend's MCP server connects your captured meetings,
          notes, Slack threads, and decisions to any AI assistant that supports the Model Context Protocol.
          One setup. Every tool. Permanent memory.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/app/settings"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            Get your API token
          </Link>
          <a
            href="https://github.com/Reattend/reattend-mcp"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition-colors text-sm flex items-center gap-2"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            View on GitHub
          </a>
        </div>
      </section>

      {/* What it does */}
      <section className="max-w-[860px] mx-auto px-5 py-16 border-t border-white/5">
        <h2 className="text-2xl font-bold mb-3">What it does</h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-10 max-w-[600px]">
          Reattend captures context from your tools automatically via the Chrome extension. The MCP server
          makes that memory available inside AI assistants as tools they can call mid-conversation, without
          you asking.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              title: 'Search your memory',
              desc: 'Before answering a question, Claude automatically searches your captures for relevant context. No copy-pasting, no re-explaining.',
            },
            {
              title: 'Answer from real history',
              desc: '"What did we decide about the auth service?" gets answered from your actual meeting notes, not a guess.',
            },
            {
              title: 'Save mid-conversation',
              desc: '"Remember we\'re using Zustand in this project" gets saved permanently and recalled in future sessions.',
            },
            {
              title: 'Works across all your AI tools',
              desc: 'One memory store, connected to Claude Desktop, Cursor, Windsurf, VS Code, and any other MCP-compatible tool.',
            },
          ].map((item) => (
            <div key={item.title} className="bg-white/[0.03] border border-white/8 rounded-xl p-5">
              <h3 className="text-white font-semibold text-sm mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tools */}
      <section className="max-w-[860px] mx-auto px-5 py-16 border-t border-white/5">
        <h2 className="text-2xl font-bold mb-2">Tools exposed</h2>
        <p className="text-gray-400 text-sm mb-8">
          The MCP server gives your AI assistant four tools. It decides when to use them.
        </p>
        <div className="space-y-3">
          {[
            {
              name: 'search_memories',
              desc: 'Semantic and keyword search across everything captured. Used proactively before answering questions that may have past context.',
            },
            {
              name: 'ask_memory',
              desc: 'AI-synthesised answer from your full memory. Best for questions that span multiple captures or time periods.',
            },
            {
              name: 'save_memory',
              desc: 'Save something from inside the AI conversation. Decisions, preferences, notes. Stored permanently.',
            },
            {
              name: 'recent_memories',
              desc: 'Your most recently captured memories. Use it for "what have I been working on?" or end-of-day recaps.',
            },
          ].map((tool) => (
            <div key={tool.name} className="flex gap-4 bg-white/[0.03] border border-white/8 rounded-xl p-5">
              <code className="text-indigo-400 text-sm font-mono flex-shrink-0 pt-0.5">{tool.name}</code>
              <p className="text-gray-400 text-sm leading-relaxed">{tool.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Setup */}
      <section className="max-w-[860px] mx-auto px-5 py-16 border-t border-white/5">
        <h2 className="text-2xl font-bold mb-2">Setup in 2 minutes</h2>
        <p className="text-gray-400 text-sm mb-10">No install required. Uses npx so it always runs the latest version.</p>

        <div className="space-y-10">
          <Step n={1} title="Get your API token">
            <p>
              Go to <Link href="/app/settings" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">Settings → API Tokens</Link> and create a token.
              It starts with <code className="text-indigo-300 bg-indigo-950/40 px-1.5 py-0.5 rounded text-xs">rat_</code>.
            </p>
          </Step>

          <Step n={2} title="Add to Claude Desktop">
            <p>Edit the Claude Desktop config file:</p>
            <p className="text-gray-500 text-xs">
              Mac: <code className="text-gray-400">~/Library/Application Support/Claude/claude_desktop_config.json</code><br />
              Windows: <code className="text-gray-400">%APPDATA%\Claude\claude_desktop_config.json</code>
            </p>
            <CodeBlock>{`{
  "mcpServers": {
    "reattend": {
      "command": "npx",
      "args": ["-y", "@reattend/mcp", "--token", "rat_your_token_here"]
    }
  }
}`}</CodeBlock>
            <p>Restart Claude Desktop. Done.</p>
          </Step>

          <Step n={3} title="Add to Cursor">
            <p>Edit <code className="text-gray-400 bg-white/5 px-1.5 py-0.5 rounded text-xs">.cursor/mcp.json</code> in your project, or go to Cursor Settings → MCP:</p>
            <CodeBlock>{`{
  "mcpServers": {
    "reattend": {
      "command": "npx",
      "args": ["-y", "@reattend/mcp", "--token", "rat_your_token_here"]
    }
  }
}`}</CodeBlock>
          </Step>

          <Step n={4} title="Add to VS Code (Copilot)">
            <p>Edit <code className="text-gray-400 bg-white/5 px-1.5 py-0.5 rounded text-xs">.vscode/mcp.json</code> in your workspace:</p>
            <CodeBlock>{`{
  "servers": {
    "reattend": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@reattend/mcp", "--token", "rat_your_token_here"]
    }
  }
}`}</CodeBlock>
          </Step>

          <Step n={5} title="Using an environment variable">
            <p>If you'd rather not put the token inline:</p>
            <CodeBlock>{`{
  "mcpServers": {
    "reattend": {
      "command": "npx",
      "args": ["-y", "@reattend/mcp"],
      "env": { "REATTEND_TOKEN": "rat_your_token_here" }
    }
  }
}`}</CodeBlock>
          </Step>
        </div>
      </section>

      {/* What gets captured */}
      <section className="max-w-[860px] mx-auto px-5 py-16 border-t border-white/5">
        <h2 className="text-2xl font-bold mb-2">What feeds your memory</h2>
        <p className="text-gray-400 text-sm mb-8">
          Install the <Link href="/" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">Reattend Chrome extension</Link> to
          start capturing automatically. Everything flows into the same memory this MCP server reads from.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { source: 'Google Meet', detail: 'Full transcription' },
            { source: 'Zoom', detail: 'Full transcription' },
            { source: 'Microsoft Teams', detail: 'Full transcription' },
            { source: 'Slack', detail: 'Messages and threads' },
            { source: 'Gmail', detail: 'Emails you read' },
            { source: 'Notion', detail: 'Pages you open' },
            { source: 'Linear', detail: 'Issues and updates' },
            { source: 'Jira', detail: 'Tickets and boards' },
            { source: 'Google Docs', detail: 'Documents you edit' },
            { source: 'Manual save', detail: 'Highlight anything' },
          ].map((item) => (
            <div key={item.source} className="bg-white/[0.03] border border-white/8 rounded-lg px-4 py-3">
              <div className="text-white text-sm font-medium">{item.source}</div>
              <div className="text-gray-500 text-xs mt-0.5">{item.detail}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Examples */}
      <section className="max-w-[860px] mx-auto px-5 py-16 border-t border-white/5">
        <h2 className="text-2xl font-bold mb-8">Real examples</h2>
        <div className="space-y-5">
          {[
            {
              prompt: 'I\'m about to jump on a call with Acme Corp. Give me a briefing.',
              response: 'Last call was Feb 12. They raised concerns about pricing. Sarah is the decision maker. You agreed to a pilot before end of Q1.',
              note: 'Claude called search_memories("Acme Corp") automatically',
            },
            {
              prompt: 'What did we decide about the auth service stack?',
              response: 'You decided on Postgres with Drizzle ORM, JWT tokens stored in httpOnly cookies. Decision was made in the Feb 20 architecture meeting.',
              note: 'Answered from your actual meeting notes, not a guess',
            },
            {
              prompt: 'Remember: no Redux in this project, we\'re using Zustand.',
              response: 'Saved to memory. I\'ll keep that in mind for this and future sessions.',
              note: 'Stored permanently via save_memory',
            },
            {
              prompt: 'What have I been working on this week?',
              response: 'Based on your recent captures: auth service refactor, Acme Corp pilot prep, three team standups, and a design review for the new onboarding flow.',
              note: 'Claude called recent_memories(20) and summarised',
            },
          ].map((ex, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/8 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5">
                <div className="text-xs text-gray-500 mb-1">You asked</div>
                <p className="text-white text-sm">{ex.prompt}</p>
              </div>
              <div className="px-5 py-4">
                <div className="text-xs text-gray-500 mb-1">Claude answered</div>
                <p className="text-gray-300 text-sm leading-relaxed">{ex.response}</p>
                <p className="text-indigo-500 text-xs mt-2">{ex.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* API */}
      <section className="max-w-[860px] mx-auto px-5 py-16 border-t border-white/5">
        <h2 className="text-2xl font-bold mb-2">Building on the API</h2>
        <p className="text-gray-400 text-sm mb-6">
          The same token works directly with the REST API. Use it in agents, automations, or any custom tool.
        </p>
        <CodeBlock>{`# Search memories
curl https://reattend.com/api/tray/search?q=acme+pricing \\
  -H "Authorization: Bearer rat_xxx"

# Save to memory
curl -X POST https://reattend.com/api/tray/capture \\
  -H "Authorization: Bearer rat_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{"text": "Decided on Postgres for the new service", "source": "agent"}'

# Ask a question (streams response)
curl -X POST https://reattend.com/api/tray/ask \\
  -H "Authorization: Bearer rat_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{"question": "What database decisions have we made?"}'

# Recent memories
curl https://reattend.com/api/tray/recent?limit=10 \\
  -H "Authorization: Bearer rat_xxx"`}</CodeBlock>
      </section>

      {/* CTA */}
      <section className="max-w-[860px] mx-auto px-5 py-20 border-t border-white/5 text-center">
        <h2 className="text-3xl font-bold mb-4">Start in 2 minutes</h2>
        <p className="text-gray-400 text-sm mb-8 max-w-[440px] mx-auto">
          Sign up, install the Chrome extension, get your token, and paste 5 lines into your Claude Desktop config.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/register"
            className="px-7 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            Create free account
          </Link>
          <a
            href="https://github.com/Reattend/reattend-mcp"
            target="_blank"
            rel="noopener noreferrer"
            className="px-7 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            View on GitHub
          </a>
        </div>
        <p className="text-xs text-gray-600 mt-5">Free plan available. No credit card required.</p>
      </section>

      <Footer />
    </div>
  )
}
