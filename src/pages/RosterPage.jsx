import { useState, useEffect } from 'react'
import { apiFetch, invalidateCache } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { Users, Edit2 } from 'lucide-react'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import GoldSpinner from '../components/GoldSpinner'
import PageHeader from '../components/PageHeader'

function getNextEightMondays() {
  const weeks = []
  const now = new Date()
  const day = now.getDay()
  const daysUntilMonday = day === 1 ? 0 : (8 - day) % 7
  const firstMonday = new Date(now)
  firstMonday.setDate(now.getDate() + daysUntilMonday)
  for (let i = 0; i < 8; i++) {
    const d = new Date(firstMonday)
    d.setDate(firstMonday.getDate() + i * 7)
    weeks.push(d.toISOString().split('T')[0])
  }
  return weeks
}

function ZoomSkeletonCard() {
  return (
    <div className="worship-card p-4 mb-4">
      <div className="h-3 w-20 rounded mb-3 skeleton-shimmer bg-surface-raised" />
      <div className="h-4 w-32 rounded mb-2 skeleton-shimmer bg-surface-raised" />
      <div className="h-3 w-48 rounded mb-3 skeleton-shimmer bg-surface-raised" />
      <div className="h-8 w-24 rounded-lg skeleton-shimmer bg-surface-raised" />
    </div>
  )
}

function RosterSkeletonRow() {
  return (
    <div className="worship-card p-4 mb-3">
      <div className="h-3 w-28 rounded mb-3 skeleton-shimmer bg-surface-raised" />
      <div className="h-4 w-40 rounded mb-2 skeleton-shimmer bg-surface-raised" />
      <div className="h-3 w-20 rounded skeleton-shimmer bg-surface-raised" />
    </div>
  )
}

