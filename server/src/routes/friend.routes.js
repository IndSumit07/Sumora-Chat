import { Router } from 'express';
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
  getFriends,
  getPendingRequests,
} from '../controllers/friend.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { friendRequestLimiter, apiLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

router.use(protect);

router.get('/', apiLimiter, getFriends);
router.get('/requests/pending', apiLimiter, getPendingRequests);
router.post('/request', friendRequestLimiter, sendFriendRequest);
router.post('/request/:requestId/accept', apiLimiter, acceptFriendRequest);
router.post('/request/:requestId/reject', apiLimiter, rejectFriendRequest);
router.post('/request/:requestId/cancel', apiLimiter, cancelFriendRequest);
router.delete('/:friendId', apiLimiter, removeFriend);

export default router;
