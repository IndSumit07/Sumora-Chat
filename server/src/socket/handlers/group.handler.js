import Group from '../../models/Group.js';
import GroupMessage from '../../models/GroupMessage.js';
import { SOCKET_EVENTS } from '../../utils/constants.js';
import logger from '../../config/logger.js';

export const registerGroupHandlers = (socket, io) => {
  const userId = socket.userId;

  /**
   * Join a group room dynamically (after being added to a group)
   */
  socket.on('joinGroup', async (data, callback) => {
    try {
      const { groupId } = data;

      const group = await Group.findById(groupId);
      if (!group) return callback?.({ error: 'Group not found' });

      if (!group.isMember(userId)) return callback?.({ error: 'Not a group member' });

      await socket.join(`group:${groupId}`);
      callback?.({ success: true });
    } catch (err) {
      logger.error(`Join group socket error: ${err.message}`);
      callback?.({ error: 'Failed to join group' });
    }
  });

  /**
   * Leave group room (after leaving or being removed)
   */
  socket.on('leaveGroup', async (data, callback) => {
    try {
      const { groupId } = data;
      await socket.leave(`group:${groupId}`);
      callback?.({ success: true });
    } catch (err) {
      callback?.({ error: 'Failed to leave group' });
    }
  });

  /**
   * Get group online member count
   */
  socket.on('getGroupOnlineMembers', async (data, callback) => {
    try {
      const { groupId } = data;
      const group = await Group.findById(groupId).select('members').lean();
      if (!group) return callback?.({ error: 'Group not found' });

      const { getRedisClient } = await import('../../config/redis.js');
      const redis = getRedisClient();

      const onlineCount = await Promise.all(
        group.members.map((m) => redis.exists(`user:online:${m.user}`))
      );

      callback?.({ count: onlineCount.filter(Boolean).length });
    } catch (err) {
      callback?.({ error: 'Failed to get online members' });
    }
  });
};
