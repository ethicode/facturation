import { apiRequest } from './apiClient.js'

export async function loadAdminDirections() {
  const directions = await apiRequest('/api/admin/directions')
  return directions.map((direction) => direction.name)
}

export async function createAdminDirection(name) {
  const directions = await apiRequest('/api/admin/directions', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
  return directions.map((direction) => direction.name)
}

export async function updateAdminDirection(currentName, name) {
  const directions = await apiRequest(`/api/admin/directions/${encodeURIComponent(currentName)}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  })
  return directions.map((direction) => direction.name)
}

export async function deleteAdminDirection(name) {
  const directions = await apiRequest(`/api/admin/directions/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  })
  return directions.map((direction) => direction.name)
}

export async function loadAdminRoles() {
  const roles = await apiRequest('/api/admin/roles')
  return roles.map((role) => ({ code: role.code, label: role.label }))
}

export async function createAdminRole(code, label) {
  const roles = await apiRequest('/api/admin/roles', {
    method: 'POST',
    body: JSON.stringify({ code, label }),
  })
  return roles.map((role) => ({ code: role.code, label: role.label }))
}

export async function updateAdminRole(code, label) {
  const roles = await apiRequest(`/api/admin/roles/${encodeURIComponent(code)}`, {
    method: 'PUT',
    body: JSON.stringify({ label }),
  })
  return roles.map((role) => ({ code: role.code, label: role.label }))
}

export async function deleteAdminRole(code) {
  const roles = await apiRequest(`/api/admin/roles/${encodeURIComponent(code)}`, {
    method: 'DELETE',
  })
  return roles.map((role) => ({ code: role.code, label: role.label }))
}

export async function loadAdminUsers() {
  const users = await apiRequest('/api/admin/users')
  return users.map((user) => ({
    id: user.id,
    username: user.username,
    name: user.full_name,
    email: user.email || '',
    role: user.role,
    roles: user.roles?.length ? user.roles : [user.role],
    isActive: user.is_active,
  }))
}

export async function createAdminUser(payload) {
  const user = await apiRequest('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return {
    id: user.id,
    username: user.username,
    name: user.full_name,
    email: user.email || '',
    role: user.role,
    roles: user.roles?.length ? user.roles : [user.role],
    isActive: user.is_active,
  }
}

export async function updateAdminUser(userId, payload) {
  const user = await apiRequest(`/api/admin/users/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return {
    id: user.id,
    username: user.username,
    name: user.full_name,
    email: user.email || '',
    role: user.role,
    roles: user.roles?.length ? user.roles : [user.role],
    isActive: user.is_active,
  }
}

export async function deleteAdminUser(userId) {
  return apiRequest(`/api/admin/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  })
}

export async function loadWorkflowAssignments() {
  const assignments = await apiRequest('/api/admin/workflow-assignments')
  return assignments.map((assignment) => ({
    step: assignment.step,
    userIds: assignment.user_ids || [],
    workflowType: assignment.workflow_type || 'facturation',
  }))
}

export async function saveWorkflowAssignment(step, userIds, workflowType = 'facturation') {
  const assignment = await apiRequest('/api/admin/workflow-assignments', {
    method: 'POST',
    body: JSON.stringify({ step, user_ids: userIds, workflow_type: workflowType }),
  })
  return {
    step: assignment.step,
    userIds: assignment.user_ids || [],
    workflowType: assignment.workflow_type || 'facturation',
  }
}

export async function updateWorkflowAssignment(step, userIds, workflowType = 'facturation') {
  const assignment = await apiRequest(`/api/admin/workflow-assignments/${encodeURIComponent(step)}`, {
    method: 'PUT',
    body: JSON.stringify({ step, user_ids: userIds, workflow_type: workflowType }),
  })
  return {
    step: assignment.step,
    userIds: assignment.user_ids || [],
    workflowType: assignment.workflow_type || 'facturation',
  }
}

export async function deleteWorkflowAssignment(step, workflowType = 'facturation') {
  const assignments = await apiRequest(
    `/api/admin/workflow-assignments/${encodeURIComponent(step)}?workflow_type=${encodeURIComponent(workflowType)}`,
    { method: 'DELETE' },
  )
  return assignments.map((assignment) => ({
    step: assignment.step,
    userIds: assignment.user_ids || [],
    workflowType: assignment.workflow_type || 'facturation',
  }))
}
