import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import {
  Alert,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import TableActionMenu from '../components/TableActionMenu.jsx'
import { useRoleContext } from '../app/roleContext.js'
import {
  createDirectionBudgetItem,
  deleteDirectionBudgetItem,
  loadApproData,
  updateDirectionBudgetItem,
} from '../services/approStorage.js'
import { loadMissions } from '../services/dashboardService.js'
import { getStoredAuth } from '../services/authService.js'
import { formatAmount } from '../utils/facturationWorkflow.js'
import { isAdminRole } from '../utils/roles.js'

function formatAuditDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
}

function GestionBudgetaireDetailPage() {
  const { direction } = useParams()
  const navigate = useNavigate()
  const { activeRole } = useRoleContext()
  const [budget, setBudget] = useState(null)
  const [budgetItems, setBudgetItems] = useState([])
  const [missions, setMissions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formValues, setFormValues] = useState({ label: '', allocated: '' })
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [editingItemId, setEditingItemId] = useState('')
  const [itemToDelete, setItemToDelete] = useState(null)

  const canEdit = activeRole === 'manageur' || isAdminRole(activeRole)

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    setBudget(null)

    Promise.all([loadApproData(), loadMissions()])
      .then(([data, missionList]) => {
        if (isMounted) {
          setBudget(data.budgets.find((line) => line.direction === direction) || null)
          setBudgetItems(data.budgetItems.filter((line) => line.direction === direction))
          setMissions(missionList)
          setApiError('')
        }
      })
      .catch((error) => {
        if (isMounted) {
          setApiError(error.message || 'Impossible de charger cette allocation.')
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [direction])

  const remaining = budget ? budget.allocated - budget.engaged : 0
  const engagementRate = budget?.allocated > 0 ? (budget.engaged / budget.allocated) * 100 : 0
  const getItemConsumed = (item) => missions
    .filter((mission) => mission.budget_item_id === item.id || (
      !mission.budget_item_id && mission.budget_concerne === `${item.direction} — ${item.label}`
    ))
    .reduce((sum, mission) => sum + Number(mission.budget_consumed || mission.montant_estimatif?.replace(/[^\d.,-]/g, '').replace(',', '.') || 0), 0)

  const currentActor = () => {
    const user = getStoredAuth()?.user
    return user?.email || user?.username || activeRole || 'DirFin'
  }

  const startEditItem = (item) => {
    setEditingItemId(item.id)
    setFormValues({ label: item.label, allocated: String(item.allocated) })
    setFormError('')
    setIsModalOpen(true)
  }

  const handleSaveItem = async (event) => {
    event.preventDefault()
    const label = formValues.label.trim()
    const allocated = Number(formValues.allocated)
    if (!label || !Number.isFinite(allocated) || allocated <= 0) {
      setFormError('Indiquez un libellé et un montant alloué supérieur à zéro.')
      return
    }

    setIsSaving(true)
    setFormError('')
    try {
      const payload = { label, allocated, actor: currentActor() }
      const nextState = editingItemId
        ? await updateDirectionBudgetItem(editingItemId, payload)
        : await createDirectionBudgetItem(direction, payload)
      setBudget(nextState.budgets.find((line) => line.direction === direction) || null)
      setBudgetItems(nextState.budgetItems.filter((line) => line.direction === direction))
      setFormValues({ label: '', allocated: '' })
      setEditingItemId('')
      setIsModalOpen(false)
      setApiError('')
    } catch (error) {
      setFormError(error.message || 'Impossible d’ajouter cette ligne budgétaire.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteItem = async () => {
    if (!itemToDelete) return

    setIsSaving(true)
    try {
      const nextState = await deleteDirectionBudgetItem(itemToDelete.id)
      setBudget(nextState.budgets.find((line) => line.direction === direction) || null)
      setBudgetItems(nextState.budgetItems.filter((line) => line.direction === direction))
      setItemToDelete(null)
      setApiError('')
    } catch (error) {
      setApiError(error.message || 'Impossible de supprimer cette ligne budgétaire.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title={`Budget — ${direction}`}
      />
      {isLoading ? (
        <Typography color="text.secondary">Chargement de l'allocation...</Typography>
      ) : apiError ? (
        <Alert severity="error">{apiError}</Alert>
      ) : !budget ? (
        <Alert severity="warning">Aucune allocation trouvée pour cette direction.</Alert>
      ) : (
        <Card>
          <CardContent>
            <Stack spacing={2.5}>
              <Typography variant="h6">Détails du budget</Typography>
              <Divider />
              <Grid container spacing={3}>
                {[
                  ['Direction', budget.direction],
                  ['Budget alloué', formatAmount(budget.allocated, 'XAF')],
                  ['Montant engagé', formatAmount(budget.engaged, 'XAF')],
                  ['Reste disponible', formatAmount(remaining, 'XAF')],
                ].map(([label, value]) => (
                  <Grid key={label} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                    <Typography variant="body1" fontWeight={600}>{value}</Typography>
                  </Grid>
                ))}
              </Grid>
              <Stack spacing={1}>
                <Typography variant="subtitle2">Budget engagé : {engagementRate.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %</Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      {!isLoading && !apiError && budget && (
        <Card>
          <CardContent>
            <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                <Typography variant="h6">Lignes budgétaires</Typography>
                {canEdit && (
                  <Button
                    sx={{
                      ml: { xs: 0, sm: 'auto' },
                      bgcolor: 'common.black',
                      color: 'common.white',
                      '&:hover': { bgcolor: 'grey.900' },
                    }}
                    variant="contained"
                    startIcon={<AddOutlinedIcon />}
                    onClick={() => {
                      setEditingItemId('')
                      setFormValues({ label: '', allocated: '' })
                      setFormError('')
                      setIsModalOpen(true)
                    }}
                  >
                    Ajouter une ligne
                  </Button>
                )}
              </Stack>
              {budgetItems.length ? (
                <TableContainer>
                  <Table size="small" sx={{ minWidth: 1280 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Libellé</TableCell>
                        <TableCell align="right">Budget alloué</TableCell>
                        <TableCell align="right">Consommé</TableCell>
                        <TableCell align="right">Disponible</TableCell>
                        <TableCell>Ajoutée le</TableCell>
                        <TableCell>Ajoutée par</TableCell>
                        <TableCell>Modifiée le</TableCell>
                        <TableCell>Modifiée par</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {budgetItems.map((item) => (
                        <TableRow
                          key={item.id}
                          hover
                          tabIndex={0}
                          role="link"
                          aria-label={`Historique de consommation de ${item.label}`}
                          onClick={() => navigate(`/gestion-budgetaire/${encodeURIComponent(direction)}/lignes/${encodeURIComponent(item.id)}`)}
                          onKeyDown={(event) => {
                            if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                              event.preventDefault()
                              navigate(`/gestion-budgetaire/${encodeURIComponent(direction)}/lignes/${encodeURIComponent(item.id)}`)
                            }
                          }}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell>{item.label}</TableCell>
                          <TableCell align="right">{formatAmount(item.allocated, 'XAF')}</TableCell>
                          <TableCell align="right">{formatAmount(getItemConsumed(item), 'XAF')}</TableCell>
                          <TableCell align="right">{formatAmount(item.allocated - getItemConsumed(item), 'XAF')}</TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatAuditDate(item.createdAt)}</TableCell>
                          <TableCell>{item.createdBy || '—'}</TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatAuditDate(item.updatedAt)}</TableCell>
                          <TableCell>{item.updatedBy || '—'}</TableCell>
                          <TableCell align="right">
                            {canEdit && (
                              <TableActionMenu
                                actions={[
                                  {
                                    key: 'edit',
                                    label: 'Modifier',
                                    icon: <EditOutlinedIcon fontSize="small" />,
                                    onClick: () => startEditItem(item),
                                  },
                                  {
                                    key: 'delete',
                                    label: 'Supprimer',
                                    icon: <DeleteOutlinedIcon fontSize="small" />,
                                    onClick: () => setItemToDelete(item),
                                  },
                                ]}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary">Aucune ligne budgétaire ajoutée pour cette direction.</Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={isModalOpen}
        onClose={() => {
          if (!isSaving) {
            setIsModalOpen(false)
            setEditingItemId('')
          }
        }}
        fullWidth
        maxWidth="sm"
      >
        <form onSubmit={handleSaveItem}>
          <DialogTitle>{editingItemId ? 'Modifier une ligne budgétaire' : 'Ajouter une ligne budgétaire'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Typography color="text.secondary">Direction : {direction}</Typography>
              {formError && <Alert severity="error">{formError}</Alert>}
              <TextField
                autoFocus
                required
                fullWidth
                label="Libellé de la ligne"
                value={formValues.label}
                onChange={(event) => setFormValues((current) => ({ ...current, label: event.target.value }))}
              />
              <TextField
                required
                fullWidth
                type="number"
                label="Budget alloué (XAF)"
                inputProps={{ min: 0.01, step: '0.01' }}
                value={formValues.allocated}
                onChange={(event) => setFormValues((current) => ({ ...current, allocated: event.target.value }))}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button disabled={isSaving} onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button type="submit" variant="contained" disabled={isSaving}>
              {isSaving ? 'Enregistrement…' : editingItemId ? 'Enregistrer les modifications' : 'Ajouter la ligne'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={Boolean(itemToDelete)} onClose={() => !isSaving && setItemToDelete(null)}>
        <DialogTitle>Supprimer la ligne budgétaire ?</DialogTitle>
        <DialogContent>
          <Typography>
            La ligne « {itemToDelete?.label} » sera supprimée et son montant retiré du budget alloué de la direction.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button disabled={isSaving} onClick={() => setItemToDelete(null)}>Annuler</Button>
          <Button color="error" variant="contained" disabled={isSaving} onClick={handleDeleteItem}>
            {isSaving ? 'Suppression…' : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default GestionBudgetaireDetailPage