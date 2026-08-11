import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import { loadDashboard } from '../services/dashboardService.js'

const missionColor = {
  Soumis: 'warning',
  Valide: 'success',
  'A completer': 'error',
}

function MissionsPage() {
  const [missions, setMissions] = useState([])
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function fetchDashboard() {
      try {
        const data = await loadDashboard()
        if (isMounted) {
          setMissions(Array.isArray(data?.missions) ? data.missions : [])
          setApiError('')
        }
      } catch (error) {
        if (isMounted) {
          setApiError(error.message || 'Impossible de charger les missions.')
        }
      }
    }

    fetchDashboard()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Frais de missions"
        subtitle="Suivre les depenses terrain et fiabiliser les justificatifs."
      />

      {apiError && <Alert severity="error">{apiError}</Alert>}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography variant="h6">Notes de frais</Typography>
                <Button variant="outlined">Soumettre mission</Button>
              </Stack>

              <TableContainer>
                <Table size="small" sx={{ minWidth: 620 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Code</TableCell>
                      <TableCell>Collaborateur</TableCell>
                      <TableCell>Destination</TableCell>
                      <TableCell>Frais</TableCell>
                      <TableCell align="right">Statut</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {missions.map((mission) => (
                      <TableRow key={mission.code} hover>
                        <TableCell>{mission.code}</TableCell>
                        <TableCell>{mission.collaborateur}</TableCell>
                        <TableCell>{mission.destination}</TableCell>
                        <TableCell>{mission.frais}</TableCell>
                        <TableCell align="right">
                          <Chip
                            size="small"
                            color={missionColor[mission.statut] || 'default'}
                            label={mission.statut}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack spacing={1.5}>
                <Typography variant="h6">Regles automatiques</Typography>
                <Typography variant="body2" color="text.secondary">
                  Les plafonds repas et hotel sont controles en direct selon la zone geographique.
                </Typography>
                <Chip color="success" label="Policy check active" sx={{ width: 'fit-content' }} />
                <Chip color="warning" label="2 missions a regulariser" sx={{ width: 'fit-content' }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  )
}

export default MissionsPage
