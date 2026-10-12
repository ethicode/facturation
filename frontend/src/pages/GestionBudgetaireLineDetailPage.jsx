import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import {
  Alert,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
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
import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { loadApproData } from '../services/approStorage.js'
import { loadMissions } from '../services/dashboardService.js'
import { formatAmount } from '../utils/facturationWorkflow.js'

function parseMissionAmount(mission) {
  const recordedAmount = Number(mission.budget_consumed)
  if (Number.isFinite(recordedAmount) && recordedAmount > 0) {
    return recordedAmount
  }

  const rawAmount = String(mission.montant_estimatif || '')
    .replace(/\s/g, '')
    .replace(/CFA|XAF|EUR/gi, '')
    .replace(/[^\d,.-]/g, '')
    .replace(',', '.')
  const parsedAmount = Number(rawAmount)
  return Number.isFinite(parsedAmount) ? parsedAmount : 0
}

function formatConsumptionDate(mission) {
  const dateValue = mission.budget_consumed_at || mission.date_depart
  if (!dateValue) return '—'
  const date = new Date(dateValue)
  return Number.isNaN(date.getTime())
    ? dateValue
    : date.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: mission.budget_consumed_at ? 'short' : undefined })
}

function GestionBudgetaireLineDetailPage() {
  const { direction, itemId } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [missions, setMissions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    let isMounted = true

    Promise.all([loadApproData(), loadMissions()])
      .then(([approData, missionList]) => {
        if (!isMounted) return

        const budgetItem = approData.budgetItems.find(
          (line) => line.id === itemId && line.direction === direction,
        ) || null
        const relatedMissions = (Array.isArray(missionList) ? missionList : [])
          .filter((mission) => mission.budget_item_id === itemId || (
            !mission.budget_item_id
            && budgetItem
            && mission.budget_concerne === `${budgetItem.direction} — ${budgetItem.label}`
          ))
          .sort((left, right) => {
            const leftDate = new Date(left.budget_consumed_at || left.date_depart || 0).getTime()
            const rightDate = new Date(right.budget_consumed_at || right.date_depart || 0).getTime()
            return rightDate - leftDate
          })

        setItem(budgetItem)
        setMissions(relatedMissions)
        setApiError('')
      })
      .catch((error) => {
        if (isMounted) setApiError(error.message || 'Impossible de charger l’historique de consommation.')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [direction, itemId])

  const consumed = missions.reduce((sum, mission) => sum + parseMissionAmount(mission), 0)
  const remaining = item ? item.allocated - consumed : 0

  return (
    <Stack spacing={2.5}>
      <Button
        variant="text"
        startIcon={<ArrowBackOutlinedIcon />}
        onClick={() => navigate(`/gestion-budgetaire/${encodeURIComponent(direction)}`)}
        sx={{ alignSelf: 'flex-start' }}
      >
        Retour au budget de la direction
      </Button>
      <PageHeader title={item ? item.label : 'Historique de consommation'} subtitle={`Direction : ${direction}`} />

      {isLoading ? (
        <Typography color="text.secondary">Chargement de l’historique...</Typography>
      ) : apiError ? (
        <Alert severity="error">{apiError}</Alert>
      ) : !item ? (
        <Alert severity="warning">Cette ligne budgétaire est introuvable.</Alert>
      ) : (
        <>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6">Synthèse de consommation</Typography>
                <Divider />
                <Grid container spacing={2}>
                  {[
                    ['Budget alloué', item.allocated],
                    ['Total consommé', consumed],
                    ['Solde disponible', remaining],
                  ].map(([label, amount]) => (
                    <Grid key={label} size={{ xs: 12, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                      <Typography variant="h6">{formatAmount(amount, 'XAF')}</Typography>
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Stack spacing={1.5}>
                <Typography variant="h6">Historique des missions imputées</Typography>
                <TableContainer>
                  <Table size="small" sx={{ minWidth: 800 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date d’imputation</TableCell>
                        <TableCell>Mission</TableCell>
                        <TableCell>Objet</TableCell>
                        <TableCell>Destination</TableCell>
                        <TableCell align="right">Montant imputé</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {missions.map((mission) => (
                        <TableRow
                          key={mission.code}
                          hover
                          onClick={() => navigate(`/frais-missions/${encodeURIComponent(mission.code)}`)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatConsumptionDate(mission)}</TableCell>
                          <TableCell>{mission.code}</TableCell>
                          <TableCell>{mission.objet_mission}</TableCell>
                          <TableCell>{mission.destination}</TableCell>
                          <TableCell align="right">{formatAmount(parseMissionAmount(mission), 'XAF')}</TableCell>
                        </TableRow>
                      ))}
                      {missions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                            Aucune mission imputée sur cette ligne budgétaire.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Stack>
            </CardContent>
          </Card>
        </>
      )}
    </Stack>
  )
}

export default GestionBudgetaireLineDetailPage