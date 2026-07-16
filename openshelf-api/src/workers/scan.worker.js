import { Worker } from 'bullmq';
import redis from '../config/redis.js';
import prisma from '../config/prisma.js';
import { scanBuffer } from '../services/clamav.service.js';
import { s3, BUCKET, PUBLIC_URL } from '../config/storage.js';
import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { notifyQueue } from '../queues/queues.js';

const worker = new Worker(
  'scan',
  async (job) => {
    const { resourceId, fileUrl } = job.data;

    // ── 1. Fetch the file buffer from MinIO ─────────────────────────────────
    const key = fileUrl.replace(`${PUBLIC_URL}/`, '');

    let buffer;
    try {
      const response = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
      const chunks = [];
      for await (const chunk of response.Body) chunks.push(chunk);
      buffer = Buffer.concat(chunks);
    } catch (err) {
      await prisma.resource.update({
        where: { id: resourceId },
        data: { scanStatus: 'ERROR', scanError: `Failed to fetch file: ${err.message}` },
      });
      throw err; // let BullMQ retry
    }

    // ── 2. Scan ───────────────────────────────────────────────────────────────
    let scanResult;
    try {
      scanResult = await scanBuffer(buffer);
    } catch (err) {
      await prisma.resource.update({
        where: { id: resourceId },
        data: { scanStatus: 'ERROR', scanError: `Scan failed: ${err.message}` },
      });
      throw err;
    }

    const { isInfected, viruses } = scanResult;

    // ── 3a. Clean — mark and move on ─────────────────────────────────────────
    if (!isInfected) {
      await prisma.resource.update({
        where: { id: resourceId },
        data: { scanStatus: 'CLEAN', scanError: null },
      });
      console.log(`[scan.worker] CLEAN — resource ${resourceId}`);
      return;
    }

    // ── 3b. Infected — quarantine ─────────────────────────────────────────────
    console.warn(`[scan.worker] INFECTED — resource ${resourceId} — ${viruses.join(', ')}`);

    const quarantineKey = key.replace(/^(resources\/)/, 'quarantine/');
    try {
      await s3.send(
        new CopyObjectCommand({
          Bucket: BUCKET,
          CopySource: `${BUCKET}/${key}`,
          Key: quarantineKey,
        })
      );
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    } catch (err) {
      console.error('[scan.worker] Failed to move file to quarantine:', err.message);
    }

    const quarantineUrl = `${PUBLIC_URL}/${quarantineKey}`;

    await prisma.resource.update({
      where: { id: resourceId },
      data: {
        scanStatus: 'INFECTED',
        scanError: `Detected: ${viruses.join(', ')}`,
        isPublished: false,
        fileUrl: quarantineUrl,
      },
    });

    const systemAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true },
    });
    if (systemAdmin) {
      await prisma.auditLog.create({
        data: {
          actorId: systemAdmin.id,
          action: 'RESOURCE_QUARANTINED',
          targetType: 'Resource',
          targetId: resourceId,
          metadata: { viruses, quarantineUrl },
        },
      });
    }

    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      select: { uploadedById: true, title: true },
    });
    if (resource) {
      await notifyQueue.add('scan-infected', {
        userId: resource.uploadedById,
        type: 'RESOURCE_REJECTED',
        title: 'Upload flagged for review',
        body: `"${resource.title}" was flagged by our safety scanner and is under review.`,
        link: '/dashboard',
      });
    }
  },
  {
    connection: redis,
    concurrency: 2,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    },
  }
);

worker.on('failed', (job, err) => {
  console.error(`[scan.worker] Job ${job?.id} failed after all retries:`, err.message);
});

export default worker;
