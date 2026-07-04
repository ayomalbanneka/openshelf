// src/workers/notify.worker.js
const { Worker } = require('bullmq')
const redis      = require('../config/redis')
const notifSvc   = require('../services/notification.service')

const worker = new Worker('notify', async (job) => {
  const { userId, type, title, body, link } = job.data
  await notifSvc.notify({ userId, type, title, body, link })
}, {
  connection: redis,
  concurrency: 10,
})

worker.on('failed', (job, err) => {
  console.error(`[notify.worker] Job ${job?.id} failed:`, err.message)
})

module.exports = worker