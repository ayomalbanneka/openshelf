const prisma = require('../config/prisma')

/**
 * Write an audit log entry.
 * Fire-and-forget safe — errors are logged but never thrown,
 * so a logging failure never blocks the actual admin action.
 *
 * @param {object} params
 * @param {string} params.actorId    - ID of the admin/moderator performing the action
 * @param {string} params.action     - AuditAction enum value
 * @param {string} params.targetType - Human label for the record type e.g. "Resource"
 * @param {string} params.targetId   - ID of the affected record
 * @param {string} [params.targetName] - Human-readable label e.g. resource title
 * @param {object} [params.metadata] - Any extra context
 */
const audit = async ({ actorId, action, targetType, targetId, targetName, metadata }) => {
  try {
    await prisma.auditLog.create({
      data: {
        actorId,
        action,
        targetType,
        targetId,
        targetName: targetName ?? null,
        metadata:   metadata   ?? undefined,
      },
    })
  } catch (err) {
    // Non-blocking — log to console but never propagate
    console.error('[audit] Failed to write audit log:', err.message, {
      actorId, action, targetType, targetId,
    })
  }
}

module.exports = { audit }