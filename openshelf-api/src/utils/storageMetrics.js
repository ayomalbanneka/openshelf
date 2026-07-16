import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  endpoint: process.env.STORAGE_ENDPOINT,
  region: process.env.STORAGE_REGION || 'auto',
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY,
    secretAccessKey: process.env.STORAGE_SECRET_KEY,
  },
  forcePathStyle: true, // required for MinIO and R2
});

const BUCKET = process.env.STORAGE_BUCKET;
const PREFIXES = ['avatars/', 'resources/', 'thumbnails/'];

/**
 * List all objects under a given prefix, paginating through
 * as many pages as needed (ListObjectsV2 returns max 1000 per call).
 */
const listPrefix = async (prefix) => {
  let totalObjects = 0;
  let totalBytes = 0;
  let token = undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      ContinuationToken: token,
    });

    const response = await s3.send(command);

    for (const obj of response.Contents ?? []) {
      totalObjects += 1;
      totalBytes += obj.Size ?? 0;
    }

    token = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (token);

  return { objects: totalObjects, bytes: totalBytes };
};

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
};

const getStorageMetrics = async () => {
  if (!BUCKET) {
    throw new Error('STORAGE_BUCKET is not set');
  }

  // Query all prefixes in parallel
  const results = await Promise.allSettled(
    PREFIXES.map((prefix) => listPrefix(prefix).then((r) => ({ prefix, ...r })))
  );

  const byPrefix = {};
  let totalObjects = 0;
  let totalBytes = 0;

  for (const result of results) {
    if (result.status === 'fulfilled') {
      const { prefix, objects, bytes } = result.value;
      const key = prefix.replace('/', '');
      byPrefix[key] = {
        objects,
        bytes,
        formatted: formatBytes(bytes),
      };
      totalObjects += objects;
      totalBytes += bytes;
    } else {
      // Partial failure — log but don't crash
      console.error('[storageMetrics] Failed to list prefix:', result.reason?.message);
    }
  }

  return {
    totalObjects,
    totalBytes,
    totalFormatted: formatBytes(totalBytes),
    byPrefix,
    bucket: BUCKET,
    queriedAt: new Date().toISOString(),
  };
};

export { getStorageMetrics };
