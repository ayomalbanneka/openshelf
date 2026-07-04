const { Queue } = require('bullmq');
const redis = require('../config/redis');

const CONNECTION = { connection: redis };

const emailQueue = new Queue('email', CONNECTION);
const searchQueue = new Queue('search', CONNECTION);
const thumbnailQueue = new Queue('thumbnail', CONNECTION);
const notifyQueue = new Queue('notify', CONNECTION);

module.exports = { emailQueue, searchQueue, thumbnailQueue, notifyQueue };