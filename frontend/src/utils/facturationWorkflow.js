import { isAdminRole } from './roles.js'
import workflowDefinition from '../workflows/facturationWorkflow.json'

// ── Workflow Facturation ──────────────────────────────────────────────────────
const orderedStatuses = [
  ...(workflowDefinition.timeline?.mainSteps || []),
  ...(workflowDefinition.timeline?.conditionalSteps || []),
]
const fallbackStatuses = (workflowDefinition.steps || []).map((step) => step.name)
const stepLookup = Object.fromEntries((workflowDefinition.steps || []).map((step) => [step.name, step]))

export const mainFacturationStatuses = (workflowDefinition.steps || [])
  .filter((step) => step.main === true)
  .map((step) => step.name)

export const infoRequestStatuses = {
  validation: "Demande d'information complémentaire (Validation métier N+1)",
  appro: "Demande d'information complémentaire (Traitement service approvisionnement)",
  signature: "Demande d'information complémentaire (Signature LAD 1)",
}

export const conditionalFacturationStatuses = workflowDefinition.timeline?.conditionalSteps || []

export const facturationStatuses = Array.from(new Set(orderedStatuses.length > 0 ? orderedStatuses : fallbackStatuses))

const facturationStatusAliases = {
  'Validation N+1': 'Validation métier N+1',
  "Demande d'informations complémentaire": infoRequestStatuses.validation,
  "Demande d'information complémentaire": infoRequestStatuses.validation,
  "Validation LAD 2": 'Signature LAD 2',
  "Validation LAD 3": 'Signature LAD 3',
}

export function normalizeFacturationStatus(status) {
  if (!status) {
    return status
  }

  return facturationStatusAliases[status] || status
}

export function getFacturationStepLabel(status) {
  const normalizedStatus = normalizeFacturationStatus(status)

  if ((normalizedStatus || '').startsWith("Demande d'information complémentaire (")) {
    return "Demande d'information complémentaire"
  }

  return normalizedStatus
}

function normalizeText(value) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function getVisibleFacturationStatuses(currentStatus, history = []) {
  const normalizedCurrentStatus = normalizeFacturationStatus(currentStatus)
  const normalizedEntries = (history || [])
    .map((entry) => normalizeText([entry?.action, entry?.detail, entry?.commentaire].filter(Boolean).join(' ')))

  return facturationStatuses.filter((status) => mainFacturationStatuses.includes(status))
}

const facturationTransitions = (workflowDefinition.transitions || []).reduce((acc, transition) => {
  const from = transition.from
  if (!from) {
    return acc
  }

  if (!acc[from]) {
    acc[from] = []
  }

  acc[from].push({
    to: transition.to,
    label: transition.label || `Passer à ${transition.to}`,
    roles: stepLookup[from]?.roles || [],
  })

  return acc
}, {})

if (!facturationTransitions.Initialisation) {
  facturationTransitions.Initialisation = facturationTransitions[workflowDefinition.initialStep] || []
}
// ── Alias backward-compat (facture = facturation) ─────────────────────────────
/** @deprecated utiliser facturationStatuses */
export const factureStatuses = facturationStatuses

export const userRoles = ['administrateur', 'utilisateur', 'manageur']

export const roleLabels = {
  administrateur: 'Administrateur',
  utilisateur: 'Utilisateur',
  manageur: 'Manageur',
}

export const statusColor = {
  // appro
  'Saisie de la demande': 'default',
  'En attente de prise en charge': 'warning',
  'En cours': 'warning',
  'Terminé': 'success',
  'Clôturé': 'info',
  // facturation
  Initialisation: 'default',
  ...facturationStatuses.reduce((acc, status) => {
    const step = stepLookup[status]
    if (step?.type === 'end' || step?.type === 'event') {
      acc[status] = 'success'
    } else if (step?.type === 'conditional' || step?.type === 'optional') {
      acc[status] = 'info'
    } else if (step?.type === 'task') {
      acc[status] = 'warning'
    } else {
      acc[status] = 'default'
    }
    if (status === 'Rejetée') {
      acc[status] = 'error'
    }
    return acc
  }, {}),
  Terminé: 'success',
  // legacy
  Bloquee: 'error',
}

export function getNextStatuses(currentStatus, workflowType = 'facturation') {
  const transitions = workflowType === 'appro' ? {} : facturationTransitions
  const normalizedStatus = normalizeFacturationStatus(currentStatus)
  return (transitions[normalizedStatus] || []).map((t) => t.to)
}

export function getTransitionActionLabel(nextStatus) {
  const allTransitions = Object.values(facturationTransitions).flat()
  const found = allTransitions.find((t) => t.to === nextStatus)
  return found?.label || `Passer à ${nextStatus}`
}

export function getAllowedTransitionsForRole(currentStatus, role, workflowType = 'facturation') {
  const transitions = workflowType === 'appro' ? {} : facturationTransitions
  const normalizedStatus = normalizeFacturationStatus(currentStatus)
  if (isAdminRole(role)) {
    return transitions[normalizedStatus] || []
  }

  return (transitions[normalizedStatus] || []).filter((t) => t.roles.includes(role))
}

export function formatAmount(amount, currency) {
  const normalizedCurrency = String(currency || '').trim().toUpperCase()
  const numericAmount = Number(amount ?? 0)

  if (normalizedCurrency === 'CFA' || normalizedCurrency === 'XAF') {
    return `${new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 0,
    }).format(numericAmount)} CFA`
  }

  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: normalizedCurrency || 'EUR',
      maximumFractionDigits: 0,
    }).format(numericAmount)
  } catch {
    return `${new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 0,
    }).format(numericAmount)} ${normalizedCurrency || 'EUR'}`.trim()
  }
}

export function formatDate(value) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('fr-FR').format(date)
}

export function formatDateTime(value) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

export function getStatusCounts(factureList) {
  const counts = Object.fromEntries(facturationStatuses.map((status) => [status, 0]))

  factureList.forEach((facture) => {
    const normalizedStatus = normalizeFacturationStatus(facture.statut)
    if (counts[normalizedStatus] !== undefined) {
      counts[normalizedStatus] += 1
    }
  })

  return counts
}
