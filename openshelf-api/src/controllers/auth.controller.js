const authService = require('../services/auth.service')

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body
    const result = await authService.register({ name, email, password })
    res.status(201).json(result)
  } catch (err) { next(err) }
}

const verifyEmail = async (req, res, next) => {
  try {
    const { code } = req.body
    const result = await authService.verifyEmail({ userId: req.user.id, code })
    res.json(result)
  } catch (err) { next(err) }
}

const resendCode = async (req, res, next) => {
  try {
    const result = await authService.resendVerificationCode(req.user.id)
    res.json(result)
  } catch (err) { next(err) }
}

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const result = await authService.login({ email, password })
    res.json(result)
  } catch (err) { next(err) }
}

const adminLoginStep1 = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const result = await authService.adminLoginStep1({ email, password })
    res.json(result)
  } catch (err) { next(err) }
}

const adminLoginStep2 = async (req, res, next) => {
  try {
    const { userId, code } = req.body
    const result = await authService.adminLoginStep2({ userId, code })
    res.json(result)
  } catch (err) { next(err) }
}

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body
    const result = await authService.forgotPassword(email)
    res.json(result)
  } catch (err) { next(err) }
}

const resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body
    const result = await authService.resetPassword({ email, code, newPassword })
    res.json(result)
  } catch (err) { next(err) }
}

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required' })
    }
    const result = authService.refreshAccessToken(refreshToken)
    res.json(result)
  } catch (err) { next(err) }
}

const me = (req, res) => {
  res.json({ user: req.user })
}

module.exports = {
  register, verifyEmail, resendCode,
  login, adminLoginStep1, adminLoginStep2,
  forgotPassword, resetPassword,
  refresh, me,
}