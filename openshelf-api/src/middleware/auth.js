const jwt = require('jsonwebtoken')
const prisma = require('../config/prisma')

const authenticate = async (req, res, next) => {
  try {
    // 1. Check the Authorization header exists
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' })
    }

    // 2. Extract the token
    const token = authHeader.split(' ')[1]

    // 3. Verify the token signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // 4. Load the user from the database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    })

    // 5. Make sure the user still exists and is active
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or deactivated' })
    }

    // 6. Attach the user to the request so controllers can access it
    req.user = user
    next()
  } catch (err) {
    // jwt.verify throws if token is invalid or expired
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' })
    }
    next()
  }
}

module.exports = { authenticate, authorize }