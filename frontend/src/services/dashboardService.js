import { apiRequest } from './apiClient.js'

export async function loadDashboard() {
  return apiRequest('/api/dashboard')
}
