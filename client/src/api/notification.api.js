import api from './axios.js';

export const notificationApi = {
  getNotifications: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/count'),
  markRead: (data) => api.post('/notifications/mark-read', data),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
};

export default notificationApi;
