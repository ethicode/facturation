import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import MetricCard from '../components/MetricCard.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { loadDashboard } from '../services/dashboardService.js'
import { loadApproData } from '../services/approStorage.js'
import { loadFactures } from '../services/facturationStorage.js'
import { normalizeApproStatus } from '../utils/approWorkflow.js'
import { normalizeFacturationStatus } from '../utils/facturationWorkflow.js'
import approWorkflowDefinition from '../workflows/approvisionnementWorkflow.json'
import facturationWorkflowDefinition from '../workflows/facturationWorkflow.json'

const FINAL_STATUSES = new Set(['Clôturée'])

const DEFAULT_SLA_HOURS = {
  start: 24,
  task: 48,
  conditional: 24,
  optional: 48,
  event: 24,
  end: 1,
}

const STEP_TYPE_COLORS = {
  start: 'default',
  task: 'warning',
  conditional: 'info',
  optional: 'secondary',
  event: 'success',
  end: 'success',
}

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

const PIPELINE_BAR_COLORS = {
  start: '#2563eb',
  task: '#d97706',
  conditional: '#0891b2',
  optional: '#7c3aed',
  event: '#059669',
  end: '#15803d',
}

function PipelineBarChart({ rows }) {
  const maxValue = Math.max(...rows.map((row) => row.count), 1)
  const chartHeight = 300
  const chartWidth = Math.max(760, rows.length * 92)
  const plotTop = 24
  const plotBottom = 96
  const plotLeft = 54
  const plotRight = 20
  const plotHeight = chartHeight - plotTop - plotBottom
  const plotWidth = chartWidth - plotLeft - plotRight
  const yTickCount = 4
  const yAxisMax = Math.max(yTickCount, Math.ceil(maxValue / yTickCount) * yTickCount)
  const columnWidth = plotWidth / rows.length
  const barWidth = Math.min(48, columnWidth * 0.62)

  return (
    <Box
      sx={{
        minWidth: chartWidth,
      }}
    >
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height={chartHeight} role="img" aria-label="Histogramme du pipeline par étape">
        {Array.from({ length: yTickCount + 1 }, (_, index) => {
          const value = (yAxisMax / yTickCount) * index
          const y = plotTop + plotHeight - (value / yAxisMax) * plotHeight

          return (
            <g key={value}>
              <line x1={plotLeft} x2={chartWidth - plotRight} y1={y} y2={y} stroke="#cbd5e1" strokeWidth="1" />
              <text x={plotLeft - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#475569">{value}</text>
            </g>
          )
        })}

        <line x1={plotLeft} x2={plotLeft} y1={plotTop} y2={plotTop + plotHeight} stroke="#64748b" strokeWidth="1.25" />
        <line x1={plotLeft} x2={chartWidth - plotRight} y1={plotTop + plotHeight} y2={plotTop + plotHeight} stroke="#64748b" strokeWidth="1.25" />
        <text x="15" y={plotTop + plotHeight / 2} transform={`rotate(-90 15 ${plotTop + plotHeight / 2})`} textAnchor="middle" fontSize="11" fill="#475569">
          Dossiers
        </text>
        <text x={plotLeft + plotWidth / 2} y={chartHeight - 8} textAnchor="middle" fontSize="11" fill="#475569">
          Étapes du workflow
        </text>

        {rows.map((row, index) => {
          const barHeight = (row.count / yAxisMax) * plotHeight
          const x = plotLeft + index * columnWidth + (columnWidth - barWidth) / 2
          const y = plotTop + plotHeight - barHeight
          const label = row.step.length > 16 ? `${row.step.slice(0, 15)}…` : row.step

          return (
            <g key={row.step}>
              <title>{`${row.step}: ${row.count} dossier(s)`}</title>
              <rect x={x} y={y} width={barWidth} height={barHeight} rx="3" fill={PIPELINE_BAR_COLORS[row.type] || '#2563eb'}>
                <animate attributeName="height" from="0" to={barHeight} dur="240ms" fill="freeze" />
                <animate attributeName="y" from={plotTop + plotHeight} to={y} dur="240ms" fill="freeze" />
              </rect>
              {row.count > 0 && (
                <text x={x + barWidth / 2} y={y - 7} textAnchor="middle" fontSize="12" fontWeight="700" fill="#1e293b">
                  {row.count}
                </text>
              )}
              <text x={x + barWidth / 2} y={plotTop + plotHeight + 13} textAnchor="end" transform={`rotate(-48 ${x + barWidth / 2} ${plotTop + plotHeight + 13})`} fontSize="10" fill="#475569">
                {label}
              </text>
            </g>
          )
        })}
      </svg>
      <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap justifyContent="center" sx={{ pt: 0.5 }}>
        {Object.entries(PIPELINE_BAR_COLORS).map(([type, color]) => (
          <Stack key={type} direction="row" spacing={0.5} alignItems="center">
            <Box sx={{ width: 10, height: 10, bgcolor: color, borderRadius: 0.5 }} />
            <Typography variant="caption" color="text.secondary">{type}</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  )
}

function buildWorkflowArtifacts(definition, workflowType) {
  const steps = definition.steps || []
  const transitions = definition.transitions || []

  const stepLookup = Object.fromEntries(steps.map((step) => [step.name, { ...step, workflowType }]))
  const orderedSteps = [
    ...(definition.timeline?.mainSteps || []),
    ...(definition.timeline?.conditionalSteps || []),
  ]

  const transitionsByFrom = transitions.reduce((acc, transition) => {
    if (!transition.from) {
      return acc
    }

    if (!acc[transition.from]) {
      acc[transition.from] = []
    }

    acc[transition.from].push(transition.to)
    return acc
  }, {})

  return {
    stepLookup,
    orderedSteps,
    transitionsByFrom,
    validStatuses: new Set(steps.map((step) => step.name)),
  }
}

const facturationArtifacts = buildWorkflowArtifacts(facturationWorkflowDefinition, 'facturation')
const approArtifacts = buildWorkflowArtifacts(approWorkflowDefinition, 'approvisionnement')

const unifiedStepOrder = Array.from(new Set([
  ...facturationArtifacts.orderedSteps,
  ...approArtifacts.orderedSteps,
]))

const unifiedStepLookup = {
  ...facturationArtifacts.stepLookup,
  ...approArtifacts.stepLookup,
}

function parseDate(value) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function getHoursDiff(from, to) {
  if (!from || !to) {
    return null
  }

  return Math.max(0, (to.getTime() - from.getTime()) / 36e5)
}

function toHoursLabel(value) {
  if (value === null || value === undefined) {
    return '-'
  }

  if (value < 1) {
    return `${Math.round(value * 60)} min`
  }

  if (value < 24) {
    return `${value.toFixed(1)} h`
  }

  return `${(value / 24).toFixed(1)} j`
}

function getStepType(status) {
  return unifiedStepLookup[status]?.type || 'task'
}

function getStepSlaHours(status) {
  const type = getStepType(status)
  return DEFAULT_SLA_HOURS[type] || 48
}

function getCurrentStepEnteredAt(record) {
  const history = Array.isArray(record.history) ? record.history : []
  const currentStatus = record.status
  const statusNormalizer = record.workflowType === 'facturation' ? normalizeFacturationStatus : normalizeApproStatus

  for (const entry of history) {
    const entryStatus = statusNormalizer(entry?.action)
    if (entryStatus === currentStatus) {
      return parseDate(entry?.at)
    }
  }

  return parseDate(history[history.length - 1]?.at) || null
}

function OverviewPage() {
  const [dashboard, setDashboard] = useState({ kpi_metrics: [], missions: [], trace_events: [], budget_lines: [] })
  const [facturationSummary, setFacturationSummary] = useState({ inProgress: 0, readyForPayment: 0 })
  const [approSummary, setApproSummary] = useState({ openTickets: 0, transferredToInvoicing: 0 })
  const [factures, setFactures] = useState([])
  const [approTickets, setApproTickets] = useState([])
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
        const [dashboardData, facturesData, approData] = await Promise.all([
          loadDashboard(),
          loadFactures(),
          loadApproData(),
        ])

        if (isMounted) {
          setDashboard(dashboardData)
          setFactures(facturesData)
          setApproTickets(approData.tickets)
          setFacturationSummary({
            inProgress: facturesData.filter((facture) => !['Clôturée', 'Rejetée', 'Terminé', 'Clôturé'].includes(facture.statut)).length,
            readyForPayment: facturesData.filter((facture) => ['Règlement en cours', 'Paiement effectué'].includes(facture.statut)).length,
          })
          setApproSummary({
            openTickets: approData.tickets.filter((ticket) => !['Clôturée', 'Terminé', 'Clôturé'].includes(ticket.statut)).length,
            transferredToInvoicing: approData.tickets.filter((ticket) => Boolean(ticket.linkedFactureId)).length,
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

  const analytics = useMemo(() => {
    const now = new Date()
    const records = [
      ...factures.map((facture) => ({
        id: facture.id,
        workflowType: 'facturation',
        status: normalizeFacturationStatus(facture.statut),
        history: facture.history || [],
        dueDate: parseDate(facture.echeance),
        path: `/facturation/${encodeURIComponent(facture.id)}`,
      })),
      ...approTickets.map((ticket) => ({
        id: ticket.id,
        workflowType: 'approvisionnement',
        status: normalizeApproStatus(ticket.statut),
        history: ticket.history || [],
        dueDate: parseDate(ticket.date_fin_souhaitee || ticket.date_debut_souhaitee),
        path: `/approvisionnement/${encodeURIComponent(ticket.id)}`,
      })),
    ]

    const pipelineCounts = Object.fromEntries(unifiedStepOrder.map((step) => [step, 0]))
    const roleQueue = { administrateur: 0, manageur: 0, utilisateur: 0 }
    const lateRecords = []

    records.forEach((record) => {
      if (pipelineCounts[record.status] !== undefined) {
        pipelineCounts[record.status] += 1
      }

      const enteredAt = getCurrentStepEnteredAt(record)
      const ageHours = getHoursDiff(enteredAt, now) ?? 0
      const stepSla = getStepSlaHours(record.status)

      const roles = unifiedStepLookup[record.status]?.roles || []
      if (!FINAL_STATUSES.has(record.status)) {
        roles.forEach((role) => {
          roleQueue[role] = (roleQueue[role] || 0) + 1
        })
      }

      if (!FINAL_STATUSES.has(record.status) && ageHours > stepSla) {
        lateRecords.push({
          ...record,
          ageHours,
          enteredAt,
          slaHours: stepSla,
        })
      }

    })

    const pipelineRows = unifiedStepOrder.map((step) => ({
      step,
      count: pipelineCounts[step] || 0,
      type: getStepType(step),
    }))

    const lateIds = new Set(lateRecords.map((record) => record.id))
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)
    const endOfToday = new Date(startOfToday)
    endOfToday.setDate(endOfToday.getDate() + 1)

    const todayRecords = records.filter((record) => {
      if (FINAL_STATUSES.has(record.status)) {
        return false
      }
      if (record.dueDate && record.dueDate >= startOfToday && record.dueDate < endOfToday) {
        return true
      }
      const enteredAt = getCurrentStepEnteredAt(record)
      return enteredAt ? enteredAt >= startOfToday : false
    })

    return {
      records,
      pipelineRows,
      roleQueue,
      lateRecords,
      lateIds,
      todayRecords,
    }
  }, [factures, approTickets])

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

      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
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

      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1.5 }}>Vue pipeline par étape</Typography>
              <Box sx={{ overflowX: 'auto', pb: 1 }}>
                <PipelineBarChart rows={analytics.pipelineRows} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1.5 }}>File d'attente par rôle</Typography>
              <Stack spacing={1.2}>
                {Object.entries(analytics.roleQueue).map(([role, count]) => (
                  <Box key={role} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">{role}</Typography>
                    <Chip size="small" color="info" label={`${count} actions`} />
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1.5 }}>Alertes SLA</Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                <Chip color="error" label={`${analytics.lateRecords.length} dossier(s) en retard`} />
                <Chip color="warning" label={`${analytics.todayRecords.length} à traiter aujourd'hui`} />
              </Stack>

              <Stack spacing={1.1}>
                {analytics.lateRecords.slice(0, 6).map((record) => (
                  <Box key={`${record.workflowType}-${record.id}`} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5 }}>
                    <Stack spacing={0.25}>
                      <Typography variant="body2" fontWeight={600}>{record.id}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {record.status} - {toHoursLabel(record.ageHours)} / SLA {toHoursLabel(record.slaHours)}
                      </Typography>
                    </Stack>
                    <Button component={RouterLink} to={record.path} size="small" color="error" variant="outlined">Voir</Button>
                  </Box>
                ))}
                {analytics.lateRecords.length === 0 && <Typography variant="body2" color="text.secondary">Aucun dossier en retard.</Typography>}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

    </Stack>
  )
}

export default OverviewPage