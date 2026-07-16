import prisma from '../config/prisma.js';

// Get comments for a resource
const getResourceComments = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const resource = await prisma.resource.findUnique({ where: { slug } });
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    // Fetch all comments for this resource in one query
    const allComments = await prisma.comment.findMany({
      where: { resourceId: resource.id },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Build tree — top-level comments with nested replies
    const topLevel = allComments.filter((c) => !c.parentId);
    const replies = allComments.filter((c) => c.parentId);

    const tree = topLevel.map((comment) => ({
      ...comment,
      replies: replies.filter((r) => r.parentId === comment.id),
    }));

    res.json(tree);
  } catch (err) {
    next(err);
  }
};

// Post a comment
const createComment = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { body, parentId } = req.body;

    if (!body?.trim()) {
      return res.status(422).json({ message: 'Comment body is required' });
    }

    const resource = await prisma.resource.findUnique({ where: { slug } });
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    // If replying, verify parent belongs to the same resource
    if (parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: parentId },
      });
      if (!parent || parent.resourceId !== resource.id) {
        return res.status(400).json({ message: 'Invalid parent comment' });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        body: body.trim(),
        authorId: req.user.id,
        resourceId: resource.id,
        parentId: parentId || null,
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    res.status(201).json({ ...comment, replies: [] });
  } catch (err) {
    next(err);
  }
};

// Edit a comment
const updateComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { body } = req.body;

    if (!body?.trim()) {
      return res.status(422).json({ message: 'Comment body is required' });
    }

    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.authorId !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own comments' });
    }

    const updated = await prisma.comment.update({
      where: { id },
      data: { body: body.trim() },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// Delete a comment
const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const comment = await prisma.comment.findUnique({
      where: { id },
      include: { replies: { select: { id: true } } },
    });

    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const isAuthor = comment.authorId === req.user.id;
    const isPrivileged = ['ADMIN', 'MODERATOR'].includes(req.user.role);

    if (!isAuthor && !isPrivileged) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // If comment has replies, soft-delete by replacing body
    // This preserves thread structure
    if (comment.replies.length > 0) {
      await prisma.comment.update({
        where: { id },
        data: { body: '[deleted]', authorId: comment.authorId },
      });
    } else {
      await prisma.comment.delete({ where: { id } });
    }

    res.json({ message: 'Comment deleted' });
  } catch (err) {
    next(err);
  }
};

export { getResourceComments, createComment, updateComment, deleteComment };
