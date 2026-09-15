import workflowDefinition from '../workflows/approvisionnementWorkflow.json'

const stepLookup = Object.fromEntries((workflowDefinition.steps || []).map((step) => [step.name, step]))
const orderedSteps = [
  ...(workflowDefinition.timeline?.mainSteps || []),
  ...(workflowDefinition.timeline?.conditionalSteps || []),
]

const fallbackOrderedSteps = (workflowDefinition.steps || []).map((step) => step.name)

export const legacyApproStatusMap = {
  Nouveau: 'Saisie de la demande',
  Initialisation: 'Saisie de la demande',
  'Budget valide': 'Traitement service approvisionnement',
  'Budget insuffisant': "Demande d'information complémentaire (Traitement service approvisionnement)",
  'En cours': 'Traitement service approvisionnement',
  Terminé: 'Paiement effectué',
  Clôturé: 'Clôturée',
  'Transfere facturation': 'Transférée en facturation',
}

// ── Workflow Approvisionnement ────────────────────────────────────────────────
export const approStatuses = Array.from(new Set(orderedSteps.length > 0 ? orderedSteps : fallbackOrderedSteps))
export const approInitialStatus = workflowDefinition.initialStep || approStatuses[0] || 'Saisie de la demande'

export function normalizeApproStatus(status) {
  const normalizedStatus = legacyApproStatusMap[status] || status || approInitialStatus
  return approStatuses.includes(normalizedStatus) ? normalizedStatus : normalizedStatus
}

export function getApproStepLabel(status) {
  return normalizeApproStatus(status)
}

export const approTransitions = (workflowDefinition.transitions || []).reduce((acc, transition) => {
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

const typeToColor = {
  start: 'default',
  task: 'warning',
  conditional: 'info',
  optional: 'info',
  event: 'success',
  end: 'success',
}

export const approStatusColor = approStatuses.reduce((acc, status) => {
  const step = stepLookup[status]
  acc[status] = typeToColor[step?.type] || 'default'
  return acc
}, {})

export const approWorkflowSteps = approStatuses.map((label) => ({
  label,
  description: stepLookup[label]?.returnsTo
    ? `Retour possible vers: ${stepLookup[label].returnsTo}`
    : '',
}))

export function getApproNextStatuses(currentStatus) {
  return (approTransitions[currentStatus] || []).map((transition) => transition.to)
}

export function getApproAllowedTransitionsForRole(currentStatus, role) {
  return (approTransitions[currentStatus] || []).filter((transition) => transition.roles.includes(role))
}
