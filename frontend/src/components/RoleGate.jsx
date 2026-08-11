import { Alert, Box } from '@mui/material'

function RoleGate({ role, allowedRoles = ['manageur', 'administrateur'], children, fallback }) {
  const isAllowed = allowedRoles.includes(role)

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
