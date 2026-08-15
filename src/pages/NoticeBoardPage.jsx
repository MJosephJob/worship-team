import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiFetch, invalidateCache } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { Megaphone, Plus, Trash2, Edit, Share2, AlertTriangle } from 'lucide-react'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import GoldSpinner from '../components/GoldSpinner'
import PageHeader from '../components/PageHeader'
import ConfirmDialog from '../components/ConfirmDialog'

const URGENCIES = ['Info','Important','Urgent','Meeting']
const urgencyLabel = { Info: 'urgency-info', Important: 'urgency-important', Urgent: 'urgency-urgent', Meeting: 'urgency-important' }

function NoticeSkeletonCard() {
  return (
    <div className="worship-card p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 w-16 rounded-full skeleton-shimmer bg-surface-raised" />
        <div className="h-3 w-20 rounded skeleton-shimmer bg-surface-raised" />
      </div>
      <div className="h-4 w-3/4 rounded mb-2 skeleton-shimmer bg-surface-raised" />
      <div className="h-3 w-1/3 rounded mb-3 skeleton-shimmer bg-surface-raised" />
      <div className="h-3 w-full rounded mb-1 skeleton-shimmer bg-surface-raised" />
      <div className="h-3 w-5/6 rounded mb-4 skeleton-shimmer bg-surface-raised" />
      <div className="border-t border-border pt-3">
        <div className="h-8 w-28 rounded-lg skeleton-shimmer bg-surface-raised" />
      </div>
    </div>
  )
}

export default function NoticeBoardPage() {
  const { member } = useAuth()
  const { toast, whatsappLink } = useApp()
  const [searchParams] = useSearchParams()
  const deepLinkId = searchParams.get('id')
  const isAdmin = ['ADMIN','SUPER_ADMIN'].includes(member.role)
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [form, setForm] = useState({ title:'', body:'', urgency:'Info' })
  const [saving, setSaving] = useState(false)
  const [highlightId, setHighlightId] = useState(null)

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!deepLinkId || loading || announcements.length === 0) return
    const el = document.getElementById('notice-' + deepLinkId)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setHighlightId(deepLinkId)
    const t = setTimeout(() => setHighlightId(null), 1500)
    return () => clearTimeout(t)
  }, [deepLinkId, loading, announcements])

  async function load() {
    setLoading(true)
    try {
      const [data] = await Promise.all([
        apiFetch('getAnnouncements', { memberId: member.id }),
        apiFetch('markAnnouncementsRead', { memberId: member.id }),
      ])
      setAnnouncements(Array.isArray(data) ? data : [])
    } catch (err) { toast(err.message, 'error') }
    finally { setLoading(false) }
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await apiFetch('updateAnnouncement', { ...form, id: editing.id })
        invalidateCache('getAnnouncements')
        toast('Announcement updated', 'success')
      } else {
        await apiFetch('createAnnouncement', { ...form, createdBy: member.id })
        invalidateCache('getAnnouncements')
        toast('Announcement posted', 'success')
      }
      setShowAdd(false)
      setEditing(null)
      setForm({ title:'', body:'', urgency:'Info' })
      load()
    } catch (err) { toast(err.message, 'error') }
    finally { setSaving(false) }
  }

  function openEdit(a) {
    setForm({ title: a.title, body: a.body, urgency: a.urgency })
    setEditing(a)
    setShowAdd(true)
  }

  async function handleDelete(id) {
    try {
      await apiFetch('deleteAnnouncement', { id })
      invalidateCache('getAnnouncements')
      toast('Announcement deleted', 'success')
      load()
    } catch (err) { toast(err.message, 'error') }
  }

  function handleAcknowledge(id) {
    const prev = announcements
    setAnnouncements(list => list.map(a => {
      if (a.id !== id) return a
      return { ...a, myAcknowledged: true, acknowledgedNames: [...(a.acknowledgedNames || []), member.name] }
    }))
    apiFetch('acknowledgeAnnouncement', { id, memberId: member.id })
      .then(() => invalidateCache('getAnnouncements'))
      .catch(err => { setAnnouncements(prev); toast(err.message, 'error') })
  }

  function handleRsvp(id, response, reason) {
    const prev = announcements
    setAnnouncements(list => list.map(a => {
      if (a.id !== id) return a
      const myName = member.name
      const yesNames = (a.rsvpYesNames || []).filter(n => n !== myName)
      const noNames  = (a.rsvpNoNames  || []).filter(n => n !== myName)
      return {
        ...a,
        myRsvp: response,
        rsvpYesNames: response === 'yes' ? [...yesNames, myName] : yesNames,
        rsvpNoNames:  response === 'no'  ? [...noNames,  myName] : noNames,
      }
    }))
    apiFetch('rsvpAnnouncement', { id, memberId: member.id, response, reason: reason || '' })
      .then(() => invalidateCache('getAnnouncements'))
      .catch(err => { setAnnouncements(prev); toast(err.message, 'error') })
  }

  function shareToWhatsApp(a) {
    const text = encodeURIComponent(`📢 *${a.title}*\n\n${a.body}`)
    const link = whatsappLink ? `https://wa.me/${whatsappLink.replace(/\D/g,'')}?text=${text}` : `https://wa.me/?text=${text}`
    window.open(link, '_blank')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Notice Board"
        subtitle="Team announcements"
        actions={isAdmin && (
          <button onClick={() => { setEditing(null); setForm({ title:'', body:'', urgency:'Info' }); setShowAdd(true) }} className="btn-gold text-sm py-2">
            <Plus size={15} /> Post
          </button>
        )}
      />

      {loading ? (
        <div className="max-w-2xl mx-auto px-4 py-4">
          <NoticeSkeletonCard />
          <NoticeSkeletonCard />
          <NoticeSkeletonCard />
        </div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="text-5xl mb-4">📢</div>
          <h3 className="font-body font-semibold text-cream text-lg mb-2">No notices yet</h3>
          <p className="font-body text-cream-muted text-sm mb-6">Nothing has been posted yet. Check back soon.</p>
          {isAdmin && (
            <button
              onClick={() => { setEditing(null); setForm({ title:'', body:'', urgency:'Info' }); setShowAdd(true) }}
              className="btn-gold px-6 py-2 text-sm font-body"
            >
              Post the first notice
            </button>
          )}
        </div>
      ) : (
        <div className="px-4 flex flex-col gap-3 card-stagger">
          {announcements.map(a => (
            <AnnouncementCard key={a.id} a={a} isAdmin={isAdmin} highlight={highlightId === a.id} onEdit={openEdit} onDelete={setConfirmDelete} onShare={shareToWhatsApp} onAcknowledge={handleAcknowledge} onRsvp={handleRsvp} />
          ))}
        </div>
      )}

      <Modal
        open={showAdd}
        onClose={() => { setShowAdd(false); setEditing(null) }}
        title={editing ? 'Edit Announcement' : 'New Announcement'}
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">Title</label>
            <input type="text" value={form.title} onChange={e => setForm(f => ({...f,title:e.target.value}))} className="worship-input" required />
          </div>
          <div>
            <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">Body</label>
            <textarea value={form.body} onChange={e => setForm(f => ({...f,body:e.target.value}))} className="worship-input resize-none" rows={5} required />
          </div>
          <div>
            <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">Urgency</label>
            <div className="flex gap-2">
              {URGENCIES.map(u => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setForm(f => ({...f,urgency:u}))}
                  className={`flex-1 py-2 rounded-lg font-body text-sm font-bold border transition-all ${
                    form.urgency === u ? urgencyLabel[u] : 'text-cream-muted border-border'
                  }`}
                >{u}</button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-gold w-full justify-center">
            {saving ? <GoldSpinner size={18} /> : editing ? 'Update' : 'Post Announcement'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => handleDelete(confirmDelete?.id)}
        title="Delete Announcement"
        message={`Are you sure you want to delete "${confirmDelete?.title}"?`}
        confirmLabel="Delete"
        danger
      />
    </div>
  )
}

