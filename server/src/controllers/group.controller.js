import Group from '../models/Group.js';
import GroupMessage from '../models/GroupMessage.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { getRedisClient } from '../config/redis.js';
import {
  emitNewGroupMessage,
  emitMessageEdited,
  emitMessageDeleted,
  emitMessageReaction,
  emitAddedToGroup,
  emitMemberAdded,
  emitMemberRemoved,
  emitGroupDeleted,
  emitNotification,
} from '../services/socket.service.js';
import { uploadAvatar as uploadAvatarToS3, uploadMessageImage, uploadGenericFile, deleteFile } from '../services/s3.service.js';
import { createOTP, verifyOTP } from '../services/otp.service.js';
import { queueEmail } from '../config/bullmq.js';
import { groupInviteEmailTemplate } from '../services/email.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middlewares/errorHandler.middleware.js';
import { successResponse, createdResponse, paginatedResponse } from '../utils/apiResponse.js';
import {
  MEMBER_ROLES,
  MESSAGE_TYPES,
  MESSAGES_PER_PAGE,
  NOTIFICATION_TYPES,
  ALLOWED_IMAGE_TYPES,
  S3_FOLDERS,
  DELETE_MESSAGE_TIME_LIMIT_HOURS,
} from '../utils/constants.js';
import { v4 as uuidv4 } from 'uuid';
import logger from '../config/logger.js';

// =========================
// POST /api/groups
// =========================
export const createGroup = asyncHandler(async (req, res) => {
  const { name, description, memberIds } = req.body;
  const creatorId = req.userId;

  // Validate members are friends
  const creator = await User.findById(creatorId).select('friends').lean();
  const invalidMembers = memberIds.filter(
    (id) => !creator.friends.some((f) => f.toString() === id)
  );
  if (invalidMembers.length > 0) {
    throw new AppError('Some members are not your friends', 400, 'VALIDATION_ERROR');
  }

  // Build member list
  const members = [
    { user: creatorId, role: MEMBER_ROLES.ADMIN, addedBy: creatorId },
    ...memberIds
      .filter((id) => id !== creatorId)
      .map((id) => ({ user: id, role: MEMBER_ROLES.MEMBER, addedBy: creatorId })),
  ];

  const group = await Group.create({
    name,
    description: description || '',
    createdBy: creatorId,
    members,
    inviteLink: uuidv4(),
  });

  await group.populate('members.user', 'fullName username avatar');

  // Notify added members
  for (const memberId of memberIds) {
    if (memberId !== creatorId) {
      emitAddedToGroup(memberId, group.toObject());

      const notification = await Notification.create({
        recipient: memberId,
        sender: creatorId,
        type: NOTIFICATION_TYPES.GROUP_INVITE,
        referenceId: group._id,
        referenceModel: 'Group',
        data: { groupName: name },
      });
      emitNotification(memberId, notification.toObject());
    }
  }

  return createdResponse(res, { data: { group } });
});

// ============================
// GET /api/groups/:groupId
// ============================
export const getGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const userId = req.userId;

  const group = await Group.findById(groupId)
    .populate('members.user', 'fullName username avatar bio')
    .populate('createdBy', 'fullName username')
    .lean();

  if (!group || group.isDeleted) throw new AppError('Group not found', 404, 'NOT_FOUND');

  const isMember = group.members.some((m) => m.user._id.toString() === userId);
  if (!isMember) throw new AppError('You are not a member of this group', 403, 'FORBIDDEN');

  return successResponse(res, { data: { group } });
});

// ==============================
// GET /api/groups [Protected]
// ==============================
export const getUserGroups = asyncHandler(async (req, res) => {
  const userId = req.userId;

  const groups = await Group.find({
    'members.user': userId,
    isDeleted: { $ne: true },
  })
    .populate('lastMessage', 'content type sender createdAt')
    .sort({ lastMessageAt: -1 })
    .lean();

  return successResponse(res, { data: { groups } });
});

// ==============================
// PUT /api/groups/:groupId
// ==============================
export const updateGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { name, description } = req.body;
  const userId = req.userId;

  const group = await Group.findById(groupId);
  if (!group || group.isDeleted) throw new AppError('Group not found', 404, 'NOT_FOUND');

  if (!group.isAdminOrCoAdmin(userId)) {
    if (!group.isMember(userId) || !group.settings.allowMembersToEditInfo) {
      throw new AppError('Permission denied', 403, 'FORBIDDEN');
    }
  }

  if (name !== undefined) group.name = name;
  if (description !== undefined) group.description = description;

  // Handle avatar upload
  if (req.file) {
    if (group.avatarKey) await deleteFile(group.avatarKey);
    const { url, key } = await uploadAvatarToS3({ buffer: req.file.buffer, userId });
    group.avatar = url;
    group.avatarKey = key;
  }

  await group.save();
  await group.populate('members.user', 'fullName username avatar');

  return successResponse(res, { message: 'Group updated', data: { group } });
});

