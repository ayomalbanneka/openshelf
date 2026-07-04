const { Worker } = require('bullmq');
const redis = require('../config/redis');
const prisma = require('../config/prisma');
const { s3, BUCKET, PUBLIC_URL } = require('../config/storage');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const sharp = require('sharp');
const crypto = require('crypto');

// Resize to a 400px-wide JPEG thumbnail — cheap and fast
const THUMB_WIDTH = 400
const THUMB_QUALITY = 80

const worker = new Worker('thumbnail', async (job) => {
    const { resourceId, buffer, originalName } = job.data

    // buffer arrives as a plain object after JSON serialisation — reconstruct it
    const fileBuffer = Buffer.from(buffer)

    const compressed = await sharp(fileBuffer)
        .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
        .jpeg({ quality: THUMB_QUALITY, mozjpeg: true })
        .toBuffer()

    const key = `resources/thumbnails/${crypto.randomBytes(16).toString('hex')}.jpg`

    await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: compressed,
        ContentType: 'image/jpeg',
    }))

    const thumbnailUrl = `${PUBLIC_URL}/${key}`

    await prisma.resource.update({
        where: { id: resourceId },
        data: { thumbnailUrl },
    })

    console.log(`[thumbnail.worker] Generated thumbnail for resource ${resourceId}`)
}, {
    connection: redis,
    concurrency: 2, // sharp is CPU-bound — keep concurrency low
})

worker.on('failed', (job, err) => {
    console.error(`[thumbnail.worker] Job ${job?.id} failed:`, err.message)
})

module.exports = worker