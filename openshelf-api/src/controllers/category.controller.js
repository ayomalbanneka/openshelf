const prisma = require('../config/prisma');

// Get all categories with their children, ordered by name
const list = async (req, res, next) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' },
            include: {
                children: {
                    orderBy: { name: 'asc' }
                },
            },
            where: {
                parentId: null // Only fetch top-level categories; children will be included via the 'include' option
            },
        });
        res.json(categories);
    } catch (err) {
        next(err);
    }
}

module.exports = {
    list
}