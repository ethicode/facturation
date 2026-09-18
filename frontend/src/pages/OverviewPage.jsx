import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
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
const INFO_REQUEST_PREFIX = "Demande d'information complémentaire ("
const SAVED_FILTERS_STORAGE_KEY = 'overview.savedFilters.v1'

const DEFAULT_SLA_HOURS = {
  start: 24,
  task: 48,
  conditional: 24,
  optional: 48,
  event: 24,
  end: 1,
}

const DEFAULT_STEP_DURATION_HOURS = {
  start: 8,
  task: 24,
  conditional: 16,
  optional: 20,
  event: 4,
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

function formatDate(value) {
  const date = parseDate(value)
  if (!date) {
    return '-'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
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

function median(values) {
  if (!values.length) {
    return 0
  }

  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2
  }

  return sorted[middle]
}

function getStepType(status) {
  return unifiedStepLookup[status]?.type || 'task'
}

function getStepSlaHours(status) {
  const type = getStepType(status)
  return DEFAULT_SLA_HOURS[type] || 48
}

function getDefaultStepDurationHours(status) {
  const type = getStepType(status)
  return DEFAULT_STEP_DURATION_HOURS[type] || 24
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

function buildStatusSequence(record) {
  const history = Array.isArray(record.history) ? record.history : []
  const statusNormalizer = record.workflowType === 'facturation' ? normalizeFacturationStatus : normalizeApproStatus
  const validStatuses = record.workflowType === 'facturation'
    ? facturationArtifacts.validStatuses
    : approArtifacts.validStatuses

  const chronological = [...history]
    .filter((entry) => entry?.at)
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())

  const statuses = []
  for (const entry of chronological) {
    const normalized = statusNormalizer(entry?.action)
    if (validStatuses.has(normalized) && statuses[statuses.length - 1] !== normalized) {
      statuses.push(normalized)
    }
  }

  if (statuses[statuses.length - 1] !== record.status) {
    statuses.push(record.status)
  }

  return statuses
}

function computeShortestPathHours(status, workflowType, averageStepHours) {
  const artifacts = workflowType === 'facturation' ? facturationArtifacts : approArtifacts
  const transitions = artifacts.transitionsByFrom

  const distances = { [status]: 0 }
  const visited = new Set()

  while (true) {
    let currentNode = null
    let currentDistance = Number.POSITIVE_INFINITY

    Object.entries(distances).forEach(([node, distance]) => {
      if (!visited.has(node) && distance < currentDistance) {
        currentNode = node
        currentDistance = distance
      }
    })

    if (!currentNode) {
      break
    }

    if (currentNode === 'Clôturée') {
      return currentDistance
    }

    visited.add(currentNode)
    const neighbors = transitions[currentNode] || []

    neighbors.forEach((neighbor) => {
      const neighborCost = averageStepHours[neighbor] ?? getDefaultStepDurationHours(neighbor)
      const nextDistance = currentDistance + Math.max(1, neighborCost)
      if (nextDistance < (distances[neighbor] ?? Number.POSITIVE_INFINITY)) {
        distances[neighbor] = nextDistance
      }
    })
  }

  return null
}

function parseFilter(value) {
  if (!value) {
    return []
  }

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function OverviewPage() {
  const [dashboard, setDashboard] = useState({ kpi_metrics: [], missions: [], trace_events: [], budget_lines: [] })
  const [facturationSummary, setFacturationSummary] = useState({ inProgress: 0, readyForPayment: 0 })
  const [approSummary, setApproSummary] = useState({ openTickets: 0, transferredToInvoicing: 0 })
  const [factures, setFactures] = useState([])
  const [approTickets, setApproTickets] = useState([])
  const [activeQuickFilter, setActiveQuickFilter] = useState('all')
  const [savedFilters, setSavedFilters] = useState(() => parseFilter(window.localStorage.getItem(SAVED_FILTERS_STORAGE_KEY)))
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
    const stepAgeMap = {}
    const backwardCounts = {}
    const lateRecords = []

    records.forEach((record) => {
      if (pipelineCounts[record.status] !== undefined) {
        pipelineCounts[record.status] += 1
      }

      const enteredAt = getCurrentStepEnteredAt(record)
      const ageHours = getHoursDiff(enteredAt, now) ?? 0
      const stepSla = getStepSlaHours(record.status)

      if (!stepAgeMap[record.status]) {
        stepAgeMap[record.status] = []
      }
      stepAgeMap[record.status].push(ageHours)

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

      const sequence = buildStatusSequence(record)
      for (let index = 0; index < sequence.length - 1; index += 1) {
        const from = sequence[index]
        const to = sequence[index + 1]

        if (to.startsWith(INFO_REQUEST_PREFIX)) {
          if (!backwardCounts[from]) {
            backwardCounts[from] = { transitions: 0, ids: new Set() }
          }
          backwardCounts[from].transitions += 1
          backwardCounts[from].ids.add(record.id)
        }
      }
    })

    const pipelineRows = unifiedStepOrder.map((step) => ({
      step,
      count: pipelineCounts[step] || 0,
      type: getStepType(step),
    }))

    const bottlenecks = Object.entries(stepAgeMap)
      .map(([step, values]) => {
        const average = values.reduce((sum, value) => sum + value, 0) / values.length
        return {
          step,
          avg: average,
          median: median(values),
          max: Math.max(...values),
          count: values.length,
        }
      })
      .sort((a, b) => b.avg - a.avg)

    const backwardRows = Object.entries(backwardCounts)
      .map(([origin, value]) => ({
        origin,
        transitions: value.transitions,
        dossiers: value.ids.size,
      }))
      .sort((a, b) => b.transitions - a.transitions)

    const averageStepHours = bottlenecks.reduce((acc, item) => {
      acc[item.step] = item.avg
      return acc
    }, {})

    const predictions = records
      .filter((record) => !FINAL_STATUSES.has(record.status))
      .map((record) => {
        const enteredAt = getCurrentStepEnteredAt(record)
        const ageHours = getHoursDiff(enteredAt, now) ?? 0
        const expectedCurrentDuration = averageStepHours[record.status] ?? getDefaultStepDurationHours(record.status)
        const currentRemaining = Math.max(0, expectedCurrentDuration - ageHours)
        const futurePathHours = computeShortestPathHours(record.status, record.workflowType, averageStepHours)
        const totalRemainingHours = futurePathHours === null
          ? null
          : currentRemaining + futurePathHours

        return {
          ...record,
          ageHours,
          enteredAt,
          estimatedClosure: totalRemainingHours === null
            ? null
            : new Date(now.getTime() + totalRemainingHours * 36e5),
        }
      })
      .sort((a, b) => {
        if (!a.estimatedClosure && !b.estimatedClosure) {
          return 0
        }
        if (!a.estimatedClosure) {
          return 1
        }
        if (!b.estimatedClosure) {
          return -1
        }
        return a.estimatedClosure.getTime() - b.estimatedClosure.getTime()
      })

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
      bottlenecks,
      roleQueue,
      lateRecords,
      lateIds,
      backwardRows,
      predictions,
      todayRecords,
    }
  }, [factures, approTickets])

  const filteredRecords = useMemo(() => {
    if (activeQuickFilter === 'blocked') {
      return analytics.records.filter((record) => analytics.lateIds.has(record.id))
    }

    if (activeQuickFilter === 'today') {
      const todayIds = new Set(analytics.todayRecords.map((record) => record.id))
      return analytics.records.filter((record) => todayIds.has(record.id))
    }

    return analytics.records.filter((record) => !FINAL_STATUSES.has(record.status))
  }, [analytics, activeQuickFilter])

  const handleSaveCurrentFilter = () => {
    if (savedFilters.includes(activeQuickFilter)) {
      return
    }

    const updated = [...savedFilters, activeQuickFilter]
    setSavedFilters(updated)
    window.localStorage.setItem(SAVED_FILTERS_STORAGE_KEY, JSON.stringify(updated))
  }

  const handleExportCsv = () => {
    const header = ['ID', 'Workflow', 'Statut', 'Date echeance', 'Lien']
    const rows = filteredRecords.map((record) => [
      record.id,
      record.workflowType,
      record.status,
      record.dueDate ? record.dueDate.toISOString() : '',
      record.path,
    ])

    const csvContent = [header, ...rows]
      .map((line) => line.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.setAttribute('download', `vue-globale-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

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

      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={1.5}>
                <Typography variant="h6">Actions globales rapides</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button size="small" variant={activeQuickFilter === 'all' ? 'contained' : 'outlined'} onClick={() => setActiveQuickFilter('all')}>
                    Tous
                  </Button>
                  <Button size="small" variant={activeQuickFilter === 'blocked' ? 'contained' : 'outlined'} onClick={() => setActiveQuickFilter('blocked')}>
                    Dossiers bloqués
                  </Button>
                  <Button size="small" variant={activeQuickFilter === 'today' ? 'contained' : 'outlined'} onClick={() => setActiveQuickFilter('today')}>
                    A traiter aujourd'hui
                  </Button>
                  <Button size="small" variant="outlined" onClick={handleSaveCurrentFilter}>
                    Enregistrer filtre actif
                  </Button>
                  <Button size="small" variant="outlined" onClick={handleExportCsv}>
                    Export CSV
                  </Button>
                </Stack>
              </Stack>

              {savedFilters.length > 0 && (
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1.5 }}>
                  {savedFilters.map((filterKey) => (
                    <Chip
                      key={filterKey}
                      clickable
                      color={activeQuickFilter === filterKey ? 'primary' : 'default'}
                      label={filterKey === 'blocked' ? 'Filtre enregistré: bloqués' : filterKey === 'today' ? "Filtre enregistré: aujourd'hui" : 'Filtre enregistré: tous'}
                      onClick={() => setActiveQuickFilter(filterKey)}
                    />
                  ))}
                </Stack>
              )}

              <Stack spacing={1.25} sx={{ mt: 2 }}>
                {filteredRecords.slice(0, 8).map((record) => (
                  <Box key={`${record.workflowType}-${record.id}`} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5 }}>
                    <Stack spacing={0.25}>
                      <Typography variant="body2" fontWeight={600}>{record.id}</Typography>
                      <Typography variant="caption" color="text.secondary">{record.workflowType} - {record.status}</Typography>
                    </Stack>
                    <Button component={RouterLink} to={record.path} size="small" variant="text">Ouvrir</Button>
                  </Box>
                ))}
                {filteredRecords.length === 0 && (
                  <Typography variant="body2" color="text.secondary">Aucun dossier pour ce filtre.</Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1.5 }}>Vue pipeline par étape</Typography>
              <Stack spacing={1.1}>
                {analytics.pipelineRows.map((row) => (
                  <Box key={row.step} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip size="small" label={row.type} color={STEP_TYPE_COLORS[row.type] || 'default'} variant="outlined" />
                      <Typography variant="body2">{row.step}</Typography>
                    </Stack>
                    <Chip size="small" color="primary" label={`${row.count}`} />
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
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
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1.5 }}>Goulots d'étranglement</Typography>
              <Stack spacing={1.25}>
                {analytics.bottlenecks.slice(0, 6).map((item) => (
                  <Box key={item.step}>
                    <Typography variant="body2" fontWeight={600}>{item.step}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Moyenne {toHoursLabel(item.avg)} - Médiane {toHoursLabel(item.median)} - Max {toHoursLabel(item.max)}
                    </Typography>
                  </Box>
                ))}
                {analytics.bottlenecks.length === 0 && <Typography variant="body2" color="text.secondary">Pas assez de données.</Typography>}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
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

      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1.5 }}>Taux de retour en arrière</Typography>
              <Stack spacing={1.1}>
                {analytics.backwardRows.map((row) => (
                  <Box key={row.origin} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">{row.origin}</Typography>
                    <Stack direction="row" spacing={1}>
                      <Chip size="small" color="warning" label={`${row.transitions} retours`} />
                      <Chip size="small" color="info" label={`${row.dossiers} dossier(s)`} />
                    </Stack>
                  </Box>
                ))}
                {analytics.backwardRows.length === 0 && <Typography variant="body2" color="text.secondary">Aucun retour détecté.</Typography>}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1.5 }}>Prévision de clôture</Typography>
              <Stack spacing={1.1}>
                {analytics.predictions.slice(0, 10).map((prediction) => (
                  <Box key={`${prediction.workflowType}-${prediction.id}`} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5 }}>
                    <Stack spacing={0.25}>
                      <Typography variant="body2" fontWeight={600}>{prediction.id}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {prediction.status} - Entrée étape: {formatDate(prediction.enteredAt?.toISOString())}
                      </Typography>
                    </Stack>
                    <Stack alignItems="flex-end" spacing={0.4}>
                      <Chip
                        size="small"
                        color={prediction.estimatedClosure ? 'success' : 'default'}
                        label={prediction.estimatedClosure ? `Clôture estimée: ${formatDate(prediction.estimatedClosure.toISOString())}` : 'Prévision indisponible'}
                      />
                      <Button component={RouterLink} to={prediction.path} size="small" variant="text">Ouvrir</Button>
                    </Stack>
                  </Box>
                ))}
                {analytics.predictions.length === 0 && <Typography variant="body2" color="text.secondary">Aucune prévision disponible.</Typography>}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  )
}

export default OverviewPage