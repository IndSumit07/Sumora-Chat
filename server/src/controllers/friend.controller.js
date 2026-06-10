import FriendRequest from '../models/FriendRequest.js';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import Notification from '../models/Notification.js';
import { getRedisClient } from '../config/redis.js';
import {
  emitFriendRequest,
  emitFriendRequestAccepted,
  emitNotification,
  emitUserOffline,
} from '../services/socket.service.js';
import { queueEmail } from '../config/bullmq.js';
import { friendRequestEmailTemplate, friendAcceptedEmailTemplate } from '../services/email.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middlewares/errorHandler.middleware.js';
import { successResponse, createdResponse, paginatedResponse } from '../utils/apiResponse.js';
import { FRIEND_REQUEST_STATUSES, NOTIFICATION_TYPES } from '../utils/constants.js';
import logger from '../config/logger.js';

// ================================
// POST /api/friends/request
// ================================
export const sendFriendRequest = asyncHandler(async (req, res) => {
  const { receiverId, receiverUsername, message } = req.body;
  const senderId = req.userId;

  let receiver;
  if (receiverId) {
    receiver = await User.findById(receiverId).select('fullName username email friends blockedUsers notificationPreferences');
  } else if (receiverUsername) {
    receiver = await User.findOne({
      username: receiverUsername.toLowerCase(),
      isDeleted: { $ne: true },
    }).select('fullName username email friends blockedUsers notificationPreferences');
  }

  if (!receiver || receiver.isDeleted) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  if (receiver._id.toString() === senderId) {
    throw new AppError('Cannot send friend request to yourself', 400, 'BAD_REQUEST');
  }

  // Check if already friends
  if (receiver.friends.some((f) => f.toString() === senderId)) {
    throw new AppError('Already friends with this user', 409, 'CONFLICT');
  }

  // Check if receiver blocked sender
  if (receiver.blockedUsers.some((b) => b.toString() === senderId)) {
    throw new AppError('Unable to send friend request', 403, 'FORBIDDEN');
  }

  // Check if sender blocked receiver
  const sender = await User.findById(senderId).select('blockedUsers fullName username').lean();
  if (sender.blockedUsers.some((b) => b.toString() === receiver._id.toString())) {
    throw new AppError('Unblock this user first', 403, 'FORBIDDEN');
  }

  // Check for existing pending request
  const existingRequest = await FriendRequest.findOne({
    sender: senderId,
    receiver: receiver._id,
    status: FRIEND_REQUEST_STATUSES.PENDING,
  });
  if (existingRequest) {
    throw new AppError('Friend request already sent', 409, 'CONFLICT');
  }

  // Check if receiver already sent us a request
  const reverseRequest = await FriendRequest.findOne({
    sender: receiver._id,
    receiver: senderId,
    status: FRIEND_REQUEST_STATUSES.PENDING,
  });
  if (reverseRequest) {
    // Auto-accept
    return acceptFriendRequestLogic(reverseRequest, senderId, res);
  }

  const request = await FriendRequest.create({
    sender: senderId,
    receiver: receiver._id,
    message: message || null,
    status: FRIEND_REQUEST_STATUSES.PENDING,
  });

  // Populate for socket/email
  await request.populate('sender', 'fullName username avatar');
  await request.populate('receiver', 'fullName username avatar');

  // Create notification
  const notification = await Notification.create({
    recipient: receiver._id,
    sender: senderId,
    type: NOTIFICATION_TYPES.FRIEND_REQUEST,
    referenceId: request._id,
    referenceModel: 'FriendRequest',
    data: {
      requestId: request._id,
      senderName: sender.fullName,
      senderUsername: sender.username,
    },
  });

  // Emit socket event if receiver is online
  emitFriendRequest(receiver._id.toString(), {
    request: request.toObject(),
    notification: notification.toObject(),
  });
  emitNotification(receiver._id.toString(), notification.toObject());

  // Send email if receiver has notifications enabled
  if (receiver.notificationPreferences?.friendRequests !== false) {
    request.emailSent = true;
    request.emailSentAt = new Date();
    await request.save();

    await queueEmail({
      to: receiver.email,
      subject: `${sender.fullName} sent you a friend request on Sumora Chat`,
      html: friendRequestEmailTemplate({
        senderName: sender.fullName,
        senderUsername: sender.username,
        receiverName: receiver.fullName,
        acceptLink: `${process.env.FRONTEND_URL}/friends/requests/${request._id}`,
      }),
    });
  }

  return createdResponse(res, { data: { request: request.toObject() } });
});

