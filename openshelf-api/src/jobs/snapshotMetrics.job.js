const prisma = require('../config/prisma');
const os = require('os');
const { register, errorsTotal } = require('../config/metrics');
const { checkThresholds } = require('../utils/alertThresholds');

// Keep 7 days of snapshots at 5-minute intervals
// That's 2016 rows max — tiny footprint
const RETENTION_DAYS = 7
const INTERVAL_MS = 5 * 60 * 1000  // 5 minutes

let lastSnapshot = {
  timestampMs: Date.now(),
  totalRequests: 0,
  totalErrors: 0,
}

const toNumber = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }

const captureSnapshot = async () => {
  try {
    const metricsData = await register.getMetricsAsJSON()
    const findMetric = (name) => metricsData.find((m) => m.name === name)

    const requestsMetric = findMetric('openshelf_http_requests_total')
    const durationMetric = findMetric('openshelf_http_request_duration_seconds')
    const errorsMetric = findMetric('openshelf_errors_total')

    const totalRequests = requestsMetric?.values?.reduce((s, v) => s + v.value, 0) ?? 0
    const totalErrors = errorsMetric?.values?.reduce((s, v) => s + v.value, 0) ?? 0

    // RPM over the last snapshot window
    const nowMs = Date.now()
    const windowSec = Math.max((nowMs - lastSnapshot.timestampMs) / 1000, 1)
    const rpm = Math.max(0, ((totalRequests - lastSnapshot.totalRequests) / windowSec) * 60)

    // Error rate
    const errorRate = totalRequests > 0
      ? (totalErrors / totalRequests) * 100
      : 0

    // p95 response time
    let p95Ms = 0
    if (durationMetric?.values) {
      const bucketsMap = {}
      let count = 0
      durationMetric.values.forEach((v) => {
        const le = v.labels?.le
        if (le !== undefined) bucketsMap[String(le)] = toNumber(v.value)
        if (v.metricName?.endsWith('_count')) count += toNumber(v.value)
      })
      if (count) {
        const target = count * 0.95
        const buckets = Object.entries(bucketsMap)
          .map(([le, val]) => ({ le, val, numLe: le === '+Inf' ? Infinity : Number(le) }))
          .sort((a, b) => a.numLe - b.numLe)
        const found = buckets.find((b) => b.val >= target)
        if (found && Number.isFinite(found.numLe)) p95Ms = found.numLe * 1000
      }
    }

    // System memory percentage
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const memoryPct = ((totalMem - freeMem) / totalMem) * 100

    // DB latency — lightweight ping
    let dbLatencyMs = 0
    try {
      const start = Date.now()
      await prisma.$queryRaw`SELECT 1`
      dbLatencyMs = Date.now() - start
    } catch { /* non-blocking */ }

    // Persist snapshot
    const snapshot = await prisma.metricSnapshot.create({
      data: {
        rpm: Math.round(rpm * 100) / 100,
        errorRate: Math.round(errorRate * 100) / 100,
        p95Ms: Math.round(p95Ms * 100) / 100,
        memoryPct: Math.round(memoryPct * 100) / 100,
        dbLatencyMs: Math.round(dbLatencyMs),
      },
    })

    await checkThresholds(snapshot).catch((err) => console.error('[threshold check failed]', err.message));

    // Update rolling snapshot for next RPM calculation
    lastSnapshot = { timestampMs: nowMs, totalRequests, totalErrors }

    // Prune rows older than retention window
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000)
    await prisma.metricSnapshot.deleteMany({
      where: { capturedAt: { lt: cutoff } },
    })

  } catch (err) {
    console.error('[snapshotMetrics] Failed to capture snapshot:', err.message)
  }
}

const start = () => {
  // Take one snapshot immediately on startup
  captureSnapshot()
  // Then every 5 minutes
  return setInterval(captureSnapshot, INTERVAL_MS)
}

module.exports = { start }