import { getRedisClient } from '../../config/redis.js';
import User from '../../models/User.js';
import { SOCKET_EVENTS, ONLINE_TTL_SECONDS } from '../../utils/constants.js';
import { emitUserOnline, emitUserOffline } from '../../services/socket.service.js';
import logger from '../../config/logger.js';

export const registerPresenceHandlers = (socket, io) => {
  const userId = socket.userId;

  /**
   * Heartbeat from client — resets the online TTL in Redis
   * Client should send this every 2 minutes
   */
  socket.on(SOCKET_EVENTS.HEARTBEAT, async (callback) => {
    try {
      const redis = getRedisClient();
      await redis.setex(`user:online:${userId}`, ONLINE_TTL_SECONDS, '1');
      callback?.({ ok: true, timestamp: Date.now() });
    } catch (err) {
      logger.error(`Heartbeat error: ${err.message}`);
      callback?.({ ok: false });
    }
  });

  /**
   * Manually join a room (e.g., after being added to a group)
   */
  socket.on(SOCKET_EVENTS.JOIN_ROOM, async (data, callback) => {
    try {
      const { conversationId, groupId } = data;
      if (conversationId) await socket.join(`conv:${conversationId}`);
      if (groupId) await socket.join(`group:${groupId}`);
      callback?.({ success: true });
    } catch (err) {
      logger.error(`Join room error: ${err.message}`);
      callback?.({ error: 'Failed to join room' });
    }
  });

  /**
   * Manually leave a room (e.g., after leaving a group)
   */
  socket.on(SOCKET_EVENTS.LEAVE_ROOM, async (data, callback) => {
    try {
      const { conversationId, groupId } = data;
      if (conversationId) await socket.leave(`conv:${conversationId}`);
      if (groupId) await socket.leave(`group:${groupId}`);
      callback?.({ success: true });
    } catch (err) {
      logger.error(`Leave room error: ${err.message}`);
      callback?.({ error: 'Failed to leave room' });
    }
  });

  /**
   * Check online status of specific users
   */
  socket.on('checkOnlineStatus', async (data, callback) => {
    try {
      const { userIds } = data;
      if (!Array.isArray(userIds) || userIds.length === 0) return callback?.({});

      const redis = getRedisClient();
      const statusMap = {};

      await Promise.all(
        userIds.slice(0, 100).map(async (uid) => {
          const isOnline = await redis.exists(`user:online:${uid}`);
          statusMap[uid] = isOnline === 1;
        })
      );

      callback?.(statusMap);
    } catch (err) {
      logger.error(`Online status check error: ${err.message}`);
      callback?.({});
    }
  });

  /**
   * Set user's last seen (called on visibility change, tab close, etc.)
   */
  socket.on('updateLastSeen', async () => {
    try {
      await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
    } catch (err) {
      logger.error(`Update lastSeen error: ${err.message}`);
    }
  });
};
