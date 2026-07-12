const prisma = require('../config/prisma')
const resourceService = require('../services/resource.service')
const emailSvc = require('../services/email.service')
const notifSvc = require('../services/notification.service')
const { deleteFile } = require('../services/storage.service')
const staffService = require('../services/staff.service')
const { paginate, paginateMeta } = require('../utils/pagination')
const { audit } = require('../utils/audit')

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

    await audit({
      actorId: req.user.id,
      action: 'RESOURCE_PUBLISHED',
      targetType: 'Resource',
      targetId: resource.id,
      targetName: resource.title,
    })

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

    await notifSvc.notify({
      userId: resource.uploadedById,
      type: 'RESOURCE_REJECTED',
      title: 'Submission update',
      body: `Your submission "${resource.title}" could not be published${reason ? `: ${reason}` : '.'}`,
    })

    await prisma.resource.delete({ where: { id: req.params.id } })

    await audit({
      actorId: req.user.id,
      action: 'RESOURCE_REJECTED',
      targetType: 'Resource',
      targetId: resource.id,
      targetName: resource.title,
      metadata: { reason: reason ?? null },
    })

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

    await audit({
      actorId: req.user.id,
      action: 'RESOURCE_DELETED',
      targetType: 'Resource',
      targetId: resource.id,
      targetName: resource.title,
    })

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
    const existing = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, role: true },
    })
    if (!existing) return res.status(404).json({ message: 'User not found' })

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
    })

    await audit({
      actorId: req.user.id,
      action: 'USER_ROLE_CHANGED',
      targetType: 'User',
      targetId: existing.id,
      targetName: existing.name,
      metadata: { oldRole: existing.role, newRole: role },
    })

    res.json(updated)
  } catch (err) { next(err) }
}

// ── Toggle User Active ───────────────────────────────────────
const toggleUserActive = async (req, res, next) => {
  try {
    const existing = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, isActive: true },
    })
    if (!existing) return res.status(404).json({ message: 'User not found' })

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: !existing.isActive },
    })

    await audit({
      actorId: req.user.id,
      action: existing.isActive ? 'USER_DEACTIVATED' : 'USER_ACTIVATED',
      targetType: 'User',
      targetId: existing.id,
      targetName: existing.name,
    })

    res.json(updated)
  } catch (err) { next(err) }
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

    await audit({
      actorId: req.user.id,
      action: 'CLUB_DELETED',
      targetType: 'Club',
      targetId: req.params.id,
      targetName: club.name,
    })

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

    await audit({
      actorId: req.user.id,
      action: 'CATEGORY_CREATED',
      targetType: 'Category',
      targetId: category.id,
      targetName: category.name,
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

    await audit({
      actorId: req.user.id,
      action: 'CATEGORY_DELETED',
      targetType: 'Category',
      targetId: req.params.id,
      targetName: category.name,
    })

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

    await audit({
      actorId: req.user.id,
      action: 'TAG_DELETED',
      targetType: 'Tag',
      targetId: req.params.id,
      targetName: tag.name,
    })

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
    const result = await staffService.cancelInvite(req.params.id, req.user.id)
    res.json(result)
  } catch (err) { next(err) }
}

// Bulk publish — MODERATOR + ADMIN
const bulkPublish = async (req, res, next) => {
  try {
    const { ids } = req.body
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'ids must be a non-empty array' })
    }
    if (ids.length > 50) {
      return res.status(400).json({ message: 'Cannot bulk publish more than 50 resources at once' })
    }

    const results = await Promise.allSettled(
      ids.map((id) => resourceService.publishById(id))
    )

    const succeeded = results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => r.value.id)

    const failed = results
      .filter((r) => r.status === 'rejected')
      .map((r, i) => ({ id: ids[i], reason: r.reason?.message }))

    await audit({
      actorId: req.user.id,
      action: 'RESOURCE_PUBLISHED',
      targetType: 'Resource',
      targetId: 'bulk',
      targetName: `Bulk publish: ${succeeded.length} resources`,
      metadata: { succeeded: succeeded.length, failed: failed.length },
    })

    res.json({ succeeded, failed, message: `${succeeded.length} published, ${failed.length} failed` })
  } catch (err) { next(err) }
}

