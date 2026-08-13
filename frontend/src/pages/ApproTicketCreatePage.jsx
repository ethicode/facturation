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
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { createSupplyTicket, loadApproData } from '../services/approStorage.js'

const emptyTicketForm = {
  titreDemande: '',
  domaine: '',
  sousDomaine: '',
  actionDemande: '',
  dateDebutSouhaitee: '',
  dateFinSouhaitee: '',
  directionDemandeur: '',
  budgetPrevisionnel: '',
  priorite: '',
  description: '',
  commentaire: '',
  uploadFileName: '',
}

const domainOptions = ['Achat', 'Service', 'Infrastructure', 'Maintenance', 'Autre']
const subDomainOptions = ['IT', 'Finance', 'RH', 'Logistique', 'Juridique', 'Autre']
const actionOptions = ['Renouvellement', 'Nouvel achat', 'Mise a niveau', 'Reparation', 'Consultance']
const priorityOptions = ['Basse', 'Normale', 'Haute', 'Critique']

function ApproTicketCreatePage() {
  const navigate = useNavigate()
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

  const handleFileUpload = (event) => {
    const selectedFile = event.target.files?.[0]
    handleFormChange('uploadFileName', selectedFile?.name || '')
  }

  const handleCreateTicket = async () => {
    const direction = ticketForm.directionDemandeur.trim() || state.budgets[0]?.direction || ''
    const objet = ticketForm.titreDemande.trim() || ticketForm.description.trim()
    const montant = Number(ticketForm.budgetPrevisionnel)

    const requiredFields = [
      ticketForm.titreDemande.trim(),
      ticketForm.domaine,
      ticketForm.sousDomaine,
      ticketForm.actionDemande.trim(),
      ticketForm.dateDebutSouhaitee,
      ticketForm.dateFinSouhaitee,
      direction,
      ticketForm.priorite,
      ticketForm.description.trim(),
    ]

    if (requiredFields.some((value) => !value) || Number.isNaN(montant) || montant <= 0) {
      setTicketError('Veuillez renseigner tous les champs obligatoires et un budget previsionnel valide.')
      setTicketSuccess('')
      return
    }

    if (ticketForm.dateFinSouhaitee < ticketForm.dateDebutSouhaitee) {
      setTicketError('La date de fin souhaitee doit etre superieure ou egale a la date de debut souhaitee.')
      setTicketSuccess('')
      return
    }

    try {
      const createdTicket = await createSupplyTicket({
        direction,
        objet,
        montant,
        devise: 'XAF',
        titre_demande: ticketForm.titreDemande.trim(),
        domaine: ticketForm.domaine,
        sous_domaine: ticketForm.sousDomaine,
        action_demande: ticketForm.actionDemande.trim(),
        date_debut_souhaitee: ticketForm.dateDebutSouhaitee,
        date_fin_souhaitee: ticketForm.dateFinSouhaitee,
        direction_demandeur: direction,
        budget_previsionnel: montant,
        priorite: ticketForm.priorite,
        description: ticketForm.description.trim(),
        commentaire: ticketForm.commentaire.trim(),
        fichier_nom: ticketForm.uploadFileName,
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
      navigate(`/approvisionnement/${createdTicket.id}`, { state: { ticket: createdTicket } })
    } catch (error) {
      setApiError(error.message || 'Impossible de créer le ticket.')
      setTicketSuccess('')
    }
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Création demande approvisionnement"
      />

      <Card>
        <CardContent>
          <Stack spacing={2}>
            
            <Typography variant="h6">Nouvelle demande</Typography>
            {ticketError && <Alert severity="error">{ticketError}</Alert>}
            {ticketSuccess && <Alert severity="success">{ticketSuccess}</Alert>}
            {apiError && <Alert severity="error">{apiError}</Alert>}

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Titre de la demande"
                  value={ticketForm.titreDemande}
                  onChange={(event) => handleFormChange('titreDemande', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Domaine</InputLabel>
                  <Select
                    value={ticketForm.domaine}
                    label="Domaine"
                    onChange={(event) => handleFormChange('domaine', event.target.value)}
                  >
                    {domainOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Sous domaine</InputLabel>
                  <Select
                    value={ticketForm.sousDomaine}
                    label="Sous domaine"
                    onChange={(event) => handleFormChange('sousDomaine', event.target.value)}
                  >
                    {subDomainOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Action</InputLabel>
                  <Select
                    value={ticketForm.actionDemande}
                    label="Action"
                    onChange={(event) => handleFormChange('actionDemande', event.target.value)}
                  >
                    {actionOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date debut souhaitee"
                  InputLabelProps={{ shrink: true }}
                  value={ticketForm.dateDebutSouhaitee}
                  onChange={(event) => handleFormChange('dateDebutSouhaitee', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date fin souhaitee"
                  InputLabelProps={{ shrink: true }}
                  value={ticketForm.dateFinSouhaitee}
                  onChange={(event) => handleFormChange('dateFinSouhaitee', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Direction demandeur</InputLabel>
                  <Select
                    value={ticketForm.directionDemandeur}
                    label="Direction demandeur"
                    onChange={(event) => handleFormChange('directionDemandeur', event.target.value)}
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
                  type="number"
                  label="Budget previsionnel"
                  value={ticketForm.budgetPrevisionnel}
                  onChange={(event) => handleFormChange('budgetPrevisionnel', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Priorite</InputLabel>
                  <Select
                    value={ticketForm.priorite}
                    label="Priorite"
                    onChange={(event) => handleFormChange('priorite', event.target.value)}
                  >
                    {priorityOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Description"
                  value={ticketForm.description}
                  onChange={(event) => handleFormChange('description', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Commentaire"
                  value={ticketForm.commentaire}
                  onChange={(event) => handleFormChange('commentaire', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Button variant="outlined" component="label" fullWidth>
                  Upload file
                  <input type="file" hidden onChange={handleFileUpload} />
                </Button>
                {ticketForm.uploadFileName && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Fichier selectionne: {ticketForm.uploadFileName}
                  </Typography>
                )}
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
