import { Alert, Box } from '@mui/material'
import { normalizeRole } from '../utils/roles.js'

function RoleGate({ role, allowedRoles = ['manageur', 'administrateur'], children, fallback }) {
  const normalizedRole = normalizeRole(role)
  const normalizedAllowedRoles = allowedRoles.map((allowedRole) => normalizeRole(allowedRole))
  const isAllowed = normalizedAllowedRoles.includes(normalizedRole)

  if (!isAllowed) {
    return fallback || (
      <Alert severity="info">
        Cette section est réservée au profil manageur ou administrateur.
      </Alert>
    )
  }

  return <Box>{children}</Box>
}

export default RoleGate
