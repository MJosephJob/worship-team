import { useState, useEffect } from 'react'
import { apiFetch } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { Calendar, Plus, CheckSquare, Square, Download, UserCheck, UserX, Clock } from 'lucide-react'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import GoldSpinner from '../components/GoldSpinner'
import PageHeader from '../components/PageHeader'

const EVENT_TYPES = ['Sunday Worship','Worship Night','Small Group','Weekly Prayer Night','Special Event','Rehearsal']

const CACHE_TTL = 5 * 60 * 1000

function getCachedAttendance() {
  try {
    const raw = sessionStorage.getItem('cache_attendance')
    if (!raw) return null
    const { ts, data } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) return null
    return data
  } catch { return null }
}

function getCachedMembers() {
  try {
    const raw = sessionStorage.getItem('cache_members')
    if (!raw) return null
    const { ts, data } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) return null
    return data
  } catch { return null }
}

const STATUS_CONFIG = {
  Present:       { color: 'border-success/40 bg-success/10', icon: UserCheck, iconCls: 'text-success', label: 'Present' },
  InformedPrior: { color: 'border-info/40 bg-info/10',       icon: Clock,     iconCls: 'text-info',    label: 'Informed Prior' },
  Absent:        { color: 'border-border bg-surface-raised', icon: UserX,     iconCls: 'text-cream-muted', label: 'Absent' },
}

