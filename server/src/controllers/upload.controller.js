import { uploadAvatar as uploadAvatarService, uploadGenericFile, deleteFile } from '../services/s3.service.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middlewares/errorHandler.middleware.js';
import { successResponse } from '../utils/apiResponse.js';
import { S3_FOLDERS, ALLOWED_IMAGE_TYPES } from '../utils/constants.js';
import { uploadMessageImage } from '../services/s3.service.js';

// ===========================
// POST /api/upload/avatar
// ===========================
export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Avatar file is required', 400, 'VALIDATION_ERROR');

  const user = await User.findById(req.userId);
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

  // Delete old avatar if exists
  if (user.avatarKey) {
    await deleteFile(user.avatarKey);
  }

  const { url, key } = await uploadAvatarService({
    buffer: req.file.buffer,
    userId: req.userId,
  });

  user.avatar = url;
  user.avatarKey = key;
  await user.save();

  return successResponse(res, {
    message: 'Avatar uploaded successfully',
    data: { url, key },
  });
});

// ===========================
// POST /api/upload/group-avatar
// ===========================
export const uploadGroupAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Avatar file is required', 400, 'VALIDATION_ERROR');

  const { url, key } = await uploadAvatarService({
    buffer: req.file.buffer,
    userId: req.userId,
  });

  return successResponse(res, {
    message: 'Group avatar uploaded',
    data: { url, key },
  });
});

// ===========================
// POST /api/upload/message-file
// ===========================
export const uploadMessageFile = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('File is required', 400, 'VALIDATION_ERROR');

  const { conversationId, groupId } = req.body;
  const mimeType = req.file.mimetype;
  const userId = req.userId;

  let result;
  let type;

  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    result = await uploadMessageImage({
      buffer: req.file.buffer,
      userId,
      conversationId: conversationId || groupId || null,
      originalName: req.file.originalname,
      mimeType,
    });
    type = 'image';
  } else {
    const folder = mimeType.startsWith('audio/')
      ? S3_FOLDERS.VOICE_NOTES
      : conversationId
      ? `${S3_FOLDERS.CONVERSATIONS}/${conversationId}`
      : groupId
      ? `groups/${groupId}`
      : `${S3_FOLDERS.DOCUMENTS}/${userId}`;

    result = await uploadGenericFile({
      buffer: req.file.buffer,
      userId,
      folder,
      originalName: req.file.originalname,
      mimeType,
    });
    type = mimeType.startsWith('audio/') ? 'voiceNote'
      : mimeType.startsWith('video/') ? 'video'
      : 'document';
  }

  return successResponse(res, {
    message: 'File uploaded successfully',
    data: {
      url: result.url,
      key: result.key,
      thumbnailUrl: result.thumbnailUrl || null,
      thumbnailKey: result.thumbnailKey || null,
      mimeType,
      fileSize: req.file.size,
      fileName: req.file.originalname,
      type,
    },
  });
});