export default function RosterPage() {
  const { member } = useAuth()
  const { toast } = useApp()
  const isAdmin = ['ADMIN','SUPER_ADMIN'].includes(member.role)
  const [roster, setRoster] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [selectedMember, setSelectedMember] = useState('')
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState([])
  const [zoomSettings, setZoomSettings] = useState({ link: '', meetingId: '', passcode: '' })
  const [editingZoom, setEditingZoom] = useState(false)
  const [zoomForm, setZoomForm] = useState({ link: '', meetingId: '', passcode: '' })
  const [savingZoom, setSavingZoom] = useState(false)
  const weeks = getNextEightMondays()

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [r, m, allSettings] = await Promise.all([
        apiFetch('getFacilitatorRoster', {}),
        apiFetch('getMembers', {}),
        apiFetch('getSettings', {}),
      ])
      setRoster(Array.isArray(r) ? r : [])
      setMembers(Array.isArray(m) ? m : [])
      setSettings(Array.isArray(allSettings) ? allSettings : [])
      const settingsMap = Array.isArray(allSettings)
        ? Object.fromEntries(allSettings.map(s => [s.key, s.value]))
        : {}
      setZoomSettings({
        link:     settingsMap.zoomLink      || '',
        meetingId: settingsMap.zoomMeetingId || '',
        passcode:  settingsMap.zoomPasscode  || '',
      })
    } catch (err) { toast(err.message, 'error') }
    finally { setLoading(false) }
  }

  function getSlot(weekDate) {
    return roster.find(r => {
      let rDate
      if (r.weekDate instanceof Date) {
        const d = new Date(r.weekDate)
        d.setMinutes(d.getMinutes() + d.getTimezoneOffset())
        rDate = d.toISOString().split('T')[0]
      } else {
        rDate = String(r.weekDate).split('T')[0]
      }
      return rDate === weekDate
    })
  }

  function getMemberName(id) {
    return members.find(m => m.id === id)?.name || '—'
  }

  async function handleSave() {
    if (!editing) return
    setSaving(true)
    try {
      const updated = await apiFetch('updateRosterSlot', { weekDate: editing, memberId: selectedMember, assignedBy: member.id })
      if (Array.isArray(updated)) setRoster(updated)
      invalidateCache('getFacilitatorRoster')
      toast('Roster updated', 'success')
      setEditing(null)
      setSelectedMember('')
    } catch (err) { toast(err.message, 'error') }
    finally { setSaving(false) }
  }

  async function saveZoom() {
    setSavingZoom(true)
    try {
      await Promise.all([
        apiFetch('updateSettings', { key: 'zoomLink',      value: zoomForm.link }),
        apiFetch('updateSettings', { key: 'zoomMeetingId', value: zoomForm.meetingId }),
        apiFetch('updateSettings', { key: 'zoomPasscode',  value: zoomForm.passcode }),
      ])
      invalidateCache('getSettings')
      setZoomSettings({ ...zoomForm })
      setEditingZoom(false)
      toast('Zoom details saved', 'success')
    } catch (err) { toast(err.message, 'error') }
    finally { setSavingZoom(false) }
  }

  function isMySlot(slot) {
    return slot?.memberId === member.id
  }

  function isOnBreak(dateStr) {
    try {
      const setting = settings?.find?.(s => s.key === 'on_break_months')
      if (!setting?.value) return false
      const breakMonths = String(setting.value)
        .split(',')
        .map(m => parseInt(m.trim()))
        .filter(m => !isNaN(m))
      return breakMonths.includes(new Date(dateStr).getMonth())
    } catch {
      return false
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Prayer Roster" subtitle="Weekly prayer facilitators — 8-week view" />

      {/* Zoom Details Card */}
      <div className="px-4 mb-4">
        <div className="worship-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-body text-gold font-bold text-sm">Prayer Meeting — Every Monday 9:30pm IST</p>
            {isAdmin && (
              <button onClick={() => { setZoomForm({ ...zoomSettings }); setEditingZoom(true) }}
                className="w-8 h-8 rounded-lg bg-surface-raised flex items-center justify-center text-cream-muted hover:text-gold transition-colors">
                <Edit2 size={14} />
              </button>
            )}
          </div>
          {zoomSettings.link ? (
            <div className="flex flex-col gap-1">
              <a href={zoomSettings.link} target="_blank" rel="noopener noreferrer"
                className="font-body text-info text-sm underline">
                Click here to join prayer
              </a>
              <p className="font-body text-cream-muted text-xs">Meeting ID: {zoomSettings.meetingId}</p>
              <p className="font-body text-cream-muted text-xs">Passcode: {zoomSettings.passcode}</p>
            </div>
          ) : (
            <p className="font-body text-cream-muted text-sm italic">
              {isAdmin ? 'No Zoom link set — click edit to add one.' : 'Zoom link not set yet.'}
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="max-w-2xl mx-auto px-4 py-4">
          <ZoomSkeletonCard />
          <RosterSkeletonRow />
          <RosterSkeletonRow />
          <RosterSkeletonRow />
          <RosterSkeletonRow />
        </div>
      ) : roster.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="text-5xl mb-4">👥</div>
          <h3 className="font-body font-semibold text-cream text-lg mb-2">No roster assigned yet</h3>
          <p className="font-body text-cream-muted text-sm mb-6">The prayer facilitator schedule hasn't been set up yet.</p>
        </div>
      ) : (
        <div className="px-4 flex flex-col gap-3 card-stagger">
          {weeks.map((weekDate, i) => {
            const slot = getSlot(weekDate)
            const my = isMySlot(slot)
            const d = new Date(weekDate)
            const label = d.toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })
            const isThisWeek = i === 0
            return (
              <div key={weekDate} className={`worship-card p-4 ${my ? 'border-gold/40' : ''} ${isThisWeek ? 'border-info/40' : ''}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {isThisWeek && <span className="text-xs bg-info/10 text-info px-2 py-0.5 rounded-full font-body">This week</span>}
                      {my && <span className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded-full font-body">You!</span>}
                    </div>
                    <p className="font-body text-cream font-bold mt-1">{label}</p>
                    <p className="font-body text-sm mt-0.5">
                      {isOnBreak(weekDate)
                        ? <span className="text-warning italic">On Break</span>
                        : slot?.memberId
                          ? <span className={`font-semibold ${my ? 'text-gold' : 'text-cream'}`}>{getMemberName(slot.memberId)}</span>
                          : <span className="text-cream-muted italic">Unassigned</span>
                      }
                    </p>
                    <p className="font-body text-cream-muted text-xs mt-0.5">9:30pm IST</p>
                    {slot?.notes && <p className="font-body text-cream-muted text-xs mt-0.5">{slot.notes}</p>}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => { setEditing(weekDate); setSelectedMember(slot?.memberId || '') }}
                      className="w-8 h-8 rounded-lg bg-surface-raised flex items-center justify-center text-cream-muted hover:text-gold transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Assign Facilitator" maxWidth="max-w-sm">
        <div className="flex flex-col gap-4">
          <p className="font-body text-cream-muted text-sm">
            Week of {editing ? new Date(editing).toLocaleDateString('en-IN', { day:'numeric', month:'long' }) : ''}
          </p>
          <div>
            <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">Facilitator</label>
            <select value={selectedMember} onChange={e => setSelectedMember(e.target.value)} className="worship-input">
              <option value="">— Unassigned —</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-gold w-full justify-center">
            {saving ? <GoldSpinner size={18} /> : 'Save'}
          </button>
        </div>
      </Modal>

      <Modal open={editingZoom} onClose={() => setEditingZoom(false)} title="Zoom Meeting Details" maxWidth="max-w-sm">
        <div className="flex flex-col gap-4">
          <div>
            <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">Zoom Link</label>
            <input value={zoomForm.link} onChange={e => setZoomForm(f => ({ ...f, link: e.target.value }))}
              className="worship-input" placeholder="https://zoom.us/j/..." />
          </div>
          <div>
            <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">Meeting ID</label>
            <input value={zoomForm.meetingId} onChange={e => setZoomForm(f => ({ ...f, meetingId: e.target.value }))}
              className="worship-input" placeholder="785 6917 9466" />
          </div>
          <div>
            <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">Passcode</label>
            <input value={zoomForm.passcode} onChange={e => setZoomForm(f => ({ ...f, passcode: e.target.value }))}
              className="worship-input" placeholder="9iYwXE" />
          </div>
          <button onClick={saveZoom} disabled={savingZoom} className="btn-gold w-full justify-center">
            {savingZoom ? <GoldSpinner size={18} /> : 'Save Zoom Details'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