// ======================================
// PUT /api/groups/:groupId/settings
// ======================================
export const updateGroupSettings = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const settings = req.body;
  const userId = req.userId;

  const group = await Group.findById(groupId);
  if (!group || group.isDeleted) throw new AppError('Group not found', 404, 'NOT_FOUND');
  if (!group.isAdmin(userId)) throw new AppError('Only admins can change settings', 403, 'FORBIDDEN');

  Object.assign(group.settings, settings);
  await group.save();

  return successResponse(res, { message: 'Settings updated', data: { settings: group.settings } });
});

// =================================
// POST /api/groups/:groupId/members
// =================================
export const addMember = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { userId: targetUserId } = req.body;
  const requesterId = req.userId;

  const group = await Group.findById(groupId);
  if (!group || group.isDeleted) throw new AppError('Group not found', 404, 'NOT_FOUND');

  if (!group.isMember(requesterId)) throw new AppError('You are not a member', 403, 'FORBIDDEN');

  if (!group.isAdminOrCoAdmin(requesterId) && !group.settings.allowMembersToAddOthers) {
    throw new AppError('Only admins can add members', 403, 'FORBIDDEN');
  }

  if (group.isMember(targetUserId)) {
    throw new AppError('User is already a member', 409, 'CONFLICT');
  }

  const targetUser = await User.findById(targetUserId).select('fullName username avatar email').lean();
  if (!targetUser || targetUser.isDeleted) throw new AppError('User not found', 404, 'NOT_FOUND');

  group.members.push({
    user: targetUserId,
    role: MEMBER_ROLES.MEMBER,
    addedBy: requesterId,
  });
  await group.save();

  const memberData = { user: targetUser, role: MEMBER_ROLES.MEMBER, addedBy: requesterId };
  emitMemberAdded(groupId, { groupId, member: memberData });
  emitAddedToGroup(targetUserId, { groupId, groupName: group.name, avatar: group.avatar });

  const notification = await Notification.create({
    recipient: targetUserId,
    sender: requesterId,
    type: NOTIFICATION_TYPES.GROUP_INVITE,
    referenceId: group._id,
    referenceModel: 'Group',
    data: { groupName: group.name },
  });
  emitNotification(targetUserId, notification.toObject());

  // Send email notification
  const requester = await User.findById(requesterId).select('fullName').lean();
  await queueEmail({
    to: targetUser.email,
    subject: `You've been added to "${group.name}" on Sumora Chat`,
    html: groupInviteEmailTemplate({
      inviterName: requester?.fullName || 'Someone',
      groupName: group.name,
      recipientName: targetUser.fullName,
      inviteLink: `${process.env.FRONTEND_URL}/groups/${groupId}`,
    }),
  });

  return createdResponse(res, { data: { member: memberData } });
});

// ==========================================
// DELETE /api/groups/:groupId/members/:userId
// ==========================================
export const removeMember = asyncHandler(async (req, res) => {
  const { groupId, userId: targetUserId } = req.params;
  const requesterId = req.userId;

  const group = await Group.findById(groupId);
  if (!group || group.isDeleted) throw new AppError('Group not found', 404, 'NOT_FOUND');

  if (!group.isAdminOrCoAdmin(requesterId)) {
    throw new AppError('Only admins can remove members', 403, 'FORBIDDEN');
  }

  const targetMember = group.getMember(targetUserId);
  if (!targetMember) throw new AppError('Member not found in group', 404, 'NOT_FOUND');
  if (targetMember.role === MEMBER_ROLES.ADMIN) {
    throw new AppError('Cannot remove the group admin', 403, 'FORBIDDEN');
  }

  group.members = group.members.filter((m) => m.user.toString() !== targetUserId);
  await group.save();

  emitMemberRemoved(groupId, { groupId, userId: targetUserId });

  return successResponse(res, { message: 'Member removed' });
});

