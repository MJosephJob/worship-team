import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { apiFetch, invalidateCache } from '../utils/api'
import { useAuth } from './AuthContext'
import { useApp } from './AppContext'
import { useNavigate } from 'react-router-dom'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const { member } = useAuth()
  const { toast } = useApp()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const intervalRef = useRef(null)
  const knownIdsRef = useRef(null) // null = first load not yet done
  const errorCountRef = useRef(0)
  const lastSeenTsRef = useRef({})

  const fetchNotifications = useCallback(async () => {
    if (!member?.id) return
    try {
      const data = await apiFetch('getNotifications', { memberId: member.id })
      const rawList = Array.isArray(data) ? data : (data?.notifications || [])
      const timestamps = Array.isArray(data) ? {} : (data?.timestamps || {})
      const list = Array.isArray(rawList) ? rawList : []
      errorCountRef.current = 0
      setNotifications(list)
      setUnreadCount(list.filter(n => !n.isRead).length)

      if (timestamps && typeof timestamps === 'object') {
        const sheetToAction = {
          'Announcements':       'getAnnouncements',
          'PrayerRequests':      'getPrayerRequests',
          'AnsweredPrayers':     'getAnsweredPrayers',
          'FacilitatorRoster':   'getFacilitatorRoster',
          'Assets':              'getAssets',
          'MaintenanceLog':      'getAssets',
          'Events':              'getEvents',
          'Attendance':          'getAttendance',
          'AuditionSuggestions': 'getAuditionSuggestions',
          'PrayerPartners':      'getPrayerPartners',
          'Members':             'getMembers',
        }

        Object.keys(timestamps).forEach(function(tsKey) {
          const sheetName = tsKey.replace('cacheTs_', '')
          const action = sheetToAction[sheetName]
          if (!action) return

          const serverTs = new Date(timestamps[tsKey]).getTime()
          const lastSeen = lastSeenTsRef.current[tsKey] || 0

          if (serverTs > lastSeen) {
            if (lastSeen > 0) {
              invalidateCache(action)
            }
            lastSeenTsRef.current[tsKey] = serverTs
          }
        })
      }

      const incomingIds = new Set(list.map(n => n.id))

      if (knownIdsRef.current === null) {
        knownIdsRef.current = incomingIds
      } else {
        list.forEach(n => {
          if (!knownIdsRef.current.has(n.id)) {
            const body = n.body ? (n.body.length > 60 ? n.body.slice(0, 60) + '…' : n.body) : ''
            toast(n.title, 'info', 5000, {
              subtitle: body,
              onClick: () => navigate(n.linkTo || '/notifications'),
            })
          }
        })
        knownIdsRef.current = incomingIds
      }
    } catch {
      errorCountRef.current += 1
    }
  }, [member?.id, toast, navigate])

  useEffect(() => {
    if (!member?.id) {
      setNotifications([])
      setUnreadCount(0)
      knownIdsRef.current = null
      errorCountRef.current = 0
      return
    }
    fetchNotifications()
    intervalRef.current = setInterval(() => {
      if (errorCountRef.current >= 3) {
        // in backoff — skip tick; reset after 8 skipped ticks (~4 min)
        if (errorCountRef.current >= 11) errorCountRef.current = 0
        else errorCountRef.current += 1
        return
      }
      fetchNotifications()
    }, 30000)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchNotifications()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      clearInterval(intervalRef.current)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [member?.id, fetchNotifications])

  const markAllRead = useCallback(async () => {
    if (!member?.id) return
    try {
      await apiFetch('markNotificationsRead', { memberId: member.id, all: true })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch {}
  }, [member?.id])

  const markRead = useCallback(async (id) => {
    try {
      await apiFetch('markNotificationsRead', { id })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {}
  }, [])

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications, markAllRead, markRead }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}
