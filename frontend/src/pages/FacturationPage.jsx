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
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import PageHeader from '../components/PageHeader.jsx'
import TableActionMenu from '../components/TableActionMenu.jsx'
import { deleteFacture, loadFactures } from '../services/facturationStorage.js'
import {
  formatAmount,
  formatDate,
  statusColor,
} from '../utils/facturationWorkflow.js'


function FacturationPage() {
  const navigate = useNavigate()
  const [factureList, setFactureList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function fetchFactures() {
      try {
        const data = await loadFactures()
        if (isMounted) {
          setFactureList(data)
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

    fetchFactures()

    return () => {
      isMounted = false
    }
  }, [])

  const openCreatePage = () => {
    navigate('/facturation/creation')
  }

  const openDetails = (factureId) => {
    navigate(`/facturation/${factureId}`)
  }

  const handleDelete = async (factureId) => {
    const confirmed = window.confirm('Supprimer cette demande de facturation ?')
    if (!confirmed) {
      return
    }

    try {
      const nextFactures = await deleteFacture(factureId)
      setFactureList(nextFactures)
      setApiError('')
    } catch (error) {
      setApiError(error.message || 'Impossible de supprimer la demande de facturation.')
    }
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
            <Button
              variant="outlined"
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
                {factureList.map((facture) => (
                  <TableRow key={facture.id} hover onClick={() => openDetails(facture.id)} sx={{ cursor: 'pointer' }}>
                    <TableCell>{facture.id}</TableCell>
                    <TableCell>{facture.fournisseur}</TableCell>
                    <TableCell>{facture.centreCout}</TableCell>
                    <TableCell>{formatAmount(facture.montant, facture.devise)}</TableCell>
                    <TableCell>{formatDate(facture.echeance)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={statusColor[facture.statut] || 'default'}
                        label={facture.statut}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TableActionMenu
                        actions={[
                          {
                            key: 'details',
                            label: 'Ouvrir',
                            icon: <OpenInNewOutlinedIcon fontSize="small" />,
                            onClick: () => openDetails(facture.id),
                          },
                          {
                            key: 'delete',
                            label: 'Supprimer',
                            icon: <DeleteOutlineOutlinedIcon fontSize="small" />,
                            onClick: () => handleDelete(facture.id),
                          },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && factureList.length === 0 && (
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
