const { S3Client } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
    endpoint: process.env.STORAGE_ENDPOINT,
    region: process.env.STORAGE_REGION || 'ap-southeast-1',
    credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY,
        secretAccessKey: process.env.STORAGE_SECRET_KEY
    },
    // Required for MinIO — uses path-style URLs like
    // localhost:9000/bucket/key instead of bucket.localhost:9000/key
    forcePathStyle: true,
})

const BUCKET     = process.env.STORAGE_BUCKET     || 'openself'
const PUBLIC_URL = process.env.STORAGE_PUBLIC_URL || 'http://localhost:9000/openshelf'

module.exports = { s3, BUCKET, PUBLIC_URL }