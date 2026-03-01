import apiClient from './apiService';

export async function getUsers(params = {}) {
  const res = await apiClient.get('/admin/users', { params });
  return res.data.data;
}

export async function createUser(data) {
  const res = await apiClient.post('/admin/users', data);
  return res.data.data;
}

export async function deleteUser(id) {
  const res = await apiClient.delete(`/admin/users/${id}`);
  return res.data;
}

export async function toggleUserActive(id) {
  const res = await apiClient.patch(`/admin/users/${id}/toggle-active`);
  return res.data;
}

export async function getAuditLogs(params = {}) {
  const res = await apiClient.get('/admin/audit-logs', { params });
  return res.data.data;
}

export async function getStatistics() {
  const res = await apiClient.get('/admin/statistics');
  return res.data.data;
}

export async function getSecurityAlerts(params = {}) {
  const res = await apiClient.get('/admin/security-alerts', { params });
  return res.data.data;
}

export async function resolveSecurityAlert(id) {
  const res = await apiClient.patch(`/admin/security-alerts/${id}/resolve`);
  return res.data;
}
