import apiClient from './apiService';

export async function register(userData) {
  const res = await apiClient.post('/auth/register', userData);
  return res.data.data;
}

export async function login(email, password) {
  const res = await apiClient.post('/auth/login', { email, password });
  return res.data.data;
}

export async function logout() {
  try {
    await apiClient.post('/auth/logout');
  } catch {
    // best-effort
  }
}

export async function getCurrentUser() {
  const res = await apiClient.get('/users/profile');
  return res.data.data;
}

export async function updateProfile(updates) {
  const res = await apiClient.put('/users/profile', updates);
  return res.data.data;
}

export async function changePassword(currentPassword, newPassword) {
  const res = await apiClient.put('/users/change-password', { currentPassword, newPassword });
  return res.data;
}

export async function forgotPassword(email) {
  const res = await apiClient.post('/auth/forgot-password', { email });
  return res.data;
}

export async function resetPassword(token, newPassword) {
  const res = await apiClient.post('/auth/reset-password', { token, newPassword });
  return res.data;
}

export async function setup2FA() {
  const res = await apiClient.post('/auth/2fa/setup');
  return res.data.data;
}

export async function enable2FA(token) {
  const res = await apiClient.post('/auth/2fa/enable', { token });
  return res.data;
}

export async function disable2FA(token) {
  const res = await apiClient.post('/auth/2fa/disable', { token });
  return res.data;
}

export async function verify2FA(tempToken, token) {
  const res = await apiClient.post('/auth/2fa/verify', { tempToken, token });
  return res.data.data;
}
