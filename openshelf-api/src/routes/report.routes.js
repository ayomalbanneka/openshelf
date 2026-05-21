const router     = require('express').Router()
const controller = require('../controllers/report.controller')
const { authenticate, authorize } = require('../middleware/auth')

// User-facing — submit a report
router.post('/resources/:slug/report', authenticate, controller.createReport)

module.exports = router