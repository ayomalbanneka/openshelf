const client = require('prom-client')

// Create a custom registry so we control exactly what's collected
const register = new client.Registry()

// Add default Node.js metrics — CPU, memory, event loop, GC
client.collectDefaultMetrics({
  register,
  prefix: 'openshelf_',
})

// ── Custom metrics ────────────────────────────────────────────

// Total HTTP requests counter
const httpRequestsTotal = new client.Counter({
  name:       'openshelf_http_requests_total',
  help:       'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers:  [register],
})

// HTTP request duration histogram
const httpRequestDuration = new client.Histogram({
  name:       'openshelf_http_request_duration_seconds',
  help:       'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets:    [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers:  [register],
})

// Active requests gauge
const activeRequests = new client.Gauge({
  name:      'openshelf_active_requests',
  help:      'Number of active HTTP requests',
  registers: [register],
})

// Database query duration histogram
const dbQueryDuration = new client.Histogram({
  name:      'openshelf_db_query_duration_seconds',
  help:      'Database query duration in seconds',
  buckets:   [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
})

// Error counter
const errorsTotal = new client.Counter({
  name:       'openshelf_errors_total',
  help:       'Total number of errors',
  labelNames: ['type'],
  registers:  [register],
})

// File upload counter
const uploadsTotal = new client.Counter({
  name:       'openshelf_uploads_total',
  help:       'Total number of file uploads',
  labelNames: ['type', 'status'],
  registers:  [register],
})

// User registration counter
const registrationsTotal = new client.Counter({
  name:      'openshelf_registrations_total',
  help:      'Total number of user registrations',
  registers: [register],
})

module.exports = {
  register,
  httpRequestsTotal,
  httpRequestDuration,
  activeRequests,
  dbQueryDuration,
  errorsTotal,
  uploadsTotal,
  registrationsTotal,
}