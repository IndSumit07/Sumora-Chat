import User from '../models/User.js';
import { getRedisClient } from '../config/redis.js';
import { uploadAvatar as uploadAvatarToS3 } from '../services/s3.service.js';
import { deleteFile } from '../services/s3.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middlewares/errorHandler.middleware.js';
import { successResponse, paginatedResponse } from '../utils/apiResponse.js';
import { ONLINE_TTL_SECONDS } from '../utils/constants.js';
import webpush from 'web-push';
import logger from '../config/logger.js';

// Configure web-push VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@sumorachat.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// ==========================
// GET /api/users/search
// ==========================
export const searchUsers = asyncHandler(async (req, res) => {
  const { query, page = 1, limit = 20 } = req.query;

  if (!query || query.trim().length < 1) {
    throw new AppError('Search query is required', 400, 'VALIDATION_ERROR');
  }

  const skip = (page - 1) * limit;
  const regex = new RegExp(query.trim(), 'i');

  const users = await User.find({
    $or: [{ username: regex }, { fullName: regex }],
    isDeleted: { $ne: true },
    _id: { $ne: req.userId },
  })
    .select('_id fullName username avatar bio')
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await User.countDocuments({
    $or: [{ username: regex }, { fullName: regex }],
    isDeleted: { $ne: true },
    _id: { $ne: req.userId },
  });

  // Add online status
  const redis = getRedisClient();
  const usersWithStatus = await Promise.all(
    users.map(async (user) => {
      const isOnline = await redis.exists(`user:online:${user._id}`);
      return { ...user, isOnline: isOnline === 1 };
    })
  );

  return paginatedResponse(res, {
    data: usersWithStatus,
    page: parseInt(page),
    limit: parseInt(limit),
    total,
  });
});

// ============================
// GET /api/users/:userId
// ============================
export const getUserProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId)
    .select('-password -pushSubscription -googleId -blockedUsers')
    .lean();

  if (!user || user.isDeleted) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  // Check if blocked
  const currentUser = await User.findById(req.userId).select('blockedUsers friends').lean();
  const isBlocked = currentUser.blockedUsers.some((id) => id.toString() === userId);
  if (isBlocked) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  const redis = getRedisClient();
  const isOnline = await redis.exists(`user:online:${userId}`);
  const isFriend = currentUser.friends.some((id) => id.toString() === userId);

  return successResponse(res, {
    data: {
      ...user,
      isOnline: isOnline === 1,
      isFriend,
    },
  });
});

// =============================
// PUT /api/users/profile [Protected]
// =============================
export const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, bio, phoneNumber, notificationPreferences } = req.body;

  const updateData = {};
  if (fullName !== undefined) updateData.fullName = fullName;
  if (bio !== undefined) updateData.bio = bio;
  if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
  if (notificationPreferences !== undefined) {
    updateData.notificationPreferences = notificationPreferences;
  }

  const user = await User.findByIdAndUpdate(
    req.userId,
    { $set: updateData },
    { new: true, runValidators: true }
  ).select('-password -pushSubscription');

  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

  return successResponse(res, {
    message: 'Profile updated successfully',
    data: { user: user.toSafeObject() },
  });
});

// =============================
// POST /api/users/avatar [Protected]
// =============================
export const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Avatar file is required', 400, 'VALIDATION_ERROR');

  const user = await User.findById(req.userId);
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

  // Delete old avatar if exists
  if (user.avatarKey) {
    await deleteFile(user.avatarKey);
  }

  // Upload new avatar
  const { url, key } = await uploadAvatarToS3({
    buffer: req.file.buffer,
    userId: req.userId,
  });

  user.avatar = url;
  user.avatarKey = key;
  await user.save();

  return successResponse(res, {
    message: 'Avatar updated successfully',
    data: { avatar: url },
  });
});

// ===============================
// GET /api/users/online-status
// ===============================
export const getOnlineStatus = asyncHandler(async (req, res) => {
  let { userIds } = req.query;

  if (!userIds) {
    throw new AppError('userIds query parameter is required', 400, 'VALIDATION_ERROR');
  }

  // Handle comma-separated string or array
  if (typeof userIds === 'string') {
    userIds = userIds.split(',').filter(Boolean);
  }

  if (userIds.length > 100) {
    throw new AppError('Too many userIds (max 100)', 400, 'VALIDATION_ERROR');
  }

  const redis = getRedisClient();

  const statusMap = {};
  await Promise.all(
    userIds.map(async (uid) => {
      const isOnline = await redis.exists(`user:online:${uid.trim()}`);
      statusMap[uid.trim()] = isOnline === 1;
    })
  );

  // Also get lastSeen for offline users
  const offlineIds = Object.keys(statusMap).filter((id) => !statusMap[id]);
  if (offlineIds.length > 0) {
    const offlineUsers = await User.find({ _id: { $in: offlineIds } })
      .select('_id lastSeen')
      .lean();
    const lastSeenMap = {};
    offlineUsers.forEach((u) => {
      lastSeenMap[u._id.toString()] = u.lastSeen;
    });

    return successResponse(res, {
      data: {
        status: statusMap,
        lastSeen: lastSeenMap,
      },
    });
  }

  return successResponse(res, { data: { status: statusMap, lastSeen: {} } });
});

// =============================
// POST /api/users/block/:userId [Protected]
// =============================
export const blockUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (userId === req.userId) {
    throw new AppError('You cannot block yourself', 400, 'BAD_REQUEST');
  }

  const target = await User.findById(userId);
  if (!target || target.isDeleted) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  await User.findByIdAndUpdate(req.userId, {
    $addToSet: { blockedUsers: userId },
    $pull: { friends: userId },
  });

  // Also remove from target's friends
  await User.findByIdAndUpdate(userId, {
    $pull: { friends: req.userId },
  });

  return successResponse(res, { message: 'User blocked successfully' });
});

// =============================
// POST /api/users/unblock/:userId [Protected]
// =============================
export const unblockUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  await User.findByIdAndUpdate(req.userId, {
    $pull: { blockedUsers: userId },
  });

  return successResponse(res, { message: 'User unblocked successfully' });
});

// =============================
// POST /api/users/push-subscription [Protected]
// =============================
export const savePushSubscription = asyncHandler(async (req, res) => {
  const { subscription } = req.body;

  await User.findByIdAndUpdate(req.userId, {
    $set: { pushSubscription: subscription },
  });

  return successResponse(res, { message: 'Push subscription saved' });
});

// =============================
// GET /api/users/friends-online [Protected]
// =============================
export const getFriendsOnlineStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId).select('friends').lean();
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

  const redis = getRedisClient();
  const statusMap = {};

  await Promise.all(
    user.friends.map(async (friendId) => {
      const isOnline = await redis.exists(`user:online:${friendId}`);
      statusMap[friendId.toString()] = isOnline === 1;
    })
  );

  return successResponse(res, { data: { status: statusMap } });
});
