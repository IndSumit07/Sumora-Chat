import { Router } from 'express';
import {
  getNotifications,
  markNotificationsRead,
  deleteNotification,
  getUnreadCount,
} from '../controllers/notification.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { apiLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

router.use(protect);
router.use(apiLimiter);

router.get('/', getNotifications);
router.get('/count', getUnreadCount);
router.post('/mark-read', markNotificationsRead);
router.delete('/:notificationId', deleteNotification);

export default router;
