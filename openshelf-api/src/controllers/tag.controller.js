import prisma from '../config/prisma.js';

// List all tags ordered by name
const list = async (req, res, next) => {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(tags);
  } catch (err) {
    next(err);
  }
};

// Create a new tag (authenticated users only)
const create = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ message: 'Tag name is required' });
    }

    const slug = name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    const tag = await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: { name: name.trim(), slug },
    });

    res.status(201).json(tag);
  } catch (err) {
    next(err);
  }
};

export { list, create };
