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
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { loadMissions } from '../services/dashboardService.js'

const missionColor = {
  Soumis: 'warning',
  Valide: 'success',
  'A completer': 'error',
}

function formatCfaAmount(value) {
  const rawValue = String(value || '').trim()
  if (!rawValue) {
    return ''
  }

  if (/\b(CFA|XAF)\b/i.test(rawValue)) {
    return rawValue.replace(/\bEUR\b/gi, 'CFA')
  }

  return `${rawValue} CFA`
}

function MissionsPage() {
  const navigate = useNavigate()
  const [missions, setMissions] = useState([])
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function fetchMissions() {
      try {
        const data = await loadMissions()
        if (isMounted) {
          setMissions(Array.isArray(data) ? data : [])
          setApiError('')
        }
      } catch (error) {
        if (isMounted) {
          setApiError(error.message || 'Impossible de charger les missions.')
        }
      }
    }

    fetchMissions()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Frais de mission"
        subtitle="Suivre les depenses terrain et fiabiliser les justificatifs."
      />

      {apiError && <Alert severity="error">{apiError}</Alert>}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">Notes de frais</Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate('/frais-missions/creation')}
                  sx={{
                    ml: 'auto',
                    bgcolor: 'common.black',
                    color: 'common.white',
                    '&:hover': { bgcolor: 'grey.900' },
                  }}
                >
                  Ajouter frais de mission
                </Button>
              </Stack>

              <TableContainer>
                <Table size="small" sx={{ minWidth: 1200 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Code</TableCell>
                      <TableCell>Objet mission</TableCell>
                      <TableCell>Destination</TableCell>
                      <TableCell>Pays</TableCell>
                      <TableCell>Départ</TableCell>
                      <TableCell>Retour</TableCell>
                      <TableCell>Montant estimatif</TableCell>
                      <TableCell>Budget concerné</TableCell>
                      <TableCell align="right">Statut</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {missions.map((mission) => (
                      <TableRow key={mission.code} hover onClick={() => navigate(`/frais-missions/${mission.code}`, { state: { mission } })} sx={{ cursor: 'pointer' }}>
                        <TableCell>{mission.code}</TableCell>
                        <TableCell>{mission.objet_mission}</TableCell>
                        <TableCell>{mission.destination}</TableCell>
                        <TableCell>{mission.pays}</TableCell>
                        <TableCell>{mission.date_depart}</TableCell>
                        <TableCell>{mission.date_retour}</TableCell>
                        <TableCell>{formatCfaAmount(mission.montant_estimatif)}</TableCell>
                        <TableCell>{mission.budget_concerne}</TableCell>
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
      </Grid>
    </Stack>
  )
}

export default MissionsPage