function CollapsibleNames({ label, names }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-1.5">
      <button onClick={() => setOpen(p => !p)} className="font-body text-cream-muted text-xs hover:text-cream">
        {open ? '▾' : '▸'} {label} ({names.length})
      </button>
      {open && (
        <div className="mt-1 flex flex-wrap gap-1">
          {names.length === 0 ? (
            <span className="font-body text-cream-muted text-xs">No one yet</span>
          ) : names.map((name, i) => (
            <span key={i} className="font-body text-xs bg-surface px-2 py-0.5 rounded-full text-cream-muted">{name}</span>
          ))}
        </div>
      )}
    </div>
  )
}

function isRecentNotice(createdAt) {
  if (!createdAt) return false
  const datePart = createdAt.split(' ')[0]
  if (!datePart) return false
  const now = new Date()
  const istOffset = 5.5 * 60 * 60 * 1000
  const nowIST = new Date(now.getTime() + istOffset)
  const todayIST = nowIST.toISOString().slice(0, 10)
  const yesterdayIST = new Date(nowIST.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  return datePart === todayIST || datePart === yesterdayIST
}

function AnnouncementCard({ a, isAdmin, highlight, onEdit, onDelete, onShare, onAcknowledge, onRsvp }) {
  const [expanded, setExpanded] = useState(false)
  const [showNoReason, setShowNoReason] = useState(false)
  const [noReason, setNoReason] = useState('')
  const isMeeting = a.urgency === 'Meeting'
  const needsAck  = a.urgency === 'Info' || a.urgency === 'Urgent'
  const isNew = isRecentNotice(a.createdAt)

  return (
    <div
      id={'notice-' + a.id}
      className={`worship-card p-4 transition-all duration-700 ${a.urgency === 'Urgent' ? 'border-danger/40' : ''} ${isNew && !highlight ? 'border-l-4 border-l-success' : ''} ${highlight ? 'border-gold shadow-gold-glow' : ''}`}
    >
      {a.urgency === 'Urgent' && (
        <div className="flex items-center gap-1.5 mb-2">
          <AlertTriangle size={13} className="text-danger" />
          <span className="font-body text-danger text-xs font-bold uppercase">Urgent</span>
        </div>
      )}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${urgencyLabel[a.urgency] || 'urgency-info'}`}>{a.urgency}</span>
            <span className="font-body text-cream-muted text-xs">{a.createdAtFormatted || ''}</span>
          </div>
          <h3 className="font-body text-cream font-bold flex items-center gap-2">
            {a.title}
            {isNew && <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-success"><span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse inline-block" />New</span>}
          </h3>
          {a.createdBy && (
            <p className="font-body text-cream-muted text-xs mt-0.5">Posted by {a.createdBy}</p>
          )}
          <p className={`font-body text-cream-muted text-sm mt-1 leading-relaxed ${!expanded && 'line-clamp-2'}`}>{a.body}</p>
          {a.body?.length > 120 && (
            <button onClick={() => setExpanded(p => !p)} className="font-body text-gold text-xs mt-1 hover:text-gold-light">
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}

          {needsAck && (
            <div className="mt-3">
              {a.myAcknowledged ? (
                <span className="inline-flex items-center gap-1 font-body text-xs text-success font-semibold">✓ Acknowledged</span>
              ) : (
                <button
                  onClick={() => onAcknowledge(a.id)}
                  className="font-body text-xs px-3 py-1.5 rounded-lg border border-gold/40 text-gold hover:bg-gold/10 transition-all"
                >
                  Acknowledge
                </button>
              )}
            </div>
          )}
          {isMeeting && (
            <div className="mt-3">
              <div className="flex items-center gap-2">
                <span className="font-body text-cream-muted text-xs">RSVP:</span>
                <button
                  onClick={() => {
                    setShowNoReason(false)
                    setNoReason('')
                    onRsvp(a.id, 'yes')
                  }}
                  className={`font-body text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    a.myRsvp === 'yes'
                      ? 'bg-success/20 border-success text-success font-semibold'
                      : 'border-border text-cream-muted hover:border-success/50 hover:text-success'
                  }`}
                >
                  ✓ Yes
                </button>
                <button
                  onClick={() => {
                    setShowNoReason(true)
                    setNoReason('')
                  }}
                  className={`font-body text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    a.myRsvp === 'no' && !showNoReason
                      ? 'bg-danger/20 border-danger text-danger font-semibold'
                      : showNoReason
                        ? 'bg-danger/10 border-danger/60 text-danger'
                        : 'border-border text-cream-muted hover:border-danger/50 hover:text-danger'
                  }`}
                >
                  ✗ No
                </button>
              </div>
              {showNoReason && (
                <div className="mt-2">
                  <textarea
                    value={noReason}
                    onChange={e => setNoReason(e.target.value)}
                    placeholder="Please let us know why you can't make it (required)"
                    rows={3}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 font-body text-sm text-cream placeholder-cream-muted resize-none focus:outline-none focus:border-gold transition-colors"
                  />
                  <button
                    disabled={noReason.trim().length < 10}
                    onClick={() => {
                      onRsvp(a.id, 'no', noReason.trim())
                      setShowNoReason(false)
                      setNoReason('')
                    }}
                    className="mt-2 font-body text-xs px-4 py-1.5 rounded-lg border border-danger text-danger bg-danger/10 hover:bg-danger/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Confirm No
                  </button>
                </div>
              )}
            </div>
          )}

          {isAdmin && (
            <div className="mt-2 space-y-0.5">
              <CollapsibleNames label="Seen by" names={a.readByNames || []} />
              {needsAck && <CollapsibleNames label="Acknowledged" names={a.acknowledgedNames || []} />}
              {isMeeting && (
                <>
                  <CollapsibleNames label="RSVP Yes" names={a.rsvpYesNames || []} />
                  <CollapsibleNames label="RSVP No"  names={a.rsvpNoNames  || []} />
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
        <button onClick={() => onShare(a)} className="flex items-center gap-1 font-body text-xs text-success hover:text-success/80">
          <Share2 size={12} /> WhatsApp
        </button>
        {isAdmin && (
          <>
            <button onClick={() => onEdit(a)} className="flex items-center gap-1 font-body text-xs text-cream-muted hover:text-cream ml-auto">
              <Edit size={12} /> Edit
            </button>
            <button onClick={() => onDelete(a)} className="flex items-center gap-1 font-body text-xs text-danger hover:text-danger/80">
              <Trash2 size={12} /> Delete
            </button>
          </>
        )}
      </div>
    </div>
  )
}
