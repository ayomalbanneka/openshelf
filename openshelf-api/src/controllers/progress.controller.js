import prisma from '../config/prisma.js';

// Get reading progress for a specific resource and user
const getProgress = async (req, res, next) => {
  try {
    const progress = await prisma.readingProgress.findUnique({
      where: {
        userId_resourceId: {
          userId: req.user.id,
          resourceId: req.params.resourceId,
        },
      },
    });
    res.json(progress || null);
  } catch (err) {
    next(err);
  }
};

// Update or create reading progress for a specific resource and user
const updateProgress = async (req, res, next) => {
  try {
    const { currentPage, totalPages, currentTime, totalTime } = req.body;
    const resourceId = req.params.resourceId;

    // Check if resource exists
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // calculate percentage
    let percentage = null;
    if (totalPages && currentPage) {
      percentage = Math.min((currentPage / totalPages) * 100, 100);
    } else if (totalTime && currentTime) {
      percentage = Math.min((currentTime / totalTime) * 100, 100);
    }

    const progress = await prisma.readingProgress.upsert({
      where: {
        userId_resourceId: {
          userId: req.user.id,
          resourceId,
        },
      },
      create: {
        userId: req.user.id,
        resourceId,
        currentPage: currentPage ? Number(currentPage) : 0,
        totalPages: totalPages ? Number(totalPages) : null,
        percentage: Math.round(percentage * 10) / 10, // round to 1 decimal place
        isCompleted: percentage >= 100,
        lastReadAt: new Date(),
      },
      update: {
        currentPage: currentPage ? Number(currentPage) : undefined,
        totalPages: totalPages ? Number(totalPages) : undefined,
        percentage: Math.round(percentage * 10) / 10,
        isCompleted: percentage >= 100,
        lastReadAt: new Date(),
      },
    });

    res.json(progress);
  } catch (err) {
    next(err);
  }
};

// Get recent reading progress for the authenticated user
const getMyProgress = async (req, res, next) => {
  try {
    const progress = await prisma.readingProgress.findMany({
      where: {
        userId: req.user.id,
        isCompleted: false,
        percentage: { gt: 0 },
      },

      orderBy: { lastReadAt: 'desc' },
      take: 10,
      include: {
        resource: {
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
            thumbnailUrl: true,
            author: true,
            language: true,
            pageCount: true,
          },
        },
      },
    });
    res.json(progress);
  } catch (err) {
    next(err);
  }
};

// Get completed resources for the authenticated user
const getCompleted = async (req, res, next) => {
  try {
    const completed = await prisma.readingProgress.findMany({
      where: {
        userId: req.user.id,
        isCompleted: true,
      },
      orderBy: { lastReadAt: 'desc' },
      include: {
        resource: {
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
            thumbnailUrl: true,
            author: true,
          },
        },
      },
    });
    res.json(completed);
  } catch (err) {
    next(err);
  }
};

export { getProgress, updateProgress, getMyProgress, getCompleted };