// ==========================================
// PUT /api/groups/:groupId/members/:userId/role
// ==========================================
export const updateMemberRole = asyncHandler(async (req, res) => {
  const { groupId, userId: targetUserId } = req.params;
  const { role } = req.body;
  const requesterId = req.userId;

  const group = await Group.findById(groupId);
  if (!group || group.isDeleted) throw new AppError('Group not found', 404, 'NOT_FOUND');
  if (!group.isAdmin(requesterId)) throw new AppError('Only the admin can change roles', 403, 'FORBIDDEN');

  const member = group.getMember(targetUserId);
  if (!member) throw new AppError('Member not found', 404, 'NOT_FOUND');

  member.role = role;
  await group.save();

  return successResponse(res, { message: 'Role updated', data: { userId: targetUserId, role } });
});

// ==============================
// POST /api/groups/:groupId/leave
// ==============================
export const leaveGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const userId = req.userId;

  const group = await Group.findById(groupId);
  if (!group || group.isDeleted) throw new AppError('Group not found', 404, 'NOT_FOUND');
  if (!group.isMember(userId)) throw new AppError('You are not a member', 403, 'FORBIDDEN');

  const isOnlyAdmin = group.isAdmin(userId) && group.members.filter(m => m.role === MEMBER_ROLES.ADMIN).length === 1;

  if (isOnlyAdmin) {
    if (group.members.length === 1) {
      // Last member — delete group
      group.isDeleted = true;
      group.deletedAt = new Date();
      await group.save();
      emitGroupDeleted(groupId, { groupId, reason: 'Last member left' });
      return successResponse(res, { message: 'Group deleted as you were the last member' });
    }

    // Transfer admin to next co-admin or longest-standing member
    const nextAdmin = group.members.find(m => m.user.toString() !== userId && m.role === MEMBER_ROLES.CO_ADMIN)
      || group.members.find(m => m.user.toString() !== userId);

    if (nextAdmin) {
      nextAdmin.role = MEMBER_ROLES.ADMIN;
    }
  }

  group.members = group.members.filter((m) => m.user.toString() !== userId);
  await group.save();

  emitMemberRemoved(groupId, { groupId, userId, reason: 'left' });

  return successResponse(res, { message: 'Left the group successfully' });
});

// ======================================
// POST /api/groups/:groupId/messages
// ======================================
export const sendGroupMessage = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { content, type = MESSAGE_TYPES.TEXT, replyTo } = req.body;
  const senderId = req.userId;

  const group = await Group.findById(groupId);
  if (!group || group.isDeleted) throw new AppError('Group not found', 404, 'NOT_FOUND');
  if (!group.isMember(senderId)) throw new AppError('Not a group member', 403, 'FORBIDDEN');

  if (group.settings.onlyAdminsCanMessage && !group.isAdminOrCoAdmin(senderId)) {
    throw new AppError('Only admins can send messages in this group', 403, 'FORBIDDEN');
  }

  const messageData = {
    groupId,
    sender: senderId,
    type,
    replyTo: replyTo || null,
  };

  if (req.file) {
    const mimeType = req.file.mimetype;
    let uploadResult;

    if (ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      uploadResult = await uploadMessageImage({
        buffer: req.file.buffer,
        userId: senderId,
        conversationId: null,
        originalName: req.file.originalname,
        mimeType,
      });
      messageData.type = MESSAGE_TYPES.IMAGE;
      messageData.thumbnailUrl = uploadResult.thumbnailUrl;
      messageData.thumbnailKey = uploadResult.thumbnailKey;
    } else {
      uploadResult = await uploadGenericFile({
        buffer: req.file.buffer,
        userId: senderId,
        folder: `groups/${groupId}`,
        originalName: req.file.originalname,
        mimeType,
      });
      messageData.type = mimeType.startsWith('audio/') ? MESSAGE_TYPES.VOICE_NOTE
        : mimeType.startsWith('video/') ? MESSAGE_TYPES.VIDEO
        : MESSAGE_TYPES.DOCUMENT;
    }

    messageData.fileUrl = uploadResult.url;
    messageData.fileKey = uploadResult.key;
    messageData.fileName = req.file.originalname;
    messageData.fileSize = req.file.size;
    messageData.mimeType = mimeType;
  } else if (content) {
    messageData.content = content;
  } else {
    throw new AppError('Message must have content or a file', 400, 'VALIDATION_ERROR');
  }

  const message = await GroupMessage.create(messageData);

  group.lastMessage = message._id;
  group.lastMessageAt = message.createdAt;
  await group.save();

  await message.populate('sender', 'fullName username avatar');
  if (message.replyTo) {
    await message.populate('replyTo', 'content sender type');
  }

  const messageObj = message.toJSON();
  emitNewGroupMessage(groupId, messageObj);

  // Push notifications for offline members
  const redis = getRedisClient();
  const offlineMembers = [];
  for (const m of group.members) {
    if (m.user.toString() === senderId) continue;
    const isOnline = await redis.exists(`user:online:${m.user}`);
    if (!isOnline) offlineMembers.push(m.user);
  }

  if (offlineMembers.length > 0) {
    const sender = await User.findById(senderId).select('fullName').lean();
    await Notification.insertMany(
      offlineMembers.map((uid) => ({
        recipient: uid,
        sender: senderId,
        type: NOTIFICATION_TYPES.GROUP_MESSAGE,
        referenceId: message._id,
        referenceModel: 'GroupMessage',
        data: {
          groupId,
          groupName: group.name,
          preview: content ? content.substring(0, 100) : `Sent a ${messageData.type}`,
          senderName: sender?.fullName,
        },
      }))
    );
  }

  return createdResponse(res, { data: { message: messageObj } });
});

