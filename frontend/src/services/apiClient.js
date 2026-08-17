const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '')
const AUTH_STORAGE_KEY = 'facturation.auth'

function buildUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

async function parseResponse(response) {
  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const payload = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      window.location.replace('/login')
      return null
    }

    const message =
      (isJson && typeof payload?.detail === 'string' && payload.detail) ||
      (typeof payload === 'string' && payload) ||
      'Erreur API'
    throw new Error(message)
  }

  return payload
}

function getStoredAuth() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || 'null')
  } catch {
    return null
  }
}

export async function apiRequest(path, options = {}) {
  const auth = getStoredAuth()
  const response = await fetch(buildUrl(path), {
    headers: {
      'Content-Type': 'application/json',
      ...(auth?.token && !path.startsWith('/api/auth/') ? { Authorization: `Bearer ${auth.token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  })

  return parseResponse(response)
}

export function getApiBaseUrl() {
  return API_BASE_URL
}
