import Notification from '../models/Notification.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middlewares/errorHandler.middleware.js';
import { successResponse, paginatedResponse } from '../utils/apiResponse.js';
import { NOTIFICATIONS_PER_PAGE } from '../utils/constants.js';

// ============================
// GET /api/notifications
// ============================
export const getNotifications = asyncHandler(async (req, res) => {
  const { cursor, limit = NOTIFICATIONS_PER_PAGE } = req.query;
  const userId = req.userId;

  const query = { recipient: userId };
  if (cursor) query._id = { $lt: cursor };

  const notifications = await Notification.find(query)
    .populate('sender', 'fullName username avatar')
    .sort({ _id: -1 })
    .limit(parseInt(limit) + 1)
    .lean();

  const hasMore = notifications.length > parseInt(limit);
  const data = hasMore ? notifications.slice(0, -1) : notifications;
  const nextCursor = hasMore ? data[data.length - 1]._id : null;

  const unreadCount = await Notification.countDocuments({
    recipient: userId,
    isRead: false,
  });

  return successResponse(res, {
    data: { notifications: data, unreadCount },
    meta: { cursor: nextCursor, hasMore, limit: parseInt(limit) },
  });
});

// ============================
// POST /api/notifications/mark-read
// ============================
export const markNotificationsRead = asyncHandler(async (req, res) => {
  const { notificationIds, all } = req.body;
  const userId = req.userId;

  const filter = { recipient: userId, isRead: false };
  if (!all) {
    if (!notificationIds || notificationIds.length === 0) {
      throw new AppError('notificationIds or all:true required', 400, 'VALIDATION_ERROR');
    }
    filter._id = { $in: notificationIds };
  }

  await Notification.updateMany(filter, {
    $set: { isRead: true, readAt: new Date() },
  });

  return successResponse(res, { message: 'Notifications marked as read' });
});

// ============================
// DELETE /api/notifications/:notificationId
// ============================
export const deleteNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.userId;

  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: userId,
  });

  if (!notification) throw new AppError('Notification not found', 404, 'NOT_FOUND');

  return successResponse(res, { message: 'Notification deleted' });
});

// ============================
// GET /api/notifications/count
// ============================
export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    recipient: req.userId,
    isRead: false,
  });

  return successResponse(res, { data: { count } });
});
