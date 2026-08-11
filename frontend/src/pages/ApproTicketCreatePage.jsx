import {
  Alert,
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import { createSupplyTicket, loadApproData } from '../services/approStorage.js'

const emptyTicketForm = {
  direction: '',
  objet: '',
  montant: '',
  devise: 'EUR',
}

function ApproTicketCreatePage() {
  const [state, setState] = useState({ budgets: [], tickets: [], dirfinHistory: [] })
  const [apiError, setApiError] = useState('')
  const [ticketForm, setTicketForm] = useState(emptyTicketForm)
  const [ticketError, setTicketError] = useState('')
  const [ticketSuccess, setTicketSuccess] = useState('')

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
          setApiError(error.message || 'Impossible de charger les directions.')
        }
      }
    }

    fetchApproData()

    return () => {
      isMounted = false
    }
  }, [])

  const handleFormChange = (field, value) => {
    setTicketForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleCreateTicket = async () => {
    const direction = ticketForm.direction.trim() || state.budgets[0]?.direction || ''
    const objet = ticketForm.objet.trim()
    const montant = Number(ticketForm.montant)

    if (!direction || !objet || Number.isNaN(montant) || montant <= 0) {
      setTicketError('Veuillez renseigner une direction, un objet et un montant valide.')
      setTicketSuccess('')
      return
    }

    try {
      const createdTicket = await createSupplyTicket({
        direction,
        objet,
        montant,
        devise: ticketForm.devise || 'EUR',
        actor: 'Agent Approvisionnement',
      })

      setState((prev) => ({
        ...prev,
        tickets: [createdTicket, ...prev.tickets],
      }))
      setTicketForm(emptyTicketForm)
      setTicketError('')
      setApiError('')
      setTicketSuccess(`Ticket ${createdTicket.id} enregistré au statut Initialisation.`)
    } catch (error) {
      setApiError(error.message || 'Impossible de créer le ticket.')
      setTicketSuccess('')
    }
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Création ticket approvisionnement"
        subtitle="Créer un ticket qui sera ensuite vérifié puis transféré vers la facturation."
      />

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">Nouveau ticket</Typography>
            {ticketError && <Alert severity="error">{ticketError}</Alert>}
            {ticketSuccess && <Alert severity="success">{ticketSuccess}</Alert>}
            {apiError && <Alert severity="error">{apiError}</Alert>}

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Direction</InputLabel>
                  <Select
                    value={ticketForm.direction}
                    label="Direction"
                    onChange={(event) => handleFormChange('direction', event.target.value)}
                  >
                    {state.budgets.map((line) => (
                      <MenuItem key={line.direction} value={line.direction}>
                        {line.direction}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Objet"
                  value={ticketForm.objet}
                  onChange={(event) => handleFormChange('objet', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Montant"
                  value={ticketForm.montant}
                  onChange={(event) => handleFormChange('montant', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  label="Devise"
                  value={ticketForm.devise}
                  onChange={(event) => handleFormChange('devise', event.target.value.toUpperCase())}
                />
              </Grid>
            </Grid>

            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                onClick={handleCreateTicket}
                sx={{
                  bgcolor: 'common.black',
                  color: 'common.white',
                  '&:hover': { bgcolor: 'grey.900' },
                }}
              >
                Enregistrer le ticket
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}

export default ApproTicketCreatePage
