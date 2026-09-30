import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import {
  Alert,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { loadApproData } from '../services/approStorage.js'
import { formatAmount } from '../utils/facturationWorkflow.js'

function GestionBudgetaireDetailPage() {
  const { direction } = useParams()
  const navigate = useNavigate()
  const [budget, setBudget] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    setBudget(null)

    loadApproData()
      .then((data) => {
        if (isMounted) {
          setBudget(data.budgets.find((line) => line.direction === direction) || null)
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

  return (
    <Stack spacing={2.5}>
      <Button
        variant="text"
        startIcon={<ArrowBackOutlinedIcon />}
        onClick={() => navigate('/gestion-budgetaire')}
        sx={{ alignSelf: 'flex-start' }}
      >
        Retour à la gestion budgétaire
      </Button>
      <PageHeader title={`Budget — ${direction}`} subtitle="Détail de l'allocation budgétaire" />

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
                  ['Alloué par', budget.allocatedBy || 'DirFin'],
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
                <LinearProgress variant="determinate" value={Math.min(100, Math.max(0, engagementRate))} />
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  )
}

export default GestionBudgetaireDetailPage