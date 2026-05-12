const router     = require('express').Router()
const controller = require('../controllers/progress.controller')
const { authenticate } = require('../middleware/auth')

router.use(authenticate)

router.get('/mine',                      controller.getMyProgress)
router.get('/completed',                 controller.getCompleted)
router.get('/:resourceId',              controller.getProgress)
router.put('/:resourceId',              controller.updateProgress)

module.exports = router