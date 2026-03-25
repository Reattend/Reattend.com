import { z } from 'zod'
import { getLLM } from './llm'
import { PROMPTS } from './prompts'
import { db, schema } from '../db'
import { eq, and, ne, or, like } from 'drizzle-orm'
import { cosineSimilarity } from '../utils'

// ─── Schemas ────────────────────────────────────────────
export const triageResultSchema = z.object({
  should_store: z.boolean(),
  record_type: z.enum(['decision', 'insight', 'meeting', 'idea', 'context', 'tasklike', 'note', 'event', 'transcript'])
    .transform(t => (t === 'event' || t === 'transcript') ? 'meeting' : t) as z.ZodType<'decision' | 'insight' | 'meeting' | 'idea' | 'context' | 'tasklike' | 'note'>,
  title: z.string(),
  summary: z.string(),
  tags: z.array(z.string()),
  entities: z.array(z.object({
    kind: z.enum(['person', 'org', 'topic', 'product', 'project', 'custom']),
    name: z.string(),
  })),
  dates: z.array(z.object({
    date: z.string(),
    label: z.string(),
    type: z.string(),
  })),
  confidence: z.number().min(0).max(1),
  proposed_projects: z.array(z.object({
    name: z.string(),
    confidence: z.number(),
    reason: z.string(),
  })),
  suggested_links: z.array(z.object({
    query_text: z.string(),
    reason: z.string(),
  })),
  why_kept_or_dropped: z.string(),
})

export type TriageResult = z.infer<typeof triageResultSchema>

const linkingResultSchema = z.object({
  links: z.array(z.object({
    target_id: z.string(),
    kind: z.enum(['same_topic', 'depends_on', 'contradicts', 'continuation_of', 'same_people', 'causes', 'temporal']),
    weight: z.number().min(0).max(1),
    explanation: z.string(),
  })),
})

