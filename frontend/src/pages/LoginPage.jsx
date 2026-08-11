import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Box, Button, Card, CardContent, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material'
import { login } from '../services/authService.js'

const demoUsers = [
  { username: 'admin', password: 'admin123', roleLabel: 'Administrateur' },
  { username: 'comptable', password: 'comptable123', roleLabel: 'Utilisateur' },
  { username: 'dirfin', password: 'dirfin123', roleLabel: 'Manageur' },
]

function LoginPage() {
  const navigate = useNavigate()
  const [formValues, setFormValues] = useState({ username: 'admin', password: 'admin123' })
  const [selectedDemoUser, setSelectedDemoUser] = useState('admin')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      await login(formValues.username, formValues.password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Connexion impossible.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 3,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent>
          <Stack spacing={2.5} component="form" onSubmit={handleSubmit}>
            <Stack spacing={0.5}>
              <Typography variant="h5">Connexion</Typography>
              <Typography variant="body2" color="text.secondary">
                Connectez-vous avec un utilisateur du backend pour accéder à l’application.
              </Typography>
            </Stack>

            {error && <Alert severity="error">{error}</Alert>}

            <FormControl fullWidth>
              <InputLabel id="demo-user-select-label">Utilisateur de démo</InputLabel>
              <Select
                labelId="demo-user-select-label"
                value={selectedDemoUser}
                label="Utilisateur de démo"
                onChange={(event) => {
                  const selectedUser = demoUsers.find((user) => user.username === event.target.value)
                  if (!selectedUser) {
                    return
                  }

                  setSelectedDemoUser(selectedUser.username)
                  setFormValues({ username: selectedUser.username, password: selectedUser.password })
                }}
              >
                {demoUsers.map((user) => (
                  <MenuItem key={user.username} value={user.username}>
                    {user.username} — {user.roleLabel}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Identifiant"
              value={formValues.username}
              onChange={(event) => setFormValues((prev) => ({ ...prev, username: event.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Mot de passe"
              type="password"
              value={formValues.password}
              onChange={(event) => setFormValues((prev) => ({ ...prev, password: event.target.value }))}
              fullWidth
              required
            />

            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? 'Connexion…' : 'Se connecter'}
            </Button>

            <Typography variant="caption" color="text.secondary">
              Comptes de demo : admin (administrateur), comptable (utilisateur), dirfin (manageur), avec leur mot de passe associé.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}

export default LoginPage