export default function AttendancePage() {
  const { member } = useAuth()
  const { toast } = useApp()
  const isAdmin = ['ADMIN','SUPER_ADMIN'].includes(member.role)
  const isSuperAdmin = member.role === 'SUPER_ADMIN'
  const [events, setEvents] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [showMarkEvent, setShowMarkEvent] = useState(null)
  const [attendance, setAttendance] = useState({}) // memberId -> 'Present'|'InformedPrior'|'Absent'
  const [form, setForm] = useState({ type:'Sunday Worship', date:'', notes:'' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const cachedA = getCachedAttendance()
      const cachedM = getCachedMembers()
      if (cachedA && cachedM) {
        setEvents(cachedA)
        setMembers(cachedM)
        setLoading(false)
        return
      }
      const [e, m] = await Promise.all([apiFetch('getEvents', {}), apiFetch('getMembers', {})])
      const eventList = Array.isArray(e) ? e.sort((a,b) => new Date(b.date) - new Date(a.date)) : []
      const memberList = Array.isArray(m) ? m.filter(x => x.isActive !== false) : []
      setEvents(eventList)
      setMembers(memberList)
      try { sessionStorage.setItem('cache_attendance', JSON.stringify({ ts: Date.now(), data: eventList })) } catch {}
      try { sessionStorage.setItem('cache_members', JSON.stringify({ ts: Date.now(), data: memberList })) } catch {}
    } catch (err) { toast(err.message, 'error') }
    finally { setLoading(false) }
  }

  async function loadAttendance(eventId) {
    try {
      const data = await apiFetch('getAttendance', { eventId })
      const map = {}
      if (Array.isArray(data)) {
        data.forEach(a => {
          map[a.memberId] = a.status || (a.isPresent === true || a.isPresent === 'true' || a.isPresent === 'TRUE' ? 'Present' : 'Absent')
        })
      }
      setAttendance(map)
    } catch {}
  }

  async function handleCreateEvent(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await apiFetch('createEvent', { ...form, createdBy: member.id })
      sessionStorage.removeItem('cache_attendance')
      sessionStorage.removeItem('cache_members')
      toast('Event created', 'success')
      setShowAddEvent(false)
      setForm({ type:'Sunday Worship', date:'', notes:'' })
      load()
    } catch (err) { toast(err.message, 'error') }
    finally { setSaving(false) }
  }

  async function openMarkEvent(event) {
    setShowMarkEvent(event)
    await loadAttendance(event.id)
  }

  function cycleStatus(memberId) {
    setAttendance(prev => {
      const cur = prev[memberId] || 'Absent'
      const next = cur === 'Present' ? 'InformedPrior' : cur === 'InformedPrior' ? 'Absent' : 'Present'
      return { ...prev, [memberId]: next }
    })
  }

  async function submitAttendance() {
    setSaving(true)
    try {
      const present = members.filter(m => attendance[m.id] === 'Present').map(m => m.id)
      const informedPrior = members.filter(m => attendance[m.id] === 'InformedPrior').map(m => m.id)
      const eventName = `${showMarkEvent.type} — ${new Date(showMarkEvent.date).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}`

      await apiFetch('markAttendanceBulk', {
        eventId: showMarkEvent.id,
        present: JSON.stringify(present),
        informedPrior: JSON.stringify(informedPrior),
        eventName,
      })
      sessionStorage.removeItem('cache_attendance')
      toast('Attendance saved!', 'success')
      setShowMarkEvent(null)
    } catch (err) { toast('Save failed: ' + err.message, 'error') }
    finally { setSaving(false) }
  }

  async function exportCSV() {
    try {
      const data = await apiFetch('exportAttendanceCSV', {})
      const blob = new Blob([data.csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'attendance.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) { toast(err.message, 'error') }
  }

  const presentCount = Object.values(attendance).filter(s => s === 'Present').length
  const informedCount = Object.values(attendance).filter(s => s === 'InformedPrior').length

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Attendance"
        subtitle="Track event attendance"
        actions={
          <div className="flex gap-2">
            {isSuperAdmin && (
              <button onClick={exportCSV} className="btn-outline text-sm py-2" data-tooltip="Export CSV">
                <Download size={14} /> CSV
              </button>
            )}
            {isAdmin && (
              <button onClick={() => setShowAddEvent(true)} className="btn-gold text-sm py-2">
                <Plus size={15} /> Event
              </button>
            )}
          </div>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16"><GoldSpinner /></div>
      ) : events.length === 0 ? (
        <EmptyState icon={Calendar} title="No events yet" message="Create events to start tracking attendance." />
      ) : (
        <div className="px-4 flex flex-col gap-3 card-stagger">
          {events.map(event => (
            <div key={event.id} className="worship-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-body text-xs bg-info/10 text-info px-2 py-0.5 rounded-full">{event.type}</span>
                  </div>
                  <h3 className="font-body text-cream font-bold mt-1">{new Date(event.date).toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'long', year:'numeric' })}</h3>
                  {event.notes && <p className="font-body text-cream-muted text-xs mt-0.5">{event.notes}</p>}
                </div>
                {isAdmin && (
                  <button onClick={() => openMarkEvent(event)} className="btn-outline text-xs py-1.5 px-3">
                    <CheckSquare size={12} /> Mark
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Event Modal */}
      <Modal open={showAddEvent} onClose={() => setShowAddEvent(false)} title="Create Event" maxWidth="max-w-sm">
        <form onSubmit={handleCreateEvent} className="flex flex-col gap-4">
          <div>
            <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">Event Type</label>
            <select value={form.type} onChange={e => setForm(f => ({...f,type:e.target.value}))} className="worship-input">
              {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">Date</label>
            <input type="date" value={form.date} onChange={e => setForm(f => ({...f,date:e.target.value}))} className="worship-input" required />
          </div>
          <div>
            <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">Notes (optional)</label>
            <input type="text" value={form.notes} onChange={e => setForm(f => ({...f,notes:e.target.value}))} className="worship-input" />
          </div>
          <button type="submit" disabled={saving} className="btn-gold w-full justify-center">
            {saving ? <GoldSpinner size={18} /> : 'Create Event'}
          </button>
        </form>
      </Modal>

      {/* Mark Attendance Modal */}
      <Modal open={!!showMarkEvent} onClose={() => setShowMarkEvent(null)} title={`Attendance: ${showMarkEvent?.type}`}>
        <div className="flex flex-col gap-3">
          <p className="font-body text-cream-muted text-sm">
            {showMarkEvent && new Date(showMarkEvent.date).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
          </p>

          {/* Legend */}
          <div className="flex gap-3 text-xs font-body flex-wrap">
            <span className="flex items-center gap-1 text-success"><UserCheck size={12} /> Tap once = Present</span>
            <span className="flex items-center gap-1 text-info"><Clock size={12} /> Tap twice = Informed Prior</span>
            <span className="flex items-center gap-1 text-cream-muted"><UserX size={12} /> Tap three = Absent</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-border text-xs font-body text-cream-muted">
            <span>{presentCount} Present · {informedCount} Informed · {members.length - presentCount - informedCount} Absent</span>
          </div>

          <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
            {members.map(m => {
              const status = attendance[m.id] || 'Absent'
              const cfg = STATUS_CONFIG[status]
              const Icon = cfg.icon
              return (
                <button
                  key={m.id}
                  onClick={() => cycleStatus(m.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${cfg.color}`}
                >
                  <Icon size={18} className={`${cfg.iconCls} flex-shrink-0`} />
                  <div className="flex-1">
                    <p className="font-body text-cream text-sm font-bold">{m.name}</p>
                    <p className="font-body text-cream-muted text-xs">{m.instrument}</p>
                  </div>
                  <span className={`font-body text-xs font-bold ${cfg.iconCls}`}>{cfg.label}</span>
                </button>
              )
            })}
          </div>

          <div className="flex gap-2 pt-2 border-t border-border">
            <button
              onClick={() => submitAttendance()}
              disabled={saving}
              className="btn-gold flex-1 justify-center text-sm"
            >
              {saving ? <GoldSpinner size={16} /> : <><UserCheck size={14} /> Save & Send Emails</>}
            </button>
          </div>
          <p className="font-body text-cream-muted text-xs text-center">Absent members will receive a reminder email automatically.</p>
        </div>
      </Modal>
    </div>
  )
}
