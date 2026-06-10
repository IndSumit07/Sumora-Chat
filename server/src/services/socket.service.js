import { SOCKET_EVENTS } from '../utils/constants.js';
import logger from '../config/logger.js';

let _io = null;

/**
 * Initialize with the Socket.IO server instance
 */
export const initSocketService = (io) => {
  _io = io;
};

const getIO = () => {
  if (!_io) throw new Error('Socket.IO not initialized in socket.service');
  return _io;
};

/**
 * Emit to a user's personal room
 */
export const emitToUser = (userId, event, data) => {
  try {
    getIO().to(`user:${userId.toString()}`).emit(event, data);
  } catch (err) {
    logger.error(`Socket emit to user failed: ${err.message}`);
  }
};

/**
 * Emit to a conversation room
 */
export const emitToConversation = (conversationId, event, data) => {
  try {
    getIO().to(`conv:${conversationId.toString()}`).emit(event, data);
  } catch (err) {
    logger.error(`Socket emit to conversation failed: ${err.message}`);
  }
};

/**
 * Emit to a group room
 */
export const emitToGroup = (groupId, event, data) => {
  try {
    getIO().to(`group:${groupId.toString()}`).emit(event, data);
  } catch (err) {
    logger.error(`Socket emit to group failed: ${err.message}`);
  }
};

/**
 * Emit new DM message
 */
export const emitNewMessage = (conversationId, message) => {
  emitToConversation(conversationId, SOCKET_EVENTS.NEW_MESSAGE, message);
};

/**
 * Emit new group message
 */
export const emitNewGroupMessage = (groupId, message) => {
  emitToGroup(groupId, SOCKET_EVENTS.NEW_GROUP_MESSAGE, message);
};

/**
 * Emit message edited event
 */
export const emitMessageEdited = (conversationId, messageData, isGroup = false) => {
  if (isGroup) {
    emitToGroup(conversationId, SOCKET_EVENTS.MESSAGE_EDITED, messageData);
  } else {
    emitToConversation(conversationId, SOCKET_EVENTS.MESSAGE_EDITED, messageData);
  }
};

/**
 * Emit message deleted event
 */
export const emitMessageDeleted = (conversationId, messageData, isGroup = false) => {
  if (isGroup) {
    emitToGroup(conversationId, SOCKET_EVENTS.MESSAGE_DELETED, messageData);
  } else {
    emitToConversation(conversationId, SOCKET_EVENTS.MESSAGE_DELETED, messageData);
  }
};

/**
 * Emit message reaction event
 */
export const emitMessageReaction = (conversationId, reactionData, isGroup = false) => {
  if (isGroup) {
    emitToGroup(conversationId, SOCKET_EVENTS.MESSAGE_REACTION, reactionData);
  } else {
    emitToConversation(conversationId, SOCKET_EVENTS.MESSAGE_REACTION, reactionData);
  }
};

/**
 * Emit messages read event
 */
export const emitMessagesRead = (conversationId, readData) => {
  emitToConversation(conversationId, SOCKET_EVENTS.MESSAGES_READ, readData);
};

/**
 * Emit user online status to all friend rooms
 */
export const emitUserOnline = (userId, friendIds) => {
  for (const friendId of friendIds) {
    emitToUser(friendId, SOCKET_EVENTS.USER_ONLINE, { userId: userId.toString() });
  }
};

/**
 * Emit user offline to all friend rooms
 */
export const emitUserOffline = (userId, friendIds, lastSeen) => {
  for (const friendId of friendIds) {
    emitToUser(friendId, SOCKET_EVENTS.USER_OFFLINE, {
      userId: userId.toString(),
      lastSeen,
    });
  }
};

/**
 * Emit notification to a user
 */
export const emitNotification = (userId, notification) => {
  emitToUser(userId, SOCKET_EVENTS.NOTIFICATION, notification);
};

/**
 * Emit friend request to receiver
 */
export const emitFriendRequest = (receiverId, requestData) => {
  emitToUser(receiverId, SOCKET_EVENTS.FRIEND_REQUEST, requestData);
};

/**
 * Emit friend request accepted to sender
 */
export const emitFriendRequestAccepted = (senderId, data) => {
  emitToUser(senderId, SOCKET_EVENTS.FRIEND_REQUEST_ACCEPTED, data);
};

/**
 * Emit added-to-group event to a user
 */
export const emitAddedToGroup = (userId, groupData) => {
  emitToUser(userId, SOCKET_EVENTS.ADDED_TO_GROUP, groupData);
};

/**
 * Emit member added to group room
 */
export const emitMemberAdded = (groupId, memberData) => {
  emitToGroup(groupId, SOCKET_EVENTS.MEMBER_ADDED, memberData);
};

/**
 * Emit member removed from group room
 */
export const emitMemberRemoved = (groupId, memberData) => {
  emitToGroup(groupId, SOCKET_EVENTS.MEMBER_REMOVED, memberData);
};

/**
 * Emit group deleted to all members
 */
export const emitGroupDeleted = (groupId, data) => {
  emitToGroup(groupId, SOCKET_EVENTS.GROUP_DELETED, data);
};

export default {
  initSocketService,
  emitToUser,
  emitToConversation,
  emitToGroup,
  emitNewMessage,
  emitNewGroupMessage,
  emitMessageEdited,
  emitMessageDeleted,
  emitMessageReaction,
  emitMessagesRead,
  emitUserOnline,
  emitUserOffline,
  emitNotification,
  emitFriendRequest,
  emitFriendRequestAccepted,
  emitAddedToGroup,
  emitMemberAdded,
  emitMemberRemoved,
  emitGroupDeleted,
};
