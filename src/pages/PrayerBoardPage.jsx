import { useState, useEffect, useRef } from 'react'
import { apiFetch, invalidateCache } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { BookOpen, Plus, Heart, CheckCircle, Trash2, Eye, EyeOff, MessageSquare } from 'lucide-react'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import GoldSpinner from '../components/GoldSpinner'
import PageHeader from '../components/PageHeader'

const tabs = ['Believing', 'Answered']

function PrayerSkeletonCard() {
  return (
    <div className="worship-card p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="h-3 w-24 rounded skeleton-shimmer bg-surface-raised" />
      </div>
      <div className="h-4 w-3/4 rounded mb-2 skeleton-shimmer bg-surface-raised" />
      <div className="h-3 w-full rounded mb-1 skeleton-shimmer bg-surface-raised" />
      <div className="h-3 w-2/3 rounded mb-4 skeleton-shimmer bg-surface-raised" />
      <div className="border-t border-border pt-3 flex items-center justify-between">
        <div className="h-8 w-28 rounded-lg skeleton-shimmer bg-surface-raised" />
        <div className="h-3 w-16 rounded skeleton-shimmer bg-surface-raised" />
      </div>
    </div>
  )
}

export default function PrayerBoardPage() {
  const { member } = useAuth()
  const { toast } = useApp()
  const isAdmin = ['ADMIN','SUPER_ADMIN'].includes(member.role)
  const [tab, setTab] = useState('Believing')
  const [requests, setRequests] = useState([])
  const [answered, setAnswered] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showAnswer, setShowAnswer] = useState(null)
  const [form, setForm] = useState({ title:'', detail:'', isAnonymous: false })
  const [testimony, setTestimony] = useState('')
  const [saving, setSaving] = useState(false)
  const [prayingInFlight, setPrayingInFlight] = useState({})
  const lastTapRef = useRef({})

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [r, a] = await Promise.all([
        apiFetch('getPrayerRequests', {}),
        apiFetch('getAnsweredPrayers', {}),
      ])
      const sorted = [...(Array.isArray(r) ? r : [])]
        .sort((x, y) => new Date(y.createdAt) - new Date(x.createdAt))
      setRequests(sorted)
      const sortedAnswered = [...(Array.isArray(a) ? a : [])]
        .sort((x, y) => new Date(y.answeredAt || y.createdAt) - new Date(x.answeredAt || x.createdAt))
      setAnswered(sortedAnswered)
    } catch (err) { toast(err.message, 'error') }
    finally { setLoading(false) }
  }

  async function handlePost(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await apiFetch('createPrayerRequest', { ...form, postedBy: member.id })
      invalidateCache('getPrayerRequests')
      toast('Prayer request posted 🙏', 'success')
      setShowAdd(false)
      setForm({ title:'', detail:'', isAnonymous: false })
      load()
    } catch (err) { toast(err.message, 'error') }
    finally { setSaving(false) }
  }

  async function handlePray(req) {
    const already = (req.prayingMembers || '').split(',').filter(Boolean).includes(member.id)
    if (already) return
    const now = Date.now()
    if (lastTapRef.current[req.id] && now - lastTapRef.current[req.id] < 1000) return
    lastTapRef.current[req.id] = now
    if (prayingInFlight[req.id]) return

    setRequests(prev => prev.map(r => {
      if (r.id !== req.id) return r
      const existing = r.prayingMembers ? r.prayingMembers.split(',').filter(Boolean) : []
      return { ...r, prayingMembers: [...existing, member.id].join(',') }
    }))
    setPrayingInFlight(p => ({ ...p, [req.id]: true }))
    try {
      await apiFetch('prayForRequest', { id: req.id, memberId: member.id })
    } catch (err) {
      setRequests(prev => prev.map(r => {
        if (r.id !== req.id) return r
        const list = r.prayingMembers ? r.prayingMembers.split(',').filter(id => id !== member.id) : []
        return { ...r, prayingMembers: list.join(',') }
      }))
      toast(err.message, 'error')
    } finally {
      setPrayingInFlight(p => ({ ...p, [req.id]: false }))
    }
  }

  async function handleMarkAnswered(e) {
    e.preventDefault()
    if (testimony.trim().length < 20) return toast('Testimony must be at least 20 characters', 'warning')
    setSaving(true)
    try {
      await apiFetch('markAnswered', { id: showAnswer.id, testimony })
      invalidateCache('getPrayerRequests')
      invalidateCache('getAnsweredPrayers')
      toast('Praise God! 🕊️ Answered prayer recorded', 'success')
      setShowAnswer(null)
      setTestimony('')
      load()
    } catch (err) { toast(err.message, 'error') }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    try {
      await apiFetch('deletePrayerRequest', { id })
      invalidateCache('getPrayerRequests')
      toast('Removed', 'success')
      load()
    } catch (err) { toast(err.message, 'error') }
  }

  const believing = requests.filter(r => r.status !== 'Answered')
  const displayList = tab === 'Believing' ? believing : answered

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Prayer Board"
        subtitle="Pray for one another"
        actions={
          <button onClick={() => setShowAdd(true)} className="btn-gold text-sm py-2">
            <Plus size={15} /> Post Request
          </button>
        }
      />

      <div className="px-4 mb-4 flex gap-2">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg font-body text-sm font-bold transition-all ${
              tab === t ? 'bg-gold/10 text-gold border border-gold/30' : 'text-cream-muted hover:text-cream'
            }`}
          >
            {t}
            {t === 'Believing' && believing.length > 0 && (
              <span className="ml-1.5 text-xs bg-gold/20 text-gold rounded-full px-1.5">{believing.length}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex gap-2 mb-4">
            <div className="h-8 w-20 rounded-lg skeleton-shimmer bg-surface-raised" />
            <div className="h-8 w-24 rounded-lg skeleton-shimmer bg-surface-raised" />
          </div>
          <PrayerSkeletonCard />
          <PrayerSkeletonCard />
          <PrayerSkeletonCard />
        </div>
      ) : displayList.length === 0 ? (
        tab === 'Believing' ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="text-5xl mb-4">🙏</div>
            <h3 className="font-body font-semibold text-cream text-lg mb-2">No prayer requests yet</h3>
            <p className="font-body text-cream-muted text-sm mb-6">Be the first to share a request with the team.</p>
            <button
              onClick={() => setShowAdd(true)}
              className="btn-gold px-6 py-2 text-sm font-body"
            >
              Post a request
            </button>
          </div>
        ) : (
          <EmptyState icon={BookOpen} title="No answered prayers yet" message="Answered prayers will appear here. Keep praying!" />
        )
      ) : (
        <div className="px-4 flex flex-col gap-3 card-stagger">
          {displayList.map(req => {
            const prayingList = typeof req.prayingMembers === 'string'
              ? req.prayingMembers.split(',').filter(Boolean)
              : (req.prayingMembers || [])
            const isPraying = prayingList.includes(member.id)
            const isOwner = req.postedBy === member.id
            return (
              <div key={req.id} className="worship-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {req.isAnonymous ? (
                        <div className="flex items-center gap-1 text-cream-muted text-xs">
                          <EyeOff size={11} /> Anonymous
                        </div>
                      ) : (
                        <span className="font-body text-cream-muted text-xs">{req.posterName || 'A member'}</span>
                      )}
                      {tab === 'Answered' && (
                        <span className="status-answered text-xs px-2 py-0.5 rounded-full">Answered!</span>
                      )}
                    </div>
                    <h3 className="font-body text-cream font-bold">{req.title}</h3>
                    {req.detail && <p className="font-body text-cream-muted text-sm mt-1 leading-relaxed">{req.detail}</p>}
                    {tab === 'Answered' && req.testimony && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="font-body text-success text-xs font-bold mb-1 flex items-center gap-1"><MessageSquare size={11} /> Testimony</p>
                        <p className="font-body text-cream text-sm leading-relaxed">{req.testimony}</p>
                      </div>
                    )}
                  </div>
                  {(isAdmin || isOwner) && tab === 'Believing' && (
                    <div className="flex flex-col gap-1">
                      <button onClick={() => setShowAnswer(req)} title="Mark as answered" className="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center text-success hover:bg-success/20">
                        <CheckCircle size={13} />
                      </button>
                      <button onClick={() => handleDelete(req.id)} title="Delete" className="w-7 h-7 rounded-lg bg-danger/10 flex items-center justify-center text-danger hover:bg-danger/20">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
                {tab === 'Believing' && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <button
                      onClick={() => handlePray(req)}
                      disabled={isPraying || prayingInFlight[req.id]}
                      className={`flex items-center gap-1.5 text-sm font-body font-bold transition-all ${
                        isPraying ? 'text-danger' : 'text-cream-muted hover:text-danger'
                      } disabled:opacity-60`}
                    >
                      {prayingInFlight[req.id]
                        ? <GoldSpinner size={14} />
                        : <Heart size={14} className={isPraying ? 'fill-current' : ''} />
                      }
                      {isPraying ? "I'm praying" : 'Pray for this'}
                    </button>
                    {prayingList.length > 0 && (
                      <span className="font-body text-cream-muted text-xs">{prayingList.length} praying</span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Post Prayer Request" maxWidth="max-w-md">
        <form onSubmit={handlePost} className="flex flex-col gap-4">
          <div>
            <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">Title</label>
            <input type="text" value={form.title} onChange={e => setForm(f => ({...f,title:e.target.value}))} className="worship-input" placeholder="Brief title" required />
          </div>
          <div>
            <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">Details (optional)</label>
            <textarea value={form.detail} onChange={e => setForm(f => ({...f,detail:e.target.value}))} className="worship-input resize-none" rows={4} placeholder="Share as much or as little as you like..." />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isAnonymous} onChange={e => setForm(f => ({...f,isAnonymous:e.target.checked}))} className="w-4 h-4 accent-gold" />
            <div className="flex items-center gap-1.5">
              <EyeOff size={14} className="text-cream-muted" />
              <span className="font-body text-cream-muted text-sm">Post anonymously</span>
            </div>
          </label>
          <button type="submit" disabled={saving} className="btn-gold w-full justify-center">
            {saving ? <GoldSpinner size={18} /> : 'Post Request 🙏'}
          </button>
        </form>
      </Modal>

      <Modal open={!!showAnswer} onClose={() => setShowAnswer(null)} title="Mark as Answered" maxWidth="max-w-md">
        <form onSubmit={handleMarkAnswered} className="flex flex-col gap-4">
          <div className="bg-success/10 border border-success/30 rounded-lg p-3">
            <p className="font-body text-success text-sm font-bold">{showAnswer?.title}</p>
          </div>
          <p className="font-body text-cream-muted text-sm">Share the testimony — how did God answer this prayer?</p>
          <div>
            <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">Testimony <span className="text-cream-muted">(min. 20 characters)</span></label>
            <textarea
              value={testimony}
              onChange={e => setTestimony(e.target.value)}
              className="worship-input resize-none"
              rows={5}
              placeholder="God answered by..."
              required
              minLength={20}
            />
            <p className={`font-body text-xs mt-1 ${testimony.length >= 20 ? 'text-success' : 'text-cream-muted'}`}>
              {testimony.length}/20 minimum
            </p>
          </div>
          <button type="submit" disabled={saving || testimony.length < 20} className="btn-gold w-full justify-center">
            {saving ? <GoldSpinner size={18} /> : 'Record Answered Prayer 🕊️'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
