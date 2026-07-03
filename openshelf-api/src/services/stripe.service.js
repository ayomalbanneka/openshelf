const Stripe = require('stripe')
const prisma  = require('../config/prisma')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const PRICE_IDS = {
  SUPPORTER: process.env.STRIPE_SUPPORTER_PRICE_ID,
  PATRON:    process.env.STRIPE_PATRON_PRICE_ID,
}

// ── Checkout ──────────────────────────────────────────────────────────────────

async function createCheckoutSession(user, tier) {
  if (!PRICE_IDS[tier]) {
    throw new Error(`Unknown or unconfigured tier: ${tier}`)
  }

  let customerId
  const existing = await prisma.subscription.findUnique({
    where:  { userId: user.id },
    select: { stripeCustomerId: true },
  })
  if (existing?.stripeCustomerId) {
    customerId = existing.stripeCustomerId
  } else {
    const customer = await stripe.customers.create({
      email:    user.email,
      name:     user.name,
      metadata: { userId: user.id },
    })
    customerId = customer.id
  }

  const session = await stripe.checkout.sessions.create({
    customer:   customerId,
    mode:       'subscription',
    line_items: [{ price: PRICE_IDS[tier], quantity: 1 }],
    success_url: `${process.env.CLIENT_URL}/settings?checkout=success`,
    cancel_url:  `${process.env.CLIENT_URL}/support?checkout=canceled`,
    metadata: { userId: user.id, tier },
    subscription_data: {
      metadata: { userId: user.id, tier },
    },
    expand: ['subscription'],
  })

  return { url: session.url }
}

// ── Billing portal ────────────────────────────────────────────────────────────

async function createPortalSession(user) {
  const subscription = await prisma.subscription.findUnique({
    where:  { userId: user.id },
    select: { stripeCustomerId: true },
  })

  if (!subscription?.stripeCustomerId) {
    throw new Error('No active subscription found')
  }

  const session = await stripe.billingPortal.sessions.create({
    customer:   subscription.stripeCustomerId,
    return_url: `${process.env.CLIENT_URL}/settings?portal=return`,
  })

  return { url: session.url }
}

// ── Webhook ───────────────────────────────────────────────────────────────────

function constructWebhookEvent(rawBody, signature) {
  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET,
  )
}

