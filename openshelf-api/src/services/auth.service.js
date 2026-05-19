const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../config/prisma')
const emailSvc = require('./email.service')
const { generateCode, codeExpiresAt } = require('../utils/generateCode')

// Token helpers
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  )
  return { accessToken, refreshToken }
}

// Register
const register = async ({ name, email, password }) => {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    const err = new Error('Email already in use')
    err.status = 409
    throw err
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: {
      id: true, name: true, email: true,
      role: true, isEmailVerified: true, createdAt: true,
    },
  })

  // Generate and send verification code
  const code = generateCode()
  await prisma.emailVerification.create({
    data: {
      userId: user.id,
      code,
      expiresAt: codeExpiresAt(),
    },
  })

  await emailSvc.sendVerificationCode({ to: email, name, code })

  const tokens = generateTokens(user.id)
  return { user, ...tokens }
}

// Verify email
const verifyEmail = async ({ userId, code }) => {
  const verification = await prisma.emailVerification.findFirst({
    where: {
      userId,
      code,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  })

  if (!verification) {
    const err = new Error('Invalid or expired code')
    err.status = 400
    throw err
  }

  // Mark code as used and verify the user atomically
  await prisma.$transaction([
    prisma.emailVerification.update({
      where: { id: verification.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { isEmailVerified: true },
    }),
  ])

  return { message: 'Email verified successfully' }
}

// Resend verification code
const resendVerificationCode = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } })

  if (!user) {
    const err = new Error('User not found')
    err.status = 404
    throw err
  }

  if (user.isEmailVerified) {
    const err = new Error('Email is already verified')
    err.status = 400
    throw err
  }

  // Invalidate old codes
  await prisma.emailVerification.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  })

  const code = generateCode()
  await prisma.emailVerification.create({
    data: { userId, code, expiresAt: codeExpiresAt() },
  })

  await emailSvc.sendVerificationCode({
    to: user.email,
    name: user.name,
    code,
  })

  return { message: 'Verification code resent' }
}

// Login
const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user || !user.isActive) {
    const err = new Error('Invalid credentials')
    err.status = 401
    throw err
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    const err = new Error('Invalid credentials')
    err.status = 401
    throw err
  }

  if (['ADMIN', 'MODERATOR'].includes(user.role)) {
    const err = new Error('Admin and moderator accounts must sign in through the admin portal.')
    err.status = 403
    throw err
  }

  const { passwordHash, ...safeUser } = user
  const tokens = generateTokens(user.id)
  return { user: safeUser, ...tokens }
}

// Admin login — sends a 2FA code
const adminLoginStep1 = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user || !user.isActive) {
    const err = new Error('Invalid credentials')
    err.status = 401
    throw err
  }

  if (!['ADMIN', 'MODERATOR'].includes(user.role)) {
    const err = new Error('Access denied')
    err.status = 403
    throw err
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    const err = new Error('Invalid credentials')
    err.status = 401
    throw err
  }

  // Generate and send admin login code
  // Invalidate previous codes first
  await prisma.emailVerification.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  })

  const code = generateCode()
  await prisma.emailVerification.create({
    data: { userId: user.id, code, expiresAt: codeExpiresAt() },
  })

  await emailSvc.sendAdminLoginCode({
    to: user.email,
    name: user.name,
    code,
  })

  // Return userId so the frontend can pass it to step 2
  return { userId: user.id, message: 'Code sent to your email' }
}

// Admin login step 2 — verify code and issue tokens
const adminLoginStep2 = async ({ userId, code }) => {
  const verification = await prisma.emailVerification.findFirst({
    where: {
      userId,
      code,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  })

  if (!verification) {
    const err = new Error('Invalid or expired code')
    err.status = 400
    throw err
  }

  await prisma.emailVerification.update({
    where: { id: verification.id },
    data: { usedAt: new Date() },
  })

  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  const { passwordHash, ...safeUser } = user
  const tokens = generateTokens(user.id)
  return { user: safeUser, ...tokens }
}

// Forgot password - send reset code
const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } })

  // Always return success to prevent email enumeration
  if (!user || !user.isActive) {
    return { message: 'If that email exists, a reset code has been sent' }
  }

  // Invalidate old reset codes
  await prisma.passwordReset.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  })

  const code = generateCode()
  await prisma.passwordReset.create({
    data: { userId: user.id, code, expiresAt: codeExpiresAt() },
  })

  await emailSvc.sendPasswordResetCode({
    to: user.email,
    name: user.name,
    code,
  })

  return { message: 'If that email exists, a reset code has been sent' }
}

// Reset password
const resetPassword = async ({ email, code, newPassword }) => {
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    const err = new Error('Invalid or expired code')
    err.status = 400
    throw err
  }

  const reset = await prisma.passwordReset.findFirst({
    where: {
      userId: user.id,
      code,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  })

  if (!reset) {
    const err = new Error('Invalid or expired code')
    err.status = 400
    throw err
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)

  await prisma.$transaction([
    prisma.passwordReset.update({
      where: { id: reset.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    }),
  ])

  return { message: 'Password reset successfully' }
}

// Refresh token
const refreshAccessToken = (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )
    return { accessToken }
  } catch {
    const err = new Error('Invalid refresh token')
    err.status = 401
    throw err
  }
}

module.exports = {
  register, verifyEmail, resendVerificationCode,
  login, adminLoginStep1, adminLoginStep2,
  forgotPassword, resetPassword,
  refreshAccessToken,
}