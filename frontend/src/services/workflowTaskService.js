import { apiRequest } from './apiClient.js'

function normalizeTask(task) {
  return {
    id: task?.id || '',
    workflow_type: task?.workflow_type || 'facturation',
    reference: task?.reference || '-',
    step: task?.step || '-',
    resolved_by: task?.resolved_by || '-',
    resolved_at: task?.resolved_at || '',
    assigned_users: Array.isArray(task?.assigned_users) ? task.assigned_users : [],
    pieces_jointes: Array.isArray(task?.pieces_jointes) ? task.pieces_jointes : [],
    history: Array.isArray(task?.history) ? task.history : [],
  }
}

export async function loadWorkflowTasks() {
  const tasks = await apiRequest('/api/workflow/tasks')
  return Array.isArray(tasks) ? tasks.map((task) => normalizeTask(task)) : []
}