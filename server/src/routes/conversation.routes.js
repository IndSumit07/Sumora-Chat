import { Router } from 'express';
import {
  getConversations,
  getConversation,
  createOrGetConversation,
  clearConversation,
} from '../controllers/conversation.controller.js';
import { markConversationRead } from '../controllers/message.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { apiLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

router.use(protect);
router.use(apiLimiter);

router.get('/', getConversations);
router.get('/:conversationId', getConversation);
router.post('/', createOrGetConversation);
router.delete('/:conversationId', clearConversation);
router.post('/:conversationId/read', markConversationRead);

export default router;
