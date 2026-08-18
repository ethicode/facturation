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
              variant={showMyFacturesOnly ? 'contained' : 'outlined'}
              onClick={() => setShowMyFacturesOnly((prev) => !prev)}
            >
              {showMyFacturesOnly ? 'Toutes les factures' : 'Mes factures'}
            </Button>
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
                  <TableCell>Dernière tâche</TableCell>
                  <TableCell>Dernière tâche assignée</TableCell>
                  <TableCell align="right" sx={{ width: 96, whiteSpace: 'nowrap' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayedFactures.map((facture) => (
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
        </CardContent>
      </Card>

    </Stack>
  )
}

export default FacturationPage
