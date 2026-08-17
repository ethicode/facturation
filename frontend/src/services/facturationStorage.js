import { apiRequest } from './apiClient.js'

function ensureFactureHistory(facture) {
  if (Array.isArray(facture.history) && facture.history.length > 0) {
    return facture
  }

  return {
    ...facture,
    history: [
      {
        at: new Date().toISOString(),
        actor: 'Systeme',
        role: 'utilisateur',
        action: 'Historique initialise',
      },
    ],
  }
}

function normalizeFactures(factureList) {
  return Array.isArray(factureList) ? factureList.map((facture) => ensureFactureHistory(facture)) : []
}

export async function loadFactures() {
  const factures = await apiRequest('/api/factures')
  return normalizeFactures(factures)
}

export async function loadFacture(factureId) {
  const facture = await apiRequest(`/api/factures/${encodeURIComponent(factureId)}`)
  return ensureFactureHistory(facture)
}

export async function createFacture(payload) {
  const created = await apiRequest('/api/factures', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return ensureFactureHistory(created)
}

export async function deleteFacture(factureId) {
  const factures = await apiRequest(`/api/factures/${encodeURIComponent(factureId)}`, {
    method: 'DELETE',
  })

  return normalizeFactures(factures)
}

export async function updateFactureStatus(factureId, nextStatus, metadata = {}) {
  const {
    actor = 'Systeme Workflow',
    email = '',
    role = 'utilisateur',
    actionLabel = `Statut passe a ${nextStatus}`,
    commentaire = '',
    piecesJointes = [],
  } = metadata

  const updatedFacture = await apiRequest(`/api/factures/${factureId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      next_status: nextStatus,
      actor,
      email,
      role,
      action_label: actionLabel,
      commentaire,
      piecesJointes,
    }),
  })

  return ensureFactureHistory(updatedFacture)
}
