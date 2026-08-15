const APPS_SCRIPT_URL = localStorage.getItem('appsScriptUrl') || import.meta.env.VITE_APPS_SCRIPT_URL || ''
const CACHE_TTLS = {
  // Social data — short TTL
  getAnnouncements:       60 * 1000,
  getPrayerRequests:      60 * 1000,
  getAnsweredPrayers:     2 * 60 * 1000,
  getFacilitatorRoster:   2 * 60 * 1000,
  getAuditionSuggestions: 2 * 60 * 1000,
  // Reference data — medium TTL
  getMembers:             10 * 60 * 1000,
  getAssets:              5 * 60 * 1000,
  getEvents:              5 * 60 * 1000,
  getPrayerPartners:      5 * 60 * 1000,
  getBadges:              10 * 60 * 1000,
  // Config data — long TTL
  getVMContent:           30 * 60 * 1000,
  getOnboardingChecklist: 30 * 60 * 1000,
  getQuizQuestions:       30 * 60 * 1000,
  getSettings:            10 * 60 * 1000,
  getAllSettings:          10 * 60 * 1000,
}
const DEFAULT_TTL = 5 * 60 * 1000

// Read-only actions that are safe to cache in sessionStorage
const CACHEABLE = new Set([
  'getVMContent','getQuizQuestions','getOnboardingChecklist','getMembers',
  'getAssets','getAnnouncements','getPrayerRequests','getAnsweredPrayers',
  'getEvents','getPrayerPartners','getFacilitatorRoster','getAuditionSuggestions',
  'getBadges','getAllSettings','getSettings',
])

function cacheKey(action, payload) {
  return `apicache:${action}:${JSON.stringify(payload)}`
}

function getCached(key) {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const { data, expiry } = JSON.parse(raw)
    if (Date.now() > expiry) { sessionStorage.removeItem(key); return null }
    return data
  } catch { return null }
}

function setCache(key, data, ttl) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, expiry: Date.now() + ttl }))
  } catch {}
}

export function invalidateCache(action) {
  try {
    const prefix = `apicache:${action}:`
    Object.keys(sessionStorage).filter(k => k.startsWith(prefix)).forEach(k => sessionStorage.removeItem(k))
  } catch {}
}

export async function apiFetch(action, payload = {}, { skipCache = false } = {}) {
  const url = localStorage.getItem('appsScriptUrl') || APPS_SCRIPT_URL
  if (!url) throw new Error('Apps Script URL not configured. Please set it in Super Admin settings.')

  const useCache = CACHEABLE.has(action) && !skipCache
  const key = useCache ? cacheKey(action, payload) : null

  if (useCache) {
    const cached = getCached(key)
    if (cached !== null) return cached
  }

  // Inject session token — honour caller-supplied value, fall back to stored token
  const token = payload.sessionToken !== undefined
    ? payload.sessionToken
    : (localStorage.getItem('cbc_session') || null)
  const fullPayload = { ...payload, sessionToken: token }

  const hasPhoto = typeof fullPayload.photoBase64 === 'string' && fullPayload.photoBase64.length > 0
  let response
  try {
    if (hasPhoto) {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...fullPayload }),
      })
    } else {
      const params = new URLSearchParams({ action, ...flattenPayload(fullPayload) })
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      })
    }
  } catch (error) {
    if (
      error instanceof TypeError &&
      error.message.toLowerCase().includes('fetch') &&
      !navigator.onLine
    ) {
      throw new Error(
        'You appear to be offline. Please reconnect and try again.'
      )
    }
    throw error
  }

  if (!response.ok) {
    throw new Error(`Network error: ${response.status}`)
  }

  const data = await response.json()
  if (!data.success) throw new Error(data.error || 'Unknown server error')

  if (useCache) setCache(key, data.data, CACHE_TTLS[action] ?? DEFAULT_TTL)
  return data.data
}

function flattenPayload(obj, prefix = '') {
  const result = {}
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(result, flattenPayload(v, key))
    } else if (Array.isArray(v)) {
      result[key] = JSON.stringify(v)
    } else if (v !== undefined) {
      result[key] = String(v)
    }
  }
  return result
}

export async function apiGet(action, params = {}) {
  const url = localStorage.getItem('appsScriptUrl') || APPS_SCRIPT_URL
  if (!url) throw new Error('Apps Script URL not configured.')

  const query = new URLSearchParams({ action, ...params }).toString()
  const response = await fetch(`${url}?${query}`)
  if (!response.ok) throw new Error(`Network error: ${response.status}`)
  const data = await response.json()
  if (!data.success) throw new Error(data.error || 'Unknown server error')
  return data.data
}

export function setAppsScriptUrl(url) {
  localStorage.setItem('appsScriptUrl', url)
}
