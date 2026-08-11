import CompareArrowsOutlinedIcon from '@mui/icons-material/CompareArrowsOutlined'
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
import { closeTicket, loadApproData, transferTicketToInvoicing } from '../services/approStorage.js'
import { formatAmount } from '../utils/invoiceWorkflow.js'

const statusColor = {
  Initialisation: 'default',
  'En attente de prise en charge': 'warning',
  'En cours': 'info',
  'Transférée en facturation': 'success',
  'Clôturée': 'success',
}

function ApproPage() {
  const navigate = useNavigate()
  const [state, setState] = useState({ budgets: [], tickets: [], dirfinHistory: [] })
  const [apiError, setApiError] = useState('')
  const [transferError, setTransferError] = useState('')

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
          setApiError(error.message || 'Impossible de charger les tickets approvisionnement.')
        }
      }
    }

    fetchApproData()

    return () => {
      isMounted = false
    }
  }, [])

  const handleTransfer = async (ticketId) => {
    try {
      const result = await transferTicketToInvoicing(ticketId)
      setState(result.state)
      setTransferError(result.error || '')
      setApiError('')
    } catch (error) {
      setApiError(error.message || 'Impossible de transférer le ticket.')
    }
  }

  const handleClose = async (ticketId) => {
    try {
      const nextState = await closeTicket(ticketId)
      setState(nextState)
      setTransferError('')
      setApiError('')
    } catch (error) {
      setApiError(error.message || 'Impossible de clôturer le ticket.')
    }
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Approvisionnement"
        subtitle="Liste des tickets, vérification budgétaire et transfert vers la facturation."
      />

      <Alert severity="info">
        Règle du process: DirFin alloue les budgets par direction. Approvisionnement contrôle avant traitement.
        Deux choix sont possibles: fermer le ticket, ou l'envoyer vers la facturation pour poursuivre son workflow.
      </Alert>

      {transferError && <Alert severity="warning">{transferError}</Alert>}
      {apiError && <Alert severity="error">{apiError}</Alert>}

      <Card>
        <CardContent>
          <Stack spacing={1.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5}>
              <Typography variant="h6">Tickets d'approvisionnement</Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/approvisionnement/creation')}
                sx={{
                  bgcolor: 'common.black',
                  color: 'common.white',
                  '&:hover': { bgcolor: 'grey.900' },
                }}
              >
                Nouveau ticket
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
                    <TableCell>Statut</TableCell>
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
                      <TableCell>
                        <Chip
                          size="small"
                          color={statusColor[ticket.statut] || 'default'}
                          label={ticket.statut}
                        />
                      </TableCell>
                      <TableCell>
                        {ticket.linkedInvoiceId ? (
                          <Button
                            size="small"
                            variant="text"
                            endIcon={<OpenInNewOutlinedIcon fontSize="small" />}
                            onClick={() => navigate(`/facturation/${ticket.linkedInvoiceId}`)}
                          >
                            {ticket.linkedInvoiceId}
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
                              key: 'transfer',
                              label: 'Envoyer vers facturation',
                              icon: <CompareArrowsOutlinedIcon fontSize="small" />,
                              disabled: Boolean(ticket.linkedInvoiceId) || ticket.statut === 'Clôturée',
                              onClick: () => handleTransfer(ticket.id),
                            },
                            {
                              key: 'close',
                              label: 'Clôturer',
                              icon: <TaskAltOutlinedIcon fontSize="small" />,
                              disabled: Boolean(ticket.linkedInvoiceId) || ticket.statut === 'Clôturée',
                              onClick: () => handleClose(ticket.id),
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