async function handleWebhookEvent(event) {
  switch (event.type) {

    case 'checkout.session.completed': {
      const session = event.data.object
      if (session.mode !== 'subscription') break
      if (!session.subscription) {
        console.warn('[webhook] checkout.session.completed — null subscription id, skipping')
        break
      }

      const subId = typeof session.subscription === 'object'
        ? session.subscription?.id
        : session.subscription

      const stripeSub = await stripe.subscriptions.retrieve(subId)

      await upsertSubscriptionFromStripe(stripeSub, {
        userId:           session.metadata?.userId,
        tier:             session.metadata?.tier,
        status:           'ACTIVE',
        stripeCustomerId: session.customer,
      })
      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object
      const prevAttrs = event.data?.previous_attributes ?? {}

      if (event.type === 'customer.subscription.created') {
        if (!sub.metadata?.userId) {
          console.log('[webhook] subscription.created without userId — deferring to checkout.session.completed')
          break
        }
        await upsertSubscriptionFromStripe(sub)
        break
      }

      // ── customer.subscription.updated ─────────────────────────────────────
      // The Stripe billing portal fires this when the user schedules a cancellation.
      // Depending on portal configuration Stripe uses ONE of two mechanisms:
      //
      //   A) cancel_at_period_end = true  (standard Stripe cancellation flag)
      //   B) cancel_at = <unix timestamp>  (portal "cancel at period end" config)
      //      In this case cancel_at_period_end stays FALSE but cancel_at is set.
      //      The previous_attributes will contain { cancel_at: null } → timestamp.
      //
      // We detect whichever mechanism changed and map both to cancelAtPeriodEnd=true
      // in our DB, since from a user perspective they mean the same thing:
      // "subscription is active but will not renew."
      //
      // Stripe also fires follow-up housekeeping events (clearing cancellation_details
      // feedback etc.) — we must not let those overwrite the flag we just set.
      // We use previous_attributes to know which fields actually changed.

      const cancelAtChanged        = 'cancel_at' in prevAttrs
      const cancelAtPeriodEndChanged = 'cancel_at_period_end' in prevAttrs

      // Derive the true "scheduled to cancel" state from the subscription object.
      // cancel_at is a Unix timestamp when set, null when cleared.
      const isScheduledToCancel =
        sub.cancel_at_period_end === true ||
        (sub.cancel_at != null && Number(sub.cancel_at) > 0)

      console.log('[webhook] subscription.updated:', {
        id:                      sub.id,
        status:                  sub.status,
        cancel_at_period_end:    sub.cancel_at_period_end,
        cancel_at:               sub.cancel_at,
        isScheduledToCancel,
        cancelAtChanged,
        cancelAtPeriodEndChanged,
        previous_attributes:     prevAttrs,
      })

      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id

      let existingRow = await prisma.subscription.findUnique({
        where:  { stripeSubscriptionId: sub.id },
        select: { userId: true, tier: true, stripeCustomerId: true },
      })

      if (!existingRow && customerId) {
        existingRow = await prisma.subscription.findFirst({
          where:  { stripeCustomerId: customerId },
          select: { userId: true, tier: true, stripeCustomerId: true },
        })
      }

      if (!existingRow) {
        console.warn('[webhook] subscription.updated — no DB row for sub', sub.id, '— skipping')
        break
      }

      // Only pass cancelAtPeriodEnd when cancel_at or cancel_at_period_end
      // actually changed in this event. This prevents housekeeping events
      // (that carry the same cancel_at but changed something else) from
      // resetting the flag.
      let cancelAtPeriodEndOverride = undefined
      if (cancelAtChanged || cancelAtPeriodEndChanged) {
        cancelAtPeriodEndOverride = isScheduledToCancel
      }

      await upsertSubscriptionFromStripe(sub, {
        userId:            existingRow.userId,
        tier:              existingRow.tier,
        stripeCustomerId:  existingRow.stripeCustomerId ?? customerId,
        cancelAtPeriodEnd: cancelAtPeriodEndOverride,
      })
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object
      const rawEnd = sub.current_period_end ?? sub.ended_at
      const currentPeriodEnd =
        rawEnd != null && Number.isFinite(Number(rawEnd))
          ? new Date(Number(rawEnd) * 1000)
          : null

      const updateData = { status: 'CANCELED', cancelAtPeriodEnd: false }
      if (currentPeriodEnd !== null) updateData.currentPeriodEnd = currentPeriodEnd

      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data:  updateData,
      })
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object
      if (!invoice.subscription) break
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: invoice.subscription },
        data:  { status: 'PAST_DUE' },
      })
      break
    }

    default:
      break
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapStripeStatus(stripeStatus) {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':           return 'ACTIVE'
    case 'past_due':
    case 'unpaid':             return 'PAST_DUE'
    case 'canceled':           return 'CANCELED'
    case 'incomplete':
    case 'incomplete_expired':
    case 'paused':
    default:                   return 'INCOMPLETE'
  }
}

// Derives whether a Stripe subscription object is scheduled to cancel,
// covering both the cancel_at_period_end flag and the cancel_at timestamp
// mechanism used by the billing portal.
function isScheduledToCancel(sub) {
  return (
    sub.cancel_at_period_end === true ||
    (sub.cancel_at != null && Number(sub.cancel_at) > 0)
  )
}

