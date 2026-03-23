import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { verifyWebhookSignature } from '@/lib/paddle'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('paddle-signature')

    // Verify webhook signature
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error('[Paddle Webhook] Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const body = JSON.parse(rawBody)
    const eventType = body.event_type
    const data = body.data

    console.log('[Paddle Webhook]', eventType, data?.id || '')

    switch (eventType) {
      case 'subscription.created':
      case 'subscription.updated': {
        await handleSubscriptionUpdate(data)
        break
      }

      case 'subscription.canceled': {
        await handleSubscriptionCanceled(data)
        break
      }

      case 'subscription.past_due': {
        await handleSubscriptionPastDue(data)
        break
      }

      case 'transaction.completed': {
        console.log('[Paddle] Transaction completed:', data?.id)
        break
      }

      default: {
        console.log('[Paddle Webhook] Unhandled event:', eventType)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('[Paddle Webhook Error]', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleSubscriptionUpdate(data: any) {
  const paddleSubId = data.id // sub_...
  const paddleCustomerId = data.customer_id // ctm_...
  const status = data.status // active, trialing, past_due, canceled, paused
  const customData = data.custom_data || {}
  const userId = customData.userId

  if (!userId) {
    console.error('[Paddle] No userId in custom_data for subscription:', paddleSubId)
    return
  }

  // Map Paddle status to our status
  type SubStatus = 'active' | 'trialing' | 'canceled' | 'past_due' | 'expired'
  let ourStatus: SubStatus = 'active'
  let planKey = 'smart'

  if (status === 'active') {
    ourStatus = 'active'
  } else if (status === 'trialing') {
    ourStatus = 'trialing'
  } else if (status === 'past_due') {
    ourStatus = 'past_due'
  } else if (status === 'canceled') {
    ourStatus = 'canceled'
    planKey = 'normal'
  } else if (status === 'paused') {
    ourStatus = 'canceled'
    planKey = 'normal'
  }

  // Get next billing date
  const renewsAt = data.next_billed_at || data.current_billing_period?.ends_at || null

  const existingSub = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.userId, userId),
  })

  if (existingSub) {
    await db.update(schema.subscriptions)
      .set({
        planKey,
        status: ourStatus,
        paddleSubscriptionId: paddleSubId,
        paddleCustomerId,
        renewsAt,
        trialEndsAt: status === 'trialing' ? data.current_billing_period?.ends_at : existingSub.trialEndsAt,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.subscriptions.userId, userId))
  } else {
    await db.insert(schema.subscriptions).values({
      userId,
      planKey,
      status: ourStatus,
      paddleSubscriptionId: paddleSubId,
      paddleCustomerId,
      renewsAt,
    })
  }

  console.log(`[Paddle] Subscription ${status} for user ${userId} (${paddleSubId})`)
}

async function handleSubscriptionCanceled(data: any) {
  const paddleSubId = data.id
  const customData = data.custom_data || {}
  const userId = customData.userId

  if (!userId) {
    // Try to find by paddle subscription ID
    const sub = await db.query.subscriptions.findFirst({
      where: eq(schema.subscriptions.paddleSubscriptionId, paddleSubId),
    })
    if (sub) {
      await db.update(schema.subscriptions)
        .set({
          planKey: 'normal',
          status: 'canceled',
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.subscriptions.id, sub.id))
      console.log(`[Paddle] Subscription canceled for user ${sub.userId} (found by sub ID)`)
    }
    return
  }

  await db.update(schema.subscriptions)
    .set({
      planKey: 'normal',
      status: 'canceled',
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.subscriptions.userId, userId))

  console.log(`[Paddle] Subscription canceled for user ${userId}`)
}

async function handleSubscriptionPastDue(data: any) {
  const paddleSubId = data.id
  const customData = data.custom_data || {}
  const userId = customData.userId

  if (!userId) {
    const sub = await db.query.subscriptions.findFirst({
      where: eq(schema.subscriptions.paddleSubscriptionId, paddleSubId),
    })
    if (sub) {
      await db.update(schema.subscriptions)
        .set({ status: 'past_due', updatedAt: new Date().toISOString() })
        .where(eq(schema.subscriptions.id, sub.id))
    }
    return
  }

  await db.update(schema.subscriptions)
    .set({ status: 'past_due', updatedAt: new Date().toISOString() })
    .where(eq(schema.subscriptions.userId, userId))

  console.log(`[Paddle] Subscription past_due for user ${userId}`)
}
