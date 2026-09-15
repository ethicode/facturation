import {
  Alert,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { createMission } from '../services/dashboardService.js'
import { uploadAttachments } from '../services/uploadService.js'

const emptyForm = {
  objet_mission: '',
  destination: '',
  pays: '',
  date_depart: '',
  date_retour: '',
  montant_estimatif: '',
  budget_concerne: '',
  pieces_jointes: '',
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

function MissionsCreatePage() {
  const navigate = useNavigate()
  const [formValues, setFormValues] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFormChange = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const validateMission = () => {
    const errors = {}

    if (!formValues.objet_mission.trim()) {
      errors.objet_mission = 'Objet de mission obligatoire.'
    }
    if (!formValues.destination.trim()) {
      errors.destination = 'Destination obligatoire.'
    }
    if (!formValues.pays.trim()) {
      errors.pays = 'Pays obligatoire.'
    }
    if (!formValues.date_depart) {
      errors.date_depart = 'Date de départ obligatoire.'
    }
    if (!formValues.date_retour) {
      errors.date_retour = 'Date de retour obligatoire.'
    }
    if (!formValues.montant_estimatif || Number(formValues.montant_estimatif) <= 0) {
      errors.montant_estimatif = 'Montant estimatif invalide.'
    }
    if (!formValues.budget_concerne.trim()) {
      errors.budget_concerne = 'Budget concerné obligatoire.'
    }

    return errors
  }

  const handleUploadChange = async (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) {
      return
    }

    setFormValues((prev) => ({ ...prev, pieces_jointes: files }))
    event.target.value = ''
  }

  const handleSubmit = async () => {
    const errors = validateMission()
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      setApiError('')
      return
    }

    try {
      setIsSubmitting(true)
      setApiError('')

      const uploadedAttachments = await uploadAttachments(formValues.pieces_jointes)

      const payload = {
        objet_mission: formValues.objet_mission.trim(),
        destination: formValues.destination.trim(),
        pays: formValues.pays.trim(),
        date_depart: formValues.date_depart,
        date_retour: formValues.date_retour,
        montant_estimatif: formatCfaAmount(formValues.montant_estimatif),
        budget_concerne: formValues.budget_concerne.trim(),
        pieces_jointes: uploadedAttachments,
      }

      const createdMission = await createMission(payload)
      navigate(`/frais-missions/${createdMission.code}`, { state: { mission: createdMission } })
    } catch (error) {
      setApiError(error.message || 'Impossible de créer la mission.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader title="Ajouter un frais de mission" />

      <Card>
        <CardContent>
          <Stack spacing={2.5}>
            {apiError && <Alert severity="error">{apiError}</Alert>}

            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Objet mission"
                  value={formValues.objet_mission}
                  onChange={(event) => handleFormChange('objet_mission', event.target.value)}
                  error={Boolean(formErrors.objet_mission)}
                  helperText={formErrors.objet_mission}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Destination"
                  value={formValues.destination}
                  onChange={(event) => handleFormChange('destination', event.target.value)}
                  error={Boolean(formErrors.destination)}
                  helperText={formErrors.destination}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Pays"
                  value={formValues.pays}
                  onChange={(event) => handleFormChange('pays', event.target.value)}
                  error={Boolean(formErrors.pays)}
                  helperText={formErrors.pays}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date de départ"
                  value={formValues.date_depart}
                  onChange={(event) => handleFormChange('date_depart', event.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  error={Boolean(formErrors.date_depart)}
                  helperText={formErrors.date_depart}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date de retour"
                  value={formValues.date_retour}
                  onChange={(event) => handleFormChange('date_retour', event.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  error={Boolean(formErrors.date_retour)}
                  helperText={formErrors.date_retour}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Montant estimatif"
                  value={formValues.montant_estimatif}
                  onChange={(event) => handleFormChange('montant_estimatif', event.target.value)}
                  error={Boolean(formErrors.montant_estimatif)}
                  helperText={formErrors.montant_estimatif || 'Saisir le montant en CFA.'}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Budget concerné"
                  value={formValues.budget_concerne}
                  onChange={(event) => handleFormChange('budget_concerne', event.target.value)}
                  error={Boolean(formErrors.budget_concerne)}
                  helperText={formErrors.budget_concerne}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Stack spacing={1}>
                  <Button variant="outlined" component="label" sx={{ alignSelf: 'flex-start' }}>
                    Importer des pièces jointes
                    <input hidden type="file" multiple onChange={handleUploadChange} />
                  </Button>
                  {Array.isArray(formValues.pieces_jointes) && formValues.pieces_jointes.length > 0 && (
                    <Stack spacing={0.5}>
                      {formValues.pieces_jointes.map((file, index) => (
                        <Typography key={`${file.name}-${file.lastModified}-${index}`} variant="body2" color="text.secondary">
                          {file.name}
                        </Typography>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </Grid>
            </Grid>

            <Stack direction="row" spacing={1.5}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={isSubmitting}
                sx={{
                  bgcolor: 'common.black',
                  color: 'common.white',
                  '&:hover': { bgcolor: 'grey.900' },
                }}
              >
                {isSubmitting ? 'Enregistrement...' : 'Ajouter la mission'}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}

export default MissionsCreatePage
