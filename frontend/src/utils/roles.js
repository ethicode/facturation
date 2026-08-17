export function normalizeRole(role) {
  if (role === 'admin') {
    return 'administrateur'
  }

  return role || 'utilisateur'
}

export function isAdminRole(role) {
  const normalizedRole = normalizeRole(role)
  return normalizedRole === 'administrateur'
}