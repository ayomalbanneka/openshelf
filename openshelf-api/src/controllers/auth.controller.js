const authService = require('../services/auth.service')

// Controller functions for authentication routes
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body
    const result = await authService.register({ name, email, password })
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
}

// Login controller
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const result = await authService.login({ email, password })
    res.json(result)
  } catch (err) {
    next(err)
  }
}

// Refresh token controller
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required' })
    }
    const result = authService.refreshAccessToken(refreshToken)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

const me = (req, res) => {
  // req.user was attached by the authenticate middleware
  res.json({ user: req.user })
}

module.exports = { register, login, refresh, me }