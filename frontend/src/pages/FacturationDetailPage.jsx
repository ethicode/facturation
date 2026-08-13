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
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { useRoleContext } from '../app/roleContext.js'
import HistoryTimeline from '../components/HistoryTimeline.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { loadFacture, updateFactureStatus } from '../services/facturationStorage.js'
import {
  formatAmount,
  formatDate,
  getAllowedTransitionsForRole,
  getTransitionActionLabel,
  statusColor,
} from '../utils/facturationWorkflow.js'

const roleActorMap = {
  administrateur: 'Administrateur ORFL',
  utilisateur: 'Utilisateur ORFL',
  manageur: 'Manageur ORFL',
}

const linearStatuses = [
  'Saisie de la demande',
  'Vérification métier',
  'Validation N+1',
  'Traitement service approvisionnement',
  'Signature LAD 1',
  'Règlement en cours',
  'Paiement effectué',
  'Clôturée',
]

function getWorkflowStep(status) {
  if (status === 'Initialisation') {
    return 0
  }
  if (status === "Demande d'informations complémentaire") {
    return 2
  }
  if (status === 'Signature LAD 2' || status === 'Signature LAD 3') {
    return 4
  }
  if (status === 'Rejetée' || status === 'Terminé') {
    return 7
  }

  const idx = linearStatuses.indexOf(status)
  return idx === -1 ? 0 : idx
}

function getWorkflowStepIndex(status) {
  return linearStatuses.indexOf(status)
}

