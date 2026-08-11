import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import {
  Alert,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import { loadApproData } from '../services/approStorage.js'
import { formatAmount } from '../utils/invoiceWorkflow.js'

function BudgetPage() {
  const [state, setState] = useState({ budgets: [], tickets: [], dirfinHistory: [] })
  const [apiError, setApiError] = useState('')

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
          setApiError(error.message || 'Impossible de charger les budgets.')
        }
      }
    }

    fetchApproData()

    return () => {
      isMounted = false
    }
  }, [])

  const criticalCount = useMemo(
    () => state.budgets.filter((line) => (line.engaged / line.allocated) * 100 >= 80).length,
    [state.budgets],
  )

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Planification budgétaire"
        subtitle="Visualiser les enveloppes allouées par DirFin et anticiper les risques de dépassement."
      />

      <Alert icon={<WarningAmberOutlinedIcon fontSize="inherit" />} severity={criticalCount > 0 ? 'warning' : 'success'}>
        Allocation budgétaire gérée par DirFin. {criticalCount > 0
          ? `${criticalCount} direction(s) dépassent 80% de consommation.`
          : 'Aucune direction en zone de risque actuellement.'}
      </Alert>

      {apiError && <Alert severity="error">{apiError}</Alert>}

      <Grid container spacing={2}>
        {state.budgets.map((line) => {
          const consumedPercent = Math.round((line.engaged / line.allocated) * 100)
          const remaining = line.allocated - line.engaged

          return (
            <Grid key={line.direction} size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <Stack spacing={1.25}>
                    <Typography variant="h6">{line.direction}</Typography>
                    <Chip size="small" label={`Allocation ${line.allocatedBy || 'DirFin'}`} variant="outlined" sx={{ width: 'fit-content' }} />
                    <Typography variant="body2" color="text.secondary">
                      Budget alloué: {formatAmount(line.allocated, 'EUR')}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={consumedPercent}
                      color={consumedPercent > 80 ? 'warning' : 'primary'}
                      sx={{ height: 10, borderRadius: 999 }}
                    />
                    <Typography variant="body2">Consommé: {consumedPercent}%</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Reste: {formatAmount(remaining, 'EUR')}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>
    </Stack>
  )
}

export default BudgetPage
