const { Worker } = require('bullmq')
const redis = require('../config/redis')
const searchService = require('../services/search.service')
const prisma = require('../config/prisma')

const worker = new Worker('search', async (job) => {
    const { type, resourceId } = job.data

    switch (type) {
        case 'UPSERT': {
            const resource = await prisma.resource.findUnique({
                where: { id: resourceId },
                include: {
                    category: { select: { id: true, name: true, slug: true } },
                    tags: { include: { tag: true } },
                },
            })
            if (resource) await searchService.updateResourceIndex(resource)
            break
        }
        case 'DELETE':
            await searchService.deleteResourceFromIndex(resourceId)
            break
        default:
            console.warn(`[search.worker] Unknown job type: ${type}`)
    }
}, {
    connection: redis,
    concurrency: 3,
})

worker.on('failed', (job, err) => {
    console.error(`[search.worker] Job ${job?.id} failed:`, err.message)
})

module.exports = worker