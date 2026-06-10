import { getRedisClient } from '../../config/redis.js';
import { SOCKET_EVENTS, TYPING_TTL_SECONDS } from '../../utils/constants.js';
import logger from '../../config/logger.js';

export const registerTypingHandlers = (socket, io) => {
  const userId = socket.userId;

  /**
   * User started typing in a conversation or group
   * data: { conversationId } or { groupId }
   */
  socket.on(SOCKET_EVENTS.TYPING_START, async (data) => {
    try {
      const { conversationId, groupId } = data;
      const roomId = conversationId ? conversationId : groupId;
      const roomPrefix = conversationId ? 'conv' : 'group';

      if (!roomId) return;

      const redis = getRedisClient();
      const typingKey = `typing:${roomId}:${userId}`;

      // SET with TTL (auto-stops typing if client disconnects)
      await redis.setex(typingKey, TYPING_TTL_SECONDS, userId);

      // Broadcast to room except sender
      socket.to(`${roomPrefix}:${roomId}`).emit(SOCKET_EVENTS.TYPING_START, {
        userId,
        conversationId,
        groupId,
        user: {
          _id: userId,
          fullName: socket.user?.fullName,
          username: socket.user?.username,
          avatar: socket.user?.avatar,
        },
      });
    } catch (err) {
      logger.error(`Typing start error: ${err.message}`);
    }
  });

  /**
   * User stopped typing
   * data: { conversationId } or { groupId }
   */
  socket.on(SOCKET_EVENTS.TYPING_STOP, async (data) => {
    try {
      const { conversationId, groupId } = data;
      const roomId = conversationId ? conversationId : groupId;
      const roomPrefix = conversationId ? 'conv' : 'group';

      if (!roomId) return;

      const redis = getRedisClient();
      const typingKey = `typing:${roomId}:${userId}`;
      await redis.del(typingKey);

      socket.to(`${roomPrefix}:${roomId}`).emit(SOCKET_EVENTS.TYPING_STOP, {
        userId,
        conversationId,
        groupId,
      });
    } catch (err) {
      logger.error(`Typing stop error: ${err.message}`);
    }
  });

  /**
   * Get current typers in a room
   */
  socket.on('getTypers', async (data, callback) => {
    try {
      const { conversationId, groupId } = data;
      const roomId = conversationId || groupId;
      if (!roomId) return callback?.([]);

      const redis = getRedisClient();
      const keys = await redis.keys(`typing:${roomId}:*`);
      const typers = keys.map((k) => k.split(':')[2]).filter((id) => id !== userId);
      callback?.(typers);
    } catch (err) {
      callback?.([]);
    }
  });
};
