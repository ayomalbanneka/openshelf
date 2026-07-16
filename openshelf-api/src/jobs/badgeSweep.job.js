import prisma from '../config/prisma.js';
import * as badgeService from '../services/badge.service.js';

const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

const sweep = async () => {
  console.log('[badgeSweep] Starting daily badge evaluation...');
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    const BATCH = 20;
    for (let i = 0; i < users.length; i += BATCH) {
      const batch = users.slice(i, i + BATCH);
      await Promise.all(batch.map((u) => badgeService.evaluateAndAward(u.id)));
    }

    console.log(`[badgeSweep] Evaluated ${users.length} users.`);
  } catch (err) {
    console.error('[badgeSweep] Error:', err.message);
  }
};

const start = () => {
  // Run once immediately on startup then every 24 hours
  sweep();
  return setInterval(sweep, INTERVAL_MS);
};

export { start };
