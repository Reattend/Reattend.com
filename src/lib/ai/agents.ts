import { z } from 'zod'
import { getLLM } from './llm'
import { PROMPTS } from './prompts'
import { db, schema } from '../db'
import { eq, and, desc, ne } from 'drizzle-orm'
import { cosineSimilarity } from '../utils'

// ─── Schemas ────────────────────────────────────────────
export const triageResultSchema = z.object({
  should_store: z.boolean(),
  record_type: z.enum(['decision', 'insight', 'meeting', 'idea', 'context', 'tasklike', 'note']),
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

    // Store project suggestions
    for (const proj of result.proposed_projects) {
      await db.insert(schema.projectSuggestions).values({
        workspaceId,
        recordId,
        proposedProjectName: proj.name,
        confidence: proj.confidence,
        reason: proj.reason,
      })
    }

    // Assign to explicit project if provided, otherwise fall back to default
    if (targetProjectId) {
      await db.insert(schema.projectRecords).values({
        projectId: targetProjectId,
        recordId,
      })
    } else if (result.proposed_projects.length === 0) {
      const defaultProject = await db.query.projects.findFirst({
        where: and(
          eq(schema.projects.workspaceId, workspaceId),
          eq(schema.projects.isDefault, true),
        ),
      })
      if (defaultProject) {
        await db.insert(schema.projectRecords).values({
          projectId: defaultProject.id,
          recordId,
        })
      }
    }

    // Queue embedding job
    await db.insert(schema.jobQueue).values({
      workspaceId,
      type: 'embed',
      payload: JSON.stringify({ recordId }),
    })

    // Create notifications for all workspace members
    try {
      const members = await db.query.workspaceMembers.findMany({
        where: eq(schema.workspaceMembers.workspaceId, workspaceId),
      })

      // Determine notification type based on record type
      const notifType = result.record_type === 'tasklike' ? 'todo'
        : result.record_type === 'decision' ? 'decision_pending'
        : 'system'

      const notifTitle = result.record_type === 'tasklike'
        ? `New task: ${result.title}`
        : result.record_type === 'decision'
        ? `Decision needed: ${result.title}`
        : `New memory: ${result.title}`

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
    } catch (e) {
      console.error('[Triage] Failed to create notifications:', e)
    }

    // Create notifications for project suggestions
    if (result.proposed_projects.length > 0) {
      try {
        const members = await db.query.workspaceMembers.findMany({
          where: eq(schema.workspaceMembers.workspaceId, workspaceId),
        })
        for (const member of members) {
          await db.insert(schema.inboxNotifications).values({
            workspaceId,
            userId: member.userId,
            type: 'suggestion',
            title: `Project suggestion: ${result.proposed_projects[0].name}`,
            body: result.proposed_projects[0].reason,
            objectType: 'record',
            objectId: recordId,
          })
        }
      } catch (e) {
        console.error('[Triage] Failed to create project suggestion notifications:', e)
      }
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
  }

  return result
}

// ─── Embedding Job ──────────────────────────────────────
export async function runEmbeddingJob(recordId: string, workspaceId: string): Promise<void> {
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

  // Queue linking job
  await db.insert(schema.jobQueue).values({
    workspaceId,
    type: 'link',
    payload: JSON.stringify({ recordId }),
  })
}

// ─── Linking Agent ──────────────────────────────────────
export async function runLinkingAgent(recordId: string, workspaceId: string): Promise<void> {
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

  // Calculate similarities
  const similarities: Array<{ recordId: string; similarity: number }> = []
  for (const emb of allEmbeddings) {
    const vector = JSON.parse(emb.vector) as number[]
    const sim = cosineSimilarity(sourceVector, vector)
    if (sim > 0.3) { // threshold
      similarities.push({ recordId: emb.recordId, similarity: sim })
    }
  }

  // Sort by similarity, take top candidates
  similarities.sort((a, b) => b.similarity - a.similarity)
  const topCandidates = similarities.slice(0, 10)

  if (topCandidates.length === 0) return

  // Fetch candidate records
  const candidateRecords = await Promise.all(
    topCandidates.map(async (c) => {
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

    // Create record links (max 8)
    let linkCount = 0
    for (const link of result.links) {
      if (linkCount >= 8) break

      // Check if link already exists
      const existing = await db.query.recordLinks.findFirst({
        where: and(
          eq(schema.recordLinks.fromRecordId, recordId),
          eq(schema.recordLinks.toRecordId, link.target_id),
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
    // If LLM fails, create links based on similarity alone
    for (const candidate of topCandidates.slice(0, 3)) {
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

// ─── Ask Agent (Q&A) ───────────────────────────────────
export async function runAskAgent(question: string, workspaceId: string): Promise<string> {
  const llm = getLLM()

  // Embed the question
  const questionVector = await llm.embed(question)

  // Get all embeddings in workspace
  const allEmbeddings = await db.query.embeddings.findMany({
    where: eq(schema.embeddings.workspaceId, workspaceId),
  })

  // Find most similar records
  const similarities: Array<{ recordId: string; similarity: number }> = []
  for (const emb of allEmbeddings) {
    const vector = JSON.parse(emb.vector) as number[]
    const sim = cosineSimilarity(questionVector, vector)
    similarities.push({ recordId: emb.recordId, similarity: sim })
  }

  similarities.sort((a, b) => b.similarity - a.similarity)
  const topRecordIds = similarities.slice(0, 5).map(s => s.recordId)

  // Fetch records
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
