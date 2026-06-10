import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { getRedisClient } from '../config/redis.js';
import {
  emitNewMessage,
  emitMessageEdited,
  emitMessageDeleted,
  emitMessageReaction,
  emitMessagesRead,
  emitNotification,
} from '../services/socket.service.js';
import { uploadMessageImage, uploadGenericFile, deleteFile } from '../services/s3.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middlewares/errorHandler.middleware.js';
import { successResponse, createdResponse, paginatedResponse } from '../utils/apiResponse.js';
import {
  MESSAGE_TYPES,
  MESSAGES_PER_PAGE,
  NOTIFICATION_TYPES,
  ALLOWED_IMAGE_TYPES,
  DELETE_MESSAGE_TIME_LIMIT_HOURS,
  S3_FOLDERS,
} from '../utils/constants.js';
import webpush from 'web-push';
import logger from '../config/logger.js';
import { decryptText } from '../utils/helpers.js';

// ==================================
// POST /api/messages/:conversationId
// ==================================
export const sendMessage = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { content, type = MESSAGE_TYPES.TEXT, replyTo } = req.body;
  const senderId = req.userId;

  // Verify conversation exists and user is participant
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new AppError('Conversation not found', 404, 'NOT_FOUND');

  const isParticipant = conversation.participants.some((p) => p.toString() === senderId);
  if (!isParticipant) throw new AppError('Not a participant of this conversation', 403, 'FORBIDDEN');

  // Check if conversation is blocked
  if (conversation.isBlocked) {
    throw new AppError('This conversation is blocked', 403, 'FORBIDDEN');
  }

  const receiverId = conversation.participants.find((p) => p.toString() !== senderId);

  // Check if sender is blocked by receiver
  const receiver = await User.findById(receiverId).select('blockedUsers').lean();
  if (receiver?.blockedUsers?.some((id) => id.toString() === senderId)) {
    throw new AppError('You cannot send messages to this user', 403, 'FORBIDDEN');
  }

  // Build message data
  const messageData = {
    conversationId,
    sender: senderId,
    type,
    replyTo: replyTo || null,
  };

  // Handle file upload
  if (req.file) {
    const mimeType = req.file.mimetype;
    let uploadResult;

    if (ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      uploadResult = await uploadMessageImage({
        buffer: req.file.buffer,
        userId: senderId,
        conversationId,
        originalName: req.file.originalname,
        mimeType,
      });
      messageData.type = MESSAGE_TYPES.IMAGE;
      messageData.thumbnailUrl = uploadResult.thumbnailUrl;
      messageData.thumbnailKey = uploadResult.thumbnailKey;
    } else {
      const folder = mimeType.startsWith('audio/')
        ? S3_FOLDERS.VOICE_NOTES
        : S3_FOLDERS.CONVERSATIONS;

      uploadResult = await uploadGenericFile({
        buffer: req.file.buffer,
        userId: senderId,
        folder: `${folder}/${conversationId}`,
        originalName: req.file.originalname,
        mimeType,
      });

      if (mimeType.startsWith('audio/')) {
        messageData.type = MESSAGE_TYPES.VOICE_NOTE;
      } else if (mimeType.startsWith('video/')) {
        messageData.type = MESSAGE_TYPES.VIDEO;
      } else {
        messageData.type = MESSAGE_TYPES.DOCUMENT;
      }
    }

    messageData.fileUrl = uploadResult.url;
    messageData.fileKey = uploadResult.key;
    messageData.fileName = req.file.originalname;
    messageData.fileSize = req.file.size;
    messageData.mimeType = mimeType;
  } else if (type === MESSAGE_TYPES.TEXT && content) {
    messageData.content = content;
  } else if (!req.file && !content) {
    throw new AppError('Message must have content or a file', 400, 'VALIDATION_ERROR');
  }

  // Save message (content will be encrypted by pre-save hook)
  const message = await Message.create(messageData);

  // Update conversation
  conversation.lastMessage = message._id;
  conversation.lastMessageAt = message.createdAt;
  conversation.incrementUnread(receiverId.toString());
  await conversation.save();

  // Populate sender for response
  await message.populate('sender', 'fullName username avatar');
  if (message.replyTo) {
    await message.populate('replyTo', 'content sender type');
  }

  const messageObj = message.toJSON();

  // Emit socket event to conversation room
  emitNewMessage(conversationId, messageObj);

  // Create notification for offline receiver
  const redis = getRedisClient();
  const isReceiverOnline = await redis.exists(`user:online:${receiverId}`);

  if (!isReceiverOnline) {
    const notification = await Notification.create({
      recipient: receiverId,
      sender: senderId,
      type: NOTIFICATION_TYPES.FRIEND_ACCEPTED, // reuse as "message" notification
      referenceId: message._id,
      referenceModel: 'Message',
      data: {
        conversationId,
        preview: content ? content.substring(0, 100) : `Sent a ${messageData.type}`,
        senderName: req.user.fullName,
      },
    });
    emitNotification(receiverId.toString(), notification.toObject());

    // Send web push notification
    const receiverWithPush = await User.findById(receiverId).select('pushSubscription notificationPreferences fullName').lean();
    if (receiverWithPush?.pushSubscription && receiverWithPush.notificationPreferences?.messages) {
      try {
        await webpush.sendNotification(
          receiverWithPush.pushSubscription,
          JSON.stringify({
            title: req.user.fullName || 'New Message',
            body: content ? content.substring(0, 80) : `Sent a ${messageData.type}`,
            icon: '/icon-192.png',
            data: { conversationId },
          })
        );
      } catch (err) {
        logger.warn(`Web push failed: ${err.message}`);
      }
    }
  }

  return createdResponse(res, { data: { message: messageObj } });
});

