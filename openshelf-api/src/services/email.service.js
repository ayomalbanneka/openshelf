const { Resend } = require('resend')

const FROM   = process.env.EMAIL_FROM || 'onboarding@resend.dev'

let resend

const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    const err = new Error('Email service is not configured. Set RESEND_API_KEY.')
    err.status = 500
    throw err
  }

  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }

  return resend
}

const sendEmail = async ({ to, subject, html }) => {
  const client = getResendClient()
  const { data, error } = await client.emails.send({
    from: FROM,
    to,
    subject,
    html,
  })

  if (error) {
    const message = error.message || 'Email provider rejected the request'
    const err = new Error(`Failed to send email: ${message}`)
    err.status = 502
    throw err
  }

  return data
}

// Send verification code
const sendVerificationCode = async ({ to, name, code }) => {
  await sendEmail({
    to,
    subject: 'Verify your OpenShelf account',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1e40af;margin-bottom:8px">Welcome to OpenShelf, ${name}!</h2>
        <p style="color:#374151;margin-bottom:24px">
          Enter this code to verify your email address.
          It expires in <strong>30 minutes</strong>.
        </p>
        <div style="background:#f1f5f9;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
          <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1e40af">
            ${code}
          </span>
        </div>
        <p style="color:#6b7280;font-size:14px">
          If you didn't create an OpenShelf account, ignore this email.
        </p>
      </div>
    `,
  })
}

// Send password reset code
const sendPasswordResetCode = async ({ to, name, code }) => {
  await sendEmail({
    to,
    subject: 'Reset your OpenShelf password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1e40af;margin-bottom:8px">Password reset</h2>
        <p style="color:#374151;margin-bottom:8px">Hi ${name},</p>
        <p style="color:#374151;margin-bottom:24px">
          Enter this code to reset your password.
          It expires in <strong>30 minutes</strong>.
        </p>
        <div style="background:#f1f5f9;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
          <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1e40af">
            ${code}
          </span>
        </div>
        <p style="color:#6b7280;font-size:14px">
          If you didn't request a password reset, ignore this email.
        </p>
      </div>
    `,
  })
}

// Send account blocked notification
const sendAccountBlockedEmail = async ({ to, name, reason }) => {
  await sendEmail({
    to,
    subject: 'Your OpenShelf account has been suspended',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#dc2626;margin-bottom:8px">Account suspended</h2>
        <p style="color:#374151;margin-bottom:8px">Hi ${name},</p>
        <p style="color:#374151;margin-bottom:16px">
          Your OpenShelf account has been suspended by an administrator.
        </p>
        <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:16px;margin-bottom:24px">
          <p style="color:#991b1b;font-weight:600;margin-bottom:4px">Reason:</p>
          <p style="color:#7f1d1d;margin:0">${reason || 'Violation of community guidelines'}</p>
        </div>
        <p style="color:#374151;margin-bottom:8px">
          If you believe this is a mistake, please contact us at
          <a href="mailto:support@openshelf.dev" style="color:#1e40af">
            support@openshelf.dev
          </a>.
        </p>
      </div>
    `,
  })
}

// Send admin login code (2FA for admin dashboard)
const sendAdminLoginCode = async ({ to, name, code }) => {
  await sendEmail({
    to,
    subject: 'OpenShelf admin login code',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1e40af;margin-bottom:8px">Admin login verification</h2>
        <p style="color:#374151;margin-bottom:8px">Hi ${name},</p>
        <p style="color:#374151;margin-bottom:24px">
          Someone is attempting to log into the OpenShelf admin dashboard.
          Enter this code to continue. It expires in <strong>30 minutes</strong>.
        </p>
        <div style="background:#f1f5f9;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
          <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1e40af">
            ${code}
          </span>
        </div>
        <p style="color:#dc2626;font-size:14px;font-weight:600">
          If this wasn't you, your account may be compromised. 
          Change your password immediately.
        </p>
      </div>
    `,
  })
}

module.exports = {
  sendVerificationCode,
  sendPasswordResetCode,
  sendAccountBlockedEmail,
  sendAdminLoginCode,
}