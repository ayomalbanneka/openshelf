const prisma = require('../config/prisma')
const resourceService = require('../services/resource.service')
const emailSvc = require('../services/email.service')
const { deleteFile } = require('../services/storage.service')
const staffService = require('../services/staff.service')
const { paginate, paginateMeta } = require('../utils/pagination')

const sanitizeBigInt = (value) => {
  if (typeof value === 'bigint') return Number(value)
  if (Array.isArray(value)) return value.map((item) => sanitizeBigInt(item))
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, sanitizeBigInt(val)])
    )
  }
  return value
}

// ── Dashboard Stats ──────────────────────────────────────────
const getStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalResources,
      publishedResources,
      pendingResources,
      totalReviews,
      totalClubs,
      totalTags,
      recentUploads,
      usersByRole,
      resourcesByType,
      uploadsByDay,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.resource.count(),
      prisma.resource.count({ where: { isPublished: true } }),
      prisma.resource.count({ where: { isPublished: false } }),
      prisma.review.count(),
      prisma.club.count(),
      prisma.tag.count(),
      prisma.resource.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedBy: { select: { id: true, name: true } },
          category: { select: { name: true } },
        },
      }),
      prisma.user.groupBy({ by: ['role'], _count: true }),
      prisma.resource.groupBy({ by: ['type'], _count: true }),
      // Uploads per day for last 7 days
      prisma.$queryRaw`
        SELECT
          DATE("createdAt") as date,
          COUNT(*) as count
        FROM resources
        WHERE "createdAt" >= NOW() - INTERVAL '7 days'
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
    ])

    res.json(sanitizeBigInt({
      stats: {
        totalUsers,
        totalResources,
        publishedResources,
        pendingResources,
        totalReviews,
        totalClubs,
        totalTags,
      },
      usersByRole,
      resourcesByType,
      uploadsByDay,
      recentUploads,
    }))
  } catch (err) {
    next(err)
  }
}

// ── Pending Resources ────────────────────────────────────────
const getPending = async (req, res, next) => {
  try {
    const { search } = req.query
    const { page, limit, skip, take } = paginate(req.query)

    const where = {
      isPublished: false,
      ...(search ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { author: { contains: search, mode: 'insensitive' } },
          { uploadedBy: { name: { contains: search, mode: 'insensitive' } } },
          { uploadedBy: { email: { contains: search, mode: 'insensitive' } } },
          { category: { name: { contains: search, mode: 'insensitive' } } },
        ],
      } : {}),
    }

    const [resources, total] = await Promise.all([
      prisma.resource.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'asc' },
        include: {
          uploadedBy: { select: { id: true, name: true, email: true } },
          category: { select: { id: true, name: true } },
          tags: { include: { tag: true } },
          _count: { select: { reviews: true } },
        },
      }),
      prisma.resource.count({ where }),
    ])

    res.json({
      data: resources,
      meta: paginateMeta(total, page, limit),
    })
  } catch (err) {
    next(err)
  }
}

// ── Publish Resource ─────────────────────────────────────────
const publishResource = async (req, res, next) => {
  try {
    const resource = await resourceService.publishById(req.params.id)
    res.json(resource)
  } catch (err) {
    next(err)
  }
}

// ── Reject Resource ──────────────────────────────────────────
const rejectResource = async (req, res, next) => {
  try {
    const { reason } = req.body || {}
    const resource = await prisma.resource.findUnique({
      where: { id: req.params.id },
      include: {
        lessons: true,
        uploadedBy: { select: { email: true } },
      },
    })
    if (!resource) return res.status(404).json({ message: 'Resource not found' })

    // Delete main file and thumbnail from storage before removing the DB record
    if (resource.fileUrl && resource.fileUrl !== 'course-content') {
      await deleteFile(resource.fileUrl)
    }
    if (resource.thumbnailUrl) {
      await deleteFile(resource.thumbnailUrl).catch(() => { })
    }

    // For courses: delete each lesson's file too
    if (resource.type === 'COURSE' && resource.lessons?.length) {
      await Promise.allSettled(
        resource.lessons
          .filter((l) => l.fileUrl && l.fileUrl !== 'pending')
          .map((l) => deleteFile(l.fileUrl))
      )
    }

    if (resource.uploadedBy?.email) {
      emailSvc.sendResourceRejected({
        to: resource.uploadedBy.email,
        title: resource.title,
        reason: reason || null,
      }).catch((err) => console.error('Failed to send reject notification:', err))
    }

    await prisma.resource.delete({ where: { id: req.params.id } })
    res.json({ message: 'Resource rejected and deleted', reason })
  } catch (err) {
    next(err)
  }
}

// ── All Resources (published) ────────────────────────────────
const getResources = async (req, res, next) => {
  try {
    const { search, type } = req.query
    const { page, limit, skip, take } = paginate(req.query)

    const where = {
      isPublished: true,
      ...(type && { type }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { author: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    const [resources, total] = await Promise.all([
      prisma.resource.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedBy: { select: { id: true, name: true } },
          category: { select: { name: true } },
          _count: { select: { reviews: true, bookmarks: true } },
        },
      }),
      prisma.resource.count({ where }),
    ])

    res.json({ data: resources, meta: paginateMeta(total, page, limit) })
  } catch (err) {
    next(err)
  }
}

// ── Delete Published Resource ────────────────────────────────
const deleteResource = async (req, res, next) => {
  try {
    const resource = await prisma.resource.findUnique({
      where: { id: req.params.id },
      include: { lessons: true },
    })
    if (!resource) return res.status(404).json({ message: 'Resource not found' })

    // Delete main file and thumbnail from storage
    if (resource.fileUrl && resource.fileUrl !== 'course-content') {
      await deleteFile(resource.fileUrl)
    }
    if (resource.thumbnailUrl) {
      await deleteFile(resource.thumbnailUrl).catch(() => { })
    }

    // For courses: delete lesson files
    if (resource.type === 'COURSE' && resource.lessons?.length) {
      await Promise.allSettled(
        resource.lessons
          .filter((l) => l.fileUrl && l.fileUrl !== 'pending')
          .map((l) => deleteFile(l.fileUrl))
      )
    }

    await prisma.resource.delete({ where: { id: req.params.id } })
    res.json({ message: 'Resource deleted' })
  } catch (err) {
    next(err)
  }
}

// ── Users ────────────────────────────────────────────────────
const getUsers = async (req, res, next) => {
  try {
    const { search, role } = req.query
    const { page, limit, skip, take } = paginate(req.query)

    const where = {
      ...(role && { role }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, email: true, role: true,
          isActive: true, isEmailVerified: true,
          createdAt: true, country: true,
          _count: { select: { uploads: true, reviews: true, followers: true } },
        },
      }),
      prisma.user.count({ where }),
    ])

    res.json({ data: users, meta: paginateMeta(total, page, limit) })
  } catch (err) {
    next(err)
  }
}

// ── Update User Role ─────────────────────────────────────────
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body
    if (!['ADMIN', 'MODERATOR', 'USER'].includes(role))
      return res.status(400).json({ message: 'Invalid role' })
    if (req.user.id === req.params.id)
      return res.status(400).json({ message: 'Cannot change your own role' })

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    })
    res.json(user)
  } catch (err) {
    next(err)
  }
}

// ── Toggle User Active ───────────────────────────────────────
const toggleUserActive = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id)
      return res.status(400).json({ message: 'Cannot deactivate yourself' })

    const user = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!user) return res.status(404).json({ message: 'User not found' })

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: !user.isActive },
      select: { id: true, name: true, email: true, isActive: true },
    })

    if (!updated.isActive) {
      const { reason } = req.body
      emailSvc.sendAccountBlockedEmail({
        to: user.email, name: user.name,
        reason: reason || 'Violation of community guidelines',
      }).catch(() => { })
    }

    res.json(updated)
  } catch (err) {
    next(err)
  }
}

// ── Clubs ────────────────────────────────────────────────────
const getClubs = async (req, res, next) => {
  try {
    const { search } = req.query
    const { page, limit, skip, take } = paginate(req.query)

    const where = search
      ? { name: { contains: search, mode: 'insensitive' } }
      : {}

    const [clubs, total] = await Promise.all([
      prisma.club.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          _count: { select: { members: true, discussions: true } },
        },
      }),
      prisma.club.count({ where }),
    ])

    res.json({ data: clubs, meta: paginateMeta(total, page, limit) })
  } catch (err) {
    next(err)
  }
}

// ── Delete Club ──────────────────────────────────────────────
const deleteClub = async (req, res, next) => {
  try {
    const club = await prisma.club.findUnique({ where: { id: req.params.id } })
    if (!club) return res.status(404).json({ message: 'Club not found' })
    await prisma.club.delete({ where: { id: req.params.id } })
    res.json({ message: 'Club deleted' })
  } catch (err) {
    next(err)
  }
}

// ── Categories ───────────────────────────────────────────────
const getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        children: {
          orderBy: { name: 'asc' },
          include: { _count: { select: { resources: true } } },
        },
        _count: { select: { resources: true } },
      },
      where: { parentId: null },
    })
    res.json(categories)
  } catch (err) {
    next(err)
  }
}

const createCategory = async (req, res, next) => {
  try {
    const { name, description, parentId } = req.body
    if (!name?.trim()) return res.status(400).json({ message: 'Name is required' })

    const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const category = await prisma.category.create({
      data: { name: name.trim(), slug, description, parentId: parentId || null },
    })
    res.status(201).json(category)
  } catch (err) {
    next(err)
  }
}

const deleteCategory = async (req, res, next) => {
  try {
    const category = await prisma.category.findUnique({ where: { id: req.params.id } })
    if (!category) return res.status(404).json({ message: 'Category not found' })
    await prisma.category.delete({ where: { id: req.params.id } })
    res.json({ message: 'Category deleted' })
  } catch (err) {
    next(err)
  }
}

// ── Tags ─────────────────────────────────────────────────────
const getTags = async (req, res, next) => {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { resources: true } } },
    })
    res.json(tags)
  } catch (err) {
    next(err)
  }
}

const deleteTag = async (req, res, next) => {
  try {
    await prisma.tag.delete({ where: { id: req.params.id } })
    res.json({ message: 'Tag deleted' })
  } catch (err) {
    next(err)
  }
}

// ── Staff Management ─────────────────────────────────────────
const inviteStaff = async (req, res, next) => {
  try {
    const { email, role } = req.body
    if (!email || !role) {
      return res.status(400).json({ message: 'Email and role are required' })
    }
    const result = await staffService.inviteStaff({
      email,
      role,
      invitedById: req.user.id,
    })
    res.status(201).json(result)
  } catch (err) { next(err) }
}

const acceptInvite = async (req, res, next) => {
  try {
    const { token, name, password } = req.body
    const result = await staffService.acceptInvite({ token, name, password })
    res.json(result)
  } catch (err) { next(err) }
}

const listStaff = async (req, res, next) => {
  try {
    const result = await staffService.listStaff()
    res.json(result)
  } catch (err) { next(err) }
}

const revokeStaff = async (req, res, next) => {
  try {
    const result = await staffService.revokeStaff({
      targetId: req.params.id,
      requestingUserId: req.user.id,
    })
    res.json(result)
  } catch (err) { next(err) }
}

const cancelInvite = async (req, res, next) => {
  try {
    const result = await staffService.cancelInvite(req.params.id)
    res.json(result)
  } catch (err) { next(err) }
}

module.exports = {
  getStats,
  getPending, publishResource, rejectResource,
  getResources, deleteResource,
  getUsers, updateUserRole, toggleUserActive,
  getClubs, deleteClub,
  getCategories, createCategory, deleteCategory,
  getTags, deleteTag, inviteStaff, acceptInvite,
  listStaff, revokeStaff, cancelInvite,
}