import {
  Alert,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { createFacture } from '../services/facturationStorage.js'
import { uploadAttachments } from '../services/uploadService.js'
import { loadWorkflowDirections } from '../services/workflowService.js'

const emptyForm = {
  priorite: '',
  direction: '',
  resume: '',
  fournisseur: '',
  numeroFacture: '',
  montantDemande: '',
  compteCharge: '',
  dateReception: '',
  modeReception: '',
  piecesJointes: [],
  description: '',
}

function getTodayDate() {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 10)
}

function createInitialForm() {
  return {
    ...emptyForm,
    dateReception: getTodayDate(),
  }
}

function validateFacture(values) {
  const errors = {}

  if (!values.priorite) {
    errors.priorite = 'Priorite obligatoire'
  }

  if (!values.direction.trim()) {
    errors.direction = 'Direction obligatoire'
  }

  if (!values.resume.trim()) {
    errors.resume = 'Resume obligatoire'
  }

  if (!values.fournisseur.trim()) {
    errors.fournisseur = 'Fournisseur obligatoire'
  }

  if (!values.numeroFacture.trim()) {
    errors.numeroFacture = 'Référence de facturation obligatoire'
  }

  const amount = Number(values.montantDemande)
  if (!values.montantDemande || Number.isNaN(amount) || amount <= 0) {
    errors.montantDemande = 'Montant invalide'
  }

  if (!values.compteCharge.trim()) {
    errors.compteCharge = 'Compte de charge obligatoire'
  }

  if (!values.dateReception) {
    errors.dateReception = 'Date de reception obligatoire'
  }

  if (!values.modeReception) {
    errors.modeReception = 'Mode de reception obligatoire'
  }

  if (!values.description.trim()) {
    errors.description = 'Description obligatoire'
  }

  return errors
}

function FacturationCreatePage() {
  const navigate = useNavigate()
  const [formValues, setFormValues] = useState(createInitialForm)
  const [formErrors, setFormErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [directions, setDirections] = useState([])
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    let isMounted = true

    const fetchDirections = async () => {
      try {
        const response = await loadWorkflowDirections()
        if (isMounted) {
          setDirections(response || [])
        }
      } catch (error) {
        if (isMounted) {
          setDirections([])
        }
      }
    }

    fetchDirections()

    return () => {
      isMounted = false
    }
  }, [])

  const handleFormChange = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleUploadChange = (event) => {
    const files = Array.from(event.target.files || [])
    handleFormChange('piecesJointes', files)
  }

  const handleSubmit = async () => {
    const errors = validateFacture(formValues)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      setApiError('')
      return
    }

    try {
      setIsUploading(true)
      const uploadedAttachments = await uploadAttachments(formValues.piecesJointes)

      const payload = {
        priorite: formValues.priorite,
        direction: formValues.direction.trim(),
        resume: formValues.resume.trim(),
        fournisseur: formValues.fournisseur.trim(),
        numeroFacture: formValues.numeroFacture.trim(),
        compteCharge: formValues.compteCharge.trim(),
        dateReception: formValues.dateReception,
        modeReception: formValues.modeReception,
        piecesJointes: uploadedAttachments,
        centreCout: formValues.compteCharge.trim(),
        description: formValues.description.trim(),
        montant: Number(formValues.montantDemande),
        devise: 'XAF',
        echeance: formValues.dateReception,
        actor: 'Utilisateur ORFL',
        role: 'utilisateur',
      }

      const createdFacture = await createFacture(payload)
      navigate(`/facturation/${createdFacture.id}`, { state: { facture: createdFacture } })
    } catch (error) {
      setApiError(error.message || 'Impossible de créer la demande de facturation.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader title="Nouvelle demande de facturation" />

      <Card>
        <CardContent>
          <Stack spacing={2.5}>
            {apiError && <Alert severity="error">{apiError}</Alert>}

            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  select
                  label="Priorite"
                  value={formValues.priorite}
                  onChange={(event) => handleFormChange('priorite', event.target.value)}
                  error={Boolean(formErrors.priorite)}
                  helperText={formErrors.priorite}
                >
                  <MenuItem value="Haute">Haute</MenuItem>
                  <MenuItem value="Moyenne">Moyenne</MenuItem>
                  <MenuItem value="Basse">Basse</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  select
                  label="Direction"
                  value={formValues.direction}
                  onChange={(event) => handleFormChange('direction', event.target.value)}
                  error={Boolean(formErrors.direction)}
                  helperText={formErrors.direction}
                >
                  <MenuItem value="">Sélectionner une direction</MenuItem>
                  {directions.map((direction) => (
                    <MenuItem key={direction} value={direction}>
                      {direction}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12}}>
                <TextField
                  fullWidth
                  label="Resume"
                  value={formValues.resume}
                  onChange={(event) => handleFormChange('resume', event.target.value)}
                  error={Boolean(formErrors.resume)}
                  helperText={formErrors.resume}
                />
              </Grid>
              <Grid size={{ xs: 12}}>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  label="Description"
                  value={formValues.description}
                  onChange={(event) => handleFormChange('description', event.target.value)}
                  error={Boolean(formErrors.description)}
                  helperText={formErrors.description}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12}}>
                <TextField
                  fullWidth
                  label="Fournisseur"
                  value={formValues.fournisseur}
                  onChange={(event) => handleFormChange('fournisseur', event.target.value)}
                  error={Boolean(formErrors.fournisseur)}
                  helperText={formErrors.fournisseur}
                />
              </Grid>
              <Grid size={{ xs: 12}}>
                <TextField
                  fullWidth
                  label="Référence de facturation"
                  value={formValues.numeroFacture}
                  onChange={(event) => handleFormChange('numeroFacture', event.target.value)}
                  error={Boolean(formErrors.numeroFacture)}
                  helperText={formErrors.numeroFacture}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Montant de la demande"
                  value={formValues.montantDemande}
                  onChange={(event) => handleFormChange('montantDemande', event.target.value)}
                  error={Boolean(formErrors.montantDemande)}
                  helperText={formErrors.montantDemande}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Compte de charge"
                  value={formValues.compteCharge}
                  onChange={(event) => handleFormChange('compteCharge', event.target.value)}
                  error={Boolean(formErrors.compteCharge)}
                  helperText={formErrors.compteCharge}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date de reception"
                  value={formValues.dateReception}
                  onChange={(event) => handleFormChange('dateReception', event.target.value)}
                  error={Boolean(formErrors.dateReception)}
                  helperText={formErrors.dateReception}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  select
                  label="Mode de reception"
                  value={formValues.modeReception}
                  onChange={(event) => handleFormChange('modeReception', event.target.value)}
                  error={Boolean(formErrors.modeReception)}
                  helperText={formErrors.modeReception}
                >
                  <MenuItem value="Courrier">Courrier</MenuItem>
                  <MenuItem value="Depot physique">Depot physique</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Button variant="outlined" component="label" fullWidth sx={{ mt: 1 }}>
                  Pieces jointes
                  <input hidden type="file" multiple onChange={handleUploadChange} />
                </Button>
              </Grid>
            </Grid>

            {formValues.piecesJointes?.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                Fichiers selectionnes: {formValues.piecesJointes.map((file) => file.name).join(', ')}
              </Typography>
            )}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={isUploading}
                sx={{
                  bgcolor: 'common.black',
                  color: 'common.white',
                  '&:hover': { bgcolor: 'grey.900' },
                }}
              >
                Enregistrer
              </Button>
              <Button variant="outlined" onClick={() => navigate('/facturation')}>
                Annuler
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}

export default FacturationCreatePage
