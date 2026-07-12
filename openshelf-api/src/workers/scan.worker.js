const { Worker }        = require('bullmq')
const redis             = require('../config/redis')
const prisma            = require('../config/prisma')
const { scanBuffer }    = require('../services/clamav.service')
const { s3, BUCKET, PUBLIC_URL } = require('../config/storage')
const {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require('@aws-sdk/client-s3')

const worker = new Worker('scan', async (job) => {
  const { resourceId, fileUrl } = job.data

  // ── 1. Fetch the file buffer from MinIO ─────────────────────────────────
  const key = fileUrl.replace(`${PUBLIC_URL}/`, '')

  let buffer
  try {
    const response = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
    const chunks = []
    for await (const chunk of response.Body) chunks.push(chunk)
    buffer = Buffer.concat(chunks)
  } catch (err) {
    await prisma.resource.update({
      where: { id: resourceId },
      data:  { scanStatus: 'ERROR', scanError: `Failed to fetch file: ${err.message}` },
    })
    throw err // let BullMQ retry
  }

  // ── 2. Scan ───────────────────────────────────────────────────────────────
  let scanResult
  try {
    scanResult = await scanBuffer(buffer)
  } catch (err) {
    await prisma.resource.update({
      where: { id: resourceId },
      data:  { scanStatus: 'ERROR', scanError: `Scan failed: ${err.message}` },
    })
    throw err
  }

  const { isInfected, viruses } = scanResult

  // ── 3a. Clean — mark and move on ─────────────────────────────────────────
  if (!isInfected) {
    await prisma.resource.update({
      where: { id: resourceId },
      data:  { scanStatus: 'CLEAN', scanError: null },
    })
    console.log(`[scan.worker] CLEAN — resource ${resourceId}`)
    return
  }

  // ── 3b. Infected — quarantine ─────────────────────────────────────────────
  console.warn(`[scan.worker] INFECTED — resource ${resourceId} — ${viruses.join(', ')}`)

  // Move file to quarantine prefix (inaccessible to public)
  const quarantineKey = key.replace(/^(resources\/)/, 'quarantine/')
  try {
    await s3.send(new CopyObjectCommand({
      Bucket:     BUCKET,
      CopySource: `${BUCKET}/${key}`,
      Key:        quarantineKey,
    }))
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
  } catch (err) {
    console.error(`[scan.worker] Failed to move file to quarantine:`, err.message)
    // Continue — still mark DB even if file move fails
  }

  const quarantineUrl = `${PUBLIC_URL}/${quarantineKey}`

  // Mark resource as infected + unpublish it
  await prisma.resource.update({
    where: { id: resourceId },
    data:  {
      scanStatus:  'INFECTED',
      scanError:   `Detected: ${viruses.join(', ')}`,
      isPublished: false,
      fileUrl:     quarantineUrl,
    },
  })

  // Write to audit log using the system admin (first ADMIN user)
  const systemAdmin = await prisma.user.findFirst({
    where:  { role: 'ADMIN' },
    select: { id: true },
  })
  if (systemAdmin) {
    await prisma.auditLog.create({
      data: {
        actorId:    systemAdmin.id,
        action:     'RESOURCE_QUARANTINED',
        targetType: 'Resource',
        targetId:   resourceId,
        metadata:   { viruses, quarantineUrl },
      },
    })
  }

  // Notify the uploader — their file was flagged
  const resource = await prisma.resource.findUnique({
    where:  { id: resourceId },
    select: { uploadedById: true, title: true },
  })
  if (resource) {
    const { notifyQueue } = require('../queues')
    await notifyQueue.add('scan-infected', {
      userId: resource.uploadedById,
      type:   'RESOURCE_REJECTED',
      title:  'Upload flagged for review',
      body:   `"${resource.title}" was flagged by our safety scanner and is under review.`,
      link:   '/dashboard',
    })
  }

}, {
  connection: redis,
  concurrency: 2, // scanning is I/O heavy — keep low
  // Retry up to 3 times with exponential backoff
  // (ClamAV may not be ready on first boot)
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
})

worker.on('failed', (job, err) => {
  console.error(`[scan.worker] Job ${job?.id} failed after all retries:`, err.message)
})

module.exports = worker