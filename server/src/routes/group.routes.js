import { Router } from 'express';
import {
  createGroup,
  getGroup,
  getUserGroups,
  updateGroup,
  updateGroupSettings,
  addMember,
  removeMember,
  updateMemberRole,
  leaveGroup,
  sendGroupMessage,
  getGroupMessages,
  deleteGroup,
  confirmDeleteGroup,
} from '../controllers/group.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { messageLimiter, apiLimiter, uploadLimiter } from '../middlewares/rateLimiter.middleware.js';
import { uploadGroupAvatar, uploadMessageFile, handleMulterError, verifyFileType } from '../middlewares/upload.middleware.js';
import {
  createGroupSchema,
  updateGroupSchema,
  addMemberSchema,
  updateMemberRoleSchema,
  sendGroupMessageSchema,
  updateGroupSettingsSchema,
} from '../validators/group.validator.js';

const router = Router();

router.use(protect);

router.get('/', apiLimiter, getUserGroups);
router.post('/', apiLimiter, validate(createGroupSchema), createGroup);
router.get('/:groupId', apiLimiter, getGroup);
router.put('/:groupId', apiLimiter, uploadGroupAvatar, handleMulterError, verifyFileType, validate(updateGroupSchema), updateGroup);
router.put('/:groupId/settings', apiLimiter, validate(updateGroupSettingsSchema), updateGroupSettings);
router.post('/:groupId/members', apiLimiter, validate(addMemberSchema), addMember);
router.delete('/:groupId/members/:userId', apiLimiter, removeMember);
router.put('/:groupId/members/:userId/role', apiLimiter, validate(updateMemberRoleSchema), updateMemberRole);
router.post('/:groupId/leave', apiLimiter, leaveGroup);
router.post('/:groupId/messages', messageLimiter, uploadMessageFile, handleMulterError, verifyFileType, sendGroupMessage);
router.get('/:groupId/messages', apiLimiter, getGroupMessages);
router.delete('/:groupId', apiLimiter, deleteGroup);
router.post('/:groupId/confirm-delete', apiLimiter, confirmDeleteGroup);

export default router;
