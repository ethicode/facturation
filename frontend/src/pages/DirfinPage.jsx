import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import {
  Alert,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import RoleGate from '../components/RoleGate.jsx'
import TableActionMenu from '../components/TableActionMenu.jsx'
import DirfinActivityTimeline from '../components/DirfinActivityTimeline.jsx'
import { useRoleContext } from '../app/roleContext.js'
import {
  deleteDirectionBudget,
  loadApproData,
  saveDirectionBudget,
} from '../services/approStorage.js'
import { formatAmount } from '../utils/invoiceWorkflow.js'

const emptyBudgetForm = {
  direction: '',
  allocated: '',
  engaged: '',
  allocatedBy: 'DirFin',
}

function validateBudgetForm(values, currentBudgets, editingDirection) {
  const errors = {}
  const directionName = values.direction.trim()
  const allocated = Number(values.allocated)
  const engaged = Number(values.engaged)

  if (!directionName) {
    errors.direction = 'Direction obligatoire'
  }

  const duplicate = currentBudgets.some(
    (line) => line.direction.toLowerCase() === directionName.toLowerCase() && line.direction !== editingDirection,
  )
  if (duplicate) {
    errors.direction = 'Cette direction existe deja'
  }

  if (!values.allocated || Number.isNaN(allocated) || allocated <= 0) {
    errors.allocated = 'Allocation invalide'
  }

  if (!values.engaged || Number.isNaN(engaged) || engaged < 0) {
    errors.engaged = 'Montant engage invalide'
  }

  if (!errors.allocated && !errors.engaged && engaged > allocated) {
    errors.engaged = 'Le montant engage ne peut pas depasser l allocation'
  }

  return errors
}

function DirfinPage() {
  const { activeRole, setActiveRole } = useRoleContext()
  const [state, setState] = useState({ budgets: [], tickets: [], dirfinHistory: [] })
  const [apiError, setApiError] = useState('')
  const [formValues, setFormValues] = useState(emptyBudgetForm)
  const [formErrors, setFormErrors] = useState({})
  const [editingDirection, setEditingDirection] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [actionError, setActionError] = useState('')

  const canEdit = activeRole === 'manageur' || activeRole === 'administrateur'

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
          setApiError(error.message || 'Impossible de charger les budgets.')
        }
      }
    }

    fetchApproData()

    return () => {
      isMounted = false
    }
  }, [])

  const totals = useMemo(() => {
    const allocated = state.budgets.reduce((sum, line) => sum + line.allocated, 0)
    const engaged = state.budgets.reduce((sum, line) => sum + line.engaged, 0)

    return {
      allocated,
      engaged,
      remaining: allocated - engaged,
    }
  }, [state.budgets])

  const handleFormChange = (field, value) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }))

    if (formErrors[field]) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }))
    }
  }

  const resetForm = () => {
    setFormValues(emptyBudgetForm)
    setEditingDirection('')
    setFormErrors({})
  }

  const openCreateModal = () => {
    resetForm()
    setActionError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    resetForm()
  }

  const startEdit = (budget) => {
    setFormValues({
      direction: budget.direction,
      allocated: String(budget.allocated),
      engaged: String(budget.engaged),
      allocatedBy: budget.allocatedBy || 'DirFin',
    })
    setEditingDirection(budget.direction)
    setFormErrors({})
    setActionError('')
    setIsModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!canEdit) {
      setActionError('Seul le profil manageur ou administrateur peut enregistrer des modifications.')
      return
    }

    const errors = validateBudgetForm(formValues, state.budgets, editingDirection)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      const nextState = await saveDirectionBudget({
        ...formValues,
        allocated: Number(formValues.allocated),
        engaged: Number(formValues.engaged),
        allocatedBy: 'DirFin',
        actor: 'DirFin',
      })

      setState(nextState)
      setActionError('')
      setApiError('')
      closeModal()
    } catch (error) {
      setApiError(error.message || 'Impossible d enregistrer l allocation.')
    }
  }

  const handleDelete = async (directionName) => {
    if (!canEdit) {
      setActionError('Seul le profil manageur ou administrateur peut supprimer une allocation.')
      return
    }

    try {
      const result = await deleteDirectionBudget(directionName, 'DirFin')
      setState(result.state)
      setActionError(result.error)
      setApiError('')

      if (!result.error && editingDirection === directionName) {
        resetForm()
      }
    } catch (error) {
      setApiError(error.message || 'Impossible de supprimer cette allocation.')
    }
  }

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
        <PageHeader
          title="DirFin"
          subtitle="Gestion complete des allocations budgetaires par direction."
        />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignSelf: { xs: 'stretch', md: 'auto' } }}>
          {canEdit && (
            <Button
              variant="contained"
              onClick={openCreateModal}
              sx={{
                bgcolor: 'common.black',
                color: 'common.white',
                '&:hover': { bgcolor: 'grey.900' },
              }}
            >
              Nouvelle allocation
            </Button>
          )}
        </Stack>
      </Stack>

      <Alert severity="info">
        DirFin alloue et ajuste les enveloppes. Approvisionnement controle uniquement avant traitement des tickets.
      </Alert>

      {!canEdit && <Alert severity="warning">Le profil courant ne peut que consulter cette page. Les modifications sont reservées aux rôles manageur et administrateur.</Alert>}

      {actionError && <Alert severity="error">{actionError}</Alert>}
      {apiError && <Alert severity="error">{apiError}</Alert>}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Total alloue
              </Typography>
              <Typography variant="h6">{formatAmount(totals.allocated, 'EUR')}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Total engage
              </Typography>
              <Typography variant="h6">{formatAmount(totals.engaged, 'EUR')}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Reste global
              </Typography>
              <Typography variant="h6">{formatAmount(totals.remaining, 'EUR')}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <RoleGate role={activeRole} allowedRoles={['manageur', 'administrateur']}>
        <Dialog open={isModalOpen} onClose={closeModal} fullWidth maxWidth="md">
          <DialogTitle>{editingDirection ? `Modifier allocation: ${editingDirection}` : 'Nouvelle allocation direction'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  label="Direction"
                  value={formValues.direction}
                  onChange={(event) => handleFormChange('direction', event.target.value)}
                  error={Boolean(formErrors.direction)}
                  helperText={formErrors.direction}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Budget alloue"
                  value={formValues.allocated}
                  onChange={(event) => handleFormChange('allocated', event.target.value)}
                  error={Boolean(formErrors.allocated)}
                  helperText={formErrors.allocated}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Montant engage"
                  value={formValues.engaged}
                  onChange={(event) => handleFormChange('engaged', event.target.value)}
                  error={Boolean(formErrors.engaged)}
                  helperText={formErrors.engaged}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  label="Alloue par"
                  value="DirFin"
                  disabled
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button color="secondary" onClick={closeModal}>Annuler</Button>
            <Button
              variant="contained"
              startIcon={<SaveOutlinedIcon />}
              onClick={handleSubmit}
              sx={{
                bgcolor: 'common.black',
                color: 'common.white',
                '&:hover': { bgcolor: 'grey.900' },
              }}
            >
              {editingDirection ? 'Mettre a jour' : 'Enregistrer'}
            </Button>
          </DialogActions>
        </Dialog>
      </RoleGate>

      <Card>
        <CardContent>
          <Stack spacing={1.5}>
            <Typography variant="h6">Directions budgetaires</Typography>
            <TableContainer>
              <Table size="small" sx={{ minWidth: 880 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Direction</TableCell>
                    <TableCell>Alloue par</TableCell>
                    <TableCell>Budget alloue</TableCell>
                    <TableCell>Montant engage</TableCell>
                    <TableCell>Reste</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {state.budgets.map((line) => (
                    <TableRow key={line.direction} hover>
                      <TableCell>{line.direction}</TableCell>
                      <TableCell>{line.allocatedBy || 'DirFin'}</TableCell>
                      <TableCell>{formatAmount(line.allocated, 'EUR')}</TableCell>
                      <TableCell>{formatAmount(line.engaged, 'EUR')}</TableCell>
                      <TableCell>{formatAmount(line.allocated - line.engaged, 'EUR')}</TableCell>
                      <TableCell align="right">
                        {canEdit ? (
                          <TableActionMenu
                            actions={[
                              {
                                key: 'edit',
                                label: 'Modifier',
                                icon: <EditOutlinedIcon fontSize="small" />,
                                onClick: () => startEdit(line),
                              },
                              {
                                key: 'delete',
                                label: 'Supprimer',
                                icon: <DeleteOutlinedIcon fontSize="small" />,
                                onClick: () => handleDelete(line.direction),
                              },
                            ]}
                          />
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={1.5}>
            <Typography variant="h6">Historique des modifications DirFin</Typography>
            <DirfinActivityTimeline entries={state.dirfinHistory || []} />
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}

export default DirfinPage
