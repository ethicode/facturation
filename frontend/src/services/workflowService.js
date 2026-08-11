import { apiRequest } from './apiClient.js'

export async function loadWorkflowMetadata() {
  return apiRequest('/api/meta/workflow')
}

export async function loadWorkflowDirections() {
  const metadata = await loadWorkflowMetadata()
  return Array.isArray(metadata?.directions) ? metadata.directions : []
}