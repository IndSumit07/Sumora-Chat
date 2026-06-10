import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { getRedisClient } from '../config/redis.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middlewares/errorHandler.middleware.js';
import { successResponse } from '../utils/apiResponse.js';

// ==============================
// GET /api/conversations [Protected]
// ==============================
export const getConversations = asyncHandler(async (req, res) => {
  const userId = req.userId;

  const conversations = await Conversation.find({
    participants: userId,
  })
    .populate({
      path: 'participants',
      select: 'fullName username avatar lastSeen',
      match: { _id: { $ne: userId } },
    })
    .populate({
      path: 'lastMessage',
      select: 'content type sender createdAt isDeleted',
      populate: { path: 'sender', select: 'fullName username' },
    })
    .sort({ lastMessageAt: -1 })
    .lean();

  const redis = getRedisClient();

  const conversationsWithStatus = await Promise.all(
    conversations.map(async (conv) => {
      const otherUser = conv.participants[0]; // Already filtered to exclude current user
      if (!otherUser) return null;

      const isOnline = await redis.exists(`user:online:${otherUser._id}`);
      const unreadCount = conv.unreadCount?.[userId] || 0;

      return {
        ...conv,
        otherUser: {
          ...otherUser,
          isOnline: isOnline === 1,
        },
        unreadCount,
      };
    })
  );

  const filtered = conversationsWithStatus.filter(Boolean);

  return successResponse(res, { data: { conversations: filtered } });
});

// ==============================
// GET /api/conversations/:conversationId [Protected]
// ==============================
export const getConversation = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.userId;

  const conversation = await Conversation.findById(conversationId)
    .populate('participants', 'fullName username avatar bio lastSeen')
    .populate({
      path: 'lastMessage',
      select: 'content type sender createdAt',
    })
    .lean();

  if (!conversation) throw new AppError('Conversation not found', 404, 'NOT_FOUND');

  const isParticipant = conversation.participants.some((p) => p._id.toString() === userId);
  if (!isParticipant) throw new AppError('Forbidden', 403, 'FORBIDDEN');

  const redis = getRedisClient();
  const otherUser = conversation.participants.find((p) => p._id.toString() !== userId);
  const isOnline = otherUser ? await redis.exists(`user:online:${otherUser._id}`) : 0;

  return successResponse(res, {
    data: {
      conversation: {
        ...conversation,
        otherUser: otherUser ? { ...otherUser, isOnline: isOnline === 1 } : null,
        unreadCount: conversation.unreadCount?.[userId] || 0,
      },
    },
  });
});

// ==============================
// POST /api/conversations [Protected]
// Create or get DM conversation
// ==============================
export const createOrGetConversation = asyncHandler(async (req, res) => {
  const { participantId } = req.body;
  const userId = req.userId;

  if (!participantId) throw new AppError('participantId is required', 400, 'VALIDATION_ERROR');
  if (participantId === userId) throw new AppError('Cannot start conversation with yourself', 400, 'BAD_REQUEST');

  const target = await User.findById(participantId).lean();
  if (!target || target.isDeleted) throw new AppError('User not found', 404, 'NOT_FOUND');

  const conversation = await Conversation.findOrCreateDM(userId, participantId);
  await conversation.populate('participants', 'fullName username avatar');

  return successResponse(res, { data: { conversation } });
});

// ==============================
// DELETE /api/conversations/:conversationId [Protected]
// Clear chat history for current user
// ==============================
export const clearConversation = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.userId;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new AppError('Conversation not found', 404, 'NOT_FOUND');

  const isParticipant = conversation.participants.some((p) => p.toString() === userId);
  if (!isParticipant) throw new AppError('Forbidden', 403, 'FORBIDDEN');

  // Delete for me (add to deletedFor array)
  await Message.updateMany(
    { conversationId, deletedFor: { $ne: userId } },
    { $addToSet: { deletedFor: userId } }
  );

  return successResponse(res, { message: 'Conversation cleared' });
});
