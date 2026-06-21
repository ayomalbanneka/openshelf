const prisma   = require('../config/prisma')
const os       = require('os')
const { register, errorsTotal } = require('../config/metrics')
const { getStorageMetrics } = require('../utils/storageMetrics')
const { getMeilisearchHealth } = require('../utils/meilisearchHealth')
const { getEmailHealth } = require('../utils/emailHealth')

const processStartedAt = new Date()
let requestSnapshot = {
  timestampMs: Date.now(),
  totalRequests: 0,
  totalErrors: 0,
}

const toNumber = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

const round = (value, digits = 2) => {
  const n = toNumber(value)
  return Number(n.toFixed(digits))
}

const getHistogramParts = (metric) => {
  if (!metric?.values) {
    return { buckets: [], sum: 0, count: 0 }
  }

  const bucketsMap = {}
  let sum = 0
  let count = 0

  metric.values.forEach((v) => {
    const le = v.labels?.le
    if (le !== undefined) {
      const key = String(le)
      bucketsMap[key] = (bucketsMap[key] || 0) + toNumber(v.value)
      return
    }

    if (v.metricName?.endsWith('_sum')) {
      sum += toNumber(v.value)
    }
    if (v.metricName?.endsWith('_count')) {
      count += toNumber(v.value)
    }
  })

  const buckets = Object.entries(bucketsMap)
    .map(([le, value]) => ({
      le,
      value,
      numericLe: le === '+Inf' ? Number.POSITIVE_INFINITY : Number(le),
    }))
    .sort((a, b) => a.numericLe - b.numericLe)

  if (!count && buckets.length > 0) {
    count = toNumber(buckets[buckets.length - 1].value)
  }

  return { buckets, sum, count }
}

const estimateQuantileMs = (histogram, quantile) => {
  if (!histogram.count) return 0

  const target = histogram.count * quantile
  const found = histogram.buckets.find((b) => toNumber(b.value) >= target)
  if (!found || !Number.isFinite(found.numericLe)) return 0
  return round(found.numericLe * 1000)
}

const bucketCountAtOrBelow = (histogram, upperBoundSec) => {
  const target = histogram.buckets
    .filter((b) => b.numericLe <= upperBoundSec)
    .sort((a, b) => b.numericLe - a.numericLe)[0]

  return target ? toNumber(target.value) : 0
}

const groupRouteBase = (route) => {
  const clean = route || 'unknown'
  const parts = clean.split('/').filter(Boolean)
  if (parts.length === 0) return '/'
  if (parts.length === 1) return `/${parts[0]}`
  return `/${parts[0]}/${parts[1]}/*`
}

// ── Prometheus metrics endpoint ───────────────────────────────
const getPrometheusMetrics = async (req, res, next) => {
  try {
    res.set('Content-Type', register.contentType)
    res.end(await register.metrics())
  } catch (err) { next(err) }
}

