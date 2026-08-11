import { apiRequest } from './apiClient.js'

const AUTH_STORAGE_KEY = 'facturation.auth'

export function getStoredAuth() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || 'null')
  } catch {
    return null
  }
}

export function setStoredAuth(auth) {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth))
}

export function clearStoredAuth() {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.removeItem(AUTH_STORAGE_KEY)
}

export async function login(username, password) {
  const data = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })

  setStoredAuth({ token: data.access_token, user: data.user })
  return data
}

export async function fetchCurrentUser() {
  const auth = getStoredAuth()
  if (!auth?.token) {
    return null
  }

  try {
    const user = await apiRequest('/api/auth/me')
    setStoredAuth({ ...auth, user })
    return user
  } catch {
    clearStoredAuth()
    return null
  }
}

export function logout() {
  clearStoredAuth()
}

export function isAuthenticated() {
  return Boolean(getStoredAuth()?.token)
}
