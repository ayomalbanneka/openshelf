const {
  httpRequestsTotal,
  httpRequestDuration,
  activeRequests,
} = require('../config/metrics')

const metricsMiddleware = (req, res, next) => {
  // Skip metrics routes themselves to avoid self-instrumentation noise
  if (req.baseUrl === '/metrics' || req.path === '/metrics') return next()

  const start = process.hrtime.bigint()
  activeRequests.inc()

  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - start) / 1e9

    // Normalise route — replace IDs with :id to avoid cardinality explosion
    // e.g. /api/resources/my-book-slug → /api/resources/:slug
    const rawRoute = req.route?.path
      ? `${req.baseUrl || ''}${req.route.path}`
      : req.path
    const route = normaliseRoute(rawRoute)

    const labels = {
      method:      req.method,
      route,
      status_code: res.statusCode,
    }

    httpRequestsTotal.inc(labels)
    httpRequestDuration.observe(labels, duration)
    activeRequests.dec()
  })

  next()
}

const normaliseRoute = (path) => {
  return path
    .replace(/\/[0-9a-f]{24,}/g,    '/:id')
    .replace(/\/c[a-z0-9]{20,}/g,   '/:id')
    .replace(/\/[0-9]+/g,           '/:id')
}

module.exports = metricsMiddleware