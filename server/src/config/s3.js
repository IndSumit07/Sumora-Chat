import { S3Client } from '@aws-sdk/client-s3';
import logger from './logger.js';

let s3Client = null;

export const getS3Client = () => {
  if (!s3Client) {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      logger.warn('AWS credentials not configured. S3 uploads will fail.');
    }

    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'ap-south-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      maxAttempts: 3,
    });

    logger.info(`S3 client initialized for region: ${process.env.AWS_REGION}`);
  }

  return s3Client;
};

export const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

export default getS3Client;
