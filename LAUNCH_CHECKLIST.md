# Reattend — Launch Checklist

> Updated: 2026-03-26
> Rule: Check off only when tested and confirmed working in production.

---

## 1. Account Deletion
- [ ] "Delete my account" button in settings (web app)
- [ ] Deletes: user record, workspaces (if sole owner), workspace members, records, embeddings, sessions, API tokens
- [ ] Confirmation dialog with typed confirmation ("delete my account")
- [ ] Logs out and redirects to marketing site after deletion
- [ ] Required for: Google Cloud OAuth approval, GDPR compliance

---

## 2. Admin Dashboard (`/admin`)
- [ ] Gated to admin user only (hardcoded userId check)
- [ ] **Users tab** — list of all users, plan, signup date, last active
- [ ] **Usage tab** — questions asked (web + ext), memories saved, per-user breakdown
- [ ] **Revenue tab** — active subscribers, plan breakdown (MRR from Paddle webhook data)
- [ ] **Actions** — manually change user plan, delete user
- [ ] **Health** — app uptime, DB record counts, last deploy timestamp

---

## 3. Copy Updates (10/month free tier)
- [ ] Landing page pricing section: "5 AI questions/day" → "10 AI questions/month"
- [ ] `/pricing` page
- [ ] Billing page in dashboard
- [ ] Extension popup / sidebar
- [ ] Any onboarding tooltips or empty states that mention the limit

---

## 4. Chrome Extension Update
### Meeting Audio Recorder
- [ ] Test recording flow end-to-end (record → transcribe → save to Reattend)
- [ ] Test on Chrome (latest stable)
- [ ] Confirm transcript appears correctly in web app as a memory
- [ ] Edge cases: tab closed mid-recording, microphone permission denied

### AI Question Counter (shared with web app)
- [ ] Extension uses same `/api/tray/ask` endpoint (counter is server-side)
- [ ] Usage indicator in extension sidebar: "X/10 questions used this month"
- [ ] Blocked at 10 with upgrade prompt (direct link to billing page)
- [ ] Counter resets on 1st of each month

### Submission
- [ ] Update extension version number in manifest.json
- [ ] Update Chrome Web Store listing description (mention audio recorder)
- [ ] Submit for review (allow 1-3 days for Google review)

---

## 5. Documentation Pages (in web app dashboard)

### Chrome Extension Docs
- [ ] How to install from Chrome Web Store
- [ ] How to connect to your Reattend account
- [ ] How to use Ask in the sidebar
- [ ] How to record and transcribe a meeting
- [ ] Screenshots for each step

### Integration Docs
- [ ] **Slack** — how to install, what commands work, what gets saved
- [ ] **Google Calendar** — how to connect, what events get pulled
- [ ] **Manual import** — paste text, upload file, import from URL
- [ ] **API / Token** — where to find your API token, example curl commands

---

## 6. External Platform Checks (async — happens when it happens)
- [ ] **Google Cloud OAuth** — consent screen verification submitted and approved (required for non-test Google login users)
- [ ] **Google Search Console** — sitemap submitted, coverage checked, no crawl errors
- [ ] **Slack App** — review status, any pending items from Slack team
- [ ] **Paddle** — all 4 price IDs working (Monthly Pro ✅, Annual Pro ✅, Monthly Teams ✅, Annual Teams ✅)

---

## 7. AI Answer Quality Testing
> Two primary use cases: meeting transcripts + integration-sourced memories

### Test Cases to Run
- [ ] Meeting transcript saved → ask "what did we decide in [meeting]?" → exact answer, no hallucination
- [ ] Multiple meetings → ask about specific one → correct one retrieved, not mixed
- [ ] Numbers/IDs in memory → ask for them → quoted exactly, not paraphrased
- [ ] Question not in memory → "I don't see this in your saved memories" — NOT an invented answer
- [ ] Follow-up suggestions appear as pills (not raw text)
- [ ] Sources section collapsed by default, expands on click
- [ ] New chat clears previous conversation state
- [ ] Thread switching loads correct thread content
- [ ] Long answer doesn't get cut off mid-sentence

### Integration Memory Quality
- [ ] Slack message saved → retrievable via Ask
- [ ] Calendar event saved → retrievable via Ask
- [ ] Cross-workspace search works correctly

---

## 8. Pricing Enforcement (last — after all testing complete)
- [ ] Shared question counter in DB (per user, resets monthly)
- [ ] `/api/ask` checks counter before answering, returns 429 + upgrade prompt at limit
- [ ] `/api/tray/ask` (extension) uses same counter
- [ ] Free tier: 10 questions/month hard limit
- [ ] Pro tier: unlimited
- [ ] Teams tier: unlimited per seat
- [ ] Counter visible to user in web app ("X/10 used this month")
- [ ] Upgrade prompt on limit hit (not just an error — direct CTA to billing)
- [ ] Test: hit limit on web → extension also blocked (shared counter working)
- [ ] Test: upgrade to Pro → limit removed immediately

---

## Phase 2 — Post-Launch Integrations (note now, build later)

### Meeting Platform Integrations (direct pipelines)
| Platform | Method | Priority |
|---|---|---|
| Fireflies.ai | GraphQL API + webhooks — auto-ingest when meeting ends | High |
| Otter.ai | REST API + webhooks | High |
| Zoom | Zoom API — recordings + auto-transcripts | High |
| Google Meet | Google Workspace API (existing OAuth scope) | Medium |
| Read.ai | API (less documented) | Medium |
| Microsoft Teams / Copilot | Microsoft Graph API | Low (enterprise) |
| Fathom | No public API yet — Zapier only | Later |

### Other
- [ ] Onboarding email on signup (plain text, what you can do, how to get started)
- [ ] Billing confirmation emails (Paddle handles receipts, but a personal note helps)
- [ ] Mobile web — test on iOS Safari and Android Chrome

---

## Launch Sign-off
- [ ] All items 1–7 checked
- [ ] Admin dashboard live and showing real data
- [ ] No console errors on web app in production
- [ ] Extension approved on Chrome Web Store
- [ ] Pricing enforcement (item 8) live
- [ ] **Ship it.**
