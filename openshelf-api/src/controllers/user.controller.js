const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');

// Get user profile
const getProfile = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                name: true,
                bio: true,
                avatarUrl: true,
                website: true,
                country: true,
                createdAt: true,
                _count: {
                    select: {
                        uploads: true,
                        followers: true,
                        following: true,
                    },
                },
            },
        })

        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        next(err);
    }
}

// Update user profile
const updateProfile = async (req, res, next) => {
    try {
        const {
            name, bio, website, country,
            preferredLanguage,
        } = req.body

        // Validate website URL if provided
        if (website !== undefined && website !== '') {
            try {
                const parsed = new URL(website)
                if (!['http:', 'https:'].includes(parsed.protocol)) {
                    return res.status(400).json({ message: 'Website must be a valid http or https URL' })
                }
            } catch {
                return res.status(400).json({ message: 'Invalid website URL' })
            }
        }

        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                ...(name !== undefined && { name }),
                ...(bio !== undefined && { bio }),
                ...(website !== undefined && { website }),
                ...(country !== undefined && { country }),
                ...(preferredLanguage !== undefined && { preferredLanguage }),
                // avatarUrl is never accepted here
            },
            select: {
                id: true, name: true, email: true, bio: true,
                website: true, country: true, preferredLanguage: true,
                avatarUrl: true, role: true, isEmailVerified: true,
            },
        })

        res.json(user)
    } catch (err) { next(err) }
}

const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body

        if (!currentPassword || !newPassword) {
            return res.status(422).json({ message: 'Both passwords are required' })
        }

        if (newPassword.length < 8) {
            return res.status(422).json({
                message: 'New password must be at least 8 characters',
            })
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
        })

        const valid = await bcrypt.compare(currentPassword, user.passwordHash)
        if (!valid) {
            return res.status(400).json({ message: 'Current password is incorrect' })
        }

        const passwordHash = await bcrypt.hash(newPassword, 12)
        await prisma.user.update({
            where: { id: req.user.id },
            data: { passwordHash },
        })

        res.json({ message: 'Password changed successfully' })
    } catch (err) { next(err) }
}

// Follow another user
const follow = async (req, res, next) => {
    try {
        const followingId = req.params.id;

        if (followingId === req.user.id) {
            return res.status(400).json({ message: "You cannot follow yourself" });
        }

        // Check if target user exists
        const target = await prisma.user.findUnique({ where: { id: followingId } });
        if (!target) { return res.status(404).json({ message: "User not found" }); }

        await prisma.userFollow.create({
            data: { followerId: req.user.id, followingId },
        })

        await notifSvc.notify({
            userId: req.params.id,      // the person being followed
            type: 'NEW_FOLLOWER',
            title: 'New follower',
            body: `${req.user.name} started following you.`,
            link: `/user/${req.user.id}`,
        })

        res.status(201).json({ message: "Followed" });
    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(400).json({ message: "Already following" });
        }
        next(err);
    }
}

// Unfollow a user
const unfollow = async (req, res, next) => {
    try {
        await prisma.userFollow.delete({
            where: {
                followerId_followingId: {
                    followerId: req.user.id,
                    followingId: req.params.id
                }
            }
        })
        res.json({ message: "Unfollowed" });
    } catch (err) {
        next(err);
    }
}

// Check if current user is following another user
const isFollowing = async (req, res, next) => {
    try {
        const record = await prisma.userFollow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: req.user.id,
                    followingId: req.params.id
                }
            }
        })
        res.json({ isFollowing: !!record });
    } catch (err) {
        next(err);
    }
}

// Get followers of a user
const getFollowers = async (req, res, next) => {
    try {
        const { paginate, paginateMeta } = require('../utils/pagination')
        const { page, limit, skip, take } = paginate(req.query)

        const [followers, total] = await Promise.all([
            prisma.userFollow.findMany({
                where: { followingId: req.params.id },
                include: {
                    follower: {
                        select: { id: true, name: true, avatarUrl: true, bio: true }, // ← fix: add select
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take,
            }),
            prisma.userFollow.count({ where: { followingId: req.params.id } }),
        ])

        res.json({
            data: followers.map((f) => f.follower),
            meta: paginateMeta(total, page, limit),
        })
    } catch (err) {
        next(err)
    }
}

// Get following list
const getFollowing = async (req, res, next) => {
    try {
        const { paginate, paginateMeta } = require('../utils/pagination')
        const { page, limit, skip, take } = paginate(req.query)

        const [follows, total] = await Promise.all([
            prisma.userFollow.findMany({
                where: { followerId: req.params.id },
                include: {
                    following: {
                        select: { id: true, name: true, avatarUrl: true, bio: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take,
            }),
            prisma.userFollow.count({ where: { followerId: req.params.id } }),
        ])

        res.json({
            data: follows.map((f) => f.following),
            meta: paginateMeta(total, page, limit),
        })
    } catch (err) {
        next(err)
    }
}

// Get uploads of a user
const getUploads = async (req, res, next) => {
    try {
        const resources = await prisma.resource.findMany({
            where: {
                uploadedById: req.params.id,
                isPublished: true,
            },

            orderBy: { createdAt: 'desc' },
            include: {
                category: { select: { id: true, name: true, slug: true } },
                _count: { select: { reviews: true } },
            },
        })
        res.json(resources);
    } catch (err) {
        next(err);
    }
}

const getMyStats = async (req, res, next) => {
    try {
        const userId = req.user.id

        const [
            uploads,
            totalReviews,
            totalDownloads,
            pendingCount,
            publishedCount,
            followerCount,
            recentActivity,
            topResources,
        ] = await Promise.all([
            // All uploads including unpublished
            prisma.resource.count({ where: { uploadedById: userId } }),

            // Total reviews received across all resources
            prisma.review.count({
                where: { resource: { uploadedById: userId } },
            }),

            // Total download count across all published resources
            prisma.resource.aggregate({
                where: { uploadedById: userId, isPublished: true },
                _sum: { downloadCount: true },
            }),

            // Pending submissions
            prisma.resource.count({
                where: { uploadedById: userId, isPublished: false },
            }),

            // Published count
            prisma.resource.count({
                where: { uploadedById: userId, isPublished: true },
            }),

            // Followers
            prisma.userFollow.count({ where: { followingId: userId } }),

            // Recent 5 uploads with review counts
            prisma.resource.findMany({
                where: { uploadedById: userId },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    type: true,
                    isPublished: true,
                    downloadCount: true,
                    createdAt: true,
                    _count: { select: { reviews: true } },
                },
            }),

            // Top 5 resources by download count
            prisma.resource.findMany({
                where: { uploadedById: userId, isPublished: true },
                orderBy: { downloadCount: 'desc' },
                take: 5,
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    type: true,
                    downloadCount: true,
                    _count: { select: { reviews: true } },
                },
            }),
        ])

        res.json({
            overview: {
                totalUploads: uploads,
                publishedCount,
                pendingCount,
                totalReviews,
                totalDownloads: totalDownloads._sum.downloadCount ?? 0,
                followerCount,
            },
            recentActivity,
            topResources,
        })
    } catch (err) { next(err) }
}

module.exports = {
    getProfile, updateProfile, changePassword,
    follow, unfollow, isFollowing,
    getFollowers, getFollowing,
    getUploads, getMyStats,
}