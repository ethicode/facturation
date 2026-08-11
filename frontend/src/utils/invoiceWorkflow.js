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
export const facturationStatuses = [
  'Saisie de la demande',
  'Vérification métier',
  'Validation N+1',
  'Traitement service approvisionnement',
  'Signature LAD 1',
  'Règlement en cours',
  'Paiement effectué',
  'Terminé',
]

const facturationTransitions = {
  'Saisie de la demande': [
    { to: 'Vérification métier', label: 'Soumettre pour vérification', roles: ['utilisateur', 'manageur'] },
  ],
  'Vérification métier': [
    { to: 'Validation N+1', label: 'Valider vérification métier', roles: ['manageur'] },
  ],
  'Validation N+1': [
    { to: 'Traitement service approvisionnement', label: 'Valider N+1', roles: ['manageur'] },
  ],
  'Traitement service approvisionnement': [
    { to: 'Signature LAD 1', label: 'Transmettre pour signature', roles: ['manageur'] },
  ],
  'Signature LAD 1': [
    { to: 'Règlement en cours', label: 'Signer LAD 1', roles: ['manageur'] },
  ],
  'Règlement en cours': [
    { to: 'Paiement effectué', label: 'Confirmer paiement', roles: ['manageur'] },
  ],
  'Paiement effectué': [
    { to: 'Terminé', label: 'Clôturer', roles: ['manageur'] },
  ],
  'Terminé': [],
}

// ── Alias backward-compat (invoice = facturation) ─────────────────────────────
/** @deprecated utiliser facturationStatuses */
export const invoiceStatuses = facturationStatuses

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
  'Saisie de la demande': 'default',
  'Vérification métier': 'warning',
  'Validation N+1': 'warning',
  'Traitement service approvisionnement': 'warning',
  'Signature LAD 1': 'warning',
  'Règlement en cours': 'warning',
  'Paiement effectué': 'success',
  // legacy
  Bloquee: 'error',
}

export function getNextStatuses(currentStatus, workflowType = 'facturation') {
  const transitions = workflowType === 'appro' ? approTransitions : facturationTransitions
  return (transitions[currentStatus] || []).map((t) => t.to)
}

export function getTransitionActionLabel(nextStatus) {
  const allTransitions = [...Object.values(approTransitions).flat(), ...Object.values(facturationTransitions).flat()]
  const found = allTransitions.find((t) => t.to === nextStatus)
  return found?.label || `Passer à ${nextStatus}`
}

export function getAllowedTransitionsForRole(currentStatus, role, workflowType = 'facturation') {
  const transitions = workflowType === 'appro' ? approTransitions : facturationTransitions
  if (role === 'administrateur') {
    return transitions[currentStatus] || []
  }

  return (transitions[currentStatus] || []).filter((t) => t.roles.includes(role))
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

export function getStatusCounts(invoiceList) {
  const counts = {
    'Saisie de la demande': 0,
    'En attente de prise en charge': 0,
    'Validation LAD 1': 0,
    'Validation LAD 2': 0,
    'Validation LAD 3': 0,
    Payee: 0,
    Cloturee: 0,
    Bloquee: 0,
  }

  invoiceList.forEach((invoice) => {
    if (counts[invoice.statut] !== undefined) {
      counts[invoice.statut] += 1
    }
  })

  return counts
}
