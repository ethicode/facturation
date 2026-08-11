import { useEffect, useState } from 'react'
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined'
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Typography,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import TableActionMenu from '../components/TableActionMenu.jsx'
import InvoiceFormDialog from '../components/InvoiceFormDialog.jsx'
import { createInvoice, loadInvoices } from '../services/invoiceStorage.js'
import {
  formatAmount,
  formatDate,
  statusColor,
} from '../utils/invoiceWorkflow.js'

const emptyForm = {
  id: '',
  fournisseur: '',
  montant: '',
  devise: 'XOF',
  centreCout: '',
  description: '',
  echeance: '',
  statut: 'Initialisation',
}

function validateInvoice(values, currentInvoices, mode) {
  const errors = {}

  if (!values.fournisseur.trim()) {
    errors.fournisseur = 'Fournisseur obligatoire'
  }

  const amount = Number(values.montant)
  if (!values.montant || Number.isNaN(amount) || amount <= 0) {
    errors.montant = 'Montant invalide'
  }

  if (!values.echeance) {
    errors.echeance = 'Echeance obligatoire'
  }

  if (!values.centreCout.trim()) {
    errors.centreCout = 'Centre de cout obligatoire'
  }

  if (!values.description.trim()) {
    errors.description = 'Description obligatoire'
  }

  return errors
}

function InvoicesPage() {
  const navigate = useNavigate()
  const [invoiceList, setInvoiceList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [dialogMode, setDialogMode] = useState('create')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formValues, setFormValues] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    let isMounted = true

    async function fetchInvoices() {
      try {
        const data = await loadInvoices()
        if (isMounted) {
          setInvoiceList(data)
          setApiError('')
        }
      } catch (error) {
        if (isMounted) {
          setApiError(error.message || 'Impossible de charger les factures.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchInvoices()

    return () => {
      isMounted = false
    }
  }, [])

  const openCreateDialog = () => {
    setDialogMode('create')
    setFormErrors({})
    setFormValues({
      ...emptyForm,
      id: '',
    })
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
  }

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

  const handleDialogSubmit = async () => {
    const errors = validateInvoice(formValues, invoiceList, dialogMode)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    const payload = {
      fournisseur: formValues.fournisseur.trim(),
      centreCout: formValues.centreCout.trim(),
      description: formValues.description.trim(),
      montant: Number(formValues.montant),
      devise: formValues.devise,
      echeance: formValues.echeance,
      actor: 'Utilisateur ORFL',
      role: 'utilisateur',
    }

    try {
      const created = await createInvoice(payload)
      setInvoiceList((prev) => [created, ...prev])
      setApiError('')
      setIsDialogOpen(false)
    } catch (error) {
      setApiError(error.message || 'Impossible de créer la facture.')
    }
  }

  const openDetails = (invoiceId) => {
    navigate(`/facturation/${invoiceId}`)
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Facturation"
        subtitle="CRUD facture + résolution du process de validation et de paiement."
      />

      <Card>
        <CardContent>
          {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5} sx={{ mb: 2 }}>
            <Stack spacing={0.25}>
              <Typography variant="h6">Dossiers actifs</Typography>
              <Typography variant="caption" color="text.secondary">
                Création, édition, suppression et pilotage du statut.
              </Typography>
            </Stack>
            <Button
              variant="contained"
              onClick={openCreateDialog}
              sx={{
                bgcolor: 'common.black',
                color: 'common.white',
                '&:hover': { bgcolor: 'grey.900' },
              }}
            >
              Nouvelle facture
            </Button>
          </Stack>

          <TableContainer>
            <Table size="small" sx={{ minWidth: 980 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Référence</TableCell>
                  <TableCell>Fournisseur</TableCell>
                  <TableCell>Centre de coût</TableCell>
                  <TableCell>Montant</TableCell>
                  <TableCell>Échéance</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoiceList.map((invoice) => (
                  <TableRow key={invoice.id} hover onClick={() => openDetails(invoice.id)} sx={{ cursor: 'pointer' }}>
                    <TableCell>{invoice.id}</TableCell>
                    <TableCell>{invoice.fournisseur}</TableCell>
                    <TableCell>{invoice.centreCout}</TableCell>
                    <TableCell>{formatAmount(invoice.montant, invoice.devise)}</TableCell>
                    <TableCell>{formatDate(invoice.echeance)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={statusColor[invoice.statut] || 'default'}
                        label={invoice.statut}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TableActionMenu
                        actions={[
                          {
                            key: 'details',
                            label: 'Ouvrir',
                            icon: <OpenInNewOutlinedIcon fontSize="small" />,
                            onClick: () => openDetails(invoice.id),
                          },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && invoiceList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      Aucune facture disponible.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <InvoiceFormDialog
        open={isDialogOpen}
        mode={dialogMode}
        values={formValues}
        errors={formErrors}
        onClose={closeDialog}
        onChange={handleFormChange}
        onSubmit={handleDialogSubmit}
      />
    </Stack>
  )
}

export default InvoicesPage
