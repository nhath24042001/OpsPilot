import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../../../../shared/config/env.js';
import { s3Client } from '../../../../shared/storage/minio.js';
import type { ObjectStoragePort } from '../../application/ports/object-storage.port.js';

const bodyToString = async (body: unknown): Promise<string> => {
  if (!body) {
    return '';
  }

  if (typeof body === 'object' && 'transformToString' in body) {
    const transformable = body as { transformToString: () => Promise<string> };
    return transformable.transformToString();
  }

  if (body instanceof Uint8Array) {
    return Buffer.from(body).toString('utf8');
  }

  throw new Error('Unsupported MinIO object body type');
};

export const minioObjectStorage: ObjectStoragePort = {
  async createUploadUrl(input) {
    const command = new PutObjectCommand({
      Bucket: env.MINIO_BUCKET,
      Key: input.objectKey,
      ContentType: input.contentType,
    });

    return {
      url: await getSignedUrl(s3Client, command, { expiresIn: input.expiresInSeconds }),
      method: 'PUT',
      expiresInSeconds: input.expiresInSeconds,
      headers: {
        'content-type': input.contentType,
      },
    };
  },

  async createDownloadUrl(input) {
    const command = new GetObjectCommand({
      Bucket: env.MINIO_BUCKET,
      Key: input.objectKey,
    });

    return {
      url: await getSignedUrl(s3Client, command, { expiresIn: input.expiresInSeconds }),
      method: 'GET',
      expiresInSeconds: input.expiresInSeconds,
    };
  },

  async readTextObject(objectKey) {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: env.MINIO_BUCKET,
        Key: objectKey,
      }),
    );

    return bodyToString(response.Body);
  },
};
