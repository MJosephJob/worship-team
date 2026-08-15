import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../contexts/NotificationContext'
import { Bell, CheckCheck, ChevronDown } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import { formatNotificationTime } from '../utils/notifications'

const typeIcon = {
  announcement: '📢',
  birthday: '🎂',
  prayer: '🙏',
  badge: '🏅',
  roster: '📅',
  maintenance: '🔧',
  partner: '💌',
  vm: '📖',
  onboarding: '✅',
  audition: '🎵',
}

function notifDate(ts) {
  return new Date(ts?.replace(' IST', '').replace(' ', 'T') || 0)
}

// Buckets consecutive same-day notifications sharing a type+title into a
// single collapsible group — recurring sends (weekly prayer reminder, daily
// birthday note) otherwise flood the list with visually identical rows.
function groupNotifications(list) {
  const sorted = [...list].sort((a, b) => notifDate(b.createdAt) - notifDate(a.createdAt))
  const groups = []
  sorted.forEach(n => {
    const day = notifDate(n.createdAt).toDateString()
    const last = groups[groups.length - 1]
    if (last && last.type === n.type && last.title === n.title && last.day === day) {
      last.items.push(n)
    } else {
      groups.push({ type: n.type, title: n.title, day, items: [n] })
    }
  })
  return groups
}

export default function NotificationsPage() {
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState({})

  const groups = useMemo(() => groupNotifications(notifications), [notifications])

  async function handleTap(n) {
    await markRead(n.id)
    if (n.linkTo) navigate(n.linkTo)
  }

  function toggleExpand(key) {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread`}
        actions={unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-outline text-sm py-2">
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      />

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="You're all caught up" message="Notifications from your worship team will appear here." />
      ) : (
        <div className="px-4 flex flex-col gap-2 card-stagger">
          {groups.map((group, gi) => {
            const key = `${group.type}:${group.title}:${group.day}`
            const latest = group.items[0]
            const hasUnread = group.items.some(n => !n.isRead)

            if (group.items.length === 1) {
              const n = latest
              return (
                <button
                  key={n.id}
                  onClick={() => handleTap(n)}
                  className={`worship-card p-4 text-left w-full transition-all cursor-pointer hover:border-gold/40 hover:bg-gold/5 ${!n.isRead ? 'border-gold/30 bg-gold/5' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">{typeIcon[n.type] || '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`font-body text-sm font-bold ${n.isRead ? 'text-cream-muted' : 'text-cream'}`}>{n.title}</p>
                        <span className="font-body text-cream-muted text-[10px] flex-shrink-0">{formatNotificationTime(n.createdAt)}</span>
                      </div>
                      <p className="font-body text-cream-muted text-xs mt-0.5 leading-relaxed">{n.body}</p>
                    </div>
                    {!n.isRead && <div className="w-2 h-2 rounded-full bg-gold flex-shrink-0 mt-1.5" />}
                  </div>
                </button>
              )
            }

            const isOpen = !!expanded[key]
            return (
              <div key={key} className="worship-card overflow-hidden">
                <button
                  onClick={() => toggleExpand(key)}
                  className={`p-4 text-left w-full transition-all cursor-pointer hover:bg-gold/5 flex items-start gap-3 ${hasUnread ? 'bg-gold/5' : ''}`}
                >
                  <span className="text-xl flex-shrink-0">{typeIcon[group.type] || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`font-body text-sm font-bold flex items-center gap-1.5 ${hasUnread ? 'text-cream' : 'text-cream-muted'}`}>
                        {group.title}
                        <span className="font-body text-[10px] font-bold bg-gold/20 text-gold rounded-full px-1.5 py-0.5">×{group.items.length}</span>
                      </p>
                      <span className="font-body text-cream-muted text-[10px] flex-shrink-0">{formatNotificationTime(latest.createdAt)}</span>
                    </div>
                    <p className="font-body text-cream-muted text-xs mt-0.5 leading-relaxed">{latest.body}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 mt-1">
                    {hasUnread && <div className="w-2 h-2 rounded-full bg-gold" />}
                    <ChevronDown size={14} className={`text-cream-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-border flex flex-col">
                    {group.items.map(n => (
                      <button
                        key={n.id}
                        onClick={() => handleTap(n)}
                        className={`px-4 py-3 pl-12 text-left w-full transition-all cursor-pointer hover:bg-gold/5 flex items-center justify-between gap-2 border-b border-border last:border-b-0 ${!n.isRead ? 'bg-gold/5' : ''}`}
                      >
                        <span className={`font-body text-xs ${n.isRead ? 'text-cream-muted' : 'text-cream'}`}>{formatNotificationTime(n.createdAt)}</span>
                        {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
