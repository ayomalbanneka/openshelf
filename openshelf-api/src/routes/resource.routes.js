const router = require('express').Router()
const { body } = require('express-validator')
const controller = require('../controllers/resource.controller')
const validate   = require('../middleware/validate')
const { authenticate, authorize } = require('../middleware/auth')

// ── Public ────────────────────────────────────────────────────
router.get('/', controller.list)
router.get('/:slug', controller.getOne)

// ── Authenticated ─────────────────────────────────────────────
router.post(
  '/',
  authenticate,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('type')
      .isIn(['BOOK', 'COURSE', 'EXAM_PAPER', 'DOCUMENT', 'AUDIO'])
      .withMessage('Invalid resource type'),
    body('fileUrl').trim().notEmpty().withMessage('File URL is required'),
    body('categoryId').trim().notEmpty().withMessage('Category is required'),
  ],
  validate,
  controller.create
)

router.patch(
  '/:slug',
  authenticate,
  controller.update
)

// ── Admin / Moderator only ────────────────────────────────────
router.patch(
  '/:slug/publish',
  authenticate,
  authorize('ADMIN', 'MODERATOR'),
  controller.publish
)

router.delete(
  '/:slug',
  authenticate,
  controller.remove
)

module.exports = router