const router     = require('express').Router()
const controller = require('../controllers/notification.controller')
const { authenticate } = require('../middleware/auth')

router.get('/',          authenticate, controller.getMyNotifications)
router.patch('/read-all', authenticate, controller.markAllRead)
router.patch('/:id/read', authenticate, controller.markRead)
router.delete('/:id',     authenticate, controller.deleteNotification)

module.exports = router