import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotificationStore } from '../store/notificationStore.js';
import notificationApi from '../api/notification.api.js';
import toast from 'react-hot-toast';

export const useNotifications = () => {
  const notifStore = useNotificationStore();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await notificationApi.getNotifications({ limit: 50 });
      const { notifications, unreadCount } = response.data.data;
      notifStore.setNotifications(notifications);
      notifStore.setUnreadCount(unreadCount);
      return { notifications, unreadCount };
    },
    staleTime: 1000 * 60,
  });

  const markReadMutation = useMutation({
    mutationFn: (data) => notificationApi.markRead(data),
    onSuccess: (_, variables) => {
      if (variables.all) {
        notifStore.markAllRead();
      } else {
        notifStore.markRead(variables.notificationIds);
      }
    },
    onError: () => toast.error('Failed to mark notifications as read'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => notificationApi.deleteNotification(id),
    onSuccess: (_, id) => notifStore.deleteNotification(id),
    onError: () => toast.error('Failed to delete notification'),
  });

  return {
    notifications: notifStore.notifications,
    unreadCount: notifStore.unreadCount,
    isLoading: query.isLoading,
    markRead: markReadMutation.mutate,
    deleteNotification: deleteMutation.mutate,
    markAllRead: () => markReadMutation.mutate({ all: true }),
  };
};

export default useNotifications;
