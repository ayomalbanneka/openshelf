const router     = require('express').Router()
const controller = require('../controllers/admin.controller')
const { authenticate, authorize } = require('../middleware/auth')

// All admin routes require authentication + ADMIN or MODERATOR role
router.use(authenticate)
router.use(authorize('ADMIN', 'MODERATOR'))

// Dashboard
router.get('/stats', controller.getStats)

// Content moderation
router.get('/pending',              controller.getPending)
router.patch('/resources/:id/publish', controller.publishResource)
router.delete('/resources/:id',        controller.rejectResource)

// User management — ADMIN only
router.get('/users',               authorize('ADMIN'), controller.getUsers)
router.patch('/users/:id/role',    authorize('ADMIN'), controller.updateUserRole)
router.patch('/users/:id/toggle',  authorize('ADMIN'), controller.toggleUserActive)

module.exports = router