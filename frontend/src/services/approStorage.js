import { apiRequest } from './apiClient.js'
import { approInitialStatus } from '../utils/approWorkflow.js'

const oldToNewStatusMap = {
  Nouveau: 'Saisie de la demande',
  Initialisation: 'Saisie de la demande',
  'Budget valide': 'Traitement service approvisionnement',
  'Budget insuffisant': "Demande d'information complémentaire (Traitement service approvisionnement)",
  'En cours': 'Traitement service approvisionnement',
  Terminé: 'Paiement effectué',
  Clôturé: 'Clôturée',
  'Transfere facturation': 'Transférée en facturation',
}

function normalizeTicket(ticket) {
  const normalizedStatus = oldToNewStatusMap[ticket.statut] || ticket.statut || approInitialStatus

  return {
    ...ticket,
    statut: normalizedStatus,
    history: Array.isArray(ticket.history) ? ticket.history : [],
  }
}

function normalizeState(state) {
  return {
    budgets: Array.isArray(state?.budgets) ? state.budgets : [],
    tickets: Array.isArray(state?.tickets) ? state.tickets.map((ticket) => normalizeTicket(ticket)) : [],
    dirfinHistory: Array.isArray(state?.dirfinHistory) ? state.dirfinHistory : [],
  }
}

export async function loadApproData() {
  const state = await apiRequest('/api/appro')
  return normalizeState(state)
}

export async function loadApproDomainCatalog() {
  const payload = await apiRequest('/api/meta/appro-domains')
  return payload.domains || []
}

export async function saveDirectionBudget(payload) {
  const state = await apiRequest('/api/appro/budgets', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return normalizeState(state)
}

export async function deleteDirectionBudget(directionName, actor = 'DirFin') {
  const params = new URLSearchParams({ actor })
  const result = await apiRequest(`/api/appro/budgets/${encodeURIComponent(directionName)}?${params.toString()}`, {
    method: 'DELETE',
  })

  return {
    state: normalizeState(result.state),
    error: result.error || '',
  }
}

export async function createSupplyTicket(payload) {
  const ticket = await apiRequest('/api/appro/tickets', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return normalizeTicket(ticket)
}

export async function deleteSupplyTicket(ticketId) {
  const state = await apiRequest(`/api/appro/tickets/${encodeURIComponent(ticketId)}`, {
    method: 'DELETE',
  })

  return normalizeState(state)
}

export async function verifyTicketBudget(ticketId, actor = 'Agent Approvisionnement') {
  const params = new URLSearchParams({ actor })
  const state = await apiRequest(`/api/appro/tickets/${encodeURIComponent(ticketId)}/verify?${params.toString()}`, {
    method: 'POST',
  })

  return normalizeState(state)
}

export async function closeTicket(ticketId, actor = 'Agent Approvisionnement') {
  const params = new URLSearchParams({ actor })
  const state = await apiRequest(`/api/appro/tickets/${encodeURIComponent(ticketId)}/close?${params.toString()}`, {
    method: 'POST',
  })

  return normalizeState(state)
}
