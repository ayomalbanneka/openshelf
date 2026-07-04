const prisma = require('../config/prisma');
const { Prisma } = require('@prisma/client');
const slugify = require('../utils/slugify');
const { uploadFile, deleteFile } = require('./storage.service');
const { validateFileBytes } = require('../utils/validateFileBytes');
const { paginate, paginateMeta } = require('../utils/pagination');
const { emailQueue, searchQueue, thumbnailQueue, notifyQueue } = require('../queues');

// List
const list = async ({ type, category, language, search, page = 1, limit = 20 }) => {
  const { page: safePage, limit: safeLimit, skip, take } = paginate({ page, limit })

  // ── Full-text search path
  if (search && search.trim().length > 0) {
    const term = search.trim()

    // Build optional filter fragments
    const typeFilter = type ? Prisma.sql`AND r.type::text = ${type}` : Prisma.empty
    const langFilter = language ? Prisma.sql`AND r.language = ${language}` : Prisma.empty
    const categoryFilter = category
      ? Prisma.sql`AND r."categoryId" = (SELECT id FROM categories WHERE slug = ${category} LIMIT 1)`
      : Prisma.empty

    // Use raw SQL for full-text search with ranking
    const searchResults = await prisma.$queryRaw`
    SELECT
      r.id,
      r.title,
      r.slug,
      r.description,
      r.type::text as type,
      r.language,
      r."fileUrl",
      r."fileSize",
      r."mimeType",
      r."thumbnailUrl",
      r."pageCount",
      r.duration,
      r."isPublished",
      r."publishedAt",
      r.author,
      r.publisher,
      r.isbn,
      r.edition,
      r."publicationYear",
      r."viewCount",
      r."downloadCount",
      r."uploadedById",
      r."categoryId",
      r."createdAt",
      r."updatedAt",
      ts_rank(r.search_vector, plainto_tsquery('english', ${term})) as rank
        FROM resources r
        WHERE
          r."isPublished" = true
          AND r.search_vector @@ plainto_tsquery('english', ${term})
          ${typeFilter}
          ${langFilter}
          ${categoryFilter}
        ORDER BY rank DESC
        LIMIT ${take}
        OFFSET ${skip}`;

    const countResult = await prisma.$queryRaw`
      SELECT COUNT(*) as total
      FROM resources r
      WHERE
        r."isPublished" = true
        AND r.search_vector @@ plainto_tsquery('english', ${term})
        ${typeFilter}
        ${langFilter}
        ${categoryFilter}
    `

    const total = Number(countResult[0]?.total ?? 0)

    // Enrich results with relations
    const ids = searchResults.map((r) => r.id)
    const enriched = await prisma.resource.findMany({
      where: { id: { in: ids } },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        uploadedBy: { select: { id: true, name: true } },
        tags: { include: { tag: true } },
        _count: { select: { reviews: true, bookmarks: true } },
      },
    })

    // Re-sort enriched results to match the rank order from the raw query
    const ranked = ids
      .map((id) => enriched.find((r) => r.id === id))
      .filter(Boolean)

    return {
      data: ranked,
      meta: paginateMeta(total, safePage, safeLimit),
    }
  }

  // Standard filter path (no search term)
  const where = {
    isPublished: true,
    ...(type && { type }),
    ...(language && { language }),
    ...(category && { category: { slug: category } }),
  }

  const [data, total] = await Promise.all([
    prisma.resource.findMany({
      where,
      skip,
      take,
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
    meta: paginateMeta(total, safePage, safeLimit),
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
      lessons: { orderBy: { sortOrder: 'asc' } },
      _count: { select: { reviews: true, bookmarks: true } },
    },
  })

  if (!resource) {
    const err = new Error('Resource not found')
    err.status = 404
    throw err
  }

  prisma.resource.update({
    where: { id: resource.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => { })

  return resource
}

// ── Create ────────────────────────────────────────────────────
const create = async (data, files, userId) => {
  const {
    title, description, type, language = 'en',
    pageCount, duration, author, publisher,
    isbn, edition, publicationYear, categoryId,
    tagIds = [], lessons,
  } = data

  const isCourse = type === 'COURSE'
  const uploadedFiles = Array.isArray(files) ? files : []

  const thumbnailFile = uploadedFiles.find((f) => f.fieldname === 'thumbnail')
  const mainFile = uploadedFiles.find((f) => f.fieldname === 'file')

  if (!isCourse && !mainFile) {
    const err = new Error('File is required'); err.status = 400; throw err
  }

  if (mainFile) await validateFileBytes(mainFile.buffer, 'file')
  if (thumbnailFile) await validateFileBytes(thumbnailFile.buffer, 'thumbnail')

  if (isCourse && lessons) {
    const lessonFiles = uploadedFiles.filter((f) => f.fieldname.startsWith('lessonFile_'))
    await Promise.all(lessonFiles.map((f) => validateFileBytes(f.buffer, f.fieldname)))
  }
  if (isCourse && !lessons) {
    const err = new Error('Course must have at least one lesson'); err.status = 400; throw err
  }

  // Upload thumbnail raw — worker will compress and replace it
  let thumbnailUrl = null
  if (thumbnailFile) {
    thumbnailUrl = await uploadFile(thumbnailFile, 'resources/thumbnails')
  }

  let fileUrl = 'course-content'
  let fileSize = 0
  let mimeType = 'application/octet-stream'

  if (mainFile) {
    fileUrl = await uploadFile(mainFile, `resources/${type.toLowerCase()}`)
    fileSize = mainFile.size
    mimeType = mainFile.mimetype
  }

  let slug = slugify(title)
  const existing = await prisma.resource.findUnique({ where: { slug } })
  if (existing) slug = `${slug}-${Date.now().toString(36)}`

  const parsedTagIds = Array.isArray(tagIds)
    ? tagIds
    : tagIds ? JSON.parse(tagIds) : []

  const resource = await prisma.resource.create({
    data: {
      title, slug, description, type, language,
      fileUrl, fileSize, mimeType, thumbnailUrl,
      pageCount: pageCount ? Number(pageCount) : null,
      duration: duration ? Number(duration) : null,
      publicationYear: publicationYear ? Number(publicationYear) : null,
      author, publisher, isbn, edition,
      uploadedById: userId,
      categoryId,
      isPublished: false,
      tags: parsedTagIds.length
        ? { create: parsedTagIds.map((tagId) => ({ tag: { connect: { id: tagId } } })) }
        : undefined,
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      uploadedBy: { select: { id: true, name: true } },
      tags: { include: { tag: true } },
    },
  })

  // Queue search indexing — non-blocking
  await searchQueue.add('upsert', { type: 'UPSERT', resourceId: resource.id })

  // Queue thumbnail compression — non-blocking
  if (thumbnailFile) {
    await thumbnailQueue.add('compress', {
      resourceId: resource.id,
      buffer: Array.from(thumbnailFile.buffer),
      originalName: thumbnailFile.originalname,
    })
  }

  if (isCourse && lessons) {
    const lessonsMeta = JSON.parse(lessons)
    await Promise.all(
      lessonsMeta.map(async (meta, i) => {
        const lessonFile = uploadedFiles.find((f) => f.fieldname === `lessonFile_${i}`)
        if (!lessonFile) {
          return prisma.lesson.create({
            data: {
              title: meta.title || `Lesson ${i + 1}`,
              sortOrder: i, duration: meta.duration || null,
              fileUrl: 'pending', resourceId: resource.id,
            },
          })
        }
        const lessonFileUrl = await uploadFile(lessonFile, 'resources/course/lessons')
        return prisma.lesson.create({
          data: {
            title: meta.title || `Lesson ${i + 1}`,
            sortOrder: i, duration: meta.duration || null,
            fileUrl: lessonFileUrl, fileSize: lessonFile.size,
            mimeType: lessonFile.mimetype, resourceId: resource.id,
          },
        })
      })
    )
  }

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
const publishById = async (id) => {
  const resource = await prisma.resource.findUnique({ where: { id } })
  if (!resource) {
    const err = new Error('Resource not found'); err.status = 404; throw err
  }

  const updated = await prisma.resource.update({
    where: { id: resource.id },
    data: { isPublished: true, publishedAt: new Date() },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      tags: { include: { tag: true } },
      uploadedBy: { select: { email: true, name: true } },
    },
  })

  // Queue search index update
  await searchQueue.add('upsert', { type: 'UPSERT', resourceId: updated.id })

  // Queue email notification
  if (updated.uploadedBy?.email) {
    await emailQueue.add('resource-published', {
      type: 'RESOURCE_PUBLISHED',
      payload: { to: updated.uploadedBy.email, title: updated.title },
    })
  }

  // Queue in-app notification
  await notifyQueue.add('resource-published', {
    userId: resource.uploadedById,
    type: 'RESOURCE_PUBLISHED',
    title: 'Your resource was published 🎉',
    body: `"${resource.title}" is now live on OpenShelf.`,
    link: `/resources/${resource.slug}`,
  })

  return updated
}

const publish = async (slug) => {
  const resource = await prisma.resource.findUnique({ where: { slug } })

  if (!resource) {
    const err = new Error('Resource not found')
    err.status = 404
    throw err
  }

  return publishById(resource.id)
}

// ── Delete ────────────────────────────────────────────────────
const remove = async (slug, requestingUser) => {
  const resource = await prisma.resource.findUnique({ where: { slug } })
  if (!resource) {
    const err = new Error('Resource not found'); err.status = 404; throw err
  }

  const isOwner      = resource.uploadedById === requestingUser.id
  const isPrivileged = ['ADMIN', 'MODERATOR'].includes(requestingUser.role)

  if (!isOwner && !isPrivileged) {
    const err = new Error('Access denied'); err.status = 403; throw err
  }

  await deleteFile(resource.fileUrl)
  await prisma.resource.delete({ where: { id: resource.id } })

  await searchQueue.add('delete', { type: 'DELETE', resourceId: resource.id })

  return { message: 'Resource deleted' }
}

module.exports = { list, getOne, create, update, publish, publishById, remove }