const crypto = require('crypto')

// Generates a cryptographically secure 6-digit code
const generateCode = () => {
  const bytes = crypto.randomBytes(3)
  const num   = parseInt(bytes.toString('hex'), 16)
  return String(num % 1000000).padStart(6, '0')
}

// 30 minutes from now
const codeExpiresAt = () => new Date(Date.now() + 30 * 60 * 1000)

module.exports = { generateCode, codeExpiresAt }