const router     = require('express').Router()
const { body }   = require('express-validator')
const controller = require('../controllers/comment.controller')
const validate   = require('../middleware/validate')
const { authenticate } = require('../middleware/auth')

// Get comments for a resource (public)
router.get('/resources/:slug/comments', controller.getResourceComments)

// Post a comment (authenticated + verified)
router.post(
  '/resources/:slug/comments',
  authenticate,
  body('body').trim().notEmpty().withMessage('Comment body is required'),
  validate,
  controller.createComment
)

// Edit a comment
router.patch(
  '/comments/:id',
  authenticate,
  body('body').trim().notEmpty().withMessage('Comment body is required'),
  validate,
  controller.updateComment
)

// Delete a comment
router.delete('/comments/:id', authenticate, controller.deleteComment)

module.exports = router