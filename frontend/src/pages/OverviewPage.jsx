import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import MetricCard from '../components/MetricCard.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { loadDashboard } from '../services/dashboardService.js'
import { loadApproData } from '../services/approStorage.js'
import { loadInvoices } from '../services/facturationStorage.js'

function CircularProgressChart({ value, size = 120, strokeWidth = 12, color = '#2563eb' }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <Box sx={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(148, 163, 184, 0.25)" strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6">{value}%</Typography>
        <Typography variant="caption" color="text.secondary">prêts</Typography>
      </Box>
    </Box>
  )
}

function MiniBarChart({ data }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1)

  return (
    <Box sx={{ width: '100%' }}>
      <svg viewBox="0 0 260 120" width="100%" height={120} role="img" aria-label="Répartition des volumes">
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * 80
          const x = 40 + index * 90
          const y = 95 - barHeight

          return (
            <g key={item.label}>
              <rect x={x} y={y} width={32} height={barHeight} rx={8} fill={index === 0 ? '#2563eb' : '#0f766e'} />
              <text x={x + 16} y={112} textAnchor="middle" fontSize="10" fill="#64748b">
                {item.label}
              </text>
            </g>
          )
        })}
      </svg>
    </Box>
  )
}

function OverviewPage() {
  const [dashboard, setDashboard] = useState({ kpi_metrics: [], missions: [], trace_events: [], budget_lines: [] })
  const [facturationSummary, setFacturationSummary] = useState({ inProgress: 0, readyForPayment: 0 })
  const [approSummary, setApproSummary] = useState({ openTickets: 0, transferredToInvoicing: 0 })
  const [apiError, setApiError] = useState('')

  const workflowProgress = Math.round(
    (facturationSummary.readyForPayment / Math.max(1, facturationSummary.inProgress + facturationSummary.readyForPayment)) * 100,
  )
  const volumeData = [
    { label: 'Demandes', value: facturationSummary.inProgress },
    { label: 'Tickets', value: approSummary.openTickets },
  ]

  useEffect(() => {
    let isMounted = true

    async function fetchDashboard() {
      try {
        const [dashboardData, invoices, approData] = await Promise.all([
          loadDashboard(),
          loadInvoices(),
          loadApproData(),
        ])

        if (isMounted) {
          setDashboard(dashboardData)
          setFacturationSummary({
            inProgress: invoices.filter((invoice) => !['Terminé', 'Clôturé'].includes(invoice.statut)).length,
            readyForPayment: invoices.filter((invoice) => ['Règlement en cours', 'Paiement effectué'].includes(invoice.statut)).length,
          })
          setApproSummary({
            openTickets: approData.tickets.filter((ticket) => !['Terminé', 'Clôturé'].includes(ticket.statut)).length,
            transferredToInvoicing: approData.tickets.filter((ticket) => Boolean(ticket.linkedInvoiceId)).length,
          })
          setApiError('')
        }
      } catch (error) {
        if (isMounted) {
          setApiError(error.message || 'Impossible de charger le tableau de bord.')
        }
      }
    }

    fetchDashboard()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <Stack spacing={2.5}>
      <PageHeader title="Pilotage" />

      {apiError && <Alert severity="error">{apiError}</Alert>}

      <Grid container spacing={2}>
        {dashboard.kpi_metrics.map((metric) => (
          <Grid key={metric.label} size={{ xs: 12, sm: 6, xl: 3 }}>
            <MetricCard {...metric} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} alignItems="stretch">
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ height: '100%', minHeight: { lg: 280 } }}>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6">Cycle validation en cours</Typography>
                <Typography variant="body2" color="text.secondary">
                  68% des dossiers traités en moins de 48h. Objectif cible : 80%.
                </Typography>
                <Divider />
                <Typography variant="body2" color="text.secondary">
                  Le suivi détaillé des opérations facturation et approvisionnement apparaît ci-dessous dans des blocs séparés.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack spacing={2}>
            <Card sx={{ height: '100%', minHeight: { lg: 280 } }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Indicateurs visuels
                </Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Stack alignItems="center" spacing={1.25}>
                      <CircularProgressChart value={workflowProgress} />
                      <Typography variant="body2" textAlign="center">
                        Taux de dossiers prêts au paiement
                      </Typography>
                    </Stack>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Stack spacing={1}>
                      <Typography variant="subtitle2">Volume actif</Typography>
                      <MiniBarChart data={volumeData} />
                      <Typography variant="caption" color="text.secondary">
                        Comparaison des demandes de facturation vs tickets ouverts
                      </Typography>
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1.5 }}>
                  Tendance du traitement
                </Typography>
                <Stack spacing={1.2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Dossiers clôturés</Typography>
                    <Chip size="small" color="success" label={`${facturationSummary.readyForPayment} dossiers`} />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Tickets transférés</Typography>
                    <Chip size="small" color="primary" label={`${approSummary.transferredToInvoicing} tickets`} />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Saisie en attente</Typography>
                    <Chip size="small" color="warning" label={`${approSummary.openTickets} éléments`} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1.5 }}>Facturation</Typography>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Demandes de facturation en cours</Typography>
                  <Chip size="small" color="warning" label={`${facturationSummary.inProgress} éléments`} />
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Dossiers prêts au paiement</Typography>
                  <Chip size="small" color="success" label={`${facturationSummary.readyForPayment} éléments`} />
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1.5 }}>Approvisionnement</Typography>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Tickets ouverts</Typography>
                  <Chip size="small" color="info" label={`${approSummary.openTickets} tickets`} />
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Transferts vers facturation</Typography>
                  <Chip size="small" color="primary" label={`${approSummary.transferredToInvoicing} transferts`} />
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  )
}

export default OverviewPage
