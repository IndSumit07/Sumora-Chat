import api from './axios.js';

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  verifyRegister: (data) => api.post('/auth/verify-register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh', {}, { skipAuth: true }),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  verifyResetOtp: (data) => api.post('/auth/verify-reset-otp', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  changePassword: (data) => api.post('/auth/change-password', data),
  setPassword: (data) => api.post('/auth/set-password', data),
  deleteAccount: () => api.delete('/auth/delete-account'),
  confirmDelete: (data) => api.post('/auth/confirm-delete', data),
  resendOtp: (data) => api.post('/auth/forgot-password', data), // reuse forgot for resend
};

export default authApi;
