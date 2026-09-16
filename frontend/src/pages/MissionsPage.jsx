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
import { loadAdminUsers } from '../services/adminService.js'
import { loadMissions } from '../services/dashboardService.js'
import { loadWorkflowMetadata } from '../services/workflowService.js'

const missionColor = {
  Soumis: 'warning',
  Valide: 'success',
  'A completer': 'error',
  Creation: 'default',
  'Validation responsable metier': 'warning',
  'Retour demande (Validation responsable metier)': 'warning',
  'Validation DRH': 'warning',
  'Retour demande (Validation DRH)': 'warning',
  'Validation DIRFIN': 'warning',
  Rejetee: 'error',
  Cloturee: 'success',
}

function normalizeMissionWorkflowStatus(status) {
  if (!status) {
    return ''
  }

  const legacyMap = {
    Soumis: 'Creation',
    Valide: 'Validation responsable metier',
    'A completer': 'Creation',
  }

  return legacyMap[status] || status
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
  const [workflowAssignments, setWorkflowAssignments] = useState([])
  const [userEmailById, setUserEmailById] = useState({})
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function fetchMissions() {
      try {
        const [data, metadata] = await Promise.all([
          loadMissions(),
          loadWorkflowMetadata(),
        ])

        let emailMap = {}
        try {
          const users = await loadAdminUsers()
          emailMap = users.reduce((acc, user) => {
            if (user?.id && user?.email) {
              acc[user.id] = user.email
            }
            return acc
          }, {})
        } catch {
          emailMap = {}
        }

        if (isMounted) {
          setMissions(Array.isArray(data) ? data : [])
          setWorkflowAssignments(Array.isArray(metadata?.workflow_assignments) ? metadata.workflow_assignments : [])
          setUserEmailById(emailMap)
          setApiError('')
        }
      } catch (error) {
        if (isMounted) {
          setWorkflowAssignments([])
          setUserEmailById({})
          setApiError(error.message || 'Impossible de charger les missions.')
        }
      }
    }

    fetchMissions()

    return () => {
      isMounted = false
    }
  }, [])

  const getAssignedUsersForCurrentStep = (status) => {
    const normalizedStatus = normalizeMissionWorkflowStatus(status)

    const assignment = workflowAssignments.find((item) => {
      const normalizedWorkflowType = String(item?.workflow_type || item?.workflowType || '').trim().toLowerCase()
      const missionWorkflowNames = ['frais_de_mission', 'frais de mission', 'mission', 'missions']
      return (
        missionWorkflowNames.includes(normalizedWorkflowType)
        && String(item?.step || '').trim() === String(normalizedStatus || '').trim()
      )
    })

    if (!assignment || !Array.isArray(assignment.user_ids) || assignment.user_ids.length === 0) {
      return ''
    }

    const assignedEmails = assignment.user_ids
      .map((userId) => userEmailById[userId] || '')
      .filter(Boolean)

    return assignedEmails.length > 0 ? assignedEmails.join(', ') : ''
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Frais de mission"
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
                      <TableCell>Dernière tâche</TableCell>
                      <TableCell>Dernière tâche assignée</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {missions.map((mission) => {
                      const normalizedStatus = normalizeMissionWorkflowStatus(mission.statut)

                      return (
                        <TableRow key={mission.code} hover onClick={() => navigate(`/frais-missions/${mission.code}`, { state: { mission } })} sx={{ cursor: 'pointer' }}>
                          <TableCell>{mission.code}</TableCell>
                          <TableCell>{mission.objet_mission}</TableCell>
                          <TableCell>{mission.destination}</TableCell>
                          <TableCell>{mission.pays}</TableCell>
                          <TableCell>{mission.date_depart}</TableCell>
                          <TableCell>{mission.date_retour}</TableCell>
                          <TableCell>{formatCfaAmount(mission.montant_estimatif)}</TableCell>
                          <TableCell>{mission.budget_concerne}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              color={missionColor[normalizedStatus] || 'default'}
                              label={normalizedStatus || mission.statut}
                            />
                          </TableCell>
                          <TableCell>{getAssignedUsersForCurrentStep(mission.statut)}</TableCell>
                        </TableRow>
                      )
                    })}
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
