import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding...');

  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const demoPassword = process.env.SEED_DEMO_PASSWORD;

  if (!adminPassword || !demoPassword) {
    throw new Error(
      'SEED_ADMIN_PASSWORD and SEED_DEMO_PASSWORD must be set in your .env before seeding.'
    );
  }

  // Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@openshelf.dev' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@openself.dev',
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: 'ADMIN',
      country: 'LK',
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'demo@openshelf.dev' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@openself.dev',
      passwordHash: await bcrypt.hash(demoPassword, 12),
      role: 'USER',
      bio: 'A curious reader from Sri Lanka.',
      country: 'LK',
    },
  });

  // Categories
  const fiction = await prisma.category.upsert({
    where: { slug: 'fiction' },
    update: {},
    create: {
      name: 'Fiction',
      slug: 'fiction',
      description: 'Novels, short stories and literary works',
    },
  });

  const academic = await prisma.category.upsert({
    where: { slug: 'academic' },
    update: {},
    create: {
      name: 'Academic',
      slug: 'academic',
      description: 'Textbooks, research papers and courses',
    },
  });

  // Child category
  await prisma.category.upsert({
    where: { slug: 'mathematics' },
    update: {},
    create: {
      name: 'Mathematics',
      slug: 'mathematics',
      parentId: academic.id,
    },
  });

  // Tags
  const tagNames = ['classic', 'beginner', 'advanced', 'free', 'popular'];
  for (const name of tagNames) {
    await prisma.tag.upsert({
      where: { slug: name },
      update: {},
      create: { name, slug: name },
    });
  }

  // A sample book resource
  await prisma.resource.upsert({
    where: { slug: 'introduction-to-algorithms' },
    update: {},
    create: {
      title: 'Introduction to algorithms',
      slug: 'introduction-to-algorithms',
      description: 'A comprehensive guide to algorithms and data structures.',
      type: 'BOOK',
      language: 'en',
      fileUrl: 'https://storage.openself.dev/books/intro-algorithms.pdf',
      pageCount: 1292,
      author: 'Thomas H. Cormen',
      publisher: 'MIT Press',
      publicationYear: 2009,
      isPublished: true,
      publishedAt: new Date(),
      uploadedById: admin.id,
      categoryId: academic.id,
    },
  });

  // A sample club
  const club = await prisma.club.upsert({
    where: { slug: 'classic-readers' },
    update: {},
    create: {
      name: 'Classic readers',
      slug: 'classic-readers',
      description: 'A club for lovers of classic literature.',
      isPublic: true,
      createdById: admin.id,
    },
  });

  // Add both users as members
  await prisma.clubMember.upsert({
    where: { clubId_userId: { clubId: club.id, userId: admin.id } },
    update: {},
    create: { clubId: club.id, userId: admin.id, role: 'OWNER' },
  });

  await prisma.clubMember.upsert({
    where: { clubId_userId: { clubId: club.id, userId: user.id } },
    update: {},
    create: { clubId: club.id, userId: user.id, role: 'MEMBER' },
  });

  console.log('Seed complete.');
  console.log('  Admin →  admin@openself.dev / admin1234');
  console.log('  User  →  demo@openself.dev  / demo1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
