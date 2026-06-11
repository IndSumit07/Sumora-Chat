import toast from 'react-hot-toast';
import { useChatStore } from '../store/chatStore.js';
import { useNotificationStore } from '../store/notificationStore.js';
import { useUIStore } from '../store/uiStore.js';
import { useAuthStore } from '../store/authStore.js';

const EVENTS = {
  NEW_MESSAGE: 'newMessage',
  NEW_GROUP_MESSAGE: 'newGroupMessage',
  MESSAGE_EDITED: 'messageEdited',
  MESSAGE_DELETED: 'messageDeleted',
  MESSAGE_REACTION: 'messageReaction',
  MESSAGES_READ: 'messagesRead',
  TYPING_START: 'typingStart',
  TYPING_STOP: 'typingStop',
  USER_ONLINE: 'userOnline',
  USER_OFFLINE: 'userOffline',
  FRIEND_REQUEST: 'friendRequest',
  FRIEND_REQUEST_ACCEPTED: 'friendRequestAccepted',
  ADDED_TO_GROUP: 'addedToGroup',
  MEMBER_ADDED: 'memberAdded',
  MEMBER_REMOVED: 'memberRemoved',
  GROUP_DELETED: 'groupDeleted',
  NOTIFICATION: 'notification',
};

let heartbeatInterval = null;

/**
 * Initialize all socket event listeners.
 * Called once after authentication. Safe to call multiple times —
 * removes all existing listeners before re-attaching.
 */
export const initSocketListeners = (socket) => {
  if (!socket) return;

  // Clean up any previous listeners to prevent duplicates
  // (e.g. after logout → re-login, or socket reconnect)
  Object.values(EVENTS).forEach((event) => socket.off(event));
  socket.off('disconnect');

  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  const chatStore = useChatStore.getState;
  const notifStore = useNotificationStore.getState;
  const uiStore = useUIStore.getState;

  // ========================
  // New DM Message
  // ========================
  socket.on(EVENTS.NEW_MESSAGE, (message) => {
    const { activeConversationId } = chatStore();
    const roomId = message.conversationId;

    chatStore().addMessage(roomId, message);
    chatStore().moveConversationToTop(roomId, message);

    if (roomId !== activeConversationId) {
      chatStore().incrementUnread(roomId);
      // Toast notification for background messages
      toast(message.sender?.fullName || 'New message', {
        icon: '💬',
        duration: 3000,
      });
    }
  });

  // ========================
  // New Group Message
  // ========================
  socket.on(EVENTS.NEW_GROUP_MESSAGE, (message) => {
    const { activeGroupId } = chatStore();
    const roomId = message.groupId;

    chatStore().addMessage(roomId, message);
    chatStore().updateGroup(roomId, { lastMessage: message, lastMessageAt: message.createdAt });

    if (roomId !== activeGroupId) {
      chatStore().incrementUnread(roomId);
    }
  });

  // ========================
  // Message Edited
  // ========================
  socket.on(EVENTS.MESSAGE_EDITED, (data) => {
    const roomId = data.conversationId || data.groupId;
    chatStore().updateMessage(roomId, data.messageId, {
      content: data.content,
      isEdited: true,
      editedAt: data.editedAt,
    });
  });

  // ========================
  // Message Deleted
  // ========================
  socket.on(EVENTS.MESSAGE_DELETED, (data) => {
    const roomId = data.conversationId || data.groupId;
    if (data.deletedFor === 'everyone') {
      chatStore().deleteMessageFromState(roomId, data.messageId);
    }
  });

  // ========================
  // Message Reaction
  // ========================
  socket.on(EVENTS.MESSAGE_REACTION, (data) => {
    const roomId = data.conversationId || data.groupId;
    chatStore().updateReactions(roomId, data.messageId, data.reactions);
  });

  // ========================
  // Messages Read
  // ========================
  socket.on(EVENTS.MESSAGES_READ, (data) => {
    const { conversationId, readBy, readAt } = data;
    chatStore().markMessagesRead(conversationId, readBy, readAt);
    chatStore().resetUnread(conversationId);
  });

  // ========================
  // Typing Start
  // ========================
  socket.on(EVENTS.TYPING_START, (data) => {
    const roomId = data.conversationId || data.groupId;
    chatStore().addTypingUser(roomId, data.user);
  });

  // ========================
  // Typing Stop
  // ========================
  socket.on(EVENTS.TYPING_STOP, (data) => {
    const roomId = data.conversationId || data.groupId;
    chatStore().removeTypingUser(roomId, data.userId);
  });

  // ========================
  // User Online
  // ========================
  socket.on(EVENTS.USER_ONLINE, (data) => {
    uiStore().setUserOnline(data.userId, true);
  });

  // ========================
  // User Offline
  // ========================
  socket.on(EVENTS.USER_OFFLINE, (data) => {
    uiStore().setUserOnline(data.userId, false);
  });

  // ========================
  // Friend Request
  // ========================
  socket.on(EVENTS.FRIEND_REQUEST, (data) => {
    // addNotification handles unread increment internally
    notifStore().addNotification(data.notification);
    toast(`${data.request?.sender?.fullName} sent you a friend request`, {
      icon: '👋',
      duration: 5000,
    });
  });

  // ========================
  // Friend Request Accepted
  // ========================
  socket.on(EVENTS.FRIEND_REQUEST_ACCEPTED, (data) => {
    notifStore().addNotification(data.notification);
    toast(`${data.notification?.data?.acceptorName} accepted your friend request!`, {
      icon: '🎉',
      duration: 5000,
    });
  });

  // ========================
  // Added to Group
  // ========================
  socket.on(EVENTS.ADDED_TO_GROUP, (group) => {
    chatStore().addGroup(group);
    toast(`You were added to "${group.name}"`, {
      icon: '👥',
      duration: 4000,
    });
    // Join group room
    socket.emit('joinGroup', { groupId: group._id });
  });

  // ========================
  // Member Added to Group
  // ========================
  socket.on(EVENTS.MEMBER_ADDED, (data) => {
    chatStore().updateGroup(data.groupId, {});
  });

  // ========================
  // Member Removed from Group
  // ========================
  socket.on(EVENTS.MEMBER_REMOVED, (data) => {
    // BUG FIX: was using useSocketStore which doesn't have user — use useAuthStore
    const { user } = useAuthStore.getState();
    // If current user was removed
    if (data.userId === user?._id) {
      chatStore().removeGroup(data.groupId);
      if (chatStore().activeGroupId === data.groupId) {
        chatStore().clearActive();
      }
    }
  });

  // ========================
  // Group Deleted
  // ========================
  socket.on(EVENTS.GROUP_DELETED, (data) => {
    chatStore().removeGroup(data.groupId);
    if (chatStore().activeGroupId === data.groupId) {
      chatStore().clearActive();
    }
    toast(`Group "${data.groupName}" has been deleted`, {
      icon: '🗑️',
      duration: 4000,
    });
  });

  // ========================
  // General Notification
  // ========================
  socket.on(EVENTS.NOTIFICATION, (notification) => {
    // addNotification handles unread increment internally
    notifStore().addNotification(notification);
  });

  // ========================
  // Heartbeat (keep online)
  // ========================
  heartbeatInterval = setInterval(() => {
    if (socket.connected) {
      socket.emit('heartbeat');
    }
  }, 120000); // Every 2 minutes

  // Cleanup on disconnect
  socket.on('disconnect', () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  });
};

export default initSocketListeners;
