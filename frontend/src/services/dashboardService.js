import { apiRequest } from './apiClient.js'

export async function loadDashboard() {
  return apiRequest('/api/dashboard')
}

export async function createMission(payload) {
  return apiRequest('/api/missions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function loadMissions() {
  return apiRequest('/api/missions')
}
