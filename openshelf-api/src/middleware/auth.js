const jwt = require('jsonwebtoken')
const prisma = require('../config/prisma')

const authenticate = async (req, res, next) => {
  try {
    // Read from cookie first, fall back to Authorization header
    // (header fallback supports API clients, Postman, mobile apps)
    const cookieToken = req.cookies?.access_token
    const headerToken = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null

    const token = cookieToken || headerToken

    if (!token) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        avatarUrl: true,
        subscription: {
          select: {
            tier: true,
            status: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
          },
        },
      },
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or deactivated' })
    }

    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

const optionalAuthenticate = (req, res, next) => {
  const header = req.headers.authorization
  if (!header) return next()
  authenticate(req, res, next)
}

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' })
    }
    next()
  }
}

module.exports = { authenticate, authorize, optionalAuthenticate }