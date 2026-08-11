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
} from '@mui/material'
import { invoiceStatuses } from '../utils/invoiceWorkflow.js'

function InvoiceFormDialog({ open, mode, values, errors, onClose, onChange, onSubmit }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{mode === 'edit' ? 'Modifier la facture' : 'Nouvelle facture'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Reference"
                value={values.id}
                onChange={(event) => onChange('id', event.target.value)}
                error={Boolean(errors.id)}
                helperText={errors.id}
                disabled={mode === 'edit'}
              />
            </Grid>
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
          </Grid>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Montant"
                value={values.montant}
                onChange={(event) => onChange('montant', event.target.value)}
                error={Boolean(errors.montant)}
                helperText={errors.montant}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                select
                label="Devise"
                value={values.devise}
                onChange={(event) => onChange('devise', event.target.value)}
              >
                <MenuItem value="XOF">XOF</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
                <MenuItem value="USD">USD</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                type="date"
                label="Echeance"
                value={values.echeance}
                onChange={(event) => onChange('echeance', event.target.value)}
                error={Boolean(errors.echeance)}
                helperText={errors.echeance}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Centre de cout"
                value={values.centreCout}
                onChange={(event) => onChange('centreCout', event.target.value)}
                error={Boolean(errors.centreCout)}
                helperText={errors.centreCout}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                select
                label="Statut"
                value={values.statut}
                onChange={(event) => onChange('statut', event.target.value)}
              >
                {invoiceStatuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Description"
            value={values.description}
            onChange={(event) => onChange('description', event.target.value)}
            error={Boolean(errors.description)}
            helperText={errors.description}
          />
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

export default InvoiceFormDialog
