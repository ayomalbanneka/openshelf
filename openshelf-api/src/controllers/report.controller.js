const prisma = require('../config/prisma')
const { paginate, paginateMeta } = require('../utils/pagination')
const { audit } = require('../utils/audit')

const VALID_REASONS = ['SPAM', 'COPYRIGHT', 'INAPPROPRIATE', 'MISINFORMATION', 'BROKEN_FILE', 'OTHER']

// POST /resources/:slug/report — authenticated users
const createReport = async (req, res, next) => {
  try {
    const { reason, details } = req.body

    if (!VALID_REASONS.includes(reason)) {
      return res.status(400).json({ message: 'Invalid report reason' })
    }

    const resource = await prisma.resource.findUnique({
      where: { slug: req.params.slug },
      select: { id: true, uploadedById: true },
    })

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' })
    }

    // Users can't report their own resources
    if (resource.uploadedById === req.user.id) {
      return res.status(400).json({ message: 'You cannot report your own resource' })
    }

    // Check for existing open report from this user
    const existing = await prisma.report.findUnique({
      where: {
        resourceId_reportedById: {
          resourceId: resource.id,
          reportedById: req.user.id,
        },
      },
    })

    if (existing) {
      return res.status(409).json({ message: 'You have already reported this resource' })
    }

    await prisma.report.create({
      data: {
        resourceId: resource.id,
        reportedById: req.user.id,
        reason,
        details: details?.trim() || null,
      },
    })

    res.status(201).json({ message: 'Report submitted. Our team will review it shortly.' })
  } catch (err) { next(err) }
}

// GET /admin/reports — admin/moderator only
const getReports = async (req, res, next) => {
  try {
    const { status = 'OPEN' } = req.query
    const { page, limit, skip, take } = paginate(req.query)

    const where = status === 'ALL' ? {} : { status }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          resource: { select: { id: true, title: true, slug: true, type: true } },
          reportedBy: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.report.count({ where }),
    ])

    res.json({
      data: reports,
      meta: paginateMeta(total, page, limit),
    })
  } catch (err) { next(err) }
}

// PATCH /admin/reports/:id — resolve or dismiss
const updateReport = async (req, res, next) => {
  try {
    const { status } = req.body

    if (!['RESOLVED', 'DISMISSED'].includes(status)) {
      return res.status(400).json({ message: 'Status must be RESOLVED or DISMISSED' })
    }

    const report = await prisma.report.findUnique({ where: { id: req.params.id } })
    if (!report) return res.status(404).json({ message: 'Report not found' })

    const updated = await prisma.report.update({
      where: { id: req.params.id },
      data: { status, resolvedAt: new Date() },
    })

    await audit({
      actorId: req.user.id,
      action: status === 'RESOLVED' ? 'REPORT_RESOLVED' : 'REPORT_DISMISSED',
      targetType: 'Report',
      targetId: report.id,
      targetName: `Report on resource ${report.resourceId}`,
      metadata: { status },
    })

    res.json(updated)
  } catch (err) { next(err) }
}

module.exports = { createReport, getReports, updateReport }