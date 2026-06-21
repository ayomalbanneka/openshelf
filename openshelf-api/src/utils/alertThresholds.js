const prisma = require('../config/prisma')
const { sendThresholdAlert } = require('../services/email.service')

const THRESHOLDS = {
  error_rate: { limit: Number(process.env.ALERT_ERROR_RATE_PCT ?? 5),   label: 'Error rate',   unit: '%'  },
  p95:        { limit: Number(process.env.ALERT_P95_MS ?? 2000),        label: 'P95 latency',  unit: 'ms' },
  memory:     { limit: Number(process.env.ALERT_MEMORY_PCT ?? 85),      label: 'Memory usage', unit: '%'  },
  db_latency: { limit: Number(process.env.ALERT_DB_LATENCY_MS ?? 500),  label: 'DB latency',   unit: 'ms' },
}

const COOLDOWN_MS = Number(process.env.ALERT_COOLDOWN_MINUTES ?? 30) * 60 * 1000
const RECIPIENTS  = (process.env.ALERT_RECIPIENT_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean)

// Called from the existing snapshotMetrics job after each snapshot
const checkThresholds = async (snapshot) => {
  const values = {
    error_rate: snapshot.errorRate,
    p95:        snapshot.p95Ms,
    memory:     snapshot.memoryPct,
    db_latency: snapshot.dbLatencyMs,
  }

  for (const [metric, config] of Object.entries(THRESHOLDS)) {
    const value = values[metric]
    const isBreached = value > config.limit

    const state = await prisma.alertState.upsert({
      where:  { metric },
      update: {},
      create: { metric, isBreached: false },
    })

    if (isBreached) {
      const cooledDown = !state.lastAlertedAt ||
        Date.now() - state.lastAlertedAt.getTime() > COOLDOWN_MS

      // Alert if: newly breached, OR still breached but cooldown has passed
      if (!state.isBreached || cooledDown) {
        if (RECIPIENTS.length) {
          await sendThresholdAlert({
            to: RECIPIENTS,
            metric: config.label,
            value,
            limit: config.limit,
            unit: config.unit,
          }).catch((err) => console.error('[alert] email failed:', err.message))
        }
        await prisma.alertState.update({
          where: { metric },
          data:  { isBreached: true, lastAlertedAt: new Date() },
        })
      }
    } else if (state.isBreached) {
      // Recovered — reset so next breach alerts immediately
      await prisma.alertState.update({
        where: { metric },
        data:  { isBreached: false },
      })
    }
  }
}

module.exports = { checkThresholds, THRESHOLDS }