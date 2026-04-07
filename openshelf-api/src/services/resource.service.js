const prisma = require('../config/prisma')
const slugify = require('../utils/slugify')
const { uploadFile } = require('./storage.service')

// ── List ──────────────────────────────────────────────────────
const list = async ({ type, category, language, search, page = 1, limit = 20 }) => {
  const skip = (Number(page) - 1) * Number(limit)

  const where = {
    isPublished: true,
    ...(type && { type }),
    ...(language && { language }),
    ...(category && { category: { slug: category } }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
      ],
    }),
  }

  const [data, total] = await Promise.all([
    prisma.resource.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        uploadedBy: { select: { id: true, name: true } },
        tags: { include: { tag: true } },
        _count: { select: { reviews: true, bookmarks: true } },
      },
    }),
    prisma.resource.count({ where }),
  ])

  return {
    data,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
  }
}

// ── Get one ───────────────────────────────────────────────────
const getOne = async (slug) => {
  const resource = await prisma.resource.findUnique({
    where: { slug },
    include: {
      category: true,
      uploadedBy: { select: { id: true, name: true, avatarUrl: true } },
      tags: { include: { tag: true } },
      examPaper: true,
      _count: { select: { reviews: true, bookmarks: true } },
    },
  })

  if (!resource) {
    const err = new Error('Resource not found')
    err.status = 404
    throw err
  }

  // Increment view count — fire and forget, don't await
  prisma.resource.update({
    where: { id: resource.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => { })

  return resource
}

// ── Create ────────────────────────────────────────────────────
const create = async (data, file, userId) => {
  const {
    title, description, type, language = 'en',
    pageCount, duration,
    author, publisher, isbn, edition, publicationYear,
    categoryId, tagIds = [],
  } = data

  // These three come from the file object, not the form body
  const fileUrl  = await uploadFile(file, `resources/${type.toLowerCase()}`)
  const fileSize = file.size
  const mimeType = file.mimetype

  let slug = slugify(title)
  const existing = await prisma.resource.findUnique({ where: { slug } })
  if (existing) slug = `${slug}-${Date.now().toString(36)}`

  const resource = await prisma.resource.create({
    data: {
      title,
      slug,
      description,
      type,
      language,
      fileUrl,
      fileSize,
      mimeType,
      pageCount:       pageCount       ? Number(pageCount)       : null,
      duration:        duration        ? Number(duration)        : null,
      publicationYear: publicationYear ? Number(publicationYear) : null,
      author,
      publisher,
      isbn,
      edition,
      uploadedById: userId,
      categoryId,
      isPublished: false,
      tags: tagIds.length
        ? {
            create: JSON.parse(tagIds).map((tagId) => ({
              tag: { connect: { id: tagId } },
            }))
          }
        : undefined,
    },
    include: {
      category:   { select: { id: true, name: true, slug: true } },
      uploadedBy: { select: { id: true, name: true } },
      tags:       { include: { tag: true } },
    },
  })

  return resource
}

// ── Update ────────────────────────────────────────────────────
const update = async (slug, data, requestingUser) => {
  const resource = await prisma.resource.findUnique({ where: { slug } })

  if (!resource) {
    const err = new Error('Resource not found')
    err.status = 404
    throw err
  }

  // Only the uploader or an admin/moderator can edit
  const isOwner = resource.uploadedById === requestingUser.id
  const isPrivileged = ['ADMIN', 'MODERATOR'].includes(requestingUser.role)

  if (!isOwner && !isPrivileged) {
    const err = new Error('Access denied')
    err.status = 403
    throw err
  }

  const {
    title, description, language, categoryId,
    author, publisher, isbn, edition, publicationYear,
  } = data

  const updated = await prisma.resource.update({
    where: { id: resource.id },
    data: {
      ...(title && { title, slug: slugify(title) }),
      description,
      language,
      categoryId,
      author,
      publisher,
      isbn,
      edition,
      publicationYear: publicationYear ? Number(publicationYear) : undefined,
    },
  })

  return updated
}

// ── Publish ───────────────────────────────────────────────────
const publish = async (slug) => {
  const resource = await prisma.resource.findUnique({ where: { slug } })

  if (!resource) {
    const err = new Error('Resource not found')
    err.status = 404
    throw err
  }

  return prisma.resource.update({
    where: { id: resource.id },
    data: { isPublished: true, publishedAt: new Date() },
  })
}

// ── Delete ────────────────────────────────────────────────────
const remove = async (slug, requestingUser) => {
  const resource = await prisma.resource.findUnique({ where: { slug } })

  if (!resource) {
    const err = new Error('Resource not found')
    err.status = 404
    throw err
  }

  const isOwner = resource.uploadedById === requestingUser.id
  const isPrivileged = ['ADMIN', 'MODERATOR'].includes(requestingUser.role)

  if (!isOwner && !isPrivileged) {
    const err = new Error('Access denied')
    err.status = 403
    throw err
  }

  // Delete the file from storage before removing the database record
  await deleteFile(resource.fileUrl)
  await prisma.resource.delete({ where: { id: resource.id } })
  return { message: 'Resource deleted' }
}

module.exports = { list, getOne, create, update, publish, remove }