async function upsertSubscriptionFromStripe(sub, fallback = {}) {
  let userId = sub.metadata?.userId ?? fallback.userId
  if (!userId) {
    const found = await prisma.subscription.findUnique({
      where:  { stripeSubscriptionId: sub.id },
      select: { userId: true },
    })
    userId = found?.userId
  }

  if (!userId) {
    console.warn('[upsert] Could not resolve userId for sub', sub.id, '— skipping')
    return false
  }

  let tier = sub.metadata?.tier ?? fallback.tier
  if (!tier) {
    const found = await prisma.subscription.findUnique({
      where:  { userId },
      select: { tier: true },
    })
    tier = found?.tier ?? 'SUPPORTER'
  }

  const rawPeriodEnd =
    sub.current_period_end
    ?? sub.currentPeriodEnd
    ?? sub.items?.data?.[0]?.current_period_end

  const currentPeriodEnd =
    rawPeriodEnd != null && Number.isFinite(Number(rawPeriodEnd))
      ? new Date(Number(rawPeriodEnd) * 1000)
      : null

  if (currentPeriodEnd === null) {
    console.warn('[upsert] current_period_end missing on sub', sub.id)
  }

  // cancelAtPeriodEnd:
  //   - If the caller passed an explicit value (even false), use it — this
  //     lets the updated handler pass undefined to mean "don't overwrite".
  //   - Otherwise derive it from the sub object, covering both Stripe mechanisms.
  const cancelAtPeriodEnd =
    fallback.cancelAtPeriodEnd !== undefined
      ? fallback.cancelAtPeriodEnd
      : isScheduledToCancel(sub)

  const commonData = {
    tier,
    status:               fallback.status ?? mapStripeStatus(sub.status),
    stripeCustomerId:     fallback.stripeCustomerId ?? sub.customer,
    stripeSubscriptionId: sub.id,
    currentPeriodEnd,
    cancelAtPeriodEnd,
  }

  try {
    await prisma.subscription.upsert({
      where:  { userId },
      create: { userId, ...commonData },
      update: commonData,
    })
  } catch (err) {
    if (err.code === 'P2002') {
      console.warn('[upsert] Race on unique constraint for sub', sub.id, '— retrying as update')
      await prisma.subscription.update({ where: { userId }, data: commonData })
    } else {
      throw err
    }
  }

  return true
}

async function syncSubscription(user) {
  const row = await prisma.subscription.findUnique({
    where:  { userId: user.id },
    select: { stripeSubscriptionId: true, stripeCustomerId: true, tier: true, status: true },
  })

  if (!row?.stripeSubscriptionId) return null

  // If the webhook already marked this CANCELED, skip the Stripe API call
  // and return immediately so fetchMe() reflects it in the UI right away.
  if (row.status === 'CANCELED') {
    console.log('[sync] already CANCELED in DB — skipping Stripe retrieve')
    return { status: 'CANCELED', cancelAtPeriodEnd: false }
  }

  let stripeSub
  try {
    stripeSub = await stripe.subscriptions.retrieve(row.stripeSubscriptionId)
  } catch (err) {
    // Immediately-cancelled subscriptions are hard-deleted on Stripe — treat as CANCELED.
    if (err?.code === 'resource_missing' || err?.statusCode === 404) {
      console.log('[sync] Stripe sub not found (immediately cancelled) — marking CANCELED')
      await prisma.subscription.update({
        where: { userId: user.id },
        data:  { status: 'CANCELED', cancelAtPeriodEnd: false },
      })
      return { status: 'CANCELED', cancelAtPeriodEnd: false }
    }
    throw err
  }

  const scheduledToCancel = isScheduledToCancel(stripeSub)

  console.log('[sync] Stripe live sub:', {
    id:                   stripeSub.id,
    status:               stripeSub.status,
    cancel_at_period_end: stripeSub.cancel_at_period_end,
    cancel_at:            stripeSub.cancel_at,
    scheduledToCancel,
    current_period_end:   stripeSub.current_period_end,
  })

  if (stripeSub.status === 'canceled') {
    await prisma.subscription.update({
      where: { userId: user.id },
      data:  { status: 'CANCELED', cancelAtPeriodEnd: false },
    })
    return { status: 'CANCELED', cancelAtPeriodEnd: false }
  }

  // Pass cancelAtPeriodEnd explicitly so upsert uses our derived value
  // (covers both cancel_at_period_end and cancel_at mechanisms).
  await upsertSubscriptionFromStripe(stripeSub, {
    userId:            user.id,
    tier:              row.tier,
    stripeCustomerId:  row.stripeCustomerId,
    cancelAtPeriodEnd: scheduledToCancel,
  })

  return {
    status:            mapStripeStatus(stripeSub.status),
    cancelAtPeriodEnd: scheduledToCancel,
  }
}

module.exports = {
  createCheckoutSession,
  createPortalSession,
  constructWebhookEvent,
  handleWebhookEvent,
  syncSubscription,
}