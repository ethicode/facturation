import { isAdminRole } from './roles.js'

// ── Workflow Approvisionnement ────────────────────────────────────────────────
export const approStatuses = [
  'Saisie de la demande',
  'En attente de prise en charge',
  'En cours',
  'Terminé',
  'Clôturé',
]

const approTransitions = {
  'Saisie de la demande': [
    { to: 'En attente de prise en charge', label: 'Soumettre', roles: ['utilisateur', 'manageur'] },
  ],
  'En attente de prise en charge': [
    { to: 'En cours', label: 'Prendre en charge', roles: ['utilisateur', 'manageur'] },
  ],
  'En cours': [
    { to: 'Terminé', label: 'Terminer', roles: ['manageur'] },
  ],
  'Terminé': [
    { to: 'Clôturé', label: 'Clôturer', roles: ['manageur'] },
  ],
  'Clôturé': [],
}

// ── Workflow Facturation ──────────────────────────────────────────────────────
export const mainFacturationStatuses = [
  'Saisie de la demande',
  'Vérification métier',
  'Validation métier N+1',
  'Traitement service approvisionnement',
  'Signature LAD 1',
  'Règlement en cours',
  'Paiement effectué',
  'Clôturée',
]

export const infoRequestStatuses = {
  validation: "Demande d'information complémentaire (Validation métier N+1)",
  appro: "Demande d'information complémentaire (Traitement service approvisionnement)",
  signature: "Demande d'information complémentaire (Signature LAD 1)",
}

export const conditionalFacturationStatuses = [
  infoRequestStatuses.validation,
  infoRequestStatuses.appro,
  infoRequestStatuses.signature,
  'Signature LAD 2',
  'Signature LAD 3',
]

export const facturationStatuses = [...mainFacturationStatuses, ...conditionalFacturationStatuses]

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
  const visibleStatuses = new Set(mainFacturationStatuses)
  const conditionalKeywords = {
    [infoRequestStatuses.validation]: ['demander des informations complémentaires (validation métier n+1)'],
    [infoRequestStatuses.appro]: ['demander des informations complémentaires (traitement service approvisionnement)'],
    [infoRequestStatuses.signature]: ['demander des informations complémentaires (signature lad 1)'],
    'Signature LAD 2': ['signature lad 2'],
    'Signature LAD 3': ['signature lad 3'],
  }

  const historyText = (history || [])
    .map((entry) => [entry?.action, entry?.detail, entry?.commentaire].filter(Boolean).join(' '))
    .join(' ')

  for (const [step, keywords] of Object.entries(conditionalKeywords)) {
    const haystack = normalizeText(historyText)
    const stepText = normalizeText(step)
    const match = [stepText, ...keywords.map((keyword) => normalizeText(keyword))].some((needle) => haystack.includes(needle))

    if (match) {
      visibleStatuses.add(step)
    }
  }

  if (conditionalFacturationStatuses.includes(normalizedCurrentStatus)) {
    visibleStatuses.add(normalizedCurrentStatus)
  }

  return Array.from(visibleStatuses)
}