// ============================================
// GET /api/messages/:conversationId
// ============================================
export const getMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { cursor, limit = MESSAGES_PER_PAGE } = req.query;
  const userId = req.userId;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new AppError('Conversation not found', 404, 'NOT_FOUND');

  const isParticipant = conversation.participants.some((p) => p.toString() === userId);
  if (!isParticipant) throw new AppError('Forbidden', 403, 'FORBIDDEN');

  const query = {
    conversationId,
    deletedFor: { $ne: userId },
  };

  if (cursor) {
    query._id = { $lt: cursor };
  }

  const messages = await Message.find(query)
    .sort({ _id: -1 })
    .limit(parseInt(limit) + 1)
    .populate('sender', 'fullName username avatar')
    .populate('replyTo', 'content sender type fileUrl')
    .lean({ transform: true });

  const hasMore = messages.length > parseInt(limit);
  const data = hasMore ? messages.slice(0, -1) : messages;
  const nextCursor = hasMore ? data[data.length - 1]._id : null;

  // Decrypt content for all messages
  const decryptedMessages = data.map((msg) => {
    if (msg.content && !msg.isDeleted) {
      msg.content = decryptText(msg.content);
    }
    return msg;
  });

  // Mark unread messages as read
  const otherParticipantId = conversation.participants.find((p) => p.toString() !== userId);
  const unreadMessages = await Message.find({
    conversationId,
    sender: otherParticipantId,
    'readBy.user': { $ne: userId },
    isDeleted: { $ne: true },
  }).select('_id');

  if (unreadMessages.length > 0) {
    const readAt = new Date();
    await Message.updateMany(
      {
        conversationId,
        sender: otherParticipantId,
        'readBy.user': { $ne: userId },
      },
      { $addToSet: { readBy: { user: userId, readAt } } }
    );

    // Reset unread count
    conversation.resetUnread(userId);
    await conversation.save();

    // Notify sender that messages were read
    emitMessagesRead(conversationId, {
      conversationId,
      readBy: userId,
      readAt,
      messageIds: unreadMessages.map((m) => m._id),
    });
  }

  return successResponse(res, {
    data: { messages: data },
    meta: { cursor: nextCursor, hasMore, limit: parseInt(limit) },
  });
});

