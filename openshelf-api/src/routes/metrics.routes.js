const router = require('express').Router()
const controller = require('../controllers/metrics.controller')
const { authenticate, authorize } = require('../middleware/auth')

// Prometheus scrape endpoint — secured with a static token
// (Prometheus scraper sends this in Authorization header)
router.get('/prometheus', (req, res, next) => {
  const token = req.headers['x-metrics-token']
  if (token !== process.env.METRICS_TOKEN) {
    return res.status(401).json({ message: 'Unauthorized' })
  }
  controller.getPrometheusMetrics(req, res, next)
})

// JSON metrics for the admin dashboard
router.get(
  '/dashboard',
  authenticate,
  authorize('ADMIN', 'MODERATOR'),
  controller.getDashboardMetrics
)

// Historical trend data for the dashboard chart
router.get(
  '/history',
  authenticate,
  authorize('ADMIN', 'MODERATOR'),
  controller.getMetricHistory
)

// Storage usage — MinIO/R2 bucket stats
router.get(
  '/storage',
  authenticate,
  authorize('ADMIN', 'MODERATOR'),
  controller.getStorageMetrics
)

// Meilisearch health
router.get(
  '/meilisearch',
  authenticate,
  authorize('ADMIN', 'MODERATOR'),
  controller.getMeilisearchHealth
)

// Email service health
router.get(
  '/email',
  authenticate,
  authorize('ADMIN', 'MODERATOR'),
  controller.getEmailHealth
)

module.exports = router