const facturationTransitions = {
  Initialisation: [
    {
      to: 'Vérification métier',
      label: 'Soumettre pour vérification métier',
      roles: ['utilisateur', 'manageur'],
    },
  ],
  'Saisie de la demande': [
    {
      to: 'Vérification métier',
      label: 'Soumettre pour vérification métier',
      roles: ['utilisateur', 'manageur'],
    },
  ],
  'Vérification métier': [
    { to: 'Validation métier N+1', label: 'Valider la vérification métier', roles: ['manageur'] },
  ],
  'Validation métier N+1': [
    { to: 'Traitement service approvisionnement', label: 'Valider N+1 (OK)', roles: ['manageur'] },
    {
      to: infoRequestStatuses.validation,
      label: "Demander des informations complémentaires (Validation métier N+1)",
      roles: ['manageur'],
    },
  ],
  [infoRequestStatuses.validation]: [
    { to: 'Validation métier N+1', label: 'Retour à Validation métier N+1', roles: ['manageur'] },
  ],
  'Traitement service approvisionnement': [
    { to: 'Signature LAD 1', label: 'Traitement validé (OK)', roles: ['manageur'] },
    {
      to: infoRequestStatuses.appro,
      label: "Demander des informations complémentaires (Traitement service approvisionnement)",
      roles: ['manageur'],
    },
  ],
  [infoRequestStatuses.appro]: [
    { to: 'Traitement service approvisionnement', label: 'Retour à Traitement service approvisionnement', roles: ['manageur'] },
  ],
  'Signature LAD 1': [
    { to: 'Règlement en cours', label: 'Passer au règlement', roles: ['manageur'] },
    { to: 'Signature LAD 2', label: 'Passer à signature LAD 2', roles: ['manageur'] },
    { to: 'Signature LAD 3', label: 'Passer à signature LAD 3', roles: ['manageur'] },
    {
      to: infoRequestStatuses.signature,
      label: "Demander des informations complémentaires (Signature LAD 1)",
      roles: ['manageur'],
    },
  ],
  [infoRequestStatuses.signature]: [
    { to: 'Signature LAD 1', label: 'Retour à Signature LAD 1', roles: ['manageur'] },
  ],
  'Signature LAD 2': [
    { to: 'Règlement en cours', label: 'Valider la signature LAD 2', roles: ['manageur'] },
  ],
  'Signature LAD 3': [
    { to: 'Règlement en cours', label: 'Valider la signature LAD 3', roles: ['manageur'] },
  ],
  'Règlement en cours': [
    { to: 'Paiement effectué', label: 'Confirmer le paiement (OK)', roles: ['manageur'] },
    { to: 'Rejetée', label: 'Rejeter la demande', roles: ['manageur'] },
  ],
  'Paiement effectué': [],
  Rejetée: [
    { to: 'Clôturée', label: 'Clôturer après rejet', roles: ['manageur'] },
  ],
  Clôturée: [],
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
  'Saisie de la demande': 'default',
  'Vérification métier': 'warning',
  'Validation métier N+1': 'warning',
  [infoRequestStatuses.validation]: 'warning',
  [infoRequestStatuses.appro]: 'warning',
  [infoRequestStatuses.signature]: 'warning',
  'Traitement service approvisionnement': 'warning',
  'Signature LAD 1': 'warning',
  'Signature LAD 2': 'warning',
  'Signature LAD 3': 'warning',
  'Règlement en cours': 'warning',
  'Paiement effectué': 'success',
  Rejetée: 'error',
  Clôturée: 'success',
  Terminé: 'success',
  // legacy
  Bloquee: 'error',
}

export function getNextStatuses(currentStatus, workflowType = 'facturation') {
  const transitions = workflowType === 'appro' ? approTransitions : facturationTransitions
  const normalizedStatus = normalizeFacturationStatus(currentStatus)
  return (transitions[normalizedStatus] || []).map((t) => t.to)
}

export function getTransitionActionLabel(nextStatus) {
  const allTransitions = [...Object.values(approTransitions).flat(), ...Object.values(facturationTransitions).flat()]
  const found = allTransitions.find((t) => t.to === nextStatus)
  return found?.label || `Passer à ${nextStatus}`
}

export function getAllowedTransitionsForRole(currentStatus, role, workflowType = 'facturation') {
  const transitions = workflowType === 'appro' ? approTransitions : facturationTransitions
  const normalizedStatus = normalizeFacturationStatus(currentStatus)
  if (isAdminRole(role)) {
    return transitions[normalizedStatus] || []
  }

  return (transitions[normalizedStatus] || []).filter((t) => t.roles.includes(role))
}

export function formatAmount(amount, currency) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
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
  const counts = {
    'Saisie de la demande': 0,
    'Vérification métier': 0,
    'Validation métier N+1': 0,
    [infoRequestStatuses.validation]: 0,
    [infoRequestStatuses.appro]: 0,
    [infoRequestStatuses.signature]: 0,
    'Traitement service approvisionnement': 0,
    'Signature LAD 1': 0,
    'Signature LAD 2': 0,
    'Signature LAD 3': 0,
    'Règlement en cours': 0,
    'Paiement effectué': 0,
    Rejetée: 0,
    Clôturée: 0,
  }

  factureList.forEach((facture) => {
    const normalizedStatus = normalizeFacturationStatus(facture.statut)
    if (counts[normalizedStatus] !== undefined) {
      counts[normalizedStatus] += 1
    }
  })

  return counts
}
