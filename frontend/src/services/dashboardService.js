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

export async function updateMissionStatus(missionCode, nextStatus, expectedStatus) {
  return apiRequest(`/api/missions/${encodeURIComponent(missionCode)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ next_status: nextStatus, expected_status: expectedStatus }),
  })
}
