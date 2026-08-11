import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

function FacturationFormDialog({ open, mode, values, errors, onClose, onChange, onSubmit }) {
  const handleUploadChange = (event) => {
    const files = Array.from(event.target.files || [])
    onChange('piecesJointes', files.map((file) => file.name))
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{mode === 'edit' ? 'Modifier la demande de facturation' : 'Nouvelle demande de facturation'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                select
                label="Priorite"
                value={values.priorite}
                onChange={(event) => onChange('priorite', event.target.value)}
                error={Boolean(errors.priorite)}
                helperText={errors.priorite}
              >
                <MenuItem value="Haute">Haute</MenuItem>
                <MenuItem value="Moyenne">Moyenne</MenuItem>
                <MenuItem value="Basse">Basse</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Direction"
                value={values.direction}
                onChange={(event) => onChange('direction', event.target.value)}
                error={Boolean(errors.direction)}
                helperText={errors.direction}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Resume"
                value={values.resume}
                onChange={(event) => onChange('resume', event.target.value)}
                error={Boolean(errors.resume)}
                helperText={errors.resume}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Description"
                value={values.description}
                onChange={(event) => onChange('description', event.target.value)}
                error={Boolean(errors.description)}
                helperText={errors.description}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Fournisseur"
                value={values.fournisseur}
                onChange={(event) => onChange('fournisseur', event.target.value)}
                error={Boolean(errors.fournisseur)}
                helperText={errors.fournisseur}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Référence de facturation"
                value={values.numeroFacture}
                onChange={(event) => onChange('numeroFacture', event.target.value)}
                error={Boolean(errors.numeroFacture)}
                helperText={errors.numeroFacture}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Montant de la demande"
                value={values.montantDemande}
                onChange={(event) => onChange('montantDemande', event.target.value)}
                error={Boolean(errors.montantDemande)}
                helperText={errors.montantDemande}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Compte de charge"
                value={values.compteCharge}
                onChange={(event) => onChange('compteCharge', event.target.value)}
                error={Boolean(errors.compteCharge)}
                helperText={errors.compteCharge}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                type="date"
                label="Date de reception"
                value={values.dateReception}
                onChange={(event) => onChange('dateReception', event.target.value)}
                error={Boolean(errors.dateReception)}
                helperText={errors.dateReception}
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
                value={values.modeReception}
                onChange={(event) => onChange('modeReception', event.target.value)}
                error={Boolean(errors.modeReception)}
                helperText={errors.modeReception}
              >
                <MenuItem value="Email">Email</MenuItem>
                <MenuItem value="Courrier">Courrier</MenuItem>
                <MenuItem value="Portail">Portail</MenuItem>
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

          {values.piecesJointes?.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              Fichiers selectionnes: {values.piecesJointes.join(', ')}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="secondary">
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          sx={{
            bgcolor: 'common.black',
            color: 'common.white',
            '&:hover': { bgcolor: 'grey.900' },
          }}
        >
          {mode === 'edit' ? 'Enregistrer' : 'Creer'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default FacturationFormDialog
