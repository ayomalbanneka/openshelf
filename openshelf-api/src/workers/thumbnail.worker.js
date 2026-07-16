import { Worker } from 'bullmq';
import redis from '../config/redis.js';
import prisma from '../config/prisma.js';
import { s3, BUCKET, PUBLIC_URL } from '../config/storage.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import crypto from 'crypto';

// Resize to a 400px-wide JPEG thumbnail — cheap and fast
const THUMB_WIDTH = 400;
const THUMB_QUALITY = 80;

const worker = new Worker(
  'thumbnail',
  async (job) => {
    const { resourceId, buffer, originalName } = job.data;

    // buffer arrives as a plain object after JSON serialisation — reconstruct it
    const fileBuffer = Buffer.from(buffer);

    const compressed = await sharp(fileBuffer)
      .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: THUMB_QUALITY, mozjpeg: true })
      .toBuffer();

    const key = `resources/thumbnails/${crypto.randomBytes(16).toString('hex')}.jpg`;

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: compressed,
        ContentType: 'image/jpeg',
      })
    );

    const thumbnailUrl = `${PUBLIC_URL}/${key}`;

    await prisma.resource.update({
      where: { id: resourceId },
      data: { thumbnailUrl },
    });

    console.log(`[thumbnail.worker] Generated thumbnail for resource ${resourceId}`);
  },
  {
    connection: redis,
    concurrency: 2, // sharp is CPU-bound — keep concurrency low
  }
);

worker.on('failed', (job, err) => {
  console.error(`[thumbnail.worker] Job ${job?.id} failed:`, err.message);
});

export default worker;
