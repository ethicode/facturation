import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined'
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
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import TableActionMenu from '../components/TableActionMenu.jsx'
import { loadAdminUsers } from '../services/adminService.js'
import { closeTicket, deleteSupplyTicket, loadApproData } from '../services/approStorage.js'
import { loadWorkflowMetadata } from '../services/workflowService.js'
import { formatAmount } from '../utils/facturationWorkflow.js'
import { approStatusColor, getApproStepLabel } from '../utils/approWorkflow.js'

function ApproPage() {
  const navigate = useNavigate()
  const [state, setState] = useState({ budgets: [], tickets: [], dirfinHistory: [] })
  const [workflowAssignments, setWorkflowAssignments] = useState([])
  const [userEmailById, setUserEmailById] = useState({})
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function fetchApproData() {
      try {
        const [data, metadata] = await Promise.all([
          loadApproData(),
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

        if (isMounted) {
          setState(data)
          setWorkflowAssignments(Array.isArray(metadata?.workflow_assignments) ? metadata.workflow_assignments : [])
          setUserEmailById(emailMap)
          setApiError('')
        }
      } catch (error) {
        if (isMounted) {
          setState({ budgets: [], tickets: [], dirfinHistory: [] })
          setWorkflowAssignments([])
          setUserEmailById({})
          setApiError(error.message || 'Impossible de charger les tickets approvisionnement.')
        }
      }
    }

    fetchApproData()

    return () => {
      isMounted = false
    }
  }, [])

  const getAssignedUsersForCurrentStep = (status) => {
    const normalizedStatus = getApproStepLabel(status)

    const assignment = workflowAssignments.find((item) => {
      const normalizedWorkflowType = String(item?.workflow_type || item?.workflowType || '').trim().toLowerCase()
      const approWorkflowNames = ['approvisionnement', 'appro', 'approvisionnement ticket', 'ticket approvisionnement']
      return (
        approWorkflowNames.includes(normalizedWorkflowType)
        && String(item?.step || '').trim() === String(normalizedStatus || '').trim()
      )
    })

    if (!assignment || !(Array.isArray(assignment.user_ids) || Array.isArray(assignment.userIds)) || (Array.isArray(assignment.user_ids) ? assignment.user_ids.length : assignment.userIds.length) === 0) {
      return ''
    }

    const assignedUserIds = Array.isArray(assignment.user_ids) ? assignment.user_ids : assignment.userIds
    const assignedEmails = assignedUserIds
      .map((userId) => userEmailById[userId] || '')
      .filter(Boolean)

    return assignedEmails.length > 0 ? assignedEmails.join(', ') : ''
  }

  const handleClose = async (ticketId) => {
    try {
      const nextState = await closeTicket(ticketId)
      setState(nextState)
      setApiError('')
    } catch (error) {
      setApiError(error.message || 'Impossible de clôturer le ticket.')
    }
  }

  const handleDelete = async (ticketId) => {
    const confirmed = window.confirm('Supprimer cette demande d\'approvisionnement ?')
    if (!confirmed) {
      return
    }

    try {
      const nextState = await deleteSupplyTicket(ticketId)
      setState(nextState)
      setApiError('')
    } catch (error) {
      setApiError(error.message || 'Impossible de supprimer le ticket.')
    }
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Approvisionnement"
      />

      {apiError && <Alert severity="error">{apiError}</Alert>}

      <Card>
        <CardContent>
          <Stack spacing={1.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">Tickets d'approvisionnement</Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/approvisionnement/creation')}
                sx={{
                  ml: { xs: 0, sm: 'auto' },
                  bgcolor: 'common.black',
                  color: 'common.white',
                  '&:hover': { bgcolor: 'grey.900' },
                }}
              >
                Nouvelle demande
              </Button>
            </Stack>

            <TableContainer>
              <Table size="small" sx={{ minWidth: 1000 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Ticket</TableCell>
                    <TableCell>Direction</TableCell>
                    <TableCell>Objet</TableCell>
                    <TableCell>Montant</TableCell>
                    <TableCell sx={{ width: 240, maxWidth: 240 }}>Dernière tâche</TableCell>
                    <TableCell>Dernière tâche assignée</TableCell>
                    <TableCell>Facturation</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {state.tickets.map((ticket) => (
                    <TableRow
                      key={ticket.id}
                      hover
                      onClick={() => navigate(`/approvisionnement/${ticket.id}`)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{ticket.id}</TableCell>
                      <TableCell>{ticket.direction}</TableCell>
                      <TableCell>{ticket.objet}</TableCell>
                      <TableCell>{formatAmount(ticket.montant, ticket.devise)}</TableCell>
                      <TableCell sx={{ width: 240, maxWidth: 240 }}>
                        <Chip
                          size="small"
                          color={approStatusColor[ticket.statut] || 'default'}
                          label={getApproStepLabel(ticket.statut)}
                          sx={{
                            maxWidth: '100%',
                            height: 'auto',
                            '& .MuiChip-label': {
                              whiteSpace: 'normal',
                              display: 'block',
                              overflowWrap: 'anywhere',
                              lineHeight: 1.25,
                              paddingTop: 0.5,
                              paddingBottom: 0.5,
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell>{getAssignedUsersForCurrentStep(ticket.statut)}</TableCell>
                      <TableCell>
                        {ticket.linkedFactureId ? (
                          <Button
                            size="small"
                            variant="text"
                            endIcon={<OpenInNewOutlinedIcon fontSize="small" />}
                            onClick={() => navigate(`/facturation/${ticket.linkedFactureId}`)}
                          >
                            {ticket.linkedFactureId}
                          </Button>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            En attente
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <TableActionMenu
                          actions={[
                            {
                              key: 'close',
                              label: 'Clôturer',
                              icon: <TaskAltOutlinedIcon fontSize="small" />,
                              disabled: Boolean(ticket.linkedFactureId) || ticket.statut === 'Clôturée',
                              onClick: () => handleClose(ticket.id),
                            },
                            {
                              key: 'delete',
                              label: 'Supprimer',
                              icon: <DeleteOutlineOutlinedIcon fontSize="small" />,
                              onClick: () => handleDelete(ticket.id),
                            },
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </CardContent>
      </Card>

    </Stack>
  )
}

export default ApproPage
