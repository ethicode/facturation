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
import { loadInvoices } from '../services/facturationStorage.js'
import {
  formatAmount,
  formatDate,
  statusColor,
} from '../utils/facturationWorkflow.js'


function FacturationPage() {
  const navigate = useNavigate()
  const [invoiceList, setInvoiceList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState('')

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
          setApiError(error.message || 'Impossible de charger les demandes de facturation.')
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

  const openCreatePage = () => {
    navigate('/facturation/creation')
  }

  const openDetails = (invoiceId) => {
    navigate(`/facturation/${invoiceId}`)
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Facturation"
        subtitle="Pilotage complet des demandes de facturation et de leur validation."
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
              onClick={openCreatePage}
              sx={{
                bgcolor: 'common.black',
                color: 'common.white',
                '&:hover': { bgcolor: 'grey.900' },
              }}
            >
              Nouvelle demande
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
                      Aucune demande de facturation disponible.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

    </Stack>
  )
}

export default FacturationPage
