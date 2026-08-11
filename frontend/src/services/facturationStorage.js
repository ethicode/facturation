import { apiRequest } from './apiClient.js'

function ensureInvoiceHistory(invoice) {
  if (Array.isArray(invoice.history) && invoice.history.length > 0) {
    return invoice
  }

  return {
    ...invoice,
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

function normalizeInvoices(invoiceList) {
  return Array.isArray(invoiceList) ? invoiceList.map((invoice) => ensureInvoiceHistory(invoice)) : []
}

export async function loadInvoices() {
  const invoices = await apiRequest('/api/invoices')
  return normalizeInvoices(invoices)
}

export async function createInvoice(payload) {
  const created = await apiRequest('/api/invoices', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return ensureInvoiceHistory(created)
}

export async function updateInvoiceStatus(invoiceId, nextStatus, metadata = {}) {
  const {
    actor = 'Systeme Workflow',
    role = 'utilisateur',
    actionLabel = `Statut passe a ${nextStatus}`,
  } = metadata

  const updatedInvoice = await apiRequest(`/api/invoices/${invoiceId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      next_status: nextStatus,
      actor,
      role,
      action_label: actionLabel,
    }),
  })

  return ensureInvoiceHistory(updatedInvoice)
}
