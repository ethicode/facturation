import CompareArrowsOutlinedIcon from '@mui/icons-material/CompareArrowsOutlined'
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined'
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined'
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
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import HistoryTimeline from '../components/HistoryTimeline.jsx'
import { closeTicket, loadApproData, transferTicketToInvoicing } from '../services/approStorage.js'
import { formatAmount } from '../utils/invoiceWorkflow.js'

const statusColor = {
  Initialisation: 'default',
  'En attente de prise en charge': 'warning',
  'En cours': 'info',
  'Terminé': 'success',
  'Clôturé': 'success',
}

const workflowSteps = [
  { label: 'Initialisation', description: 'Ticket enregistré en approvisionnement.' },
  { label: 'En attente de prise en charge', description: 'En attente d\'analyse ou de correction budgétaire.' },
  { label: 'En cours', description: 'Ticket en cours de traitement.' },
  { label: 'Terminé', description: 'Traitement terminé.' },
  { label: 'Clôturé', description: 'Ticket finalisé et fermé.' },
]

function getActiveStep(ticket) {
  if (!ticket) return 0
  const stepIndex = workflowSteps.findIndex((step) => step.label === ticket.statut)
  return stepIndex === -1 ? 0 : stepIndex
}

function ApproTicketDetailPage() {
  const { ticketId } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState({ budgets: [], tickets: [], dirfinHistory: [] })
  const [apiError, setApiError] = useState('')
  const [transferError, setTransferError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function fetchApproData() {
      try {
        const data = await loadApproData()
        if (isMounted) {
          setState(data)
          setApiError('')
        }
      } catch (error) {
        if (isMounted) {
          setApiError(error.message || 'Impossible de charger le ticket.')
        }
      }
    }

    fetchApproData()

    return () => {
      isMounted = false
    }
  }, [ticketId])

  const ticket = state.tickets.find((item) => item.id === ticketId)

  const handleTransfer = async () => {
    try {
      const result = await transferTicketToInvoicing(ticketId)
      setState(result.state)
      setTransferError(result.error || '')
      setApiError('')
    } catch (error) {
      setApiError(error.message || 'Impossible de transférer le ticket.')
    }
  }

  const handleClose = async () => {
    try {
      const nextState = await closeTicket(ticketId)
      setState(nextState)
      setTransferError('')
      setApiError('')
    } catch (error) {
      setApiError(error.message || 'Impossible de clôturer le ticket.')
    }
  }

  if (!ticket) {
    return (
      <Stack spacing={2.5}>
        <Alert severity="error">
          Ticket introuvable : <strong>{ticketId}</strong>
        </Alert>
        {apiError && <Alert severity="warning">{apiError}</Alert>}
      </Stack>
    )
  }

  const activeStep = getActiveStep(ticket)
  const budget = state.budgets.find((line) => line.direction === ticket.direction)
  const remaining = budget ? budget.allocated - budget.engaged : null

  return (
    <Stack spacing={2.5}>
      <Stack direction="row" spacing={2} alignItems="center">
        <PageHeader
          title={`Ticket ${ticket.id}`}
          subtitle={`Direction ${ticket.direction} — ${ticket.objet}`}
        />
      </Stack>

      {/* ── Workflow stepper ── */}
      <Card>
        <CardContent>
          <Stack spacing={2.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
              <Chip
                label={ticket.statut}
                color={statusColor[ticket.statut] || 'default'}
              />
            </Stack>
            <Stepper activeStep={activeStep} alternativeLabel>
              {workflowSteps.map((step, index) => (
                <Step
                  key={step.label}
                  completed={
                    index < activeStep || (index === activeStep && ticket.statut !== 'En attente de prise en charge')
                  }
                >
                  <StepLabel>{step.label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Stack spacing={2.5}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h6">Détails</Typography>
                  <Divider />
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary" display="block">Référence</Typography>
                      <Typography variant="body1" fontWeight={600}>{ticket.id}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary" display="block">Direction</Typography>
                      <Typography variant="body1">{ticket.direction}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary" display="block">Objet</Typography>
                      <Typography variant="body1">{ticket.objet}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary" display="block">Montant demandé</Typography>
                      <Typography variant="body1" fontWeight={600}>{formatAmount(ticket.montant, ticket.devise)}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary" display="block">Budget restant (direction)</Typography>
                      <Typography
                        variant="body1"
                        color={remaining !== null && remaining < ticket.montant ? 'error.main' : 'success.main'}
                      >
                        {remaining !== null ? formatAmount(remaining, 'EUR') : '—'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary" display="block">Facture liée</Typography>
                      {ticket.linkedInvoiceId ? (
                        <Button
                          size="small"
                          variant="text"
                          endIcon={<OpenInNewOutlinedIcon fontSize="small" />}
                          onClick={() => navigate(`/facturation/${ticket.linkedInvoiceId}`)}
                          sx={{ p: 0 }}
                        >
                          {ticket.linkedInvoiceId}
                        </Button>
                      ) : (
                        <Typography variant="body1" color="text.secondary">Aucune</Typography>
                      )}
                    </Grid>
                  </Grid>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Stack spacing={1.5}>
                  <Typography variant="h6">Actions</Typography>
                  <Divider />
                  {transferError && <Alert severity="warning">{transferError}</Alert>}
                  {apiError && <Alert severity="error">{apiError}</Alert>}
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<CompareArrowsOutlinedIcon />}
                      disabled={ticket.statut === 'Clôturée' || Boolean(ticket.linkedInvoiceId)}
                      onClick={handleTransfer}
                      sx={{
                        bgcolor: 'common.black',
                        color: 'common.white',
                        '&:hover': { bgcolor: 'grey.900' },
                      }}
                    >
                      Envoyer vers facturation
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      startIcon={<TaskAltOutlinedIcon />}
                      disabled={ticket.statut === 'Clôturée' || Boolean(ticket.linkedInvoiceId)}
                      onClick={handleClose}
                    >
                      Fermer le ticket
                    </Button>
                  </Stack>
                  {ticket.statut === 'En attente de prise en charge' && (
                    <Alert severity="warning">
                      Ticket en attente de prise en charge. Ajustez le budget ou fermez le ticket.
                    </Alert>
                  )}
                  {ticket.statut === 'Transférée en facturation' && (
                    <Alert severity="info">
                      Ticket transmis à la facturation. Le workflow continue sur la facture liée.
                    </Alert>
                  )}
                  {ticket.statut === 'Clôturée' && (
                    <Alert severity="success">
                      Ticket clôturé. Aucune action supplémentaire n\'est disponible.
                    </Alert>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {ticket.history?.length > 0 && (
          <Grid size={{ xs: 12, lg: 5 }}>
            <Card>
              <CardContent>
                <Stack spacing={1.5}>
                  <Typography variant="h6">Historique et dates</Typography>
                  <Divider />
                  <HistoryTimeline
                    entries={ticket.history}
                    dotColor={statusColor[ticket.statut] || 'primary'}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Stack>
  )
}

export default ApproTicketDetailPage
