const router     = require('express').Router()
const controller = require('../controllers/admin.controller')
const { authenticate, authorize } = require('../middleware/auth')
const reportController = require('../controllers/report.controller')

router.use(authenticate)
router.use(authorize('ADMIN', 'MODERATOR'))

// Dashboard
router.get('/stats', controller.getStats)

// Content moderation (ADMIN + MODERATOR)
router.get('/pending',                    controller.getPending)
router.patch('/resources/:id/publish',    controller.publishResource)
router.delete('/resources/:id/reject',    controller.rejectResource)

// All resources — ADMIN only
router.get('/resources',                  authorize('ADMIN'), controller.getResources)
router.delete('/resources/:id',           authorize('ADMIN'), controller.deleteResource)

// Users — ADMIN only
router.get('/users',                      authorize('ADMIN'), controller.getUsers)
router.patch('/users/:id/role',           authorize('ADMIN'), controller.updateUserRole)
router.patch('/users/:id/toggle',         authorize('ADMIN'), controller.toggleUserActive)

// Clubs — ADMIN only
router.get('/clubs',                      authorize('ADMIN'), controller.getClubs)
router.delete('/clubs/:id',               authorize('ADMIN'), controller.deleteClub)

// Categories — ADMIN only
router.get('/categories',                 authorize('ADMIN'), controller.getCategories)
router.post('/categories',                authorize('ADMIN'), controller.createCategory)
router.delete('/categories/:id',          authorize('ADMIN'), controller.deleteCategory)

// Tags — ADMIN only
router.get('/tags',                       authorize('ADMIN'), controller.getTags)
router.delete('/tags/:id',                authorize('ADMIN'), controller.deleteTag)

// Staff management — ADMIN only
router.get('/staff',                authorize('ADMIN'), controller.listStaff)
router.post('/staff/invite',        authorize('ADMIN'), controller.inviteStaff)
router.delete('/staff/:id/revoke',  authorize('ADMIN'), controller.revokeStaff)
router.delete('/staff/invites/:id', authorize('ADMIN'), controller.cancelInvite)

// Reports
router.get('/reports',     authorize('ADMIN', 'MODERATOR'), reportController.getReports)
router.patch('/reports/:id', authorize('ADMIN', 'MODERATOR'), reportController.updateReport)

// Bulk actions — MODERATOR + ADMIN
router.post('/resources/bulk-publish', controller.bulkPublish)
router.post('/resources/bulk-reject',  controller.bulkReject)

module.exports = router