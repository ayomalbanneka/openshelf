import prisma from '../config/prisma.js';
import slugify from '../utils/slugify.js';
import { paginate, paginateMeta } from '../utils/pagination.js';

// List public clubs with pagination and search
const list = async (req, res, next) => {
  try {
    const { search } = req.query;
    const { page, limit, skip, take } = paginate(req.query);

    const where = {
      isPublic: true,
      ...(search && {
        name: { contains: search, mode: 'insensitive' },
      }),
    };

    const [clubs, total] = await Promise.all([
      prisma.club.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, name: true } },
          _count: { select: { members: true, discussions: true } },
        },
      }),
      prisma.club.count({ where }),
    ]);

    res.json({
      data: clubs,
      meta: paginateMeta(total, page, limit),
    });
  } catch (err) {
    next(err);
  }
};

// Get club details by slug, including members and discussions count
const getOne = async (req, res, next) => {
  try {
    const club = await prisma.club.findUnique({
      where: { slug: req.params.slug },
      include: {
        createdBy: { select: { id: true, name: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { joinedAt: 'asc' },
        },
        _count: { select: { members: true, discussions: true } },
      },
    });

    if (!club) return res.status(404).json({ message: 'Club not found' });
    res.json(club);
  } catch (err) {
    next(err);
  }
};

// Create a new club with the authenticated user as the owner
const create = async (req, res, next) => {
  try {
    const { name, description, isPublic = true } = req.body;

    if (!name?.trim()) return res.status(400).json({ message: 'Name is required' });

    let slug = slugify(name);

    // Make slug unique by appending a timestamp if it already exists
    const existing = await prisma.club.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now().toString(36)}`;

    const club = await prisma.club.create({
      data: {
        name: name.trim(),
        slug,
        description,
        isPublic: Boolean(isPublic),
        createdById: req.user.id,

        members: {
          create: { userId: req.user.id, role: 'OWNER' },
        },
      },
      include: {
        _count: { select: { members: true, discussions: true } },
      },
    });
    res.status(201).json(club);
  } catch (err) {
    next(err);
  }
};

// Join a public club, preventing duplicates and private clubs
const join = async (req, res, next) => {
  try {
    const club = await prisma.club.findUnique({
      where: { slug: req.params.slug },
    });

    if (!club) return res.status(404).json({ message: 'Club not found' });
    if (!club.isPublic) return res.status(403).json({ message: 'Cannot join a private club' });

    await prisma.clubMember.create({
      data: { clubId: club.id, userId: req.user.id, role: 'MEMBER' },
    });

    res.status(201).json({ message: 'Joined club successfully' });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ message: 'Already a member of this club' });
    }
    next(err);
  }
};

// Leave a club, preventing owners from leaving without transferring ownership first
const leave = async (req, res, next) => {
  try {
    const club = await prisma.club.findUnique({
      where: { slug: req.params.slug },
    });

    if (!club) return res.status(404).json({ message: 'Club not found' });

    // Prevent leaving if not a member or if the user is the owner (must transfer ownership first)
    const membership = await prisma.clubMember.findUnique({
      where: { clubId_userId: { clubId: club.id, userId: req.user.id } },
    });

    if (!membership) {
      return res.status(400).json({ message: 'You are not a member of this club' });
    }

    if (membership.role === 'OWNER') {
      return res.status(403).json({
        message: 'Owners cannot leave the club. Please transfer ownership before leaving.',
      });
    }

    await prisma.clubMember.delete({
      where: { clubId_userId: { clubId: club.id, userId: req.user.id } },
    });

    res.json({ message: 'Left club successfully' });
  } catch (err) {
    next(err);
  }
};

// Get the membership status and role of the authenticated user in a club by slug
const getMembership = async (req, res, next) => {
  try {
    const club = await prisma.club.findUnique({
      where: { slug: req.params.slug },
    });

    if (!club) return res.status(404).json({ message: 'Club not found' });

    const membership = await prisma.clubMember.findUnique({
      where: { clubId_userId: { clubId: club.id, userId: req.user.id } },
    });

    res.json({
      isMember: !!membership,
      role: membership?.role || null,
    });
  } catch (err) {
    next(err);
  }
};

// Get a single discussion by ID
const getOneDiscussion = async (req, res, next) => {
  try {
    const discussion = await prisma.clubDiscussion.findUnique({
      where: { id: req.params.discussionId },
      include: {
        author: { select: { id: true, name: true } },
        resource: { select: { id: true, title: true, slug: true, type: true } },
        _count: { select: { comments: true } },
      },
    });

    if (!discussion) return res.status(404).json({ message: 'Discussion not found' });
    res.json(discussion);
  } catch (err) {
    next(err);
  }
};

// Get discussions for a club, including author info, resource info, and comments count
const getDiscussions = async (req, res, next) => {
  try {
    const club = await prisma.club.findUnique({
      where: { slug: req.params.slug },
    });

    if (!club) return res.status(404).json({ message: 'Club not found' });

    const disscussions = await prisma.clubDiscussion.findMany({
      where: { clubId: club.id },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, name: true } },
        resource: { select: { id: true, title: true, slug: true, type: true } },
        _count: { select: { comments: true } },
      },
    });

    res.json(disscussions);
  } catch (err) {
    next(err);
  }
};

// Create a new discussion in a club, only allowing members to post and validating input
const createDiscussion = async (req, res, next) => {
  try {
    const club = await prisma.club.findUnique({
      where: { slug: req.params.slug },
    });

    if (!club) return res.status(404).json({ message: 'Club not found' });

    // Only members can post
    const membership = await prisma.clubMember.findUnique({
      where: { clubId_userId: { clubId: club.id, userId: req.user.id } },
    });

    if (!membership) {
      return res.status(403).json({ message: 'Only club members can post discussions' });
    }

    const { title, body, resourceId } = req.body;

    if (!title?.trim()) return res.status(400).json({ message: 'Title is required' });
    if (!body?.trim()) return res.status(400).json({ message: 'Body is required' });

    const discussion = await prisma.clubDiscussion.create({
      data: {
        title: title.trim(),
        body: body.trim(),
        clubId: club.id,
        authorId: req.user.id,
        resourceId: resourceId || null,
      },
      include: {
        author: { select: { id: true, name: true } },
        resource: { select: { id: true, title: true, slug: true, type: true } },
        _count: { select: { comments: true } },
      },
    });

    res.status(201).json(discussion);
  } catch (err) {
    next(err);
  }
};

// Get comments for a discussion, including author info and ordered by creation date
const getComments = async (req, res, next) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { discussionId: req.params.discussionId },
      orderBy: { createdAt: 'asc' },
      include: { author: { select: { id: true, name: true } } },
    });

    res.json(comments);
  } catch (err) {
    next(err);
  }
};

// Create a new comment in a discussion, only allowing members to comment and validating input
const createComment = async (req, res, next) => {
  try {
    const { body } = req.body;
    if (!body?.trim()) {
      return res.status(422).json({ message: 'Comment body is required' });
    }

    const comment = await prisma.comment.create({
      data: {
        body: body.trim(),
        authorId: req.user.id,
        discussionId: req.params.discussionId,
      },
      include: { author: { select: { id: true, name: true } } },
    });

    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
};

export {
  list,
  getOne,
  create,
  join,
  leave,
  getMembership,
  getDiscussions,
  createDiscussion,
  getComments,
  createComment,
  getOneDiscussion,
};
