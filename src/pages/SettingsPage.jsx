import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { apiFetch } from '../utils/api'
import { sha256 } from '../utils/sha256'
import { setAppsScriptUrl } from '../utils/api'
import { useNavigate } from 'react-router-dom'
import { Users, Package, Settings, Shield, Link2, Database, Bell, Edit, Plus, Trash2, Download, Upload, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-react'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import GoldSpinner from '../components/GoldSpinner'
import PageHeader from '../components/PageHeader'
import InstrumentPicker from '../components/InstrumentPicker'
import RichTextEditor from '../components/RichTextEditor'

const ROLES = ['MEMBER','ADMIN','SUPER_ADMIN']
const DEPARTMENTS = ['WORSHIP','ASSETS','SOUND','PRAYER','EVENTS','AUDITIONS']
const DEPARTMENT_LABELS = { WORSHIP: 'Worship', ASSETS: 'Assets', SOUND: 'Sound', PRAYER: 'Prayer', EVENTS: 'Events', AUDITIONS: 'Auditions' }

export default function SettingsPage() {
  const { member, refreshMember } = useAuth()
  const { toast, setWhatsappLink, setTeam, whatsappLink, teamName } = useApp()
  const navigate = useNavigate()
  const isAdmin = ['ADMIN','SUPER_ADMIN'].includes(member.role)
  const isSuperAdmin = member.role === 'SUPER_ADMIN'
  const [activeTab, setActiveTab] = useState('members')
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [memberForm, setMemberForm] = useState({ name:'', email:'', phone:'', gender:'Male', instrument:'', birthday:'', tempPassword:'' })
  const [saving, setSaving] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(null)
  const [vmForm, setVmForm] = useState({ vision:'', mission:'', values:'' })
  const [quizQuestions, setQuizQuestions] = useState([])
  const [editedQuestions, setEditedQuestions] = useState({})
  const [savingQ, setSavingQ] = useState({})
  const [showAddQ, setShowAddQ] = useState(false)
  const [qForm, setQForm] = useState({ question:'', options:['','','',''], correctIndex:0 })
  const [onboardingItems, setOnboardingItems] = useState([])
  const [showAddItem, setShowAddItem] = useState(false)
  const [itemForm, setItemForm] = useState({ title:'', description:'', required: true })
  const [editingItem, setEditingItem] = useState(null)
  const [editItemTitle, setEditItemTitle] = useState('')
  const [confirmDeleteItem, setConfirmDeleteItem] = useState(null)
  const [settings, setSettings] = useState({})
  const [confirmClear, setConfirmClear] = useState(false)
  const [clearConfirmCount, setClearConfirmCount] = useState(0)
  const [fbConfig, setFbConfig] = useState('')

  useEffect(() => {
    if (member.role === 'MEMBER') { navigate('/profile', { replace: true }); return }
    if (isAdmin) loadMembers()
    if (isSuperAdmin) loadSuperAdminData()
    loadSettings()
  }, [])

  async function loadMembers() {
    setLoading(true)
    try {
      const data = await apiFetch('getMembers', {})
      setMembers(Array.isArray(data) ? data : [])
    } catch (err) { toast(err.message, 'error') }
    finally { setLoading(false) }
  }

  async function loadSuperAdminData() {
    try {
      const [vm, quiz, items] = await Promise.all([
        apiFetch('getVMContent', {}),
        apiFetch('getQuizQuestions', {}),
        apiFetch('getOnboardingChecklist', {}),
      ])
      setVmForm(vm || { vision:'', mission:'', values:'' })
      setQuizQuestions(Array.isArray(quiz) ? quiz : [])
      setOnboardingItems(Array.isArray(items) ? items : [])
    } catch {}
  }

  async function loadSettings() {
    try {
      const data = await apiFetch('getAllSettings', {})
      const map = {}
      if (Array.isArray(data)) data.forEach(s => { map[s.key] = s.value })
      setSettings(map)
      if (map.whatsappLink) setWhatsappLink(map.whatsappLink)
      if (map.teamName) setTeam(map.teamName, map.teamLogo)
      const fb = map.firebaseConfig ? JSON.parse(map.firebaseConfig) : null
      if (fb) setFbConfig(JSON.stringify(fb, null, 2))
    } catch {}
  }

  async function handleAddMember(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const hash = await sha256(memberForm.tempPassword)
      await apiFetch('createMember', { ...memberForm, passwordHash: hash, role: 'MEMBER', isActive: true, joinDate: new Date().toISOString() })
      toast('Member added!', 'success')
      setShowAddMember(false)
      setMemberForm({ name:'', email:'', phone:'', gender:'Male', instrument:'', birthday:'', tempPassword:'' })
      loadMembers()
    } catch (err) { toast(err.message, 'error') }
    finally { setSaving(false) }
  }

  async function handleRemoveMember(m) {
    try {
      await apiFetch('deleteMember', { id: m.id })
      toast('Member removed', 'success')
      loadMembers()
    } catch (err) { toast(err.message, 'error') }
  }

  async function handleRoleChange(m, newRole) {
    if (m.role === 'SUPER_ADMIN') return toast('Cannot demote Super Admin', 'warning')
    try {
      await apiFetch('updateMember', { id: m.id, role: newRole })
      toast('Role updated', 'success')
      loadMembers()
    } catch (err) { toast(err.message, 'error') }
  }

  async function handleDepartmentsChange(m, dept) {
    const current = (m.adminDepartments || '').split(',').filter(Boolean)
    const next = current.includes(dept) ? current.filter(d => d !== dept) : [...current, dept]
    try {
      await apiFetch('updateMember', { id: m.id, requestingMemberId: member.id, adminDepartments: next.join(',') })
      loadMembers()
    } catch (err) { toast(err.message, 'error') }
  }

  async function handleSaveVM(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await apiFetch('updateVMContent', {
        vision: vmForm.vision || '',
        mission: vmForm.mission || '',
        values: vmForm.values || '',
      })
      toast('Vision & Mission saved!', 'success')
    } catch (err) {
      toast('Save failed: ' + err.message, 'error')
    } finally { setSaving(false) }
  }

  async function handleAddQuestion(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await apiFetch('addQuizQuestion', qForm)
      toast('Question added', 'success')
      setShowAddQ(false)
      setQForm({ question:'', options:['','','',''], correctIndex:0 })
      loadSuperAdminData()
    } catch (err) { toast(err.message, 'error') }
    finally { setSaving(false) }
  }

  async function handleDeleteQuestion(id) {
    try {
      await apiFetch('deleteQuizQuestion', { id })
      toast('Question deleted', 'success')
      loadSuperAdminData()
    } catch (err) { toast(err.message, 'error') }
  }

  function getEditedQ(q) {
    return editedQuestions[q.id] !== undefined ? editedQuestions[q.id] : q
  }

  function updateEditedQ(id, patch) {
    setEditedQuestions(prev => ({ ...prev, [id]: { ...getEditedQ({ id, ...quizQuestions.find(x => x.id === id) }), ...patch } }))
  }

  function getMergedQuestions(overrides) {
    return quizQuestions.map(q => overrides[q.id] ? { ...q, ...overrides[q.id], id: q.id } : q)
  }

  async function saveQuestion(id) {
    if (!editedQuestions[id]) { toast('No changes to save', 'info'); return }
    setSavingQ(prev => ({ ...prev, [id]: true }))
    try {
      const merged = getMergedQuestions({ [id]: editedQuestions[id] })
      await apiFetch('saveAllQuizQuestions', { questions: merged })
      toast('Question saved!', 'success')
      setEditedQuestions(prev => { const n = { ...prev }; delete n[id]; return n })
      loadSuperAdminData()
    } catch (err) { toast('Save failed: ' + err.message, 'error') }
    finally { setSavingQ(prev => ({ ...prev, [id]: false })) }
  }

  async function saveAllQuestions() {
    const ids = Object.keys(editedQuestions)
    if (!ids.length) { toast('No changes to save', 'info'); return }
    setSaving(true)
    try {
      const merged = getMergedQuestions(editedQuestions)
      await apiFetch('saveAllQuizQuestions', { questions: merged })
      toast(`Saved ${ids.length} question(s)!`, 'success')
      setEditedQuestions({})
      loadSuperAdminData()
    } catch (err) { toast('Save failed: ' + err.message, 'error') }
    finally { setSaving(false) }
  }

  async function handleAddItem(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await apiFetch('addOnboardingItem', itemForm)
      toast('Item added', 'success')
      setShowAddItem(false)
      setItemForm({ title:'', description:'', required: true })
      loadSuperAdminData()
    } catch (err) { toast(err.message, 'error') }
    finally { setSaving(false) }
  }

  async function handleSaveEditItem(item) {
    if (!editItemTitle.trim()) return
    try {
      await apiFetch('updateOnboardingItem', { id: item.id, title: editItemTitle.trim() })
      toast('Item updated', 'success')
      setEditingItem(null)
      loadSuperAdminData()
    } catch (err) { toast(err.message, 'error') }
  }

  async function handleDeleteItem(item) {
    try {
      await apiFetch('deleteOnboardingItem', { id: item.id })
      toast('Item deleted', 'success')
      loadSuperAdminData()
    } catch (err) { toast(err.message, 'error') }
  }

  async function handleMoveItem(index, dir) {
    const items = [...onboardingItems]
    const target = index + dir
    if (target < 0 || target >= items.length) return
    const tmp = items[index]; items[index] = items[target]; items[target] = tmp
    setOnboardingItems(items)
    try {
      await apiFetch('reorderOnboardingItems', { items: JSON.stringify(items) })
    } catch (err) { toast(err.message, 'error') }
  }

  async function saveSetting(key, value) {
    try {
      await apiFetch('updateSettings', { key, value })
      setSettings(prev => ({ ...prev, [key]: value }))
    } catch (err) { toast(err.message, 'error') }
  }

  async function saveWhatsApp(link) {
    await saveSetting('whatsappLink', link)
    setWhatsappLink(link)
    toast('WhatsApp link saved', 'success')
  }

  async function saveFBConfig() {
    try {
      JSON.parse(fbConfig)
      localStorage.setItem('fbConfig', fbConfig)
      await saveSetting('firebaseConfig', fbConfig)
      toast('Firebase config saved', 'success')
    } catch { toast('Invalid JSON. Please check and try again.', 'error') }
  }

  function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const base64 = ev.target.result
      await saveSetting('teamLogo', base64)
      setTeam(settings.teamName || teamName, base64)
      toast('Logo updated', 'success')
    }
    reader.readAsDataURL(file)
  }

  async function exportData() {
    try {
      const data = await apiFetch('exportData', {})
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cbc-worship-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) { toast(err.message, 'error') }
  }

  function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const json = JSON.parse(ev.target.result)
        await apiFetch('importData', { data: JSON.stringify(json) })
        toast('Data imported successfully', 'success')
      } catch (err) { toast('Invalid backup file: ' + err.message, 'error') }
    }
    reader.readAsText(file)
  }

  async function clearAllData() {
    if (clearConfirmCount < 2) {
      setClearConfirmCount(p => p + 1)
      toast(`Warning: Click ${2 - clearConfirmCount} more time(s) to confirm deletion`, 'warning')
      return
    }
    try {
      await apiFetch('clearAllData', {})
      toast('All data cleared', 'success')
      setClearConfirmCount(0)
      setConfirmClear(false)
    } catch (err) { toast(err.message, 'error') }
  }

  if (member.role === 'MEMBER') return null

  const tabs = [
    { key: 'members', label: 'Members', icon: Users, show: isAdmin },
    { key: 'vm', label: 'V&M', icon: Edit, show: isSuperAdmin },
    { key: 'checklist', label: 'Checklist', icon: Settings, show: isSuperAdmin },
    { key: 'integrations', label: 'Integrations', icon: Link2, show: isSuperAdmin },
    { key: 'general', label: 'General', icon: Settings, show: isAdmin },
    { key: 'data', label: 'Data', icon: Database, show: isSuperAdmin },
  ].filter(t => t.show)

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Settings" />

      {/* Tab bar */}
      <div className="px-4 mb-4 overflow-x-auto">
        <div className="flex gap-1 pb-2">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-body text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                activeTab === t.key ? 'bg-gold/10 text-gold border border-gold/30' : 'text-cream-muted hover:text-cream'
              }`}
            >
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-8">
        {/* Members */}
        {activeTab === 'members' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <button onClick={() => setShowAddMember(true)} className="btn-gold text-sm py-2">
                <Plus size={14} /> Add Member
              </button>
            </div>
            {loading ? <div className="flex justify-center py-8"><GoldSpinner /></div> : (
              <div className="flex flex-col gap-2">
                {members.map(m => (
                  <div key={m.id} className="worship-card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {m.photoBase64
                        ? <img src={m.photoBase64} alt="" className="w-full h-full object-cover" />
                        : <span className="font-body text-gold text-sm font-bold">{m.name?.[0]}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-cream text-sm font-bold truncate">{m.name}</p>
                      <p className="font-body text-cream-muted text-xs">{m.email} · {m.instrument}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-body ${m.isOnboarded ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                          {m.isOnboarded ? 'Onboarded' : 'Pending'}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-info/10 text-info font-body">{m.role}</span>
                      </div>
                      {isSuperAdmin && (m.role === 'ADMIN' || m.role === 'SUPER_ADMIN') && (
                        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                          {DEPARTMENTS.map(dept => {
                            const active = (m.adminDepartments || '').split(',').filter(Boolean).includes(dept)
                            return (
                              <button
                                key={dept}
                                type="button"
                                onClick={() => handleDepartmentsChange(m, dept)}
                                className={`text-[10px] px-2 py-0.5 rounded-full font-body border transition-colors ${
                                  active ? 'bg-gold/15 text-gold border-gold/40' : 'bg-surface-raised text-cream-muted border-border hover:border-gold/30'
                                }`}
                              >
                                {DEPARTMENT_LABELS[dept]}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                    {isSuperAdmin && m.role !== 'SUPER_ADMIN' && (
                      <select
                        value={m.role}
                        onChange={e => handleRoleChange(m, e.target.value)}
                        className="text-xs bg-surface-raised border border-border rounded px-2 py-1 text-cream font-body"
                      >
                        {ROLES.map(r => <option key={r}>{r}</option>)}
                      </select>
                    )}
                    {m.id !== member.id && m.role !== 'SUPER_ADMIN' && (
                      <button onClick={() => setConfirmRemove(m)} className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center text-danger hover:bg-danger/20 transition-colors flex-shrink-0" data-tooltip="Remove member">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Vision & Mission */}
        {activeTab === 'vm' && (
          <form onSubmit={handleSaveVM} className="flex flex-col gap-4">
            {[['vision','Vision'], ['mission','Mission'], ['values','Expectations & Values']].map(([key, label]) => (
              <div key={key}>
                <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">{label}</label>
                <RichTextEditor
                  value={vmForm[key]}
                  onChange={html => setVmForm(f => ({...f, [key]: html}))}
                  rows={6}
                  placeholder={`Enter team ${label.toLowerCase()}...`}
                />
              </div>
            ))}
            <button type="submit" disabled={saving} className="btn-gold w-full justify-center">
              {saving ? <GoldSpinner size={18} /> : 'Save V&M'}
            </button>
          </form>
        )}

        {/* QUIZ DISABLED — VM is now read-only with one-time sign-off */}
        {false && activeTab === 'quiz' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="font-body text-cream-muted text-sm">{quizQuestions.length} questions (minimum 5 required)</p>
              <button onClick={() => setShowAddQ(true)} className="btn-gold text-sm py-2">
                <Plus size={14} /> Add Question
              </button>
            </div>
            {quizQuestions.map((q, i) => {
              const eq = getEditedQ(q)
              const isDirty = !!editedQuestions[q.id]
              return (
                <div key={q.id || i} className={`worship-card p-4 ${isDirty ? 'border-gold/40' : ''}`}>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="font-body text-cream-muted text-xs font-bold">Q{i+1}</span>
                    <button onClick={() => handleDeleteQuestion(q.id)} className="w-7 h-7 rounded bg-danger/10 flex items-center justify-center text-danger flex-shrink-0" title="Delete question">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <textarea
                    value={eq.question}
                    onChange={e => updateEditedQ(q.id, { question: e.target.value })}
                    className="worship-input resize-none text-sm mb-3"
                    rows={2}
                  />
                  <div className="flex flex-col gap-1.5 mb-3">
                    {(eq.options || []).map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct_${q.id}`}
                          checked={eq.correctIndex === oi}
                          onChange={() => updateEditedQ(q.id, { correctIndex: oi })}
                          className="accent-gold w-4 h-4 flex-shrink-0"
                          title="Mark correct"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={e => {
                            const opts = [...(eq.options || [])]
                            opts[oi] = e.target.value
                            updateEditedQ(q.id, { options: opts })
                          }}
                          className={`worship-input text-sm ${eq.correctIndex === oi ? 'border-success/40' : ''}`}
                          placeholder={`Option ${oi+1}`}
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => saveQuestion(q.id)}
                    disabled={savingQ[q.id]}
                    className={`btn-gold text-xs py-1.5 px-3 w-full justify-center ${!isDirty ? 'opacity-50' : ''}`}
                  >
                    {savingQ[q.id] ? <GoldSpinner size={14} /> : 'Save Question'}
                  </button>
                </div>
              )
            })}
            {quizQuestions.length > 0 && (
              <button onClick={saveAllQuestions} disabled={saving || Object.keys(editedQuestions).length === 0} className="btn-outline w-full justify-center">
                {saving ? <GoldSpinner size={18} /> : `Save All Questions${Object.keys(editedQuestions).length > 0 ? ` (${Object.keys(editedQuestions).length} changed)` : ''}`}
              </button>
            )}
          </div>
        )}

        {/* Onboarding Checklist */}
        {activeTab === 'checklist' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <button onClick={() => setShowAddItem(true)} className="btn-gold text-sm py-2">
                <Plus size={14} /> Add Item
              </button>
            </div>
            {onboardingItems.map((item, i) => (
              <div key={item.id || i} className="worship-card p-4 flex items-start gap-3">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => handleMoveItem(i, -1)} disabled={i === 0} className="text-cream-muted hover:text-gold disabled:opacity-30 p-0.5"><ChevronUp size={13} /></button>
                  <button onClick={() => handleMoveItem(i, 1)} disabled={i === onboardingItems.length - 1} className="text-cream-muted hover:text-gold disabled:opacity-30 p-0.5"><ChevronDown size={13} /></button>
                </div>
                <div className={`text-xs mt-0.5 px-1.5 py-0.5 rounded font-body flex-shrink-0 ${item.required ? 'bg-gold/10 text-gold' : 'bg-surface-raised text-cream-muted'}`}>
                  {item.required ? 'Required' : 'Optional'}
                </div>
                <div className="flex-1">
                  {editingItem === item.id ? (
                    <input
                      type="text"
                      value={editItemTitle}
                      onChange={e => setEditItemTitle(e.target.value)}
                      onBlur={() => handleSaveEditItem(item)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveEditItem(item); if (e.key === 'Escape') setEditingItem(null) }}
                      className="worship-input text-sm py-1 mb-1"
                      autoFocus
                    />
                  ) : (
                    <p className="font-body text-cream text-sm font-bold">{item.title}</p>
                  )}
                  {item.description && <p className="font-body text-cream-muted text-xs mt-0.5">{item.description}</p>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => { setEditingItem(item.id); setEditItemTitle(item.title) }}
                    className="w-7 h-7 rounded bg-info/10 flex items-center justify-center text-info hover:bg-info/20"
                    title="Edit"
                  >
                    <Edit size={12} />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteItem(item)}
                    className="w-7 h-7 rounded bg-danger/10 flex items-center justify-center text-danger hover:bg-danger/20"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Integrations */}
        {activeTab === 'integrations' && (
          <div className="flex flex-col gap-6">
            <div className="worship-card p-5">
              <h3 className="font-body text-cream font-semibold mb-3 flex items-center gap-2"><Bell size={16} className="text-gold" /> Firebase (Push Notifications)</h3>
              <textarea
                value={fbConfig}
                onChange={e => setFbConfig(e.target.value)}
                className="worship-input resize-none font-mono text-xs"
                rows={8}
                placeholder={'{\n  "apiKey": "...",\n  "authDomain": "...",\n  ...\n}'}
              />
              <button onClick={saveFBConfig} className="btn-gold text-sm mt-3 w-full justify-center">Save Firebase Config</button>
            </div>

            <div className="worship-card p-5">
              <h3 className="font-body text-cream font-semibold mb-3 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                Email (GmailApp)
              </h3>
              <div className="bg-success/10 border border-success/30 rounded-lg px-4 py-3">
                <p className="font-body text-success text-sm font-semibold mb-1">No configuration needed</p>
                <p className="font-body text-cream-muted text-xs leading-relaxed">Emails are sent via the Google account that owns the Apps Script deployment using GmailApp. Welcome emails, password resets, announcements, onboarding alerts, and audition notifications are all sent automatically — no API keys required.</p>
              </div>
              <p className="font-body text-cream-muted text-xs mt-3 leading-relaxed">To send monthly V&amp;M reminders and overdue maintenance alerts, set up time-based triggers in <strong className="text-cream">Apps Script → Triggers</strong> for <code className="text-gold text-xs">sendVMReminders</code> (monthly) and <code className="text-gold text-xs">sendMaintenanceAlerts</code> (daily).</p>
            </div>
          </div>
        )}

        {/* General */}
        {activeTab === 'general' && (
          <div className="flex flex-col gap-4">
            <div className="worship-card p-5">
              <h3 className="font-body text-cream font-semibold mb-3 flex items-center gap-2"><Link2 size={16} className="text-success" /> WhatsApp Group Link</h3>
              <input
                type="url"
                defaultValue={whatsappLink}
                onBlur={e => saveWhatsApp(e.target.value)}
                className="worship-input"
                placeholder="https://chat.whatsapp.com/..."
              />
              <p className="font-body text-cream-muted text-xs mt-1.5">Paste your WhatsApp group invite link here.</p>
            </div>
            {isSuperAdmin && (
              <div className="worship-card p-5">
                <h3 className="font-body text-cream font-semibold mb-3">Team Identity</h3>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-4">
                    <img
                      src={settings.teamLogo || '/icons/CBC_logo.png'}
                      alt="Team logo"
                      className="w-[60px] h-[60px] rounded-full object-cover border border-gold/30 flex-shrink-0"
                    />
                    <div className="flex-1">
                      <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">Team Logo</label>
                      <label className="btn-outline text-xs cursor-pointer py-1.5 inline-flex">
                        Upload Image
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      </label>
                      <p className="font-body text-cream-muted text-[11px] mt-1">PNG or JPG, shown in the top nav bar.</p>
                    </div>
                  </div>
                  <div>
                    <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1">Team Name</label>
                    <input
                      type="text"
                      defaultValue={settings.teamName || teamName}
                      onBlur={e => { saveSetting('teamName', e.target.value); setTeam(e.target.value, settings.teamLogo) }}
                      className="worship-input"
                    />
                  </div>
                  <div>
                    <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1">Apps Script URL</label>
                    <input
                      type="url"
                      defaultValue={localStorage.getItem('appsScriptUrl') || ''}
                      onBlur={e => { setAppsScriptUrl(e.target.value); toast('Apps Script URL updated', 'success') }}
                      className="worship-input"
                      placeholder="https://script.google.com/macros/s/..."
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="worship-card p-5">
              <h3 className="font-body text-cream font-semibold mb-3">Notification Schedule</h3>
              {[
                ['vmReminderDay', 'Monthly V&M Reminder Day', '1'],
                ['prayerPartnerDay', 'Prayer Partner Reminder Day', 'Sunday'],
                ['rosterReminderDays', 'Roster Reminder (days before)', '3'],
                ['birthdayTime', 'Birthday Notification Time', '08:00'],
              ].map(([key, label, placeholder]) => (
                <div key={key} className="mb-3">
                  <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1">{label}</label>
                  <input
                    type="text"
                    defaultValue={settings[key] || ''}
                    onBlur={e => saveSetting(key, e.target.value)}
                    className="worship-input"
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data */}
        {activeTab === 'data' && (
          <div className="flex flex-col gap-4">
            <div className="worship-card p-5">
              <h3 className="font-body text-cream font-semibold mb-3">Export & Backup</h3>
              <div className="flex flex-col gap-3">
                <button onClick={exportData} className="btn-outline w-full justify-center">
                  <Download size={14} /> Export All Data (JSON)
                </button>
                <label className="btn-outline w-full justify-center cursor-pointer">
                  <Upload size={14} /> Import Data (JSON)
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
              </div>
            </div>
            <div className="worship-card p-5 border-danger/30">
              <h3 className="font-body text-danger font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle size={16} /> Danger Zone
              </h3>
              <p className="font-body text-cream-muted text-sm mb-3">This will permanently delete ALL data from all sheets. This action cannot be undone.</p>
              <button onClick={() => setConfirmClear(true)} className="btn-danger w-full justify-center">
                Clear All Data
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      <Modal open={showAddMember} onClose={() => setShowAddMember(false)} title="Add New Member">
        <form onSubmit={handleAddMember} className="flex flex-col gap-3">
          {[['name','Full Name','text'],['email','Email','email'],['phone','Phone','tel']].map(([key,label,type]) => (
            <div key={key}>
              <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1">{label}</label>
              <input type={type} value={memberForm[key]} onChange={e => setMemberForm(f => ({...f,[key]:e.target.value}))} className="worship-input" required={key !== 'phone'} />
            </div>
          ))}
          <div>
            <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1">Gender</label>
            <select value={memberForm.gender} onChange={e => setMemberForm(f => ({...f,gender:e.target.value}))} className="worship-input">
              <option>Male</option><option>Female</option>
            </select>
          </div>
          <div>
            <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1">Instrument(s)</label>
            <InstrumentPicker value={memberForm.instrument} onChange={val => setMemberForm(f => ({...f, instrument: val}))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1">Birthday (DD/MM)</label>
              <input type="text" value={memberForm.birthday} onChange={e => setMemberForm(f => ({...f,birthday:e.target.value}))} className="worship-input" placeholder="25/12" />
            </div>
            <div>
              <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1">Temp Password</label>
              <input type="text" value={memberForm.tempPassword} onChange={e => setMemberForm(f => ({...f,tempPassword:e.target.value}))} className="worship-input" required />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-gold w-full justify-center mt-2">
            {saving ? <GoldSpinner size={18} /> : 'Add Member'}
          </button>
        </form>
      </Modal>

      {/* Add Quiz Question Modal */}
      <Modal open={showAddQ} onClose={() => setShowAddQ(false)} title="Add Quiz Question">
        <form onSubmit={handleAddQuestion} className="flex flex-col gap-4">
          <div>
            <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">Question</label>
            <textarea value={qForm.question} onChange={e => setQForm(f => ({...f,question:e.target.value}))} className="worship-input resize-none" rows={2} required />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-body text-cream-muted text-xs uppercase tracking-wide">Options</label>
            {qForm.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct"
                  checked={qForm.correctIndex === i}
                  onChange={() => setQForm(f => ({...f,correctIndex:i}))}
                  className="accent-gold w-4 h-4 flex-shrink-0"
                  title="Mark as correct answer"
                />
                <input
                  type="text"
                  value={opt}
                  onChange={e => {
                    const opts = [...qForm.options]
                    opts[i] = e.target.value
                    setQForm(f => ({...f,options:opts}))
                  }}
                  className="worship-input flex-1"
                  placeholder={`Option ${i+1}${qForm.correctIndex === i ? ' (correct)' : ''}`}
                  required
                />
              </div>
            ))}
            <p className="font-body text-cream-muted text-xs">Select the radio button next to the correct answer</p>
          </div>
          <button type="submit" disabled={saving} className="btn-gold w-full justify-center">
            {saving ? <GoldSpinner size={18} /> : 'Add Question'}
          </button>
        </form>
      </Modal>

      {/* Add Checklist Item Modal */}
      <Modal open={showAddItem} onClose={() => setShowAddItem(false)} title="Add Checklist Item" maxWidth="max-w-sm">
        <form onSubmit={handleAddItem} className="flex flex-col gap-4">
          <div>
            <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">Title</label>
            <input type="text" value={itemForm.title} onChange={e => setItemForm(f => ({...f,title:e.target.value}))} className="worship-input" required />
          </div>
          <div>
            <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">Description (optional)</label>
            <textarea value={itemForm.description} onChange={e => setItemForm(f => ({...f,description:e.target.value}))} className="worship-input resize-none" rows={2} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={itemForm.required} onChange={e => setItemForm(f => ({...f,required:e.target.checked}))} className="w-4 h-4 accent-gold" />
            <span className="font-body text-cream text-sm">Required item</span>
          </label>
          <button type="submit" disabled={saving} className="btn-gold w-full justify-center">
            {saving ? <GoldSpinner size={18} /> : 'Add Item'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        onConfirm={() => handleRemoveMember(confirmRemove)}
        title="Remove Member"
        message={`Are you sure you want to remove ${confirmRemove?.name} from the team? This cannot be undone.`}
        confirmLabel="Remove"
        danger
      />

      <ConfirmDialog
        open={confirmClear}
        onClose={() => { setConfirmClear(false); setClearConfirmCount(0) }}
        onConfirm={clearAllData}
        title="Clear All Data"
        message="This will permanently delete ALL data. Are you absolutely sure? This action cannot be undone."
        confirmLabel="Yes, Delete Everything"
        danger
      />

      <ConfirmDialog
        open={!!confirmDeleteItem}
        onClose={() => setConfirmDeleteItem(null)}
        onConfirm={() => { handleDeleteItem(confirmDeleteItem); setConfirmDeleteItem(null) }}
        title="Delete Checklist Item"
        message={`Remove "${confirmDeleteItem?.title}" from the checklist?`}
        confirmLabel="Delete"
        danger
      />
    </div>
  )
}
