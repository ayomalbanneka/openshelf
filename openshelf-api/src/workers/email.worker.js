import { Worker } from 'bullmq';
import redis from '../config/redis.js';
import * as emailSvc from '../services/email.service.js';

const worker = new Worker(
  'email',
  async (job) => {
    const { type, payload } = job.data;

    switch (type) {
      case 'RESOURCE_PUBLISHED':
        await emailSvc.sendResourcePublished(payload);
        break;
      case 'SUBSCRIPTION_RECEIPT':
        await emailSvc.sendSubscriptionReceipt(payload);
        break;
      case 'SUBSCRIPTION_CANCELED':
        await emailSvc.sendSubscriptionCanceled(payload);
        break;
      default:
        console.warn(`[email.worker] Unknown job type: ${type}`);
    }
  },
  {
    connection: redis,
    concurrency: 5,
  }
);

worker.on('failed', (job, err) => {
  console.error(`[email.worker] Job ${job?.id} failed:`, err.message);
});

export default worker;