// ===================================
// PUT /api/messages/:messageId
// ===================================
export const editMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { content } = req.body;

  const message = await Message.findById(messageId);
  if (!message) throw new AppError('Message not found', 404, 'NOT_FOUND');
  if (message.sender.toString() !== req.userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
  if (message.type !== MESSAGE_TYPES.TEXT) throw new AppError('Only text messages can be edited', 400, 'BAD_REQUEST');
  if (message.isDeleted) throw new AppError('Cannot edit a deleted message', 400, 'BAD_REQUEST');

  message.content = content; // Will be re-encrypted by pre-save hook
  message.isEdited = true;
  message.editedAt = new Date();
  await message.save();

  await message.populate('sender', 'fullName username avatar');

  const messageObj = message.toJSON();

  emitMessageEdited(message.conversationId.toString(), {
    messageId: message._id,
    conversationId: message.conversationId,
    content: messageObj.content,
    isEdited: true,
    editedAt: message.editedAt,
  });

  return successResponse(res, { data: { message: messageObj } });
});

// ===================================
// DELETE /api/messages/:messageId
// ===================================
export const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { deleteFor } = req.body;

  const message = await Message.findById(messageId);
  if (!message) throw new AppError('Message not found', 404, 'NOT_FOUND');

  if (deleteFor === 'everyone') {
    if (message.sender.toString() !== req.userId) {
      throw new AppError('Only the sender can delete for everyone', 403, 'FORBIDDEN');
    }

    const hoursSince = (Date.now() - message.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSince > DELETE_MESSAGE_TIME_LIMIT_HOURS) {
      throw new AppError('Can only delete messages within 24 hours', 400, 'TIME_EXPIRED');
    }

    // Delete file from S3 if exists
    if (message.fileKey) await deleteFile(message.fileKey);
    if (message.thumbnailKey) await deleteFile(message.thumbnailKey);

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = null;
    message.fileUrl = null;
    message.fileKey = null;
    await message.save();

    emitMessageDeleted(message.conversationId.toString(), {
      messageId: message._id,
      conversationId: message.conversationId,
      deletedFor: 'everyone',
    });
  } else {
    // Delete for me only
    await Message.findByIdAndUpdate(messageId, {
      $addToSet: { deletedFor: req.userId },
    });
  }

  return successResponse(res, { message: 'Message deleted' });
});

// ============================================
// POST /api/messages/:messageId/react
// ============================================
export const reactToMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;

  const message = await Message.findById(messageId);
  if (!message) throw new AppError('Message not found', 404, 'NOT_FOUND');
  if (message.isDeleted) throw new AppError('Cannot react to deleted message', 400, 'BAD_REQUEST');

  const userId = req.userId;
  const existingIdx = message.reactions.findIndex(
    (r) => r.user.toString() === userId && r.emoji === emoji
  );

  if (existingIdx > -1) {
    // Remove reaction (toggle)
    message.reactions.splice(existingIdx, 1);
  } else {
    // Remove any existing reaction from this user (only one emoji per user)
    const userReactionIdx = message.reactions.findIndex((r) => r.user.toString() === userId);
    if (userReactionIdx > -1) {
      message.reactions.splice(userReactionIdx, 1);
    }
    // Add new reaction
    message.reactions.push({ user: userId, emoji });
  }

  await message.save();

  const reactionData = {
    messageId: message._id,
    conversationId: message.conversationId,
    reactions: message.reactions,
    userId,
    emoji,
  };

  emitMessageReaction(message.conversationId.toString(), reactionData);

  return successResponse(res, { data: { reactions: message.reactions } });
});

// ===========================================
// POST /api/conversations/:conversationId/read [Protected]
// ===========================================
export const markConversationRead = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.userId;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new AppError('Conversation not found', 404, 'NOT_FOUND');

  const isParticipant = conversation.participants.some((p) => p.toString() === userId);
  if (!isParticipant) throw new AppError('Forbidden', 403, 'FORBIDDEN');

  const otherParticipantId = conversation.participants.find((p) => p.toString() !== userId);
  const readAt = new Date();

  await Message.updateMany(
    {
      conversationId,
      sender: otherParticipantId,
      'readBy.user': { $ne: userId },
      isDeleted: { $ne: true },
    },
    { $addToSet: { readBy: { user: userId, readAt } } }
  );

  conversation.resetUnread(userId);
  await conversation.save();

  emitMessagesRead(conversationId, {
    conversationId,
    readBy: userId,
    readAt,
  });

  return successResponse(res, { message: 'Messages marked as read' });
});
