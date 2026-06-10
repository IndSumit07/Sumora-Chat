import Notification from '../../models/Notification.js';
import { SOCKET_EVENTS, NOTIFICATIONS_PER_PAGE } from '../../utils/constants.js';
import logger from '../../config/logger.js';

export const registerNotificationHandlers = (socket, io) => {
  const userId = socket.userId;

  /**
   * Get unread notification count via socket
   */
  socket.on('getUnreadCount', async (callback) => {
    try {
      const count = await Notification.countDocuments({
        recipient: userId,
        isRead: false,
      });
      callback?.({ count });
    } catch (err) {
      logger.error(`Get unread count error: ${err.message}`);
      callback?.({ count: 0 });
    }
  });

  /**
   * Mark notifications as read via socket
   */
  socket.on('markNotificationsRead', async (data, callback) => {
    try {
      const { notificationIds, all } = data;
      const filter = { recipient: userId, isRead: false };
      if (!all && notificationIds?.length > 0) {
        filter._id = { $in: notificationIds };
      }
      await Notification.updateMany(filter, { $set: { isRead: true, readAt: new Date() } });
      callback?.({ success: true });
    } catch (err) {
      logger.error(`Mark notifications read error: ${err.message}`);
      callback?.({ error: 'Failed' });
    }
  });
};