// Internal helper for accepting
const acceptFriendRequestLogic = async (request, acceptorId, res) => {
  request.status = FRIEND_REQUEST_STATUSES.ACCEPTED;
  await request.save();

  const senderId = request.sender.toString();
  const receiverId = request.receiver.toString();

  // Add to each other's friends list
  await Promise.all([
    User.findByIdAndUpdate(senderId, { $addToSet: { friends: receiverId } }),
    User.findByIdAndUpdate(receiverId, { $addToSet: { friends: senderId } }),
  ]);

  // Create DM conversation
  const conversation = await Conversation.findOrCreateDM(senderId, receiverId);

  // Notification for original sender
  const acceptor = await User.findById(acceptorId).select('fullName username').lean();
  const notification = await Notification.create({
    recipient: senderId,
    sender: acceptorId,
    type: NOTIFICATION_TYPES.FRIEND_ACCEPTED,
    referenceId: request._id,
    referenceModel: 'FriendRequest',
    data: {
      acceptorName: acceptor?.fullName,
      conversationId: conversation._id,
    },
  });

  emitFriendRequestAccepted(senderId, {
    request: request.toObject(),
    conversation: conversation.toObject(),
    notification: notification.toObject(),
  });

  // Email to original sender
  const original = await User.findById(senderId).select('email fullName').lean();
  if (original) {
    await queueEmail({
      to: original.email,
      subject: `${acceptor?.fullName} accepted your friend request`,
      html: friendAcceptedEmailTemplate({
        accepterName: acceptor?.fullName || 'Someone',
        senderName: original.fullName,
      }),
    });
  }

  return successResponse(res, {
    message: 'Friend request accepted',
    data: { conversation: conversation.toObject() },
  });
};

// ===================================================
// POST /api/friends/request/:requestId/accept
// ===================================================
export const acceptFriendRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const userId = req.userId;

  const request = await FriendRequest.findById(requestId);
  if (!request) throw new AppError('Friend request not found', 404, 'NOT_FOUND');
  if (request.receiver.toString() !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
  if (request.status !== FRIEND_REQUEST_STATUSES.PENDING) {
    throw new AppError(`Request is already ${request.status}`, 400, 'BAD_REQUEST');
  }

  return acceptFriendRequestLogic(request, userId, res);
});

// ===================================================
// POST /api/friends/request/:requestId/reject
// ===================================================
export const rejectFriendRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const userId = req.userId;

  const request = await FriendRequest.findById(requestId);
  if (!request) throw new AppError('Friend request not found', 404, 'NOT_FOUND');
  if (request.receiver.toString() !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
  if (request.status !== FRIEND_REQUEST_STATUSES.PENDING) {
    throw new AppError(`Request is already ${request.status}`, 400, 'BAD_REQUEST');
  }

  request.status = FRIEND_REQUEST_STATUSES.REJECTED;
  await request.save();

  return successResponse(res, { message: 'Friend request rejected' });
});

// ===================================================
// POST /api/friends/request/:requestId/cancel
// ===================================================
export const cancelFriendRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const userId = req.userId;

  const request = await FriendRequest.findById(requestId);
  if (!request) throw new AppError('Friend request not found', 404, 'NOT_FOUND');
  if (request.sender.toString() !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
  if (request.status !== FRIEND_REQUEST_STATUSES.PENDING) {
    throw new AppError(`Request is already ${request.status}`, 400, 'BAD_REQUEST');
  }

  request.status = FRIEND_REQUEST_STATUSES.CANCELLED;
  await request.save();

  return successResponse(res, { message: 'Friend request cancelled' });
});

// ============================
// DELETE /api/friends/:friendId
// ============================
export const removeFriend = asyncHandler(async (req, res) => {
  const { friendId } = req.params;
  const userId = req.userId;

  await Promise.all([
    User.findByIdAndUpdate(userId, { $pull: { friends: friendId } }),
    User.findByIdAndUpdate(friendId, { $pull: { friends: userId } }),
  ]);

  logger.info(`Friends removed: ${userId} <-> ${friendId}`);
  return successResponse(res, { message: 'Friend removed' });
});

// ============================
// GET /api/friends
// ============================
export const getFriends = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const redis = getRedisClient();

  const user = await User.findById(userId)
    .populate('friends', 'fullName username avatar bio lastSeen')
    .lean();

  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

  const friendsWithStatus = await Promise.all(
    user.friends.map(async (friend) => {
      const isOnline = await redis.exists(`user:online:${friend._id}`);
      return { ...friend, isOnline: isOnline === 1 };
    })
  );

  return successResponse(res, { data: { friends: friendsWithStatus } });
});

// ====================================
// GET /api/friends/requests/pending
// ====================================
export const getPendingRequests = asyncHandler(async (req, res) => {
  const userId = req.userId;

  const [received, sent] = await Promise.all([
    FriendRequest.find({ receiver: userId, status: FRIEND_REQUEST_STATUSES.PENDING })
      .populate('sender', 'fullName username avatar bio')
      .sort({ createdAt: -1 })
      .lean(),
    FriendRequest.find({ sender: userId, status: FRIEND_REQUEST_STATUSES.PENDING })
      .populate('receiver', 'fullName username avatar bio')
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  return successResponse(res, { data: { received, sent } });
});
