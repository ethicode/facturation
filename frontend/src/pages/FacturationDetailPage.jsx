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
import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import {
  formatAmount,
  formatDate,
  getAllowedTransitionsForRole,
  getNextStatuses,
  getTransitionActionLabel,
  roleLabels,
  statusColor,
  userRoles,
} from '../utils/facturationWorkflow.js'
import HistoryTimeline from '../components/HistoryTimeline.jsx'
import { useRoleContext } from '../app/roleContext.js'
import { loadInvoices, updateInvoiceStatus } from '../services/facturationStorage.js'

const roleActorMap = {
  administrateur: 'Administrateur ORFL',
  utilisateur: 'Utilisateur ORFL',
  manageur: 'Manageur ORFL',
}

const linearStatuses = [
  'Saisie de la demande',
  'En attente de vérification métier',
  'Vérification métier',
  'Validation N+1',
  'Traitement service approvisionnement',
  'Signature LAD 1',
  'Règlement en cours',
  'Paiement effectué',
  'Terminé',
]

const stepDescriptions = {
  'Saisie de la demande': 'Demande saisie par un utilisateur.',
  'En attente de vérification métier': 'Étape de saisie validée, en attente de vérification métier.',
  'Vérification métier': 'Vérification de la conformité métier.',
  'Validation N+1': 'Validation par le responsable hiérarchique.',
  'Traitement service approvisionnement': 'Prise en charge par le service approvisionnement.',
  'Signature LAD 1': 'Signature et validation LAD 1.',
  'Règlement en cours': 'Règlement en cours de traitement.',
  'Paiement effectué': 'Paiement effectué.',
  'Terminé': 'Dossier clôturé.',
}

function getWorkflowStep(status) {
  if (status === 'Initialisation') {
    return 1
  }

  const idx = linearStatuses.indexOf(status)
  return idx === -1 ? 0 : idx
}

function FacturationWorkflowStepper({ currentStatus }) {
  const activeStep = getWorkflowStep(currentStatus)

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
        <Chip
          label={currentStatus}
          color={statusColor[currentStatus] || 'default'}
        />
      </Stack>
      <Stepper activeStep={activeStep} alternativeLabel>
        {linearStatuses.map((status, index) => (
          <Step
            key={status}
            completed={index < activeStep}
          >
            <StepLabel>{status}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Stack>
  )
}

function FacturationDetailPage() {
  const { invoiceId } = useParams()
  const navigate = useNavigate()
  const { activeRole, setActiveRole } = useRoleContext()
  const [invoiceList, setInvoiceList] = useState([])
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function fetchInvoices() {
      try {
        const data = await loadInvoices()
        if (isMounted) {
          setInvoiceList(data)
          setApiError('')
        }
      } catch (error) {
        if (isMounted) {
          setApiError(error.message || 'Impossible de charger la demande de facturation.')
        }
      }
    }

    fetchInvoices()

    return () => {
      isMounted = false
    }
  }, [invoiceId])

  const invoice = useMemo(
    () => invoiceList.find((entry) => entry.id === invoiceId),
    [invoiceList, invoiceId],
  )

  const handleTransition = async (nextStatus) => {
    try {
      const updatedInvoice = await updateInvoiceStatus(invoice.id, nextStatus, {
        actor: roleActorMap[activeRole] || 'Systeme Workflow',
        role: activeRole,
        actionLabel: getTransitionActionLabel(nextStatus),
      })

      setInvoiceList((prev) => prev.map((entry) => (entry.id === updatedInvoice.id ? updatedInvoice : entry)))
      setApiError('')
    } catch (error) {
      setApiError(error.message || 'Impossible de mettre à jour le statut de la demande de facturation.')
    }
  }

  const allowedTransitions = getAllowedTransitionsForRole(invoice?.statut, activeRole)

  if (!invoice) {
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
      <PageHeader
        title={`Suivi de la facturation - ${invoice.id}`}
      />

      {apiError && <Alert severity="error">{apiError}</Alert>}

      <Card>
        <CardContent>
          <Stack spacing={1.5}>
            <FacturationWorkflowStepper currentStatus={invoice.statut} />
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6">Détails de la demande</Typography>
                <Divider />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography variant="caption" color="text.secondary">
                      Référence
                    </Typography>
                    <Typography variant="body1">{invoice.id}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography variant="caption" color="text.secondary">
                      Fournisseur
                    </Typography>
                    <Typography variant="body1">{invoice.fournisseur}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography variant="caption" color="text.secondary">
                      Centre de coût
                    </Typography>
                    <Typography variant="body1">{invoice.centreCout}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography variant="caption" color="text.secondary">
                      Montant
                    </Typography>
                    <Typography variant="body1">{formatAmount(invoice.montant, invoice.devise)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography variant="caption" color="text.secondary">
                      Échéance
                    </Typography>
                    <Typography variant="body1">{formatDate(invoice.echeance)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography variant="caption" color="text.secondary">
                      Statut
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip size="small" color={statusColor[invoice.statut] || 'default'} label={invoice.statut} />
                    </Stack>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary">
                      Description
                    </Typography>
                    <Typography variant="body1">{invoice.description}</Typography>
                  </Grid>
                </Grid>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card>
            <CardContent>
              <Stack spacing={1}>
                <Typography variant="h6">Historique et dates</Typography>
                <Divider />
                <HistoryTimeline
                  entries={invoice.history || []}
                  dotColor={statusColor[invoice.statut] || 'primary'}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Stack spacing={1.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between">
              <Typography variant="h6">Actions disponibles</Typography>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {allowedTransitions.map((transition) => (
                <Button
                  key={transition.to}
                  variant="contained"
                  onClick={() => handleTransition(transition.to)}
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
