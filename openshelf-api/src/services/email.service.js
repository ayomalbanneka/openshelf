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

// Send staff invite email
const sendStaffInvite = async ({ to, role, token, inviterName }) => {
  const inviteUrl  = `${process.env.WEB_URL}/admin/accept-invite?token=${token}`
  const roleLabel  = role === 'ADMIN' ? 'Administrator' : 'Moderator'
  const roleColor  = role === 'ADMIN' ? '#991b1b' : '#92400e'
  const roleBg     = role === 'ADMIN' ? '#fee2e2' : '#fef3c7'

  await sendEmail({
    to,
    subject: `You've been invited to join OpenShelf as a ${roleLabel}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1e40af;margin-bottom:8px">You're invited to OpenShelf</h2>
        <p style="color:#374151;margin-bottom:8px">
          <strong>${inviterName}</strong> has invited you to join the OpenShelf team.
        </p>

        <div style="display:inline-block;padding:4px 12px;border-radius:999px;margin-bottom:24px;
                    background:${roleBg};color:${roleColor};font-weight:600;font-size:14px">
          ${roleLabel}
        </div>

        <p style="color:#374151;margin-bottom:24px">
          Click the button below to set up your account. This invite expires in
          <strong>48 hours</strong>.
        </p>

        <a href="${inviteUrl}"
          style="display:block;text-align:center;background:#1e40af;color:#ffffff;
                 padding:14px 24px;border-radius:12px;text-decoration:none;
                 font-weight:600;font-size:16px;margin-bottom:24px">
          Accept Invite
        </a>

        <p style="color:#6b7280;font-size:13px;margin-bottom:8px">
          Or copy this link into your browser:
        </p>
        <p style="color:#1e40af;font-size:12px;word-break:break-all;margin-bottom:24px">
          ${inviteUrl}
        </p>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin-bottom:24px" />

        <p style="color:#6b7280;font-size:12px">
          If you weren't expecting this invite, you can safely ignore this email.
          The link will expire automatically.
        </p>
      </div>
    `,
  })
}

// Notify uploader when their resource is published
const sendResourcePublished = async ({ to, title }) => {
  await sendEmail({
    to,
    subject: `Your submission "${title}" has been published on OpenShelf`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1e40af;margin-bottom:8px">Great news! 🎉</h2>
        <p style="color:#374151;margin-bottom:16px">
          Your submission <strong>"${title}"</strong> has been reviewed and
          is now live on OpenShelf. Readers around the world can access it.
        </p>

        <a href="${process.env.WEB_URL}/resources"
          style="display:block;text-align:center;background:#1e40af;color:#ffffff;
                 padding:14px 24px;border-radius:12px;text-decoration:none;
                 font-weight:600;font-size:15px;margin-bottom:24px">
          View on OpenShelf
        </a>

        <p style="color:#6b7280;font-size:13px">
          Thank you for contributing to OpenShelf's mission of freely accessible knowledge.
        </p>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />

        <p style="color:#9ca3af;font-size:12px">
          You're receiving this because you submitted a resource to OpenShelf.
        </p>
      </div>
    `,
  })
}

// Notify uploader when their resource is rejected
const sendResourceRejected = async ({ to, title, reason }) => {
  await sendEmail({
    to,
    subject: `Update on your OpenShelf submission: "${title}"`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#374151;margin-bottom:8px">Submission update</h2>
        <p style="color:#374151;margin-bottom:16px">
          Thank you for submitting <strong>"${title}"</strong> to OpenShelf.
          After review, our team was unable to publish this submission at this time.
        </p>

        ${reason ? `
        <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:12px;
                    padding:14px 16px;margin-bottom:20px">
          <p style="color:#92400e;font-size:13px;font-weight:600;margin-bottom:4px">
            Reason from our team:
          </p>
          <p style="color:#92400e;font-size:14px;margin:0">${reason}</p>
        </div>
        ` : ''}

        <p style="color:#374151;font-size:14px;margin-bottom:20px">
          You're welcome to make changes and resubmit. If you have questions,
          please reach out to our moderation team.
        </p>

        <a href="${process.env.WEB_URL}/upload"
          style="display:block;text-align:center;background:#374151;color:#ffffff;
                 padding:14px 24px;border-radius:12px;text-decoration:none;
                 font-weight:600;font-size:15px;margin-bottom:24px">
          Submit a new resource
        </a>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />

        <p style="color:#9ca3af;font-size:12px">
          You're receiving this because you submitted a resource to OpenShelf.
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
  sendStaffInvite,
  sendResourcePublished,
  sendResourceRejected,
}