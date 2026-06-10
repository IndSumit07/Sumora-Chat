import api from './axios.js';

export const conversationApi = {
  getConversations: () => api.get('/conversations'),
  getConversation: (id) => api.get(`/conversations/${id}`),
  createOrGet: (data) => api.post('/conversations', data),
  clear: (id) => api.delete(`/conversations/${id}`),
  markRead: (id) => api.post(`/conversations/${id}/read`),
};

export default conversationApi;
