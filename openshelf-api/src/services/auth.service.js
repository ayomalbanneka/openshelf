const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../config/prisma')

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  )

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
  )

  return { accessToken, refreshToken }
}

const register = async ({ name, email, password }) => {
  // Check if email is already taken
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    const err = new Error('Email already in use')
    err.status = 409
    throw err
  }

  // Hash the password — never store plaintext
  const passwordHash = await bcrypt.hash(password, 12)

  // Create the user
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  })

  const tokens = generateTokens(user.id)
  return { user, ...tokens }
}

const login = async ({ email, password }) => {
  // Find the user
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user || !user.isActive) {
    const err = new Error('Invalid credentials')
    err.status = 401
    throw err
  }

  // Compare the password against the stored hash
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    const err = new Error('Invalid credentials')
    err.status = 401
    throw err
  }

  // Strip the password hash before returning
  const { passwordHash, ...safeUser } = user
  const tokens = generateTokens(user.id)
  return { user: safeUser, ...tokens }
}

const refreshAccessToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)

    // Ensure the token still maps to an active account.
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, isActive: true },
    })

    if (!user || !user.isActive) {
      const err = new Error('User not found or deactivated')
      err.status = 401
      throw err
    }

    const accessToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    return { accessToken }
  } catch {
    const err = new Error('Invalid refresh token')
    err.status = 401
    throw err
  }
}

module.exports = { register, login, refreshAccessToken }