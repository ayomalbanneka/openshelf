const {
  createCheckoutSession,
  createPortalSession,
  constructWebhookEvent,
  handleWebhookEvent,
  syncSubscription,
} = require('../services/stripe.service')

const checkout = async (req, res, next) => {
  try {
    const { tier } = req.body

    if (!['SUPPORTER', 'PATRON'].includes(tier)) {
      return res.status(400).json({ message: 'Invalid tier. Must be SUPPORTER or PATRON.' })
    }

    const result = await createCheckoutSession(req.user, tier)
    res.json(result)
  } catch (err) {
    if (err.message === 'You already have an active subscription') {
      return res.status(400).json({ message: err.message })
    }
    next(err)
  }
}

const portal = async (req, res, next) => {
  try {
    const result = await createPortalSession(req.user)
    res.json(result)
  } catch (err) {
    if (err.message === 'No active subscription found') {
      return res.status(400).json({ message: err.message })
    }
    next(err)
  }
}

const sync = async (req, res, next) => {
  try {
    const result = await syncSubscription(req.user)
    res.json({ synced: true, subscription: result })
  } catch (err) {
    next(err)
  }
}

const webhook = async (req, res) => {
  const signature = req.headers['stripe-signature']

  if (!signature) {
    console.error('[webhook] Missing stripe-signature header')
    return res.status(400).json({ message: 'Missing stripe-signature header' })
  }

  let event
  try {
    event = constructWebhookEvent(req.body, signature)
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err.message)
    return res.status(400).json({ message: `Webhook error: ${err.message}` })
  }

  try {
    console.log(`[webhook] Processing event: ${event.type}`)
    await handleWebhookEvent(event)
    res.json({ received: true })
  } catch (err) {
    console.error(`[webhook] Handler error for event ${event.type}:`, err)
    // Return 500 so Stripe will retry the event
    res.status(500).json({ message: 'Webhook handler failed' })
  }
}

module.exports = { checkout, portal, sync, webhook }