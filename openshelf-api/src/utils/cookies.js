const IS_PROD = process.env.NODE_ENV === 'production'

/**
 * Sets the access and refresh token as httpOnly cookies.
 * - Access token: sent on every request
 * - Refresh token: scoped to /api/auth/refresh only
 */
const setTokenCookies = (res, { accessToken, refreshToken }) => {
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure:   IS_PROD,
    sameSite: IS_PROD ? 'strict' : 'lax',
    maxAge:   15 * 60 * 1000,              // 15 minutes — matches JWT expiry
  })

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure:   IS_PROD,
    sameSite: IS_PROD ? 'strict' : 'lax',
    path:     '/api/auth/refresh',         // only sent on refresh endpoint
    maxAge:   30 * 24 * 60 * 60 * 1000,   // 30 days — matches DB expiry
  })
}

/**
 * Clears both token cookies.
 */
const clearTokenCookies = (res) => {
  res.clearCookie('access_token')
  res.clearCookie('refresh_token', { path: '/api/auth/refresh' })
}

module.exports = { setTokenCookies, clearTokenCookies }