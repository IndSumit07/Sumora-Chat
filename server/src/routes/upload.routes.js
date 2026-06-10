import { Router } from 'express';
import {
  uploadAvatar,
  uploadGroupAvatar,
  uploadMessageFile,
} from '../controllers/upload.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { uploadLimiter } from '../middlewares/rateLimiter.middleware.js';
import {
  uploadAvatar as multerAvatar,
  uploadGroupAvatar as multerGroupAvatar,
  uploadMessageFile as multerMessageFile,
  handleMulterError,
  verifyFileType,
} from '../middlewares/upload.middleware.js';

const router = Router();

router.use(protect);
router.use(uploadLimiter);

router.post('/avatar', multerAvatar, handleMulterError, verifyFileType, uploadAvatar);
router.post('/group-avatar', multerGroupAvatar, handleMulterError, verifyFileType, uploadGroupAvatar);
router.post('/message-file', multerMessageFile, handleMulterError, verifyFileType, uploadMessageFile);

export default router;
