import { Router } from 'express';
import {
  sendMessage,
  getMessages,
  editMessage,
  deleteMessage,
  reactToMessage,
  markConversationRead,
} from '../controllers/message.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { messageLimiter } from '../middlewares/rateLimiter.middleware.js';
import { uploadMessageFile, handleMulterError, verifyFileType } from '../middlewares/upload.middleware.js';
import {
  sendMessageSchema,
  editMessageSchema,
  deleteMessageSchema,
  reactToMessageSchema,
  messagesQuerySchema,
} from '../validators/message.validator.js';

const router = Router();

router.use(protect);

// DM message routes
router.post(
  '/:conversationId',
  messageLimiter,
  uploadMessageFile,
  handleMulterError,
  verifyFileType,
  sendMessage
);

router.get('/:conversationId', validate(messagesQuerySchema, 'query'), getMessages);
router.put('/:messageId', validate(editMessageSchema), editMessage);
router.delete('/:messageId', validate(deleteMessageSchema), deleteMessage);
router.post('/:messageId/react', validate(reactToMessageSchema), reactToMessage);

// Mark conversation read
router.post('/conversation/:conversationId/read', markConversationRead);

export default router;
