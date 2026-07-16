import rateLimit from 'express-rate-limit';

const ipKeyGenerator  = rateLimit;

const getIp = (req) => req.headers['x-forwarded-for']?.split(',')[0].trim() ?? req.ip;

const getRateLimitKey = (req) => ipKeyGenerator(getIp(req));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  keyGenerator: getRateLimitKey,
  message: { message: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const adminAuthLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  keyGenerator: getRateLimitKey,
  message: { message: 'Too many admin login attempts. Please try again in 1 hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 10,
  keyGenerator: getRateLimitKey,
  message: { message: 'Too many code attempts. Please request a new code.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export { authLimiter, adminAuthLimiter, otpLimiter };
