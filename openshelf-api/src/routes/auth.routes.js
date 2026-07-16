import { Router } from 'express';
import { body } from 'express-validator';
import * as controller from '../controllers/auth.controller.js';
import * as adminController from '../controllers/admin.controller.js';
import validate from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter, adminAuthLimiter, otpLimiter } from '../middleware/rateLimiter.js';
import passport from '../config/passport.js';

const router = Router();

// Register
router.post(
  '/register',
  authLimiter,
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2 })
      .withMessage('Name must be at least 2 characters'),
    body('email').isEmail().withMessage('Enter a valid email').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate,
  controller.register
);

// Email verification
router.post(
  '/verify-email',
  authenticate,
  body('code').isLength({ min: 6, max: 6 }).withMessage('Enter a valid 6-digit code'),
  validate,
  controller.verifyEmail
);

router.post('/resend-code', authenticate, controller.resendCode);

// Standard login
router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  controller.login
);

// Admin login — two steps
router.post(
  '/admin/login',
  adminAuthLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  controller.adminLoginStep1
);

router.post(
  '/admin/verify',
  otpLimiter,
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Enter a valid 6-digit code'),
  ],
  validate,
  controller.adminLoginStep2
);

// Forgot / reset password
router.post(
  '/forgot-password',
  authLimiter,
  body('email').isEmail().normalizeEmail(),
  validate,
  controller.forgotPassword
);

router.post(
  '/reset-password',
  otpLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Enter a valid 6-digit code'),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate,
  controller.resetPassword
);

// Staff invite acceptance — public, token-based
router.post('/accept-invite', adminController.acceptInvite);

// Refresh + me
router.post('/refresh', controller.refresh);
router.get('/me', authenticate, controller.me);

// Logout — revokes the refresh token
router.post('/logout', authenticate, controller.logout);

// Google OAuth
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user) => {
    if (err) {
      const reason = err.code === 'OAUTH_ACCOUNT_CONFLICT' ? 'account_exists' : 'oauth_failed';
      return res.redirect(`${process.env.WEB_URL}/login?error=${reason}`);
    }
    if (!user) {
      return res.redirect(`${process.env.WEB_URL}/login?error=oauth_failed`);
    }
    req.user = user;
    controller.oauthCallback(req, res, next);
  })(req, res, next);
});

// GitHub OAuth
router.get(
  '/github',
  passport.authenticate('github', {
    scope: ['user:email'],
    session: false,
  })
);

router.get('/github/callback', (req, res, next) => {
  passport.authenticate('github', { session: false }, (err, user) => {
    if (err) {
      const reason = err.code === 'OAUTH_ACCOUNT_CONFLICT' ? 'account_exists' : 'oauth_failed';
      return res.redirect(`${process.env.WEB_URL}/login?error=${reason}`);
    }
    if (!user) {
      return res.redirect(`${process.env.WEB_URL}/login?error=oauth_failed`);
    }
    req.user = user;
    controller.oauthCallback(req, res, next);
  })(req, res, next);
});

export default router;
