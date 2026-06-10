import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getS3Client, S3_BUCKET_NAME } from '../config/s3.js';
import { generateS3Key, getFileExtension } from '../utils/helpers.js';
import { PRESIGNED_URL_EXPIRY } from '../utils/constants.js';
import logger from '../config/logger.js';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload a file to S3
 * @returns { url, key }
 */
export const uploadFile = async ({ buffer, folder, userId, originalName, mimeType, isPublic = false }) => {
  const ext = getFileExtension(originalName) || 'bin';
  const key = `${folder}/${userId}/${uuidv4()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    ServerSideEncryption: 'AES256',
    CacheControl: isPublic ? 'public, max-age=31536000' : 'private, no-cache',
    ACL: isPublic ? 'public-read' : 'private',
  });

  await getS3Client().send(command);

  const url = isPublic
    ? `https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
    : await getPresignedUrl(key, PRESIGNED_URL_EXPIRY);

  logger.info(`S3 upload: key=${key}, size=${buffer.length}, public=${isPublic}`);
  return { url, key };
};

/**
 * Delete a file from S3 by key
 */
export const deleteFile = async (key) => {
  if (!key) return;
  try {
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });
    await getS3Client().send(command);
    logger.info(`S3 delete: key=${key}`);
  } catch (err) {
    logger.error(`S3 delete failed: key=${key}, error=${err.message}`);
  }
};

/**
 * Generate a presigned URL for private file access (default 1hr expiry)
 */
export const getPresignedUrl = async (key, expiresIn = PRESIGNED_URL_EXPIRY) => {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: key,
  });
  return getSignedUrl(getS3Client(), command, { expiresIn });
};

/**
 * Check if a file exists in S3
 */
export const fileExists = async (key) => {
  try {
    await getS3Client().send(new HeadObjectCommand({ Bucket: S3_BUCKET_NAME, Key: key }));
    return true;
  } catch {
    return false;
  }
};

/**
 * Process and upload an avatar image
 * Resizes to 200x200 WEBP with sharp
 * @returns { url, key, thumbnailUrl, thumbnailKey }
 */
export const uploadAvatar = async ({ buffer, userId }) => {
  // Main avatar: 200x200 WEBP
  const avatarBuffer = await sharp(buffer)
    .resize(200, 200, { fit: 'cover', position: 'center' })
    .webp({ quality: 85 })
    .toBuffer();

  const { url: avatarUrl, key: avatarKey } = await uploadFile({
    buffer: avatarBuffer,
    folder: 'avatars',
    userId,
    originalName: 'avatar.webp',
    mimeType: 'image/webp',
    isPublic: true,
  });

  return { url: avatarUrl, key: avatarKey };
};

/**
 * Process and upload a message image with thumbnail
 * @returns { url, key, thumbnailUrl, thumbnailKey, width, height }
 */
export const uploadMessageImage = async ({ buffer, userId, conversationId, originalName, mimeType }) => {
  const folder = conversationId
    ? `conversations/${conversationId}`
    : `documents/${userId}`;

  // Get image metadata
  const metadata = await sharp(buffer).metadata();

  // Full size image (max 2000px wide)
  const mainBuffer = await sharp(buffer)
    .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  const { url, key } = await uploadFile({
    buffer: mainBuffer,
    folder,
    userId,
    originalName: `img_${Date.now()}.webp`,
    mimeType: 'image/webp',
    isPublic: false,
  });

  // Thumbnail (400px wide)
  const thumbBuffer = await sharp(buffer)
    .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 70 })
    .toBuffer();

  const { url: thumbnailUrl, key: thumbnailKey } = await uploadFile({
    buffer: thumbBuffer,
    folder: `${folder}/thumbnails`,
    userId,
    originalName: `thumb_${Date.now()}.webp`,
    mimeType: 'image/webp',
    isPublic: false,
  });

  return {
    url,
    key,
    thumbnailUrl,
    thumbnailKey,
    width: metadata.width,
    height: metadata.height,
  };
};

/**
 * Upload a generic file (documents, audio, video)
 */
export const uploadGenericFile = async ({ buffer, userId, folder, originalName, mimeType }) => {
  return uploadFile({ buffer, folder, userId, originalName, mimeType, isPublic: false });
};

/**
 * Refresh presigned URL for a private file
 */
export const refreshPresignedUrl = async (key) => {
  if (!key) return null;
  return getPresignedUrl(key, PRESIGNED_URL_EXPIRY);
};

export default {
  uploadFile,
  deleteFile,
  getPresignedUrl,
  fileExists,
  uploadAvatar,
  uploadMessageImage,
  uploadGenericFile,
  refreshPresignedUrl,
};
