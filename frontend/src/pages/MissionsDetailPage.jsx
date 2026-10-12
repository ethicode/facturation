import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
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
import { loadMissions, updateMissionStatus } from '../services/dashboardService.js'
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

export function MissionWorkflowStepper({ currentStatus }) {
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

function MissionsDetailPage() {
  const { missionCode, historyEntryId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [missions, setMissions] = useState(() => (location.state?.mission ? [location.state.mission] : []))
  const [apiError, setApiError] = useState('')
  const [isLoading, setIsLoading] = useState(() => !location.state?.mission)
  const [isTransitionSubmitting, setIsTransitionSubmitting] = useState(false)

  const mission = useMemo(
    () => missions.find((item) => item.code === missionCode) || null,
    [missions, missionCode],
  )

  const currentWorkflowStatus = normalizeMissionWorkflowStatus(mission?.statut)
  const selectedHistoryEntry = historyEntryId
    ? mission?.history?.find((entry) => entry.id === historyEntryId)
    : null
  const displayedEntry = selectedHistoryEntry || (!historyEntryId ? mission?.history?.[0] : null)
  const displayedStatus = selectedHistoryEntry?.action || currentWorkflowStatus
  const authorEmail = displayedEntry?.email || (displayedEntry?.actor?.includes('@') ? displayedEntry.actor : '')

  const allowedTransitions = useMemo(() => {
    if (!currentWorkflowStatus) {
      return []
    }
    return (missionWorkflow.transitions || []).filter((transition) => transition.from === currentWorkflowStatus)
  }, [currentWorkflowStatus])

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
  }, [missionCode])

  const handleTransition = async (nextStatus) => {
    if (!mission?.code || !nextStatus || isTransitionSubmitting || historyEntryId) {
      return
    }
    setIsTransitionSubmitting(true)
    setApiError('')
    try {
      const updatedMission = await updateMissionStatus(mission.code, nextStatus, mission.statut)
      setMissions((current) => current.map((item) => item.code === updatedMission.code ? updatedMission : item))
    } catch (error) {
      setApiError(error.message || 'Impossible d’enregistrer cette action de mission.')
    } finally {
      setIsTransitionSubmitting(false)
    }
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Détail frais de mission"
      />

      {apiError && <Alert severity="error">{apiError}</Alert>}
      {isLoading && <Alert severity="info">Chargement de la mission...</Alert>}
      {!isLoading && !mission && !apiError && <Alert severity="warning">Mission introuvable.</Alert>}
      {historyEntryId && mission && !selectedHistoryEntry && (
        <Alert
          severity="warning"
          action={<Button onClick={() => navigate(`/frais-missions/${encodeURIComponent(missionCode)}`)}>Étape actuelle</Button>}
        >
          Cette étape est introuvable dans l’historique de la mission.
        </Alert>
      )}

      {mission && (
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <MissionWorkflowStepper currentStatus={displayedStatus} />
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
                          Mission {mission.code} · {authorEmail || 'E-mail non renseigné'}
                        </Typography>
                      </Stack>
                      <Chip size="small" color={missionColor[displayedStatus] || 'default'} label={displayedStatus} />
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
                    {historyEntryId ? (
                      <Stack spacing={1} alignItems="flex-start">
                        <Typography variant="body2" color="text.secondary">Étape enregistrée en lecture seule.</Typography>
                        <Button onClick={() => navigate(`/frais-missions/${encodeURIComponent(missionCode)}`)}>Revenir à l’étape actuelle</Button>
                      </Stack>
                    ) : allowedTransitions.length > 0 ? (
                      <Stack direction="column" spacing={1.5} alignItems="flex-start">
                        {allowedTransitions.map((transition) => (
                          <Button
                            key={`${transition.from}->${transition.to}`}
                            variant="contained"
                            color={transition.to === 'Rejetee' ? 'error' : transition.to.startsWith('Retour') || transition.to === 'Creation' ? 'warning' : 'primary'}
                            onClick={() => handleTransition(transition.to)}
                            disabled={isLoading || isTransitionSubmitting}
                          >
                            {transition.to}
                          </Button>
                        ))}
                      </Stack>
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
                      entries={mission.history || []}
                      showComment={false}
                      selectedEntryId={historyEntryId}
                      onEntryClick={(entry) => navigate(`/frais-missions/${encodeURIComponent(missionCode)}/${encodeURIComponent(entry.id)}`)}
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