// ============================================
// GET /api/groups/:groupId/messages
// ============================================
export const getGroupMessages = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { cursor, limit = MESSAGES_PER_PAGE } = req.query;
  const userId = req.userId;

  const group = await Group.findById(groupId);
  if (!group || group.isDeleted) throw new AppError('Group not found', 404, 'NOT_FOUND');
  if (!group.isMember(userId)) throw new AppError('Not a group member', 403, 'FORBIDDEN');

  const query = { groupId, deletedFor: { $ne: userId } };
  if (cursor) query._id = { $lt: cursor };

  const messages = await GroupMessage.find(query)
    .sort({ _id: -1 })
    .limit(parseInt(limit) + 1)
    .populate('sender', 'fullName username avatar')
    .populate('replyTo', 'content sender type fileUrl')
    .lean();

  const hasMore = messages.length > parseInt(limit);
  const data = hasMore ? messages.slice(0, -1) : messages;
  const nextCursor = hasMore ? data[data.length - 1]._id : null;

  // Mark as read for current user
  await GroupMessage.updateMany(
    { groupId, 'readBy.user': { $ne: userId }, isDeleted: { $ne: true } },
    { $addToSet: { readBy: { user: userId, readAt: new Date() } } }
  );

  return successResponse(res, {
    data: { messages: data },
    meta: { cursor: nextCursor, hasMore, limit: parseInt(limit) },
  });
});

// =====================================
// DELETE /api/groups/:groupId [Admin only]
// =====================================
export const deleteGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const userId = req.userId;

  const group = await Group.findById(groupId);
  if (!group || group.isDeleted) throw new AppError('Group not found', 404, 'NOT_FOUND');
  if (!group.isAdmin(userId)) throw new AppError('Only admin can delete the group', 403, 'FORBIDDEN');

  // Send OTP for confirmation
  const otp = await createOTP('delete_group', userId);
  const user = await User.findById(userId).select('email fullName').lean();
  await queueEmail({
    to: user.email,
    subject: `Confirm deletion of "${group.name}"`,
    html: `<p>Your OTP to delete group "${group.name}" is: <strong>${otp}</strong>. Expires in 10 minutes.</p>`,
  });

  return successResponse(res, { message: 'OTP sent to confirm group deletion' });
});

// ====================================
// POST /api/groups/:groupId/confirm-delete
// ====================================
export const confirmDeleteGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { otp } = req.body;
  const userId = req.userId;

  const group = await Group.findById(groupId);
  if (!group || group.isDeleted) throw new AppError('Group not found', 404, 'NOT_FOUND');
  if (!group.isAdmin(userId)) throw new AppError('Only admin can delete the group', 403, 'FORBIDDEN');

  const result = await verifyOTP('delete_group', userId, otp);
  if (!result.valid) throw new AppError(result.reason, 400, 'INVALID_OTP');

  // Delete group avatar from S3
  if (group.avatarKey) await deleteFile(group.avatarKey);

  // Delete all group messages and their files
  const messages = await GroupMessage.find({ groupId }).select('fileKey thumbnailKey').lean();
  for (const msg of messages) {
    if (msg.fileKey) await deleteFile(msg.fileKey);
    if (msg.thumbnailKey) await deleteFile(msg.thumbnailKey);
  }
  await GroupMessage.deleteMany({ groupId });

  group.isDeleted = true;
  group.deletedAt = new Date();
  await group.save();

  emitGroupDeleted(groupId, { groupId, groupName: group.name, deletedBy: userId });

  return successResponse(res, { message: 'Group deleted successfully' });
});
