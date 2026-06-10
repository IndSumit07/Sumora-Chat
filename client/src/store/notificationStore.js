import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export const useNotificationStore = create(
  immer((set) => ({
    notifications: [],
    unreadCount: 0,

    setNotifications: (notifications) =>
      set((state) => {
        state.notifications = notifications;
      }),

    addNotification: (notification) =>
      set((state) => {
        const exists = state.notifications.some((n) => n._id === notification._id);
        if (!exists) {
          state.notifications = [notification, ...state.notifications];
          if (!notification.isRead) {
            state.unreadCount = state.unreadCount + 1;
          }
        }
      }),

    setUnreadCount: (count) =>
      set((state) => {
        state.unreadCount = count;
      }),

    incrementUnread: () =>
      set((state) => {
        state.unreadCount = state.unreadCount + 1;
      }),

    markRead: (notificationIds) =>
      set((state) => {
        let readCount = 0;
        state.notifications = state.notifications.map((n) => {
          if (notificationIds.includes(n._id) && !n.isRead) {
            readCount++;
            return { ...n, isRead: true };
          }
          return n;
        });
        state.unreadCount = Math.max(0, state.unreadCount - readCount);
      }),

    markAllRead: () =>
      set((state) => {
        state.notifications = state.notifications.map((n) => ({ ...n, isRead: true }));
        state.unreadCount = 0;
      }),

    deleteNotification: (notificationId) =>
      set((state) => {
        const notif = state.notifications.find((n) => n._id === notificationId);
        state.notifications = state.notifications.filter((n) => n._id !== notificationId);
        if (notif && !notif.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      }),

    reset: () =>
      set((state) => {
        state.notifications = [];
        state.unreadCount = 0;
      }),
  }))
);

export default useNotificationStore;
