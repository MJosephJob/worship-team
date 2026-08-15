import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { apiFetch } from '../utils/api'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen, Package, Star, Users, Calendar, AlertTriangle,
  ChevronRight, Phone, Heart, Megaphone, TrendingUp, Database, Settings, RefreshCw
} from 'lucide-react'
import GoldSpinner from '../components/GoldSpinner'
import StatCard from '../components/StatCard'

const CACHE_KEY = 'dash_cache'
const CACHE_TTL = 60 * 1000

function getCached(memberId) {
  try {
    const raw = sessionStorage.getItem(`${CACHE_KEY}_${memberId}`)
    if (!raw) return null
    const { ts, data } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) return null
    return data
  } catch { return null }
}

function setCache(memberId, data) {
  try { sessionStorage.setItem(`${CACHE_KEY}_${memberId}`, JSON.stringify({ ts: Date.now(), data })) } catch {}
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function VMStatusBadge({ status, onClick }) {
  const cfg = status === 'done'
    ? { cls: 'bg-success/15 text-success border-success/30', label: '✓ VM Signed' }
    : { cls: 'bg-warning/15 text-warning border-warning/30', label: 'VM Pending' }

  return (
    <button onClick={onClick} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-body font-bold ${cfg.cls}`}>
      {cfg.label}
    </button>
  )
}

function SkeletonCard({ lines = 2 }) {
  return (
    <div className="worship-card p-4 animate-pulse">
      <div className="h-4 w-32 bg-surface-raised rounded mb-3 skeleton-shimmer" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-3 bg-surface-raised rounded mb-2 skeleton-shimmer`} style={{ width: `${70 + i * 10}%` }} />
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { member } = useAuth()
  const { toast } = useApp()
  const navigate = useNavigate()
  const [dashData, setDashData] = useState(() => getCached(member.id))
  const [loadingSecondary, setLoadingSecondary] = useState(!getCached(member.id))
  const [refreshing, setRefreshing] = useState(false)
  const touchStartY = useRef(null)

  async function load(force = false) {
    if (!force) {
      const cached = getCached(member.id)
      if (cached) { setDashData(cached); return }
    }
    setLoadingSecondary(true)
    try {
      const data = await apiFetch('getDashboard', { memberId: member.id, role: member.role })
      setDashData(data)
      setCache(member.id, data)
    } catch (err) {
      toast('Could not load dashboard', 'error')
    } finally {
      setLoadingSecondary(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [member.id])

  function onTouchStart(e) { touchStartY.current = e.touches[0].clientY }
  function onTouchEnd(e) {
    if (touchStartY.current === null) return
    const delta = e.changedTouches[0].clientY - touchStartY.current
    touchStartY.current = null
    if (delta > 60 && window.scrollY === 0 && !refreshing) {
      setRefreshing(true)
      load(true)
    }
  }

  const d = dashData || {}
  const vmStatus = d.vmStatus || 'due'
  const partner = d.prayerPartner
  const birthdays = d.upcomingBirthdays || []
  const latestAnnouncement = d.latestAnnouncement
  const badges = d.badges || []
  const attendance = d.attendancePct || 0
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(member.role)
  const isSuperAdmin = member.role === 'SUPER_ADMIN'

  return (
    <div className="max-w-2xl mx-auto px-4 py-6" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Pull-to-refresh indicator */}
      {refreshing && (
        <div className="flex justify-center pb-3">
          <div className="flex items-center gap-2 text-gold text-xs font-body">
            <RefreshCw size={13} className="animate-spin" /> Refreshing…
          </div>
        </div>
      )}

      {/* Greeting */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-cream text-xl font-medium">
              {greeting()}, {member.name?.split(' ')[0]}
            </h1>
            <p className="font-body text-cream-muted text-xs mt-1 tracking-wide">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
          <VMStatusBadge status={vmStatus} onClick={() => navigate('/vm')} />
        </div>
      </div>

      <div className="flex flex-col gap-4 card-stagger">
        {/* Skeleton while loading */}
        {loadingSecondary && !dashData && (
          <>
            <SkeletonCard lines={2} />
            <SkeletonCard lines={3} />
            <SkeletonCard lines={2} />
          </>
        )}

        {/* Urgent announcement */}
        {latestAnnouncement && latestAnnouncement.urgency === 'Urgent' && (
          <button onClick={() => navigate('/notices')} className="w-full bg-danger/10 border border-danger/30 rounded-xl p-4 text-left hover:bg-danger/15 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={14} className="text-danger" />
              <span className="font-body text-danger text-xs font-bold uppercase">Urgent Notice</span>
            </div>
            <p className="font-body text-cream text-sm font-bold">{latestAnnouncement.title}</p>
          </button>
        )}

        {/* Prayer Partner */}
        {partner && (
          <div className="worship-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-body text-cream font-semibold">Prayer Partner</h3>
              <span className="text-xs text-cream-muted font-body">{d.partnerSeason}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center overflow-hidden">
                {(partner.photoUrl || partner.photoBase64)
                  ? <img src={partner.photoUrl || partner.photoBase64} alt="" className="w-full h-full object-cover" />
                  : <span className="font-body text-gold text-sm font-bold">{partner.name?.[0]}</span>
                }
              </div>
              <div className="flex-1">
                <p className="font-body text-cream text-sm font-bold">{partner.name}</p>
                <p className="font-body text-cream-muted text-xs">{partner.instrument}</p>
              </div>
              <div className="flex gap-2">
                {partner.phone && (
                  <a href={`tel:${partner.phone}`} className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center text-success hover:bg-success/20 transition-colors" data-tooltip="Call">
                    <Phone size={14} />
                  </a>
                )}
                <button
                  onClick={() => toast('Encouragement note sent! 💌', 'success')}
                  className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-gold hover:bg-gold/20 transition-colors"
                  data-tooltip="Send encouragement"
                >
                  <Heart size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BIRTHDAYS REMOVED FROM DASHBOARD
            — visible on Birthdays page */}
        {false && (
          <div className="worship-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-body text-cream font-semibold">Upcoming Birthdays</h3>
              <button onClick={() => navigate('/birthdays')} className="text-gold text-xs font-body hover:text-gold-light flex items-center gap-1">
                See all <ChevronRight size={12} />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {birthdays.slice(0, 3).map((b, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star size={13} className="text-warning" />
                    <span className="font-body text-cream text-sm">{b.name}</span>
                    <span className="font-body text-cream-muted text-xs">{b.instrument}</span>
                  </div>
                  <span className="font-body text-gold text-xs">
                    {b.daysUntil === 0 ? '🎂 Today!' : `${b.daysUntil}d`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Latest announcement */}
        {latestAnnouncement && latestAnnouncement.urgency !== 'Urgent' && (
          <button onClick={() => navigate('/notices')} className="worship-card p-4 text-left w-full">
            <div className="flex items-center gap-2 mb-2">
              <Megaphone size={14} className="text-gold" />
              <span className="font-body text-gold text-xs font-bold uppercase">Latest Notice</span>
            </div>
            <p className="font-body text-cream text-sm font-bold">{latestAnnouncement.title}</p>
            <p className="font-body text-cream-muted text-xs mt-1 line-clamp-2">{latestAnnouncement.body}</p>
          </button>
        )}

        {/* BADGES REMOVED FROM DASHBOARD
            — feature not active */}
        {false && (
          <div className="worship-card p-4">
            <h3 className="font-body text-cream font-semibold mb-3">My Badges</h3>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {badges.map((b, i) => (
                <div key={i} title={b.badgeName} className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-xl">
                    {b.badgeEmoji}
                  </div>
                  <span className="font-body text-cream-muted text-[10px] text-center max-w-[48px] truncate">{b.badgeName}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ATTENDANCE BAR REMOVED FROM DASHBOARD
            — visible on Profile page */}
        {false && (
          <div className="worship-card p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-body text-cream font-semibold">My Event Attendance</h3>
              <span className="font-body text-cream-muted text-xs">Last 3 months</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-surface-raised rounded-full overflow-hidden">
                <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${attendance}%` }} />
              </div>
              <span className={`font-body text-sm font-bold ${attendance >= 70 ? 'text-success' : attendance >= 40 ? 'text-warning' : 'text-danger'}`}>
                {attendance}%
              </span>
            </div>
          </div>
        )}

        {/* Admin cards */}
        {isAdmin && (
          <>
            <div className="mt-6">
              <p className="text-[10px] text-cream-muted font-body uppercase tracking-widest mb-3">Admin overview</p>
              <div className="grid grid-cols-2 gap-3">
                <StatCard icon={Package} label="Total Assets" value={d.totalAssets || 0} />
                <StatCard icon={AlertTriangle} label="Need Attention" value={d.assetsNeedingAttention || 0} color="text-warning" />
                <StatCard icon={Users} label="Total Members" value={d.totalMembers || 0} />
                <StatCard icon={TrendingUp} label="Onboarded %" value={`${d.onboardedPct || 0}%`} color="text-success" />
              </div>
            </div>

            {/* Maintenance alerts */}
            {(d.maintenanceAlerts || []).length > 0 && (
              <div className="worship-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={15} className="text-warning" />
                  <h3 className="font-body text-cream font-semibold">Maintenance Alerts</h3>
                </div>
                {d.maintenanceAlerts.slice(0, 4).map((m, i) => (
                  <div key={i} className={`flex items-center justify-between py-2 border-b border-border last:border-0`}>
                    <span className="font-body text-cream text-sm">{m.assetName}</span>
                    <span className={`font-body text-xs ${m.overdue ? 'text-danger' : 'text-warning'}`}>
                      {m.overdue ? 'Overdue' : 'Due soon'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* V&M Sign-off */}
            <div className="worship-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-body text-cream font-semibold">V&M Sign-off</h3>
                <span className={`font-body text-sm font-bold ${((d.totalMembers || 0) - (d.vmOverdue || []).length) === (d.totalMembers || 0) ? 'text-success' : 'text-warning'}`}>
                  {(d.totalMembers || 0) - (d.vmOverdue || []).length} of {d.totalMembers || 0} signed
                </span>
              </div>
              {(d.vmOverdue || []).length > 0 && (
                <>
                  <p className="font-body text-cream-muted text-xs mb-1">Not yet signed:</p>
                  {(d.vmOverdue || []).slice(0, 3).map((m, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-warning" />
                      <span className="font-body text-cream text-sm">{m.name}</span>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Upcoming roster */}
            {(d.upcomingRoster || []).length > 0 && (
              <div className="worship-card p-4">
                <h3 className="font-body text-cream font-semibold mb-3">Next Prayer Facilitators</h3>
                {d.upcomingRoster.map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="font-body text-cream text-sm">{r.memberName}</span>
                    <span className="font-body text-cream-muted text-xs">{new Date(r.weekDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Audition suggestions */}
            {isAdmin && d.pendingAuditions > 0 && (
              <div
                onClick={() => navigate('/auditions')}
                className="worship-card p-4 flex items-center justify-between cursor-pointer active:opacity-70"
              >
                <span className="font-body text-sm text-cream">
                  Pending audition suggestions
                </span>
                <span className="font-body text-sm font-medium text-gold">
                  {d.pendingAuditions} →
                </span>
              </div>
            )}
          </>
        )}

        {/* Super Admin extras */}
        {isSuperAdmin && (
          <div className="worship-card p-4">
            <h3 className="font-body text-cream font-semibold mb-3">Super Admin</h3>
            <div className="flex gap-2">
              <button onClick={() => navigate('/settings')} className="btn-outline text-sm flex-1 justify-center py-2">
                <Settings size={14} /> Settings
              </button>
              <button onClick={() => navigate('/year-end')} className="btn-outline text-sm flex-1 justify-center py-2">
                <BookOpen size={14} /> Year-End
              </button>
            </div>
            {d.lastBackupDate && (
              <div className="flex items-center gap-2 mt-3 p-2 bg-surface-raised rounded-lg">
                <Database size={13} className="text-cream-muted" />
                <span className="font-body text-cream-muted text-xs">Last backup: {new Date(d.lastBackupDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
