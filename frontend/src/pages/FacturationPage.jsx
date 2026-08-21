import { useEffect, useState } from 'react'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
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
  TablePagination,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import PageHeader from '../components/PageHeader.jsx'
import { loadAdminUsers } from '../services/adminService.js'
import TableActionMenu from '../components/TableActionMenu.jsx'
import { deleteFacture, loadFactures } from '../services/facturationStorage.js'
import { getStoredAuth } from '../services/authService.js'
import { loadWorkflowMetadata } from '../services/workflowService.js'
import {
  formatAmount,
  formatDate,
  statusColor,
} from '../utils/facturationWorkflow.js'


function FacturationPage() {
  const navigate = useNavigate()
  const [factureList, setFactureList] = useState([])
  const [myWorkflowSteps, setMyWorkflowSteps] = useState([])
  const [workflowAssignments, setWorkflowAssignments] = useState([])
  const [userEmailById, setUserEmailById] = useState({})
  const [showMyFacturesOnly, setShowMyFacturesOnly] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function fetchFactures() {
      try {
        const [data, metadata] = await Promise.all([
          loadFactures(),
          loadWorkflowMetadata(),
        ])

        let emailMap = {}
        try {
          const users = await loadAdminUsers()
          emailMap = users.reduce((acc, user) => {
            if (user?.id && user?.email) {
              acc[user.id] = user.email
            }
            return acc
          }, {})
        } catch {
          emailMap = {}
        }

        const currentUserId = getStoredAuth()?.user?.id || ''
        const userSteps = Array.isArray(metadata?.workflow_assignments)
          ? metadata.workflow_assignments
            .filter(
              (assignment) =>
                assignment?.workflow_type === 'facturation'
                && Array.isArray(assignment?.user_ids)
                && assignment.user_ids.includes(currentUserId),
            )
            .map((assignment) => assignment.step)
          : []

        if (isMounted) {
          setFactureList(data)
          setWorkflowAssignments(Array.isArray(metadata?.workflow_assignments) ? metadata.workflow_assignments : [])
          setUserEmailById(emailMap)
          setMyWorkflowSteps(userSteps)
          setApiError('')
        }
      } catch (error) {
        if (isMounted) {
          setWorkflowAssignments([])
          setUserEmailById({})
          setMyWorkflowSteps([])
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

  const displayedFactures = showMyFacturesOnly
    ? factureList.filter((facture) => myWorkflowSteps.includes(facture.statut))
    : factureList

  const paginatedFactures = displayedFactures.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  )

  const handleChangePage = (_event, nextPage) => {
    setPage(nextPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(displayedFactures.length / rowsPerPage) - 1)
    if (page > maxPage) {
      setPage(maxPage)
    }
  }, [displayedFactures.length, rowsPerPage, page])

  const getAssignedUsersForCurrentStep = (status) => {
    const assignment = workflowAssignments.find(
      (item) => item?.workflow_type === 'facturation' && item?.step === status,
    )

    if (!assignment || !Array.isArray(assignment.user_ids) || assignment.user_ids.length === 0) {
      return ''
    }

    const assignedEmails = assignment.user_ids
      .map((userId) => userEmailById[userId] || '')
      .filter(Boolean)

    return assignedEmails.length > 0 ? assignedEmails.join(', ') : ''
  }

  const handleExportToExcel = () => {
    const headers = [
      'Référence',
      'Fournisseur',
      'Centre de coût',
      'Montant',
      'Échéance',
      'Dernière tâche',
      'Dernière tâche assignée',
    ]
    const escapeCsvValue = (value) => {
      const text = String(value ?? '')
      const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text
      return `"${safeText.replaceAll('"', '""')}"`
    }
    const rows = displayedFactures.map((facture) => [
      facture.id,
      facture.fournisseur,
      facture.centreCout,
      formatAmount(facture.montant, facture.devise),
      formatDate(facture.echeance),
      facture.statut,
      getAssignedUsersForCurrentStep(facture.statut),
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsvValue).join(';'))
      .join('\r\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'facturation.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'flex-start' }} spacing={1.5}>
        <PageHeader
          title="Facturation"
          subtitle="Pilotage complet des demandes de facturation et de leur validation."
        />
        <Button
          variant="outlined"
          onClick={openCreatePage}
          sx={{
            ml: { xs: 0, sm: 'auto' },
            alignSelf: 'flex-start',
            bgcolor: 'common.black',
            color: 'common.white',
            '&:hover': { bgcolor: 'grey.900' },
          }}
        >
          Nouvelle demande
        </Button>
      </Stack>

      <Card>
        <CardContent>
          {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5} sx={{ mb: 2 }}>
            <Button
              variant={showMyFacturesOnly ? 'contained' : 'outlined'}
              onClick={() => setShowMyFacturesOnly((prev) => !prev)}
            >
              {showMyFacturesOnly ? 'Toutes les factures' : 'Mes factures'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<FileDownloadOutlinedIcon />}
              onClick={handleExportToExcel}
              disabled={displayedFactures.length === 0}
              sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
            >
              Télécharger Excel
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
                  <TableCell>Dernière tâche</TableCell>
                  <TableCell>Dernière tâche assignée</TableCell>
                  <TableCell align="right" sx={{ width: 96, whiteSpace: 'nowrap' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedFactures.map((facture) => (
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
                    <TableCell>{getAssignedUsersForCurrentStep(facture.statut)}</TableCell>
                    <TableCell
                      align="right"
                      sx={{ width: 96, whiteSpace: 'nowrap' }}
                      onClick={(event) => event.stopPropagation()}
                    >
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
                {!isLoading && displayedFactures.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      {showMyFacturesOnly
                        ? 'Aucune facture disponible à votre niveau.'
                        : 'Aucune demande de facturation disponible.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={displayedFactures.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Lignes par page"
          />
        </CardContent>
      </Card>

    </Stack>
  )
}

export default FacturationPage
