import Conversation from '../models/Conversation.js';
import Group from '../models/Group.js';
import { getRedisClient } from '../config/redis.js';
import { SOCKET_EVENTS, ONLINE_TTL_SECONDS } from '../utils/constants.js';
import { emitUserOnline } from '../services/socket.service.js';
import logger from '../config/logger.js';

/**
 * Join all rooms for a connected user:
 * - Personal room: user:{userId}
 * - All conversation rooms: conv:{conversationId}
 * - All group rooms: group:{groupId}
 * Also sets user online in Redis and notifies friends
 */
export const joinUserRooms = async (socket, io) => {
  const userId = socket.userId;

  // Personal room
  await socket.join(`user:${userId}`);

  // Join all conversation rooms
  const conversations = await Conversation.find({ participants: userId })
    .select('_id')
    .lean();

  for (const conv of conversations) {
    await socket.join(`conv:${conv._id.toString()}`);
  }

  // Join all group rooms
  const groups = await Group.find({ 'members.user': userId, isDeleted: { $ne: true } })
    .select('_id')
    .lean();

  for (const group of groups) {
    await socket.join(`group:${group._id.toString()}`);
  }

  // Set user online in Redis
  const redis = getRedisClient();
  await redis.setex(`user:online:${userId}`, ONLINE_TTL_SECONDS, '1');

  // Notify friends that user is online
  const friendIds = socket.user?.friends?.map((f) => f.toString()) || [];
  emitUserOnline(userId, friendIds);

  logger.info(`User ${userId} joined ${conversations.length} conversations and ${groups.length} groups`);
};

/**
 * Join a specific conversation room (e.g., after creating a new DM)
 */
export const joinConversationRoom = async (socket, conversationId) => {
  await socket.join(`conv:${conversationId}`);
};

/**
 * Join a specific group room (e.g., after being added to a group)
 */
export const joinGroupRoom = async (socket, groupId) => {
  await socket.join(`group:${groupId}`);
};

/**
 * Leave a group room (e.g., after leaving or being removed)
 */
export const leaveGroupRoom = async (socket, groupId) => {
  await socket.leave(`group:${groupId}`);
};

/**
 * Handle disconnect: set user offline in Redis, notify friends
 */
export const leaveAllRooms = async (socket, io) => {
  const userId = socket.userId;
  const redis = getRedisClient();

  // Delete online key immediately
  await redis.del(`user:online:${userId}`);

  // Update lastSeen in DB asynchronously
  const User = (await import('../models/User.js')).default;
  User.findByIdAndUpdate(userId, { lastSeen: new Date() }).catch((err) => {
    logger.error(`Failed to update lastSeen for ${userId}: ${err.message}`);
  });

  // Notify friends offline
  const friendIds = socket.user?.friends?.map((f) => f.toString()) || [];
  const { emitUserOffline } = await import('../services/socket.service.js');
  emitUserOffline(userId, friendIds, new Date());

  // Clear typing indicators
  const keys = await redis.keys(`typing:*:${userId}`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }

  logger.info(`User ${userId} disconnected and set offline`);
};
