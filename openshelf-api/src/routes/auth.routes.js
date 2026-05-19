const router = require('express').Router()
const { body } = require('express-validator')
const controller = require('../controllers/auth.controller')
const validate = require('../middleware/validate')
const { authenticate } = require('../middleware/auth')
const { authLimiter, adminAuthLimiter, otpLimiter } = require('../middleware/rateLimiter')

// Register
router.post('/register',
  authLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required')
      .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().withMessage('Enter a valid email').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate,
  controller.register
)

// Email verification
router.post('/verify-email',
  authenticate,
  body('code').isLength({ min: 6, max: 6 }).withMessage('Enter a valid 6-digit code'),
  validate,
  controller.verifyEmail
)

router.post('/resend-code', authenticate, controller.resendCode)

// Standard login
router.post('/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  controller.login
)

// Admin login — two steps
router.post('/admin/login',
  adminAuthLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  controller.adminLoginStep1
)

router.post('/admin/verify',
  otpLimiter,
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Enter a valid 6-digit code'),
  ],
  validate,
  controller.adminLoginStep2
)

// Forgot / reset password
router.post('/forgot-password',
  authLimiter,
  body('email').isEmail().normalizeEmail(),
  validate,
  controller.forgotPassword
)

router.post('/reset-password',
  otpLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Enter a valid 6-digit code'),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate,
  controller.resetPassword
)

// Refresh + me
router.post('/refresh', controller.refresh)
router.get('/me', authenticate, controller.me)

// Logout — revokes the refresh token
router.post('/logout', authenticate, controller.logout)

module.exports = router