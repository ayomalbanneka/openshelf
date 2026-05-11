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
            preferredLanguage, avatarUrl,
        } = req.body

        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                ...(name !== undefined && { name }),
                ...(bio !== undefined && { bio }),
                ...(website !== undefined && { website }),
                ...(country !== undefined && { country }),
                ...(preferredLanguage !== undefined && { preferredLanguage }),
                ...(avatarUrl !== undefined && { avatarUrl }),
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
        const followers = await prisma.userFollow.findMany({
            where: { followingId: req.params.id },
            include: {
                follower: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                    bio: true,
                },
            },
            orderBy: { createdAt: 'desc' },
        })
        res.json(followers.map((f) => f.follower));
    } catch (err) {
        next(err);
    }
}

// Get following list
const getFollowing = async (req, res, next) => {
    try {
        const follows = await prisma.userFollow.findMany({
            where: { followerId: req.params.id },
            include: {
                following: {
                    select: { id: true, name: true, avatarUrl: true, bio: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        })
        res.json(follows.map((f) => f.following))
    } catch (err) { next(err) }
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

module.exports = {
    getProfile, updateProfile, changePassword,
    follow, unfollow, isFollowing,
    getFollowers, getFollowing,
    getUploads,
}