// ─── Triage Agent ───────────────────────────────────────
export async function runTriageAgent(rawItemId: string, workspaceId: string, targetProjectId?: string): Promise<TriageResult> {
  const llm = getLLM()

  // Fetch raw item
  const rawItem = await db.query.rawItems.findFirst({
    where: eq(schema.rawItems.id, rawItemId),
  })
  if (!rawItem) throw new Error(`Raw item ${rawItemId} not found`)

  const prompt = PROMPTS.triage(rawItem.text, rawItem.metadata || undefined)
  const result = await llm.generateJSON(prompt, triageResultSchema)

  // Update raw item with triage result
  await db.update(schema.rawItems)
    .set({
      status: result.should_store ? 'triaged' : 'ignored',
      triageResult: JSON.stringify(result),
    })
    .where(eq(schema.rawItems.id, rawItemId))

  // Determine if this came from an integration (has a source) vs manual input
  const fromIntegration = !!rawItem.sourceId
  // Auto-accept: integration source + high confidence → goes straight to memories, no inbox stop
  const autoAccept = fromIntegration && result.confidence >= 0.75

  // Resolve source label from the source kind (gmail, google-calendar, etc.)
  let recordSource: string | undefined
  if (rawItem.sourceId) {
    const src = await db.query.sources.findFirst({ where: eq(schema.sources.id, rawItem.sourceId) })
    if (src) {
      recordSource = src.kind === 'email' ? 'gmail' : src.kind === 'calendar' ? 'google-calendar' : src.kind === 'chat' ? src.label.toLowerCase() : src.kind
    }
  }

  if (result.should_store) {
    // Create record
    const recordId = crypto.randomUUID()
    await db.insert(schema.records).values({
      id: recordId,
      workspaceId,
      rawItemId,
      type: result.record_type,
      title: result.title,
      summary: result.summary,
      content: rawItem.text,
      confidence: result.confidence,
      tags: JSON.stringify(result.tags),
      triageStatus: autoAccept ? 'auto_accepted' : 'needs_review',
      source: recordSource,
      createdBy: 'agent',
    })

    // Upsert entities
    for (const entity of result.entities) {
      const normalized = entity.name.toLowerCase().trim()
      let existingEntity = await db.query.entities.findFirst({
        where: and(
          eq(schema.entities.workspaceId, workspaceId),
          eq(schema.entities.normalized, normalized),
        ),
      })

      if (!existingEntity) {
        const entityId = crypto.randomUUID()
        await db.insert(schema.entities).values({
          id: entityId,
          workspaceId,
          kind: entity.kind,
          name: entity.name,
          normalized,
        })
        existingEntity = { id: entityId } as any
      }

      await db.insert(schema.recordEntities).values({
        recordId,
        entityId: existingEntity!.id,
      })
    }

    // ── Save extracted future dates to record_dates ──────────────
    const today = new Date().toISOString().split('T')[0]
    const validDateTypes = ['deadline', 'follow_up', 'event', 'due_date', 'launch', 'reminder']
    for (const d of result.dates) {
      if (!d.date || d.date < today) continue // skip past dates and invalid
      const dateType = validDateTypes.includes(d.type) ? d.type : 'reminder'
      try {
        await db.insert(schema.recordDates).values({
          workspaceId,
          recordId,
          date: d.date,
          label: d.label,
          type: dateType as any,
        })
      } catch { /* ignore duplicate inserts */ }
    }

    // ── Project assignment ───────────────────────────────────────
    // Only assign to an explicitly requested project (e.g. user adding a note
    // to a project manually). Triage never auto-creates or auto-assigns projects
    // — memories land in the Memories list and users organise them into projects.
    if (targetProjectId) {
      await db.insert(schema.projectRecords).values({
        projectId: targetProjectId,
        recordId,
      })
    }

    // Queue embedding job (pass suggested_links for use in linking stage)
    await db.insert(schema.jobQueue).values({
      workspaceId,
      type: 'embed',
      payload: JSON.stringify({
        recordId,
        suggestedLinks: result.suggested_links,
      }),
    })

    // Create notifications for all workspace members
    try {
      const members = await db.query.workspaceMembers.findMany({
        where: eq(schema.workspaceMembers.workspaceId, workspaceId),
      })

      // Auto-accepted items go straight to memories — no inbox notification needed
      if (!autoAccept) {
        const notifType = result.record_type === 'tasklike' ? 'todo'
          : result.record_type === 'decision' ? 'decision_pending'
          : 'needs_review'

        const notifTitle = result.record_type === 'tasklike'
          ? `Task: ${result.title}`
          : result.record_type === 'decision'
          ? `Decision: ${result.title}`
          : result.title

        for (const member of members) {
          await db.insert(schema.inboxNotifications).values({
            workspaceId,
            userId: member.userId,
            type: notifType,
            title: notifTitle,
            body: result.summary.length > 120 ? result.summary.slice(0, 117) + '...' : result.summary,
            objectType: 'record',
            objectId: recordId,
          })
        }
      }

      // Create reminder notifications for each future date
      const futureDates = result.dates.filter(d => d.date && d.date >= today)
      for (const d of futureDates) {
        const dateType = validDateTypes.includes(d.type) ? d.type : 'reminder'
        // Schedule the notification to appear on that date via snoozedUntil
        const notifDate = new Date(d.date + 'T09:00:00.000Z').toISOString()
        for (const member of members) {
          await db.insert(schema.inboxNotifications).values({
            workspaceId,
            userId: member.userId,
            type: 'reminder',
            title: `${dateType === 'deadline' ? '⚑ Deadline' : dateType === 'follow_up' ? '↩ Follow-up' : '◷ Upcoming'}: ${d.label}`,
            body: `From: ${result.title}`,
            objectType: 'record',
            objectId: recordId,
            snoozedUntil: notifDate,
          })
        }
      }
    } catch (e) {
      console.error('[Triage] Failed to create notifications:', e)
    }

    // Log activity
    await db.insert(schema.activityLog).values({
      workspaceId,
      actor: 'agent',
      action: 'triaged',
      objectType: 'raw_item',
      objectId: rawItemId,
      meta: JSON.stringify({ recordId, result: result.why_kept_or_dropped }),
    })
  } else if (fromIntegration) {
    // AI rejected this integration item — create rejected notification so user can rescue if needed
    try {
      const members = await db.query.workspaceMembers.findMany({
        where: eq(schema.workspaceMembers.workspaceId, workspaceId),
      })
      for (const member of members) {
        await db.insert(schema.inboxNotifications).values({
          workspaceId,
          userId: member.userId,
          type: 'rejected',
          title: result.title || rawItem.text.slice(0, 80),
          body: result.why_kept_or_dropped,
          objectType: 'raw_item',
          objectId: rawItemId,
        })
      }
    } catch (e) {
      console.error('[Triage] Failed to create rejected notification:', e)
    }
  }

  return result
}

