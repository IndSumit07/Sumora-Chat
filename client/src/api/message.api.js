import api from './axios.js';

export const messageApi = {
  getMessages: (conversationId, params) =>
    api.get(`/messages/${conversationId}`, { params }),
  sendMessage: (conversationId, data) =>
    api.post(`/messages/${conversationId}`, data),
  editMessage: (messageId, data) =>
    api.put(`/messages/${messageId}`, data),
  deleteMessage: (messageId, data) =>
    api.delete(`/messages/${messageId}`, { data }),
  reactToMessage: (messageId, data) =>
    api.post(`/messages/${messageId}/react`, data),
  markRead: (conversationId) =>
    api.post(`/messages/conversation/${conversationId}/read`),
};

export default messageApi;
