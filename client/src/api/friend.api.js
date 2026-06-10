import api from './axios.js';

export const friendApi = {
  getFriends: () => api.get('/friends'),
  getPendingRequests: () => api.get('/friends/requests/pending'),
  sendRequest: (data) => api.post('/friends/request', data),
  acceptRequest: (requestId) => api.post(`/friends/request/${requestId}/accept`),
  rejectRequest: (requestId) => api.post(`/friends/request/${requestId}/reject`),
  cancelRequest: (requestId) => api.post(`/friends/request/${requestId}/cancel`),
  removeFriend: (friendId) => api.delete(`/friends/${friendId}`),
};

export default friendApi;
