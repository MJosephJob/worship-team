import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../contexts/NotificationContext'
import { Bell, CheckCheck } from 'lucide-react'
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

export default function NotificationsPage() {
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications()
  const navigate = useNavigate()

  async function handleTap(n) {
    await markRead(n.id)
    if (n.linkTo) navigate(n.linkTo)
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
          {[...notifications].sort((a, b) => {
            const dateA = new Date(a.createdAt?.replace(' IST','').replace(' ','T') || 0)
            const dateB = new Date(b.createdAt?.replace(' IST','').replace(' ','T') || 0)
            return dateB - dateA
          }).map(n => (
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
          ))}
        </div>
      )}
    </div>
  )
}
