const prisma = require('../config/prisma');

// Get all reading lists for the authenticated user
const getMyLists = async (req, res, next) => {
    try {
        const lists = await prisma.readingList.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { items: true } } }
        })
        res.json(lists);
    } catch (err) {
        next(err);
    }
}

// Get all public reading lists for a specific user
const getUserLists = async (req, res, next) => {
    try {
        const lists = await prisma.readingList.findMany({
            where: { userId: req.params.userId, isPublic: true },
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { items: true } } }
        })
        res.json(lists);
    } catch (err) {
        next(err);
    }
}

// Get a single reading list by ID, including its items and the user who created it
const getOne = async (req, res, next) => {
    try {
        const list = await prisma.readingList.findUnique({
            where: { id: req.params.id },
            include: {
                user: { select: { id: true, name: true } },
                items: {
                    orderBy: { sortOrder: 'asc' },
                    include: {
                        resource: {
                            select: {
                                id: true, title: true, slug: true, thumbnailUrl: true, type: true,
                                author: true, language: true, _count: { select: { reviews: true } }
                            },
                        },
                    },
                },
                _count: { select: { items: true } }
            }
        })

        if (!list) return res.status(404).json({ message: 'Reading list not found' });

        // If the list is not public and the user is not the owner, return 403
        // Private lists are only visible to their owner
        if (!list.isPublic && list.userId !== req.user?.id) {
            return res.status(403).json({ message: 'This reading list is private' });
        }

        res.json(list);
    } catch (err) {
        next(err);
    }
}

// Create a new reading list for the authenticated user
const create = async (req, res, next) => {
    try {
        const { title, description, isPublic = true } = req.body;

        if (!title?.trim()) {
            return res.status(400).json({ message: 'Title is required' });
        }

        const list = await prisma.readingList.create({
            data: {
                title: title.trim(),
                description,
                isPublic,
                userId: req.user.id
            },
            include: { _count: { select: { items: true } } },
        })

        res.status(201).json(list);
    } catch (err) {
        next(err);
    }
}

// Update an existing reading list. Only the owner can update their list.
const update = async (req, res, next) => {
    try {
        const list = await prisma.readingList.findUnique({
            where: { id: req.params.id }
        })

        if (!list) return res.status(404).json({ message: 'Reading list not found' });
        if (!list.userId !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { title, description, isPublic } = req.body;

        const updated = await prisma.readingList.update({
            where: { id: req.params.id },
            data: {
                ...(title !== undefined && { title: title.trim() }),
                ...(description !== undefined && { description }),
                ...(isPublic !== undefined && { isPublic }),
            },
        })

        res.json(updated);
    } catch (err) { next(err) }
}

// Delete a reading list. Only the owner can delete their list.
const remove = async (req, res, next) => {
    try {
        const list = await prisma.readingList.findUnique({
            where: { id: req.params.id }
        })

        if (!list) return res.status(404).json({ message: 'Reading list not found' });
        if (list.userId !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await prisma.readingList.delete({ where: { id: req.params.id } });
        res.json({ message: 'Reading list deleted successfully' });
    } catch (err) { next(err); }
}

// Add an item to a reading list. Only the owner can add items to their list.
const addItem = async (req, res, next) => {
    try {
        const list = await prisma.readingList.findUnique({
            where: { id: req.params.id }
        })

        if (!list) return res.status(404).json({ message: 'Reading list not found' });
        if (list.userId !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const count = await prisma.readingListItem.count({
            where: { listId: list.id }
        })

        const item = await prisma.readingListItem.create({
            data: {
                listId: list.id,
                resourceId: req.body.resourceId,
                note: req.body.note,
                sortOrder: count
            },
            include: {
                resource: {
                    select: {
                        id: true, title: true, slug: true,
                        type: true, thumbnailUrl: true, author: true
                    },
                },
            },
        })

        res.status(201).json(item);
    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(400).json({ message: 'This resource is already in the reading list' });
        }
        next(err);
    }
}

const removeItem = async (req, res, next) => {
    try {
        const list = await prisma.readingList.findUnique({
            where: { id: req.params.id },
        })

        if (!list) return res.status(404).json({ message: 'Reading list item not found' });
        if (list.userId !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await prisma.readingListItem.delete({
            where: { id: req.params.itemId }
        })

        res.json({ message: 'Item removed from reading list' });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getMyLists, getUserLists, getOne,
    create, update, remove,
    addItem, removeItem,
}