import { Router } from 'express';
import {
  searchUsers,
  getUserProfile,
  updateProfile,
  updateAvatar,
  getOnlineStatus,
  blockUser,
  unblockUser,
  savePushSubscription,
  getFriendsOnlineStatus,
} from '../controllers/user.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { apiLimiter } from '../middlewares/rateLimiter.middleware.js';
import { uploadAvatar, handleMulterError, verifyFileType } from '../middlewares/upload.middleware.js';
import { updateProfileSchema } from '../validators/user.validator.js';

const router = Router();

// All user routes require auth
router.use(protect);
router.use(apiLimiter);

router.get('/search', searchUsers);
router.get('/online-status', getOnlineStatus);
router.get('/friends-online', getFriendsOnlineStatus);
router.get('/:userId', getUserProfile);
router.put('/profile', validate(updateProfileSchema), updateProfile);
router.post('/avatar', uploadAvatar, handleMulterError, verifyFileType, updateAvatar);
router.post('/block/:userId', blockUser);
router.post('/unblock/:userId', unblockUser);
router.post('/push-subscription', savePushSubscription);

export default router;
