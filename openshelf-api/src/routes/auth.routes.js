const router = require('express').Router()
const { body } = require('express-validator')
const controller = require('../controllers/auth.controller')
const validate = require('../middleware/validate')
const { authenticate } = require('../middleware/auth')


router.post(
  '/register',
  [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email')
      .isEmail().withMessage('Enter a valid email')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate,
  controller.register
)

router.post(
  '/login',
  [
    body('email')
      .isEmail().withMessage('Enter a valid email')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required'),
  ],
  validate,
  controller.login
)

router.post('/refresh', controller.refresh)

router.get('/me', authenticate, controller.me)

module.exports = router