import { Queue } from 'bullmq';
import redis from '../config/redis.js';

const CONNECTION = { connection: redis };

const emailQueue = new Queue('email', CONNECTION);
const searchQueue = new Queue('search', CONNECTION);
const thumbnailQueue = new Queue('thumbnail', CONNECTION);
const notifyQueue = new Queue('notify', CONNECTION);
const scanQueue = new Queue('scan', CONNECTION);

export { emailQueue, searchQueue, thumbnailQueue, notifyQueue, scanQueue };
