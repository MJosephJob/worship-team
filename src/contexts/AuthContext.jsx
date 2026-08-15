import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { validateSession, clearSession, login as doLogin } from '../utils/auth'
import { apiFetch } from '../utils/api'
import { requestFCMPermission, saveFCMToken } from '../utils/notifications'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  // Synchronous check — runs before first render, no async timing window
  const [needsSetup, setNeedsSetup] = useState(false)

  useEffect(() => {
    async function init() {
      setLoading(true)
      try {
        const sessionMember = await validateSession()
        setMember(sessionMember)
        requestFCMPermission()
          .then(token => { if (token) saveFCMToken(sessionMember.id, token) })
          .catch(() => {})
      } catch {
        setMember(null)
      } finally {
        setLoading(false)
      }
    }
    if (!needsSetup) init()
    else setLoading(false)
  }, [needsSetup])

  const login = useCallback(async (email, password, staySignedIn) => {
    const data = await doLogin(email, password, staySignedIn)
    setMember(data)
    requestFCMPermission()
      .then(token => { if (token) saveFCMToken(data.id, token) })
      .catch(() => {})
    return data
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setMember(null)
  }, [])

  const refreshMember = useCallback(async () => {
    if (!member?.id) return
    try {
      const data = await apiFetch('getMember', { id: member.id })
      setMember(data)
    } catch {}
  }, [member?.id])

  const updateMemberLocal = useCallback((updates) => {
    setMember(prev => prev ? { ...prev, ...updates } : prev)
  }, [])

  return (
    <AuthContext.Provider value={{ member, loading, needsSetup, setNeedsSetup, login, logout, refreshMember, updateMemberLocal }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
