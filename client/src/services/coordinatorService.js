import apiClient from './apiService';

export async function getBackgroundChecks(params = {}) {
  const res = await apiClient.get('/background-checks', { params });
  return res.data.data;
}

export async function updateBackgroundCheckStatus(volunteerId, data) {
  const res = await apiClient.put(`/background-checks/${volunteerId}/status`, data);
  return res.data.data;
}
