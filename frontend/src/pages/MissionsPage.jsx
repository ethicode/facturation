import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  TextField,
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
import { createMission, loadMissions } from '../services/dashboardService.js'

const missionColor = {
  Soumis: 'warning',
  Valide: 'success',
  'A completer': 'error',
}

const emptyCreateForm = {
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

function MissionsPage() {
  const navigate = useNavigate()
  const [missions, setMissions] = useState([])
  const [apiError, setApiError] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createForm, setCreateForm] = useState(emptyCreateForm)
  const [createError, setCreateError] = useState('')
  const [createLoading, setCreateLoading] = useState(false)

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
          setApiError(error.message || 'Impossible de charger les missions.')
        }
      }
    }

    fetchMissions()

    return () => {
      isMounted = false
    }
  }, [])

  const handleCreateMission = async () => {
    const objet_mission = createForm.objet_mission.trim()
    const destination = createForm.destination.trim()
    const pays = createForm.pays.trim()
    const date_depart = createForm.date_depart.trim()
    const date_retour = createForm.date_retour.trim()
    const montant_estimatif = formatCfaAmount(createForm.montant_estimatif)
    const budget_concerne = createForm.budget_concerne.trim()
    const pieces_jointes = createForm.pieces_jointes
      .split(/[\n,]+/)
      .map((piece) => piece.trim())
      .filter(Boolean)

    if (!objet_mission || !destination || !pays || !date_depart || !date_retour || !montant_estimatif || !budget_concerne) {
      setCreateError('Veuillez renseigner tous les champs de la mission.')
      return
    }

    try {
      setCreateLoading(true)
      const mission = await createMission({
        objet_mission,
        destination,
        pays,
        date_depart,
        date_retour,
        montant_estimatif,
        budget_concerne,
        pieces_jointes,
      })
      setMissions((current) => [mission, ...current])
      setCreateModalOpen(false)
      setCreateForm(emptyCreateForm)
      setCreateError('')
      setApiError('')
    } catch (error) {
      setCreateError(error.message || 'Impossible de créer la mission.')
    } finally {
      setCreateLoading(false)
    }
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Frais de mission"
        subtitle="Suivre les depenses terrain et fiabiliser les justificatifs."
      />

      {apiError && <Alert severity="error">{apiError}</Alert>}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography variant="h6">Notes de frais</Typography>
                <Button variant="contained" onClick={() => setCreateModalOpen(true)}>
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
                      <TableCell align="right">Statut</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {missions.map((mission) => (
                      <TableRow key={mission.code} hover onClick={() => navigate(`/frais-missions/${mission.code}`, { state: { mission } })} sx={{ cursor: 'pointer' }}>
                        <TableCell>{mission.code}</TableCell>
                        <TableCell>{mission.objet_mission}</TableCell>
                        <TableCell>{mission.destination}</TableCell>
                        <TableCell>{mission.pays}</TableCell>
                        <TableCell>{mission.date_depart}</TableCell>
                        <TableCell>{mission.date_retour}</TableCell>
                        <TableCell>{formatCfaAmount(mission.montant_estimatif)}</TableCell>
                        <TableCell>{mission.budget_concerne}</TableCell>
                        <TableCell align="right">
                          <Chip
                            size="small"
                            color={missionColor[mission.statut] || 'default'}
                            label={mission.statut}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Ajouter un frais de mission</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            {createError && <Alert severity="error">{createError}</Alert>}
            <TextField
              label="Objet mission"
              value={createForm.objet_mission}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, objet_mission: event.target.value }))}
              autoFocus
              fullWidth
            />
            <TextField
              label="Destination"
              value={createForm.destination}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, destination: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Pays"
              value={createForm.pays}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, pays: event.target.value }))}
              fullWidth
            />
            <TextField
              type="date"
              label="Date de départ"
              value={createForm.date_depart}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, date_depart: event.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <TextField
              type="date"
              label="Date de retour"
              value={createForm.date_retour}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, date_retour: event.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <TextField
              label="Montant estimatif"
              value={createForm.montant_estimatif}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, montant_estimatif: event.target.value }))}
              helperText="Saisir le montant en CFA."
              fullWidth
            />
            <TextField
              label="Budget concerné"
              value={createForm.budget_concerne}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, budget_concerne: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Pièces jointes"
              value={createForm.pieces_jointes}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, pieces_jointes: event.target.value }))}
              helperText="Séparez les pièces jointes par une virgule ou un retour à la ligne."
              multiline
              minRows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateModalOpen(false)} disabled={createLoading}>Annuler</Button>
          <Button variant="contained" onClick={handleCreateMission} disabled={createLoading}>
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default MissionsPage
