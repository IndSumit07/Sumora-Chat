import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export const useChatStore = create(
  immer((set, get) => ({
    // Active conversation or group
    activeConversationId: null,
    activeGroupId: null,
    activeType: null, // 'dm' | 'group'

    // Messages map: conversationId/groupId -> messages array
    messages: {},
    hasMore: {},
    cursors: {},

    // Typing indicators: conversationId/groupId -> [userIds]
    typingUsers: {},

    // Conversations list
    conversations: [],
    groups: [],

    // Unread counts
    unreadCounts: {},

    // ========================
    // Active conversation
    // ========================
    setActiveConversation: (conversationId) =>
      set((state) => {
        state.activeConversationId = conversationId;
        state.activeGroupId = null;
        state.activeType = 'dm';
      }),

    setActiveGroup: (groupId) =>
      set((state) => {
        state.activeGroupId = groupId;
        state.activeConversationId = null;
        state.activeType = 'group';
      }),

    clearActive: () =>
      set((state) => {
        state.activeConversationId = null;
        state.activeGroupId = null;
        state.activeType = null;
      }),

    // ========================
    // Messages
    // ========================
    setMessages: (roomId, messages, cursor, hasMore) =>
      set((state) => {
        state.messages[roomId] = messages;
        state.cursors[roomId] = cursor;
        state.hasMore[roomId] = hasMore;
      }),

    prependMessages: (roomId, messages, cursor, hasMore) =>
      set((state) => {
        const existing = state.messages[roomId] || [];
        state.messages[roomId] = [...messages, ...existing];
        state.cursors[roomId] = cursor;
        state.hasMore[roomId] = hasMore;
      }),

    addMessage: (roomId, message) =>
      set((state) => {
        if (!state.messages[roomId]) state.messages[roomId] = [];
        // Prevent duplicates
        const exists = state.messages[roomId].some((m) => m._id === message._id);
        if (!exists) {
          state.messages[roomId] = [...state.messages[roomId], message];
        }
      }),

    updateMessage: (roomId, messageId, updates) =>
      set((state) => {
        if (!state.messages[roomId]) return;
        state.messages[roomId] = state.messages[roomId].map((m) =>
          m._id === messageId ? { ...m, ...updates } : m
        );
      }),

    deleteMessageFromState: (roomId, messageId) =>
      set((state) => {
        if (!state.messages[roomId]) return;
        state.messages[roomId] = state.messages[roomId].map((m) =>
          m._id === messageId
            ? { ...m, isDeleted: true, content: '[This message was deleted]' }
            : m
        );
      }),

    updateReactions: (roomId, messageId, reactions) =>
      set((state) => {
        if (!state.messages[roomId]) return;
        state.messages[roomId] = state.messages[roomId].map((m) =>
          m._id === messageId ? { ...m, reactions } : m
        );
      }),

    markMessagesRead: (roomId, readBy, readAt) =>
      set((state) => {
        if (!state.messages[roomId]) return;
        state.messages[roomId] = state.messages[roomId].map((m) => {
          if (m.sender?._id !== readBy && !m.readBy?.some((r) => r.user === readBy)) {
            return {
              ...m,
              readBy: [...(m.readBy || []), { user: readBy, readAt }],
            };
          }
          return m;
        });
      }),

    // ========================
    // Typing indicators
    // ========================
    addTypingUser: (roomId, user) =>
      set((state) => {
        if (!state.typingUsers[roomId]) state.typingUsers[roomId] = [];
        const exists = state.typingUsers[roomId].some((u) => u._id === user._id);
        if (!exists) {
          state.typingUsers[roomId] = [...state.typingUsers[roomId], user];
        }
      }),

    removeTypingUser: (roomId, userId) =>
      set((state) => {
        if (!state.typingUsers[roomId]) return;
        state.typingUsers[roomId] = state.typingUsers[roomId].filter(
          (u) => u._id !== userId
        );
      }),

    // ========================
    // Conversations
    // ========================
    setConversations: (conversations) =>
      set((state) => {
        state.conversations = conversations;
      }),

    updateConversation: (conversationId, updates) =>
      set((state) => {
        state.conversations = state.conversations.map((c) =>
          c._id === conversationId ? { ...c, ...updates } : c
        );
      }),

    moveConversationToTop: (conversationId, lastMessage) =>
      set((state) => {
        const idx = state.conversations.findIndex((c) => c._id === conversationId);
        if (idx === -1) return;
        const conv = { ...state.conversations[idx], lastMessage, lastMessageAt: new Date() };
        state.conversations.splice(idx, 1);
        state.conversations.unshift(conv);
      }),

    // ========================
    // Groups
    // ========================
    setGroups: (groups) =>
      set((state) => {
        state.groups = groups;
      }),

    addGroup: (group) =>
      set((state) => {
        const exists = state.groups.some((g) => g._id === group._id);
        if (!exists) state.groups = [group, ...state.groups];
      }),

    updateGroup: (groupId, updates) =>
      set((state) => {
        state.groups = state.groups.map((g) =>
          g._id === groupId ? { ...g, ...updates } : g
        );
      }),

    removeGroup: (groupId) =>
      set((state) => {
        state.groups = state.groups.filter((g) => g._id !== groupId);
      }),

    // ========================
    // Unread counts
    // ========================
    setUnreadCount: (roomId, count) =>
      set((state) => {
        state.unreadCounts[roomId] = count;
      }),

    incrementUnread: (roomId) =>
      set((state) => {
        state.unreadCounts[roomId] = (state.unreadCounts[roomId] || 0) + 1;
      }),

    resetUnread: (roomId) =>
      set((state) => {
        state.unreadCounts[roomId] = 0;
      }),
  }))
);

export default useChatStore;
