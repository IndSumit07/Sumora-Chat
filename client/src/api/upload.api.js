import api from './axios.js';

export const uploadApi = {
  uploadAvatar: (formData) =>
    api.post('/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadGroupAvatar: (formData) =>
    api.post('/upload/group-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadMessageFile: (formData, onUploadProgress) =>
    api.post('/upload/message-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    }),
};

export default uploadApi;
