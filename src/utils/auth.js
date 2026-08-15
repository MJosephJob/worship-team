import { sha256 } from './sha256'
import { apiFetch } from './api'

const SESSION_KEY = 'cbc_session'
const SESSION_EXPIRY_KEY = 'cbc_session_expiry'
const STAY_SIGNED_IN_KEY = 'cbc_stay'

export async function login(email, password, staySignedIn = false) {
  const hash = await sha256(password)
  const data = await apiFetch('authenticateUser', { email, passwordHash: hash })
  const expiry = staySignedIn
    ? Date.now() + 7 * 24 * 60 * 60 * 1000
    : Date.now() + 7 * 24 * 60 * 60 * 1000
  localStorage.setItem(SESSION_KEY, data.sessionToken)
  localStorage.setItem(SESSION_EXPIRY_KEY, String(expiry))
  localStorage.setItem(STAY_SIGNED_IN_KEY, staySignedIn ? '1' : '0')
  localStorage.setItem('cbc_member', JSON.stringify(data))
  return data
}

export async function validateSession() {
  const token = localStorage.getItem(SESSION_KEY)
  const expiry = Number(localStorage.getItem(SESSION_EXPIRY_KEY) || 0)
  if (!token || Date.now() > expiry) {
    clearSession()
    return null
  }
  try {
    const data = await apiFetch('validateSession', { token })
    return data
  } catch {
    const token = localStorage.getItem(SESSION_KEY)
    const expiry = Number(localStorage.getItem(SESSION_EXPIRY_KEY) || 0)
    if (token && Date.now() < expiry) {
      try {
        const stored = localStorage.getItem('cbc_member')
        if (stored) return JSON.parse(stored)
      } catch { }
    }
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(SESSION_EXPIRY_KEY)
  localStorage.removeItem('cbc_member')
  localStorage.removeItem(STAY_SIGNED_IN_KEY)
}

export function getSessionToken() {
  return localStorage.getItem(SESSION_KEY)
}

export async function changePassword(memberId, currentPassword, newPassword) {
  const currentHash = await sha256(currentPassword)
  const newHash = await sha256(newPassword)
  return apiFetch('changePassword', { memberId, currentHash, newHash })
}

export async function requestPasswordReset(email) {
  return apiFetch('requestPasswordReset', { email })
}
