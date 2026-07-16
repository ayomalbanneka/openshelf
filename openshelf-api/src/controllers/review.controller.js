import prisma from '../config/prisma.js';

const getReviews = async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { resource: { slug: req.params.slug } },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true } } },
    });
    res.json(reviews);
  } catch (err) {
    next(err);
  }
};

const createReview = async (req, res, next) => {
  try {
    const resource = await prisma.resource.findUnique({
      where: { slug: req.params.slug },
    });
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(422).json({ message: 'Rating must be between 1 and 5' });
    }

    const review = await prisma.review.create({
      data: {
        userId: req.user.id,
        resourceId: resource.id,
        rating: Number(rating),
        comment,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    res.status(201).json(review);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'You have already reviewed this resource' });
    }
    next(err);
  }
};

const addBookmark = async (req, res, next) => {
  try {
    const resource = await prisma.resource.findUnique({
      where: { slug: req.params.slug },
    });
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    await prisma.bookmark.create({
      data: { userId: req.user.id, resourceId: resource.id },
    });
    res.status(201).json({ message: 'Bookmarked' });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'Already bookmarked' });
    }
    next(err);
  }
};

const removeBookmark = async (req, res, next) => {
  try {
    const resource = await prisma.resource.findUnique({
      where: { slug: req.params.slug },
    });
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    await prisma.bookmark.delete({
      where: {
        userId_resourceId: { userId: req.user.id, resourceId: resource.id },
      },
    });
    res.json({ message: 'Bookmark removed' });
  } catch (err) {
    next(err);
  }
};

const getBookmarkStatus = async (req, res, next) => {
  try {
    const resource = await prisma.resource.findUnique({
      where: { slug: req.params.slug },
      select: { id: true },
    });
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_resourceId: { userId: req.user.id, resourceId: resource.id },
      },
      select: { id: true },
    });

    res.json({ bookmarked: Boolean(bookmark) });
  } catch (err) {
    next(err);
  }
};

export { getReviews, createReview, addBookmark, removeBookmark, getBookmarkStatus };
