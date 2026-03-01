import apiClient from './apiService';

export async function getVolunteers(params = {}) {
  const res = await apiClient.get('/volunteers', { params });
  return res.data.data;
}

export async function getVolunteerById(id) {
  const res = await apiClient.get(`/volunteers/${id}`);
  return res.data.data;
}

export async function getMyVolunteerProfile() {
  const res = await apiClient.get('/volunteers/me');
  return res.data.data;
}

export async function updateVolunteerProfile(id, data) {
  const res = await apiClient.put(`/volunteers/${id}`, data);
  return res.data.data;
}

export async function logHours(volunteerId, data) {
  const res = await apiClient.post(`/volunteers/${volunteerId}/hours`, data);
  return res.data.data;
}

export async function getHours(volunteerId, params = {}) {
  const res = await apiClient.get(`/volunteers/${volunteerId}/hours`, { params });
  return res.data.data;
}

export async function approveHours(hoursId) {
  const res = await apiClient.put(`/volunteers/hours/${hoursId}/approve`);
  return res.data.data;
}
