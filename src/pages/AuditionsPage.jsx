import { useState, useEffect } from 'react'
import { apiFetch, invalidateCache } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { Music, Plus, Search } from 'lucide-react'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import GoldSpinner from '../components/GoldSpinner'
import PageHeader from '../components/PageHeader'

const MINISTRIES = ['Worship','DLP','Sound','Stage','Other']

const STATUSES = ['Following Up','Invited to Audition','On Hold','Not Suitable']
const statusColor = {
  'Following Up': 'urgency-info',
  'Invited to Audition': 'urgency-important',
  'On Hold': 'text-cream-muted border border-border',
  'Not Suitable': 'urgency-urgent',
}

export default function AuditionsPage() {
  const { member } = useAuth()
  const { toast } = useApp()
  const isAdmin = ['ADMIN','SUPER_ADMIN'].includes(member.role)
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showDetail, setShowDetail] = useState(null)
  const [form, setForm] = useState({ suggestedName:'', skill:'', ministry:'Worship', description:'', contact:'' })
  const [statusUpdate, setStatusUpdate] = useState('')
  const [adminResponse, setAdminResponse] = useState('')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await apiFetch('getAuditionSuggestions', {})
      setSuggestions(Array.isArray(data) ? data : [])
    } catch (err) { toast(err.message, 'error') }
    finally { setLoading(false) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await apiFetch('createSuggestion', { ...form, submittedBy: member.id })
      invalidateCache('getAuditionSuggestions')
      toast('Suggestion submitted! Admins will review it.', 'success')
      setShowAdd(false)
      setForm({ suggestedName:'', skill:'', ministry:'Worship', description:'', contact:'' })
      load()
    } catch (err) { toast(err.message, 'error') }
    finally { setSaving(false) }
  }

  async function handleUpdateStatus() {
    if (!statusUpdate) return
    setSaving(true)
    try {
      await apiFetch('updateSuggestionStatus', { id: showDetail.id, status: statusUpdate, adminResponse })
      invalidateCache('getAuditionSuggestions')
      toast('Status updated', 'success')
      setShowDetail(null)
      load()
    } catch (err) { toast(err.message, 'error') }
    finally { setSaving(false) }
  }

  const myList = !isAdmin ? suggestions.filter(s => s.submittedBy === member.name) : suggestions
  const filtered = myList.filter(s => !search || s.suggestedName?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Talent Suggestions"
        subtitle={isAdmin ? 'Review all suggestions' : 'Suggest someone for the team'}
        actions={
          <button onClick={() => setShowAdd(true)} className="btn-gold text-sm py-2">
            <Plus size={15} /> Suggest
          </button>
        }
      />

      {isAdmin && (
        <div className="px-4 mb-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream-muted" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name..." className="worship-input pl-9 py-2.5 text-sm" />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><GoldSpinner /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Music} title="No suggestions yet" message="Know someone with a gift? Suggest them for the worship team!" />
      ) : (
        <div className="px-4 flex flex-col gap-3 card-stagger">
          {filtered.map(s => (
            <button key={s.id} onClick={() => { setShowDetail(s); setStatusUpdate(s.status || ''); setAdminResponse(s.adminResponse || '') }} className="worship-card p-4 text-left w-full hover:border-gold/30 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-body text-cream font-bold">{s.suggestedName}</p>
                  <p className="font-body text-cream-muted text-xs mt-0.5">{s.skill} · {s.ministry}</p>
                </div>
                {s.status && (
                  <span className={`text-xs px-2 py-1 rounded-full font-body ${statusColor[s.status] || ''}`}>{s.status}</span>
                )}
              </div>
              {s.description && <p className="font-body text-cream-muted text-sm mt-2 line-clamp-2">{s.description}</p>}
            </button>
          ))}
        </div>
      )}

      {/* Submit Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Suggest a Talent">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">Person's Name</label>
            <input type="text" value={form.suggestedName} onChange={e => setForm(f => ({...f,suggestedName:e.target.value}))} className="worship-input" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">Skill / Instrument</label>
              <input type="text" value={form.skill} onChange={e => setForm(f => ({...f,skill:e.target.value}))} className="worship-input" placeholder="e.g. Vocals" required />
            </div>
            <div>
              <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">Ministry</label>
              <select value={form.ministry} onChange={e => setForm(f => ({...f,ministry:e.target.value}))} className="worship-input">
                {MINISTRIES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({...f,description:e.target.value}))} className="worship-input resize-none" rows={3} placeholder="Tell us about their gift..." />
          </div>
          <div>
            <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">Contact Info</label>
            <input type="text" value={form.contact} onChange={e => setForm(f => ({...f,contact:e.target.value}))} className="worship-input" placeholder="Phone or email" />
          </div>
          <button type="submit" disabled={saving} className="btn-gold w-full justify-center">
            {saving ? <GoldSpinner size={18} /> : 'Submit Suggestion'}
          </button>
        </form>
      </Modal>

      {/* Detail / Admin Modal */}
      {showDetail && (
        <Modal open={!!showDetail} onClose={() => setShowDetail(null)} title={showDetail.suggestedName}>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[['Skill', showDetail.skill], ['Ministry', showDetail.ministry], ['Contact', showDetail.contact || '—']].map(([k,v]) => (
                <div key={k}>
                  <span className="font-body text-cream-muted text-xs">{k}</span>
                  <p className="font-body text-cream font-semibold mt-0.5">{v}</p>
                </div>
              ))}
            </div>
            {showDetail.description && (
              <div>
                <span className="font-body text-cream-muted text-xs">Description</span>
                <p className="font-body text-cream text-sm mt-0.5">{showDetail.description}</p>
              </div>
            )}
            {isAdmin && (
              <div className="flex flex-col gap-3 pt-3 border-t border-border">
                <label className="font-body text-cream-muted text-xs uppercase tracking-wide">Update Status</label>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map(s => (
                    <button
                      key={s}
                      onClick={() => setStatusUpdate(s)}
                      className={`text-xs px-3 py-1.5 rounded-full border font-body transition-all ${statusUpdate === s ? statusColor[s] || 'bg-gold/10 text-gold border-gold/30' : 'text-cream-muted border-border'}`}
                    >{s}</button>
                  ))}
                </div>
                <textarea value={adminResponse} onChange={e => setAdminResponse(e.target.value)} className="worship-input resize-none" rows={2} placeholder="Notes for the submitter..." />
                <button onClick={handleUpdateStatus} disabled={saving} className="btn-gold w-full justify-center">
                  {saving ? <GoldSpinner size={18} /> : 'Update Status'}
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
