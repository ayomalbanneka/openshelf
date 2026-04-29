const prisma = require('../config/prisma');
const resourceService = require('../services/resource.service');
const emailSvc = require('../services/email.service');

// Admin Dashboard Stats
const getStats = async (req, res, next) => {
    try {
        const [
            totalUsers,
            totalResources,
            publishedResources,
            pendingResources,
            totalReviews,
            totalClubs,
            recentUploads,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.resource.count(),
            prisma.resource.count({ where: { isPublished: true } }),
            prisma.resource.count({ where: { isPublished: false } }),
            prisma.review.count(),
            prisma.club.count(),
            prisma.resource.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    uploadedBy: { select: { id: true, name: true } },
                    category: { select: { name: true } },
                },
            }),
        ])

        res.json({
            stats: {
                totalUsers,
                totalResources,
                publishedResources,
                pendingResources,
                totalReviews,
                totalClubs,
            },
            recentUploads,
        })
    } catch (err) {
        next(err);
    }
}

// Get Pending Resources for Admin Review
const getPending = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const [resources, total] = await Promise.all([
            prisma.resource.findMany({
                where: { isPublished: false },
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'asc' },
                include: {
                    uploadedBy: { select: { id: true, name: true, email: true } },
                    category: { select: { id: true, name: true } },
                    _count: { select: { reviews: true } }
                },
            }),
            prisma.resource.count({ where: { isPublished: false } }),
        ])

        res.json({
            data: resources,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit)),
            }
        })
    } catch (err) {
        next(err);
    }
}

// Publish Resource
const publishResource = async (req, res, next) => {
    try {
        const resources = await resourceService.publishById(req.params.id)

        res.json(resources);
    } catch (err) {
        next(err);
    }
}

// Reject Resource (Delete)
const rejectResource = async (req, res, next) => {
    try {
        const { reason } = req.body;

        const resource = await prisma.resource.findUnique({
            where: { id: req.params.id },
        })

        if (!resource) {
            return res.status(404).json({ message: 'Resource not found' });
        }

        // Delete the resource — cascades to tags, bookmarks, etc.
        await prisma.resource.delete({ where: { id: req.params.id } });

        res.json({ message: 'Resource rejected and deleted successfully', reason });
    } catch (err) {
        next(err);
    }
}

// Get Users with Pagination and Search
const getUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        // Build search filter
        const where = search
            ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {}

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true, name: true, email: true, role: true, createdAt: true,
                    _count: { select: { uploads: true } },
                }
            }),
            prisma.user.count({ where }),
        ])

        res.json({
            data: users,
            meta: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            }
        })
    } catch (err) {
        next(err);
    }
}

// Update User Role
const updateUserRole = async (req, res, next) => {
    try {
        const { role } = req.body;

        if (!['ADMIN', 'MODERATOR', 'USER'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role specified' });
        }

        // Prevent changing own role
        if (req.user.id === req.params.id) {
            return res.status(400).json({ message: 'You cannot change your own role' });
        }

        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: { role },
            select: { id: true, name: true, email: true, role: true }
        })

        res.json(user)
    } catch (err) {
        next(err);
    }
}

const toggleUserActive = async (req, res, next) => {
    try {
        if (req.params.id === req.user.id) {
            return res.status(400).json({ message: 'You cannot deactivate yourself' })
        }

        const user = await prisma.user.findUnique({ where: { id: req.params.id } })
        if (!user) return res.status(404).json({ message: 'User not found' })

        const updated = await prisma.user.update({
            where: { id: req.params.id },
            data: { isActive: !user.isActive },
            select: { id: true, name: true, email: true, isActive: true },
        })

        // If the user was just deactivated, send them an email
        if (!updated.isActive) {
            const { reason } = req.body
            emailSvc.sendAccountBlockedEmail({
                to: user.email,
                name: user.name,
                reason: reason || 'Violation of community guidelines',
            }).catch(() => { }) // fire and forget
        }

        res.json(updated)
    } catch (err) { next(err) }
}

module.exports = {
    getStats,
    getPending,
    publishResource,
    rejectResource,
    getUsers,
    updateUserRole,
    toggleUserActive,
}