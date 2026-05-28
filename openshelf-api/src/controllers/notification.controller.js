const notifSvc = require('../services/notification.service')
const { paginate } = require('../utils/pagination')

const getMyNotifications = async (req, res, next) => {
  try {
    const { page, limit } = paginate(req.query)
    const result = await notifSvc.getNotifications(req.user.id, { page, limit })
    res.json(result)
  } catch (err) { next(err) }
}

const markRead = async (req, res, next) => {
  try {
    await notifSvc.markRead(req.user.id, req.params.id)
    res.json({ message: 'Marked as read' })
  } catch (err) { next(err) }
}

const markAllRead = async (req, res, next) => {
  try {
    await notifSvc.markAllRead(req.user.id)
    res.json({ message: 'All marked as read' })
  } catch (err) { next(err) }
}

const deleteNotification = async (req, res, next) => {
  try {
    await notifSvc.deleteNotification(req.user.id, req.params.id)
    res.json({ message: 'Notification deleted' })
  } catch (err) { next(err) }
}

module.exports = { getMyNotifications, markRead, markAllRead, deleteNotification }