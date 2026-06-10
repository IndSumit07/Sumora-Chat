import api from './axios.js';

export const groupApi = {
  getGroups: () => api.get('/groups'),
  getGroup: (id) => api.get(`/groups/${id}`),
  createGroup: (data) => api.post('/groups', data),
  updateGroup: (id, data) => api.put(`/groups/${id}`, data),
  updateSettings: (id, data) => api.put(`/groups/${id}/settings`, data),
  addMember: (groupId, data) => api.post(`/groups/${groupId}/members`, data),
  removeMember: (groupId, userId) => api.delete(`/groups/${groupId}/members/${userId}`),
  updateMemberRole: (groupId, userId, data) => api.put(`/groups/${groupId}/members/${userId}/role`, data),
  leaveGroup: (id) => api.post(`/groups/${id}/leave`),
  sendMessage: (groupId, data) => api.post(`/groups/${groupId}/messages`, data),
  getMessages: (groupId, params) => api.get(`/groups/${groupId}/messages`, { params }),
  deleteGroup: (id) => api.delete(`/groups/${id}`),
  confirmDelete: (id, data) => api.post(`/groups/${id}/confirm-delete`, data),
};

export default groupApi;
