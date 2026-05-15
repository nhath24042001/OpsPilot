import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { env } from '../config/env.js';

export const s3Client = new S3Client({
  endpoint: env.MINIO_ENDPOINT,
  region: env.MINIO_REGION,
  forcePathStyle: true,
  credentials: {
    accessKeyId: env.MINIO_ACCESS_KEY,
    secretAccessKey: env.MINIO_SECRET_KEY,
  },
});

export const checkMinio = async () => {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: env.MINIO_BUCKET }));
    return true;
  } catch {
    return false;
  }
};
