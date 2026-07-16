// src/workers/notify.worker.js
import { Worker } from 'bullmq';
import redis from '../config/redis.js';
import * as notifSvc from '../services/notification.service.js';

const worker = new Worker(
  'notify',
  async (job) => {
    const { userId, type, title, body, link } = job.data;
    await notifSvc.notify({ userId, type, title, body, link });
  },
  {
    connection: redis,
    concurrency: 10,
  }
);

worker.on('failed', (job, err) => {
  console.error(`[notify.worker] Job ${job?.id} failed:`, err.message);
});

export default worker;