// Bulk reject — MODERATOR + ADMIN
const bulkReject = async (req, res, next) => {
  try {
    const { ids, reason } = req.body
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'ids must be a non-empty array' })
    }
    if (ids.length > 50) {
      return res.status(400).json({ message: 'Cannot bulk reject more than 50 resources at once' })
    }

    const results = await Promise.allSettled(
      ids.map(async (id) => {
        const resource = await prisma.resource.findUnique({
          where: { id },
          include: { lessons: true, uploadedBy: { select: { email: true } } },
        })
        if (!resource) throw new Error('Not found')

        if (resource.fileUrl && resource.fileUrl !== 'course-content') {
          await deleteFile(resource.fileUrl)
        }
        if (resource.thumbnailUrl) {
          await deleteFile(resource.thumbnailUrl).catch(() => { })
        }
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
          }).catch(() => { })
        }
        await prisma.resource.delete({ where: { id } })
        return id
      })
    )

    const succeeded = results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => r.value)

    const failed = results
      .filter((r) => r.status === 'rejected')
      .map((r, i) => ({ id: ids[i], reason: r.reason?.message }))

    await audit({
      actorId: req.user.id,
      action: 'RESOURCE_REJECTED',
      targetType: 'Resource',
      targetId: 'bulk',
      targetName: `Bulk reject: ${succeeded.length} resources`,
      metadata: { succeeded: succeeded.length, failed: failed.length, reason },
    })

    res.json({ succeeded, failed, message: `${succeeded.length} rejected, ${failed.length} failed` })
  } catch (err) { next(err) }
}

const editResource = async (req, res, next) => {
  try {
    const {
      title, author, description,
      language, categoryId, publisher,
      publicationYear, pageCount,
    } = req.body

    const resource = await prisma.resource.findUnique({
      where: { id: req.params.id },
      select: { id: true, title: true },
    })
    if (!resource) return res.status(404).json({ message: 'Resource not found' })

    const updated = await prisma.resource.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(author !== undefined && { author }),
        ...(description !== undefined && { description }),
        ...(language !== undefined && { language }),
        ...(categoryId !== undefined && { categoryId }),
        ...(publisher !== undefined && { publisher }),
        ...(publicationYear !== undefined && { publicationYear: Number(publicationYear) }),
        ...(pageCount !== undefined && { pageCount: Number(pageCount) }),
      },
      include: {
        category: { select: { id: true, name: true } },
        uploadedBy: { select: { id: true, name: true } },
      },
    })

    // Update search index so changes are reflected immediately
    await resourceService.updateIndex?.(updated)

    await audit({
      actorId: req.user.id,
      action: 'RESOURCE_EDITED',
      targetType: 'Resource',
      targetId: resource.id,
      targetName: resource.title,
      metadata: { fields: Object.keys(req.body) },
    })

    res.json(updated)
  } catch (err) { next(err) }
}

const messageUser = async (req, res, next) => {
  try {
    const { subject, message } = req.body

    if (!subject?.trim() || !message?.trim()) {
      return res.status(400).json({ message: 'Subject and message are required' })
    }

    if (message.length > 2000) {
      return res.status(400).json({ message: 'Message cannot exceed 2000 characters' })
    }

    const target = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, email: true, isActive: true },
    })

    if (!target) return res.status(404).json({ message: 'User not found' })
    if (!target.isActive) return res.status(400).json({ message: 'Cannot message a deactivated user' })

    await emailSvc.sendAdminMessage({
      to: target.email,
      userName: target.name,
      subject: subject.trim(),
      message: message.trim(),
      senderName: req.user.name,
    })

    await audit({
      actorId: req.user.id,
      action: 'USER_MESSAGED',
      targetType: 'User',
      targetId: target.id,
      targetName: target.name,
      metadata: { subject: subject.trim() },
    })

    res.json({ message: `Message sent to ${target.name}` })
  } catch (err) { next(err) }
}

