import prisma from '../config/prisma.js';
import { BADGES } from '../config/badges.js';
import { notifyQueue } from '../queues/queues.js';

async function getUserStats(userId) {
  const [uploadStats, subscription] = await Promise.all([
    prisma.resource.aggregate({
      where: { uploadedById: userId, isPublished: true },
      _count: { id: true },
      _sum: { viewCount: true, downloadCount: true },
      _max: { viewCount: true, downloadCount: true },
    }),
    prisma.subscription.findUnique({
      where: { userId },
      select: { tier: true, status: true },
    }),
  ]);

  return {
    totalUploads: uploadStats._count.id ?? 0,
    totalViews: uploadStats._sum.viewCount ?? 0,
    totalDownloads: uploadStats._sum.downloadCount ?? 0,
    maxResourceViews: uploadStats._max.viewCount ?? 0,
    maxResourceDownloads: uploadStats._max.downloadCount ?? 0,
    subscriptionTier: subscription?.status === 'ACTIVE' ? subscription.tier : null,
  };
}

async function evaluateAndAward(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { badges: true, name: true },
  });

  if (!user) return [];

  const currentBadgeIds = new Set((user.badges ?? []).map((b) => b.id));

  const stats = await getUserStats(userId);
  const newBadges = [];

  for (const badge of BADGES) {
    if (currentBadgeIds.has(badge.id)) continue;
    if (!badge.condition(stats)) continue;

    newBadges.push({
      id: badge.id,
      awardedAt: new Date().toISOString(),
    });
  }

  if (newBadges.length === 0) return user.badges ?? [];

  const updateBadges = [...(user.badges ?? []), ...newBadges];

  await prisma.user.update({
    where: { id: userId },
    data: { badges: updateBadges },
  });

  await Promise.all(
    newBadges.map((b) => {
      const def = BADGES.find((d) => d.id === b.id);
      return notifyQueue.add('badge-awarded', {
        userId,
        type: 'NEW_FOLLOWER',
        title: `Badge unlocked: ${def.label} 🏅`,
        body: def.description,
        link: `/profile/${userId}`,
      });
    })
  );

  return updateBadges;
}

async function getBadgesForUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { badges: true },
  });

  const awarded = user?.badges ?? [];

  return BADGES.filter((def) => awarded.some((b) => b.id === def.id)).map((def) => ({
    ...def,
    awardedAt: awarded.find((b) => b.id === def.id)?.awardedAt ?? null,
    condition: undefined,
  }));
}

export { evaluateAndAward, getBadgesForUser, getUserStats };
