import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  Radio,
  RadioGroup,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import HistoryTimeline from '../components/HistoryTimeline.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { loadMissions } from '../services/dashboardService.js'
import missionWorkflow from '../../../fraisDeMissionWorkflow.json'

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

const missionWorkflowStepOrder = [
  'Creation',
  'Validation responsable metier',
  'Validation DRH',
  'Validation DIRFIN',
  'Cloturee',
]

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

function MissionWorkflowStepper({ currentStatus }) {
  const activeStep = missionWorkflowStepOrder.indexOf(normalizeMissionWorkflowStatus(currentStatus))
  const safeStep = activeStep >= 0 ? activeStep : 0

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
        <Chip label={normalizeMissionWorkflowStatus(currentStatus) || 'Statut inconnu'} color={missionColor[normalizeMissionWorkflowStatus(currentStatus)] || 'default'} />
      </Stack>
      <Stepper activeStep={safeStep} alternativeLabel>
        {missionWorkflowStepOrder.map((status) => (
          <Step key={status} completed={missionWorkflowStepOrder.indexOf(status) < safeStep}>
            <StepLabel>{status}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Stack>
  )
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

function buildMissionHistoryEntry(mission, status, timestamp = new Date()) {
  const normalizedStatus = normalizeMissionWorkflowStatus(status) || status

  return {
    id: `${mission.code}-status-${normalizedStatus}-${timestamp.getTime()}`,
    at: timestamp.toISOString(),
    action: normalizedStatus,
    actor: 'Workflow',
    commentaire: `Mission passée à l'étape ${normalizedStatus}.`,
  }
}

function MissionsDetailPage() {
  const { missionCode } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [missions, setMissions] = useState(() => (location.state?.mission ? [location.state.mission] : []))
  const [apiError, setApiError] = useState('')
  const [isLoading, setIsLoading] = useState(() => !location.state?.mission)
  const [selectedTransition, setSelectedTransition] = useState(null)
  const [missionHistoryEntries, setMissionHistoryEntries] = useState(() => {
    const initialMission = location.state?.mission
    if (!initialMission) {
      return []
    }

    const initialStatus = normalizeMissionWorkflowStatus(initialMission.statut) || initialMission.statut
    const initialDate = initialMission.date_depart ? new Date(`${initialMission.date_depart}T09:00:00`) : new Date()
    return [buildMissionHistoryEntry(initialMission, initialStatus, initialDate)]
  })

  const mission = useMemo(
    () => missions.find((item) => item.code === missionCode) || null,
    [missions, missionCode],
  )

  const currentWorkflowStatus = normalizeMissionWorkflowStatus(mission?.statut)

  useEffect(() => {
    if (!mission) {
      return
    }

    const normalizedCurrentStatus = normalizeMissionWorkflowStatus(mission.statut) || mission.statut
    if (!normalizedCurrentStatus) {
      return
    }

    setMissionHistoryEntries((currentEntries) => {
      if (currentEntries.some((entry) => entry.action === normalizedCurrentStatus)) {
        return currentEntries
      }

      const timestamp = mission.date_depart ? new Date(`${mission.date_depart}T09:00:00`) : new Date()
      return [buildMissionHistoryEntry(mission, normalizedCurrentStatus, timestamp), ...currentEntries]
    })
  }, [mission])

  const allowedTransitions = useMemo(() => {
    if (!currentWorkflowStatus) {
      return []
    }
    return (missionWorkflow.transitions || []).filter((transition) => transition.from === currentWorkflowStatus)
  }, [currentWorkflowStatus])

  useEffect(() => {
    if (!allowedTransitions.length) {
      setSelectedTransition(null)
      return
    }

    setSelectedTransition((currentValue) => {
      if (currentValue && allowedTransitions.some((transition) => transition.to === currentValue.to)) {
        return currentValue
      }
      return allowedTransitions[0]
    })
  }, [allowedTransitions])

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
          setApiError(error.message || 'Impossible de charger la mission.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchMissions()

    return () => {
      isMounted = false
    }
  }, [])

  const handleTransition = (nextStatus) => {
    if (!mission?.code || !nextStatus) {
      return
    }

    const normalizedNextStatus = normalizeMissionWorkflowStatus(nextStatus) || nextStatus

    setMissions((current) => current.map((item) => {
      if (item.code !== mission.code) {
        return item
      }

      return {
        ...item,
        statut: nextStatus,
      }
    }))

    setMissionHistoryEntries((currentEntries) => {
      if (currentEntries.some((entry) => entry.action === normalizedNextStatus)) {
        return currentEntries
      }

      return [buildMissionHistoryEntry(mission, normalizedNextStatus, new Date()), ...currentEntries]
    })
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Détail frais de mission"
      />

      {apiError && <Alert severity="error">{apiError}</Alert>}
      {isLoading && <Alert severity="info">Chargement de la mission...</Alert>}
      {!isLoading && !mission && !apiError && <Alert severity="warning">Mission introuvable.</Alert>}

      {mission && (
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <MissionWorkflowStepper currentStatus={currentWorkflowStatus} />
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, lg: 8 }}>
            <Stack spacing={2.5}>
              <Card>
                <CardContent>
                  <Stack spacing={1.5}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                      <Stack spacing={0.5}>
                        <Typography variant="h6">{mission.objet_mission}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Mission {mission.code} · {mission.destination}, {mission.pays}
                        </Typography>
                      </Stack>
                      <Chip size="small" color={missionColor[mission.statut] || 'default'} label={mission.statut} />
                    </Stack>

                    <Divider />

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" color="text.secondary">Objet mission</Typography>
                        <Typography variant="body1">{mission.objet_mission}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" color="text.secondary">Destination</Typography>
                        <Typography variant="body1">{mission.destination}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" color="text.secondary">Pays</Typography>
                        <Typography variant="body1">{mission.pays}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" color="text.secondary">Budget concerné</Typography>
                        <Typography variant="body1">{mission.budget_concerne}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" color="text.secondary">Date de départ</Typography>
                        <Typography variant="body1">{mission.date_depart}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" color="text.secondary">Date de retour</Typography>
                        <Typography variant="body1">{mission.date_retour}</Typography>
                      </Grid>
                    </Grid>
                  </Stack>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2">Montant et justificatifs</Typography>
                    <Divider />
                    <Typography variant="body2">
                      <strong>Montant estimatif:</strong> {formatCfaAmount(mission.montant_estimatif)}
                    </Typography>
                    <Stack spacing={0.75}>
                      <Typography variant="body2"><strong>Pièces jointes:</strong></Typography>
                      {mission.pieces_jointes?.length ? (
                        <Stack spacing={0.5} sx={{ pl: 2 }}>
                          {mission.pieces_jointes.map((piece) => (
                            <Typography key={piece} variant="body2">{piece}</Typography>
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">Aucune pièce jointe.</Typography>
                      )}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2">Actions</Typography>
                    {allowedTransitions.length > 0 ? (
                      <>
                        <RadioGroup
                          value={selectedTransition?.to || ''}
                          onChange={(event) => {
                            const nextTransition = allowedTransitions.find((transition) => transition.to === event.target.value)
                            setSelectedTransition(nextTransition || null)
                          }}
                        >
                          {allowedTransitions.map((transition) => (
                            <FormControlLabel
                              key={`${transition.from}->${transition.to}`}
                              value={transition.to}
                              control={<Radio />}
                              label={transition.to}
                            />
                          ))}
                        </RadioGroup>
                        <Button
                          variant="contained"
                          onClick={() => selectedTransition && handleTransition(selectedTransition.to)}
                          sx={{
                            alignSelf: 'flex-start',
                            bgcolor: 'common.black',
                            color: 'common.white',
                            '&:hover': { bgcolor: 'grey.900' },
                          }}
                        >
                          Valider
                        </Button>
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Aucune action disponible pour ce statut.
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={2.5}>
              <Card>
                <CardContent>
                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2">Historique</Typography>
                    <Divider />
                    <HistoryTimeline
                      entries={missionHistoryEntries}
                      dotColor={missionColor[currentWorkflowStatus] || 'primary'}
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      )}
    </Stack>
  )
}

export default MissionsDetailPage