const getAuditLogs = async (req, res, next) => {
  try {
    const { paginate, paginateMeta } = require('../utils/pagination')
    const { action, actorId, targetType } = req.query
    const { page, limit, skip, take } = paginate(req.query)

    const where = {
      ...(action && { action }),
      ...(actorId && { actorId }),
      ...(targetType && { targetType }),
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { id: true, name: true, role: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ])

    res.json({ data: logs, meta: paginateMeta(total, page, limit) })
  } catch (err) { next(err) }
}

const getQuarantined = async (req, res, next) => {
  try {
    const resources = await prisma.resource.findMany({
      where:   { scanStatus: { in: ['INFECTED', 'ERROR'] } },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
        category:   { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })
    res.json(resources)
  } catch (err) {
    next(err)
  }
}

const releaseFromQuarantine = async (req, res, next) => {
  try {
    const { id } = req.params
    const { s3, BUCKET, PUBLIC_URL } = require('../config/storage')
    const { CopyObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3')

    const resource = await prisma.resource.findUnique({ where: { id } })
    if (!resource) return res.status(404).json({ message: 'Resource not found' })

    // Move file back from quarantine prefix to normal prefix
    const quarantineKey = resource.fileUrl.replace(`${PUBLIC_URL}/`, '')
    const restoredKey   = quarantineKey.replace(/^quarantine\//, 'resources/')

    await s3.send(new CopyObjectCommand({
      Bucket:     BUCKET,
      CopySource: `${BUCKET}/${quarantineKey}`,
      Key:        restoredKey,
    }))
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: quarantineKey }))

    const restoredUrl = `${PUBLIC_URL}/${restoredKey}`

    const updated = await prisma.resource.update({
      where: { id },
      data:  { scanStatus: 'CLEAN', scanError: null, fileUrl: restoredUrl },
    })

    await prisma.auditLog.create({
      data: {
        actorId:    req.user.id,
        action:     'RESOURCE_PUBLISHED', // closest existing AuditAction
        targetType: 'Resource',
        targetId:   id,
        targetName: resource.title,
        metadata:   { action: 'quarantine_released' },
      },
    })

    const { searchQueue } = require('../queues')
    await searchQueue.add('upsert', { type: 'UPSERT', resourceId: id })

    res.json(updated)
  } catch (err) {
    next(err)
  }
}

const deleteQuarantined = async (req, res, next) => {
  try {
    const { id } = req.params
    const { s3, BUCKET, PUBLIC_URL } = require('../config/storage')
    const { DeleteObjectCommand }    = require('@aws-sdk/client-s3')

    const resource = await prisma.resource.findUnique({ where: { id } })
    if (!resource) return res.status(404).json({ message: 'Resource not found' })

    const key = resource.fileUrl.replace(`${PUBLIC_URL}/`, '')
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key })).catch(() => {})

    await prisma.resource.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        actorId:    req.user.id,
        action:     'RESOURCE_DELETED',
        targetType: 'Resource',
        targetId:   id,
        targetName: resource.title,
        metadata:   { reason: 'malware_confirmed' },
      },
    })

    res.json({ message: 'Quarantined resource permanently deleted' })
  } catch (err) {
    next(err)
  }
}


module.exports = {
  getStats,
  getPending, publishResource, rejectResource,
  getResources, deleteResource,
  getUsers, updateUserRole, toggleUserActive,
  getClubs, deleteClub,
  getCategories, createCategory, deleteCategory,
  getTags, deleteTag, inviteStaff, acceptInvite,
  listStaff, revokeStaff, cancelInvite, bulkPublish, bulkReject,
  editResource, messageUser, getAuditLogs, getQuarantined, 
  releaseFromQuarantine,deleteQuarantined,
}