// ── JSON metrics for the dashboard ───────────────────────────
const getDashboardMetrics = async (req, res, next) => {
  try {
    const memUsage  = process.memoryUsage()
    const uptime    = process.uptime()
    const totalMem  = os.totalmem()
    const freeMem   = os.freemem()
    const cpuCount  = os.cpus().length
    const loadAvg   = os.loadavg()

    // Database health check
    let dbStatus = 'healthy'
    let dbLatency = 0
    try {
      const start = Date.now()
      await prisma.$queryRaw`SELECT 1`
      dbLatency = Date.now() - start
    } catch {
      dbStatus = 'unhealthy'
      errorsTotal.inc({ type: 'database' })
    }

    // Pull current metrics from Prometheus registry
    const metricsData   = await register.getMetricsAsJSON()
    const findMetric    = (name) => metricsData.find((m) => m.name === name)

    const requestsMetric  = findMetric('openshelf_http_requests_total')
    const durationMetric  = findMetric('openshelf_http_request_duration_seconds')
    const activeMetric    = findMetric('openshelf_active_requests')
    const errorsMetric    = findMetric('openshelf_errors_total')

    // Calculate total requests
    const totalRequests = requestsMetric?.values?.reduce(
      (sum, v) => sum + v.value, 0
    ) ?? 0

    // Calculate error rate
    const totalErrors = errorsMetric?.values?.reduce(
      (sum, v) => sum + v.value, 0
    ) ?? 0

    const errorRateNum = totalRequests > 0
      ? (totalErrors / totalRequests) * 100
      : 0
    const errorRate = errorRateNum.toFixed(2)

    const requestHistogram = getHistogramParts(durationMetric)
    const avgResponseMs = requestHistogram.count > 0
      ? round((requestHistogram.sum / requestHistogram.count) * 1000)
      : 0
    const p50ResponseMs = estimateQuantileMs(requestHistogram, 0.5)
    const p95ResponseMs = estimateQuantileMs(requestHistogram, 0.95)
    const p99ResponseMs = estimateQuantileMs(requestHistogram, 0.99)

    const dbHistogram = getHistogramParts(findMetric('openshelf_db_query_duration_seconds'))
    const avgDbQueryMs = dbHistogram.count > 0
      ? round((dbHistogram.sum / dbHistogram.count) * 1000)
      : 0
    const p95DbQueryMs = estimateQuantileMs(dbHistogram, 0.95)
    const slowQueryCount = Math.max(
      0,
      round(dbHistogram.count - bucketCountAtOrBelow(dbHistogram, 0.5), 0)
    )

    // Active requests
    const activeReqs = activeMetric?.values?.[0]?.value ?? 0

    // Top routes by request count
    const routeStats = {}
    const endpointStats = {}
    const routeGroupStats = {}
    if (requestsMetric?.values) {
      requestsMetric.values.forEach((v) => {
        const route = v.labels?.route || 'unknown'
        const method = v.labels?.method || 'UNKNOWN'
        const status = String(v.labels?.status_code || 'unknown')

        if (!routeStats[route]) routeStats[route] = 0
        routeStats[route] += v.value

        const endpointKey = `${method} ${route} (${status})`
        if (!endpointStats[endpointKey]) endpointStats[endpointKey] = 0
        endpointStats[endpointKey] += v.value

        const group = groupRouteBase(route)
        if (!routeGroupStats[group]) routeGroupStats[group] = 0
        routeGroupStats[group] += v.value
      })
    }

    const topRoutes = Object.entries(routeStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([route, count]) => ({ route, count: toNumber(count) }))

    const topEndpoints = Object.entries(endpointStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([endpoint, count]) => ({ endpoint, count: toNumber(count) }))

    const topRouteGroups = Object.entries(routeGroupStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([route, count]) => ({ route, count: toNumber(count) }))

    // Status code breakdown
    const statusBreakdown = {}
    if (requestsMetric?.values) {
      requestsMetric.values.forEach((v) => {
        const code = String(v.labels?.status_code || 'unknown')
        const codeNum = parseInt(code, 10)
        const group = Number.isFinite(codeNum) ? `${Math.floor(codeNum / 100)}xx` : 'unknown'
        if (!statusBreakdown[group]) statusBreakdown[group] = 0
        statusBreakdown[group] += v.value
      })
    }

    const errorTypes = (errorsMetric?.values || [])
      .map((v) => ({ type: v.labels?.type || 'unknown', count: toNumber(v.value) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const nowMs = Date.now()
    const windowSec = Math.max((nowMs - requestSnapshot.timestampMs) / 1000, 1)
    const requestsPerMinute = Math.max(
      0,
      round(((totalRequests - requestSnapshot.totalRequests) / windowSec) * 60)
    )
    const errorsPerMinute = Math.max(
      0,
      round(((totalErrors - requestSnapshot.totalErrors) / windowSec) * 60)
    )

    requestSnapshot = {
      timestampMs: nowMs,
      totalRequests,
      totalErrors,
    }

    const alerts = []
    if (dbStatus !== 'healthy') {
      alerts.push({ severity: 'critical', key: 'db', message: 'Database health check is failing.' })
    }
    if (avgResponseMs > 500) {
      alerts.push({ severity: 'critical', key: 'latency', message: `High latency detected (p95 ${p95ResponseMs}ms).` })
    } else if (avgResponseMs > 250) {
      alerts.push({ severity: 'warning', key: 'latency', message: `Latency is elevated (avg ${avgResponseMs}ms).` })
    }
    if (errorRateNum > 2) {
      alerts.push({ severity: 'critical', key: 'errors', message: `Error rate is ${errorRate.toString()}%.` })
    } else if (errorRateNum > 0.5) {
      alerts.push({ severity: 'warning', key: 'errors', message: `Error rate is trending up (${errorRate.toString()}%).` })
    }

    const systemUsedPct = ((totalMem - freeMem) / totalMem) * 100
    if (systemUsedPct > 90) {
      alerts.push({ severity: 'critical', key: 'memory', message: 'System memory usage is above 90%.' })
    } else if (systemUsedPct > 80) {
      alerts.push({ severity: 'warning', key: 'memory', message: 'System memory usage is above 80%.' })
    }

    const alertState = alerts.some((a) => a.severity === 'critical')
      ? 'critical'
      : alerts.length > 0
        ? 'warning'
        : 'healthy'

    res.json({
      system: {
        uptime:      Math.round(uptime),
        uptimeHuman: formatUptime(uptime),
        startedAt: processStartedAt.toISOString(),
        nodeVersion: process.version,
        platform:    process.platform,
        cpuCount,
        loadAvg:    loadAvg.map((v) => v.toFixed(2)),
      },
      memory: {
        heapUsed:    Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal:   Math.round(memUsage.heapTotal / 1024 / 1024),
        rss:         Math.round(memUsage.rss / 1024 / 1024),
        external:    Math.round(memUsage.external / 1024 / 1024),
        systemTotal: Math.round(totalMem / 1024 / 1024),
        systemFree:  Math.round(freeMem / 1024 / 1024),
        systemUsedPct: (((totalMem - freeMem) / totalMem) * 100).toFixed(1),
        heapUsedPct:   ((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(1),
      },
      requests: {
        total:         totalRequests,
        active:        activeReqs,
        errorRate:     `${errorRate}%`,
        avgResponseMs,
        latency: {
          avgMs: avgResponseMs,
          p50Ms: p50ResponseMs,
          p95Ms: p95ResponseMs,
          p99Ms: p99ResponseMs,
        },
        throughput: {
          rpm: requestsPerMinute,
          errorRpm: errorsPerMinute,
          windowSec: round(windowSec),
        },
        topRoutes,
        topEndpoints,
        topRouteGroups,
        statusBreakdown,
        errorTypes,
      },
      database: {
        status:    dbStatus,
        latencyMs: dbLatency,
        avgQueryMs: avgDbQueryMs,
        p95QueryMs: p95DbQueryMs,
        slowQueries: slowQueryCount,
      },
      alerts: {
        state: alertState,
        items: alerts,
      },
    })
  } catch (err) { next(err) }
}

const formatUptime = (seconds) => {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${s}s`
}

// GET /metrics/history — returns last N snapshots for trend chart
const getMetricHistory = async (req, res, next) => {
  try {
    // Default: last 2 hours (24 × 5-min intervals)
    const points = Math.min(Math.max(parseInt(req.query.points ?? '24', 10), 6), 288)

    const snapshots = await prisma.metricSnapshot.findMany({
      orderBy: { capturedAt: 'desc' },
      take:    points,
      select: {
        capturedAt:  true,
        rpm:         true,
        errorRate:   true,
        p95Ms:       true,
        memoryPct:   true,
        dbLatencyMs: true,
      },
    })

    // Return in ascending time order for chart rendering
    res.json({ data: snapshots.reverse() })
  } catch (err) { next(err) }
}

// GET /metrics/storage — MinIO/R2 bucket usage
const getStorageMetrics_ = async (req, res, next) => {
  try {
    const data = await getStorageMetrics()
    res.json(data)
  } catch (err) {
    // Storage metrics are non-critical — return a degraded response
    // rather than a 500 so the dashboard doesn't crash
    console.error('[metrics/storage] Failed to query storage:', err.message)
    res.json({
      totalObjects:   null,
      totalBytes:     null,
      totalFormatted: 'Unavailable',
      byPrefix:       {},
      error:          'Could not connect to storage. Check STORAGE_* environment variables.',
      queriedAt:      new Date().toISOString(),
    })
  }
}

const getMeilisearchHealth_ = async (req, res) => {
  const health = await getMeilisearchHealth()
  res.json(health)
}

const getEmailHealth_ = async (req, res) => {
  const health = await getEmailHealth()
  res.json(health)
}


module.exports = {
  getPrometheusMetrics,
  getDashboardMetrics,
  getMetricHistory,
  getStorageMetrics: getStorageMetrics_,
  getMeilisearchHealth: getMeilisearchHealth_,
  getEmailHealth: getEmailHealth_,
}