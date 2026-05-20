const crypto    = require('crypto')
const prisma    = require('../config/prisma')
const bcrypt    = require('bcryptjs')
const emailSvc  = require('./email.service')

// Invite a new staff member
const inviteStaff = async ({ email, role, invitedById }) => {
  if (!['ADMIN', 'MODERATOR'].includes(role)) {
    throw Object.assign(new Error('Role must be ADMIN or MODERATOR'), { status: 400 })
  }

  // If the email already belongs to a registered user, just promote them
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    if (['ADMIN', 'MODERATOR'].includes(existing.role)) {
      throw Object.assign(
        new Error(`${email} is already a staff member with role ${existing.role}`),
        { status: 409 }
      )
    }

    await prisma.user.update({
      where: { id: existing.id },
      data:  { role },
    })

    return { promoted: true, message: `${existing.name} has been promoted to ${role}` }
  }

  // Check for an existing pending invite to this email
  const pendingInvite = await prisma.staffInvite.findFirst({
    where: { email, usedAt: null, expiresAt: { gt: new Date() } },
  })
  if (pendingInvite) {
    throw Object.assign(
      new Error(`A pending invite already exists for ${email}. It expires in 48 hours.`),
      { status: 409 }
    )
  }

  // Generate a secure random token — store only the hash
  const rawToken  = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours

  const inviter = await prisma.user.findUnique({
    where:  { id: invitedById },
    select: { name: true },
  })

  await prisma.staffInvite.create({
    data: { email, role, tokenHash, expiresAt, invitedById },
  })

  await emailSvc.sendStaffInvite({
    to:          email,
    role,
    token:       rawToken,
    inviterName: inviter?.name ?? 'An admin',
  })

  return { promoted: false, message: `Invite sent to ${email}` }
}

// Accept an invite — set name + password, create account
const acceptInvite = async ({ token, name, password }) => {
  if (!token || !name || !password) {
    throw Object.assign(new Error('Token, name, and password are required'), { status: 400 })
  }

  if (password.length < 8) {
    throw Object.assign(new Error('Password must be at least 8 characters'), { status: 400 })
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

  const invite = await prisma.staffInvite.findUnique({ where: { tokenHash } })

  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    throw Object.assign(
      new Error('This invite link is invalid or has expired. Please ask an admin to send a new one.'),
      { status: 400 }
    )
  }

  // Check the email wasn't registered in the meantime
  const existing = await prisma.user.findUnique({ where: { email: invite.email } })
  if (existing) {
    // Mark invite as used and just promote
    await prisma.staffInvite.update({
      where: { id: invite.id },
      data:  { usedAt: new Date() },
    })
    await prisma.user.update({
      where: { id: existing.id },
      data:  { role: invite.role },
    })
    return { message: 'Account already exists — role has been updated. Please sign in.' }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  // Create the staff account and mark the invite as used atomically
  await prisma.$transaction([
    prisma.user.create({
      data: {
        name,
        email:           invite.email,
        passwordHash,
        role:            invite.role,
        isEmailVerified: true,  // staff accounts skip email verification
        isActive:        true,
      },
    }),
    prisma.staffInvite.update({
      where: { id: invite.id },
      data:  { usedAt: new Date() },
    }),
  ])

  return { message: 'Account created. You can now sign in through the admin portal.' }
}

// List all current staff
const listStaff = async () => {
  const [staff, pendingInvites] = await Promise.all([
    prisma.user.findMany({
      where:   { role: { in: ['ADMIN', 'MODERATOR'] } },
      select:  {
        id: true, name: true, email: true, role: true,
        isActive: true, createdAt: true,
        sentInvites: {
          where:   { usedAt: { not: null } },
          select:  { email: true, role: true, usedAt: true },
          orderBy: { usedAt: 'desc' },
          take:    3,
        },
      },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.staffInvite.findMany({
      where:   { usedAt: null, expiresAt: { gt: new Date() } },
      select:  {
        id: true, email: true, role: true,
        expiresAt: true, createdAt: true,
        invitedBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return { staff, pendingInvites }
}

// Revoke staff access — demote back to USER
const revokeStaff = async ({ targetId, requestingUserId }) => {
  if (targetId === requestingUserId) {
    throw Object.assign(new Error('You cannot revoke your own staff access'), { status: 400 })
  }

  const target = await prisma.user.findUnique({ where: { id: targetId } })
  if (!target) {
    throw Object.assign(new Error('User not found'), { status: 404 })
  }
  if (!['ADMIN', 'MODERATOR'].includes(target.role)) {
    throw Object.assign(new Error('User is not a staff member'), { status: 400 })
  }

  // Revoke all active refresh tokens so they're logged out immediately
  await prisma.refreshToken.updateMany({
    where: { userId: targetId, revokedAt: null },
    data:  { revokedAt: new Date() },
  })

  const updated = await prisma.user.update({
    where:  { id: targetId },
    data:   { role: 'USER' },
    select: { id: true, name: true, email: true, role: true },
  })

  return updated
}

// Cancel a pending invite
const cancelInvite = async (inviteId) => {
  const invite = await prisma.staffInvite.findUnique({ where: { id: inviteId } })
  if (!invite) {
    throw Object.assign(new Error('Invite not found'), { status: 404 })
  }
  if (invite.usedAt) {
    throw Object.assign(new Error('Invite has already been used'), { status: 400 })
  }

  // Mark as used with a past date — effectively cancels it
  await prisma.staffInvite.update({
    where: { id: inviteId },
    data:  { usedAt: new Date() },
  })

  return { message: 'Invite cancelled' }
}

module.exports = { inviteStaff, acceptInvite, listStaff, revokeStaff, cancelInvite }