function FacturationWorkflowStepper({ currentStatus }) {
  const activeStep = getWorkflowStep(currentStatus)

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
        <Chip label={currentStatus} color={statusColor[currentStatus] || 'default'} />
      </Stack>
      <Stepper activeStep={activeStep} alternativeLabel>
        {linearStatuses.map((status, index) => (
          <Step key={status} completed={index < activeStep}>
            <StepLabel>{status}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Stack>
  )
}

function FacturationDetailPage() {
  const { factureId } = useParams()
  const location = useLocation()
  const { activeRole } = useRoleContext()
  const [facture, setFacture] = useState(() => location.state?.facture || null)
  const [apiError, setApiError] = useState('')
  const [isLoading, setIsLoading] = useState(() => !location.state?.facture)
  const [transitionForm, setTransitionForm] = useState({ commentaire: '', piecesJointes: [] })
  const [isTransitionSubmitting, setIsTransitionSubmitting] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function fetchFactures() {
      try {
        const data = await loadFacture(factureId)
        if (isMounted) {
          setFacture(data)
          setApiError('')
        }
      } catch (error) {
        if (isMounted) {
          setApiError(error.message || 'Impossible de charger la demande de facturation.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchFactures()

    return () => {
      isMounted = false
    }
  }, [factureId])

  const resetTransitionForm = () => {
    setTransitionForm({ commentaire: '', piecesJointes: [] })
  }

  const handleTransition = async (nextStatus, metadata = {}) => {
    try {
      setIsTransitionSubmitting(true)
      const updatedFacture = await updateFactureStatus(facture.id, nextStatus, {
        actor: roleActorMap[activeRole] || 'Systeme Workflow',
        role: activeRole,
        actionLabel: getTransitionActionLabel(nextStatus),
        commentaire: metadata.commentaire || '',
        piecesJointes: metadata.piecesJointes || [],
      })

      setFacture(updatedFacture)
      setApiError('')
      resetTransitionForm()
    } catch (error) {
      setApiError(error.message || 'Impossible de mettre à jour le statut de la demande de facturation.')
    } finally {
      setIsTransitionSubmitting(false)
    }
  }

  const handleTransitionFileUpload = (event) => {
    const files = Array.from(event.target.files || [])
    setTransitionForm((prev) => ({
      ...prev,
      piecesJointes: files.map((file) => file.name),
    }))
  }

  const currentStepIndex = getWorkflowStepIndex(facture?.statut)
  const canAddTransitionContext = currentStepIndex > 0 && currentStepIndex < linearStatuses.length - 1
  const allowedTransitions = getAllowedTransitionsForRole(facture?.statut, activeRole)

  if (isLoading) {
    return (
      <Stack spacing={2.5}>
        <PageHeader title="Suivi de la facturation" subtitle="Chargement du dossier en cours..." />
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Chargement de la fiche détail...
            </Typography>
          </CardContent>
        </Card>
      </Stack>
    )
  }

  if (!facture) {
    return (
      <Stack spacing={2.5}>
        <PageHeader
          title="Dossier de facturation introuvable"
          subtitle="La demande de facturation demandée n'existe pas ou a été supprimée."
        />
        <Alert severity="warning">{apiError || 'Impossible de charger la fiche detail.'}</Alert>
      </Stack>
    )
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader title={facture.id || ''} />

      {apiError && <Alert severity="error">{apiError}</Alert>}

      <Card>
        <CardContent>
          <Stack spacing={1.5}>
            <FacturationWorkflowStepper currentStatus={facture.statut} />
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Stack spacing={2.5}>
            <Card>
              <CardContent>
                <Stack
                  spacing={2}
                  sx={{
                    '& .MuiInputLabel-root': {
                      color: 'primary.main',
                      fontWeight: 700,
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: 'primary.dark',
                    },
                    '& .MuiOutlinedInput-root fieldset': {
                      borderColor: 'rgba(15, 23, 42, 0.28)',
                    },
                    '& .MuiOutlinedInput-root:hover fieldset': {
                      borderColor: 'rgba(15, 23, 42, 0.45)',
                    },
                    '& .MuiOutlinedInput-root.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                    '& .MuiOutlinedInput-root.Mui-error fieldset': {
                      borderColor: 'primary.main',
                    },
                    '& .MuiOutlinedInput-root.Mui-disabled fieldset': {
                      borderColor: 'primary.main',
                      borderWidth: 1.5,
                    },
                    '& .MuiInputBase-input.Mui-disabled': {
                      WebkitTextFillColor: '#0f172a',
                      color: '#0f172a',
                      fontWeight: 600,
                    },
                    '& .MuiInputBase-inputMultiline.Mui-disabled': {
                      WebkitTextFillColor: '#0f172a',
                      color: '#0f172a',
                      fontWeight: 600,
                    },
                  }}
                >
                  <Typography variant="h6">Détails de la demande</Typography>
                  <Divider />

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <TextField fullWidth label="Référence" value={facture.id || '-'} disabled />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <TextField fullWidth label="Priorité" value={facture.priorite || '-'} disabled />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField fullWidth label="Direction" value={facture.direction || '-'} disabled />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="Résumé" value={facture.resume || '-'} disabled />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth multiline minRows={2} label="Description" value={facture.description || '-'} disabled />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="Fournisseur" value={facture.fournisseur || '-'} disabled />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="Référence de facturation" value={facture.numeroFacture || '-'} disabled />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField fullWidth label="Montant de la demande" value={formatAmount(facture.montant, facture.devise)} disabled />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField fullWidth label="Compte de charge" value={facture.compteCharge || '-'} disabled />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField fullWidth label="Date de réception" value={formatDate(facture.dateReception)} disabled />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="Mode de réception" value={facture.modeReception || '-'} disabled />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Pièces jointes"
                        value={
                          Array.isArray(facture.piecesJointes) && facture.piecesJointes.length > 0
                            ? facture.piecesJointes.join(', ')
                            : '-'
                        }
                        disabled
                      />
                    </Grid>
                  </Grid>
                </Stack>
              </CardContent>
            </Card>

            {canAddTransitionContext && (
              <Card>
                <CardContent>
                  <Stack spacing={2}>
                    <Typography variant="h6">Commentaire et pièces jointes</Typography>
                    <Divider />
                    <TextField
                      fullWidth
                      multiline
                      minRows={4}
                      label="Commentaire"
                      value={transitionForm.commentaire}
                      onChange={(event) => setTransitionForm((prev) => ({ ...prev, commentaire: event.target.value }))}
                    />
                    <Button variant="outlined" component="label" sx={{ alignSelf: 'flex-start' }}>
                      Ajouter des pièces jointes
                      <input hidden type="file" multiple onChange={handleTransitionFileUpload} />
                    </Button>
                    {transitionForm.piecesJointes.length > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        Fichiers sélectionnés: {transitionForm.piecesJointes.join(', ')}
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Card>
            <CardContent>
              <Stack spacing={1}>
                <Typography variant="h6">Historique et dates</Typography>
                <Divider />
                <HistoryTimeline entries={facture.history || []} dotColor={statusColor[facture.statut] || 'primary'} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Stack spacing={1.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between">
              <Typography variant="h6">Actions</Typography>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {allowedTransitions.map((transition) => (
                <Button
                  key={transition.to}
                  variant="contained"
                  onClick={() => handleTransition(transition.to, transitionForm)}
                  disabled={isTransitionSubmitting}
                  sx={{
                    bgcolor: 'common.black',
                    color: 'common.white',
                    '&:hover': { bgcolor: 'grey.900' },
                  }}
                >
                  {transition.label}
                </Button>
              ))}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}

export default FacturationDetailPage