// ─── Embedding Job ──────────────────────────────────────
export async function runEmbeddingJob(recordId: string, workspaceId: string, suggestedLinks?: Array<{ query_text: string; reason: string }>): Promise<void> {
  const llm = getLLM()

  const record = await db.query.records.findFirst({
    where: eq(schema.records.id, recordId),
  })
  if (!record) throw new Error(`Record ${recordId} not found`)

  const textToEmbed = `${record.title}. ${record.summary || ''}. ${record.content || ''}`
  const vector = await llm.embed(textToEmbed)

  // Upsert embedding
  await db.insert(schema.embeddings)
    .values({
      recordId,
      workspaceId,
      vector: JSON.stringify(vector),
      model: process.env.GROQ_API_KEY ? 'bge-base-en-v1.5' : (process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text'),
    })
    .onConflictDoUpdate({
      target: schema.embeddings.recordId,
      set: {
        vector: JSON.stringify(vector),
        model: process.env.GROQ_API_KEY ? 'bge-base-en-v1.5' : (process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text'),
        createdAt: new Date().toISOString(),
      },
    })

  // Queue linking job with suggested_links as seeds
  await db.insert(schema.jobQueue).values({
    workspaceId,
    type: 'link',
    payload: JSON.stringify({ recordId, suggestedLinks: suggestedLinks || [] }),
  })
}

// ─── Linking Agent ──────────────────────────────────────
export async function runLinkingAgent(recordId: string, workspaceId: string, suggestedLinks?: Array<{ query_text: string; reason: string }>): Promise<void> {
  const record = await db.query.records.findFirst({
    where: eq(schema.records.id, recordId),
  })
  if (!record) throw new Error(`Record ${recordId} not found`)

  const sourceEmbedding = await db.query.embeddings.findFirst({
    where: eq(schema.embeddings.recordId, recordId),
  })
  if (!sourceEmbedding) return

  const sourceVector = JSON.parse(sourceEmbedding.vector) as number[]

  // Get all other embeddings in workspace
  const allEmbeddings = await db.query.embeddings.findMany({
    where: and(
      eq(schema.embeddings.workspaceId, workspaceId),
      ne(schema.embeddings.recordId, recordId),
    ),
  })

  // Calculate semantic similarities
  const similarities: Array<{ recordId: string; similarity: number }> = []
  for (const emb of allEmbeddings) {
    const vector = JSON.parse(emb.vector) as number[]
    const sim = cosineSimilarity(sourceVector, vector)
    if (sim > 0.4) { // raised threshold to reduce noise
      similarities.push({ recordId: emb.recordId, similarity: sim })
    }
  }
  similarities.sort((a, b) => b.similarity - a.similarity)
  const topSemantic = similarities.slice(0, 8)

  // ── Keyword-seed candidates from suggested_links ─────────────
  const seededIds = new Set<string>()
  if (suggestedLinks && suggestedLinks.length > 0) {
    for (const suggestion of suggestedLinks) {
      const keywords = suggestion.query_text
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 3)
        .slice(0, 3)

      if (keywords.length === 0) continue

      const conditions = keywords.flatMap(kw => [
        like(schema.records.title, `%${kw}%`),
        like(schema.records.summary, `%${kw}%`),
      ])

      const keywordMatches = await db.query.records.findMany({
        where: and(
          eq(schema.records.workspaceId, workspaceId),
          ne(schema.records.id, recordId),
          or(...conditions),
        ),
        limit: 3,
      })

      for (const r of keywordMatches) seededIds.add(r.id)
    }
  }

  // Merge: seeded candidates get a high synthetic similarity so they rank near the top
  const seededCandidates = Array.from(seededIds)
    .filter(id => !topSemantic.some(s => s.recordId === id))
    .map(id => ({ recordId: id, similarity: 0.55 })) // treat as medium-high confidence

  const allCandidates = [...topSemantic, ...seededCandidates].slice(0, 12)
  if (allCandidates.length === 0) return

  // Fetch candidate records
  const candidateRecords = await Promise.all(
    allCandidates.map(async (c) => {
      const rec = await db.query.records.findFirst({
        where: eq(schema.records.id, c.recordId),
      })
      return rec ? { id: rec.id, title: rec.title, summary: rec.summary || '' } : null
    })
  )
  const validCandidates = candidateRecords.filter(Boolean) as Array<{ id: string; title: string; summary: string }>

  const llm = getLLM()
  const prompt = PROMPTS.linking(record.title, record.summary || '', validCandidates)

  try {
    const result = await llm.generateJSON(prompt, linkingResultSchema)

    let linkCount = 0
    for (const link of result.links) {
      if (linkCount >= 8) break

      const existing = await db.query.recordLinks.findFirst({
        where: or(
          and(
            eq(schema.recordLinks.fromRecordId, recordId),
            eq(schema.recordLinks.toRecordId, link.target_id),
          ),
          and(
            eq(schema.recordLinks.fromRecordId, link.target_id),
            eq(schema.recordLinks.toRecordId, recordId),
          ),
        ),
      })

      if (!existing) {
        await db.insert(schema.recordLinks).values({
          workspaceId,
          fromRecordId: recordId,
          toRecordId: link.target_id,
          kind: link.kind,
          weight: link.weight,
          explanation: link.explanation,
          createdBy: 'agent',
        })
        linkCount++
      }
    }
  } catch (e) {
    // Fallback: only link if similarity is strong (raised threshold)
    for (const candidate of topSemantic.slice(0, 3).filter(c => c.similarity > 0.6)) {
      const existing = await db.query.recordLinks.findFirst({
        where: or(
          and(eq(schema.recordLinks.fromRecordId, recordId), eq(schema.recordLinks.toRecordId, candidate.recordId)),
          and(eq(schema.recordLinks.fromRecordId, candidate.recordId), eq(schema.recordLinks.toRecordId, recordId)),
        ),
      })
      if (!existing) {
        await db.insert(schema.recordLinks).values({
          workspaceId,
          fromRecordId: recordId,
          toRecordId: candidate.recordId,
          kind: 'same_topic',
          weight: candidate.similarity,
          explanation: `Semantic similarity: ${(candidate.similarity * 100).toFixed(0)}%`,
          createdBy: 'agent',
        })
      }
    }
  }
}

// ─── Ask Agent (Q&A) ───────────────────────────────────
export async function runAskAgent(question: string, workspaceId: string): Promise<string> {
  const llm = getLLM()

  const questionVector = await llm.embed(question)

  const allEmbeddings = await db.query.embeddings.findMany({
    where: eq(schema.embeddings.workspaceId, workspaceId),
  })

  const similarities: Array<{ recordId: string; similarity: number }> = []
  for (const emb of allEmbeddings) {
    const vector = JSON.parse(emb.vector) as number[]
    const sim = cosineSimilarity(questionVector, vector)
    similarities.push({ recordId: emb.recordId, similarity: sim })
  }

  similarities.sort((a, b) => b.similarity - a.similarity)
  const topRecordIds = similarities.slice(0, 5).map(s => s.recordId)

  const contextRecords = await Promise.all(
    topRecordIds.map(async (id) => {
      const rec = await db.query.records.findFirst({
        where: eq(schema.records.id, id),
      })
      return rec
    })
  )

  const validRecords = contextRecords.filter(Boolean).map(r => ({
    title: r!.title,
    summary: r!.summary || '',
    content: r!.content || undefined,
    type: r!.type,
  }))

  const prompt = PROMPTS.ask(question, validRecords)
  const answer = await llm.generateText(prompt)

  return answer
}
