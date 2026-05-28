const prisma = require('../config/prisma')

/**
 * Create a notification for a user.
 * Fire-and-forget safe — never throws.
 */
const notify = async ({ userId, type, title, body, link }) => {
  try {
    await prisma.notification.create({
      data: { userId, type, title, body, link: link ?? null },
    })
  } catch (err) {
    console.error('[notify] Failed to create notification:', err.message)
  }
}

const getNotifications = async (userId, { page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take:    limit,
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ])

  return {
    data: notifications,
    meta: {
      total,
      unreadCount,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  }
}

const markRead = async (userId, notificationId) => {
  await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data:  { isRead: true },
  })
}

const markAllRead = async (userId) => {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data:  { isRead: true },
  })
}

const deleteNotification = async (userId, notificationId) => {
  await prisma.notification.deleteMany({
    where: { id: notificationId, userId },
  })
}

module.exports = { notify, getNotifications, markRead, markAllRead, deleteNotification }