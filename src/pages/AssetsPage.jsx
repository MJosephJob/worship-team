import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { apiFetch, invalidateCache } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { Package, Plus, Search, AlertTriangle, X, Filter, Camera, Wrench, Trash2 } from 'lucide-react'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import GoldSpinner from '../components/GoldSpinner'
import PageHeader from '../components/PageHeader'
import ConfirmDialog from '../components/ConfirmDialog'
import { compressImage } from '../utils/imageCompress'

const CONDITION_OPTIONS = ['Excellent','Good','Fair','Needs Repair']
const STATUSES = ['Active','Retired']

const MAINTENANCE_TYPES = {
  'Guitars': ['String replacement','Fret polish & condition','Neck adjustment','Tuning peg service','Body clean & polish','Pickup check','Electronics check','Case inspection'],
  'Keyboards & Pianos': ['Key clean & polish','Sustain pedal check','Power cable inspection','Internal dust clean','Firmware update check','Stand & mount check'],
  'Microphones': ['Capsule clean','Windscreen replacement','Cable & connector check','Wireless transmitter battery check','Receiver unit check','Frequency scan & reprogram'],
  'Amplifiers & Speakers': ['Speaker cone inspection','Cable & connector check','Input/output jack clean','Knob & fader clean','Internal dust blow-out','Fuse check','Stand & mount check'],
  'Drums & Percussion': ['Drumhead replacement','Drumhead tuning','Hardware tighten & lubricate','Cymbal clean & polish','Stick & mallet stock check','Bass drum pedal service','Drum mat check'],
  'Audio Gear': ['Fader & knob clean','Cable & connector check','Firmware update check','Internal dust clean','Rack mount check'],
  'Cables & Accessories': ['Continuity test','Connector inspect & clean','Jacket integrity check','Label & organise','Replace worn cables'],
  'Stands & Mounts': ['Thread & joint tighten','Height lock mechanism check','Base stability check','Surface protection check','Clean & wipe down'],
  'Lighting & Stage Gear': ['Bulb / LED check','Cable & connector check','DMX connection test','Physical mount & clamp check','Clean lens & housing'],
  'Other / General': ['General inspection','Clean & wipe down','Functionality test','Report for specialist service'],
}

const conditionColor = { Excellent: 'text-success', Good: 'text-info', Fair: 'text-warning', 'Needs Repair': 'text-danger' }


function formatDate(val) {
  if (!val) return '—'
  const d = new Date(val)
  if (isNaN(d)) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function AssetsPage() {
  const { member } = useAuth()
  const { toast } = useApp()
  const location = useLocation()
  const isAdmin = ['ADMIN','SUPER_ADMIN'].includes(member.role)
  const [assets, setAssets] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({ cat:'', condition:'', maintFrom:'', maintTo:'', dueFrom:'', dueTo:'', updatedBy:'' })
  const [showAdd, setShowAdd] = useState(false)
  const [savedAssetId, setSavedAssetId] = useState(null)
  const [showDetail, setShowDetail] = useState(null)
  const [detailLogsBySerial, setDetailLogsBySerial] = useState({})
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [showMaint, setShowMaint] = useState(null)
  const [activeAssetSerial, setActiveAssetSerial] = useState(null)
  const [completingLog, setCompletingLog] = useState(null)
  const [deletingLog, setDeletingLog] = useState(null)
  const [confirmDeleteLog, setConfirmDeleteLog] = useState(null)
  const [form, setForm] = useState({ name:'',category:'',subcategory:'',description:'',serialNumber:'',condition:'Good',assignedTo:'',purchaseDate:'',estimatedValue:'',status:'Active',notes:'',photoBase64:'',photoLoading:false })
  const [maintForm, setMaintForm] = useState({ date:'',maintenanceType:'',description:'',doneBy:'',cost:'',nextDueDate:'',photoBase64:'' })
  const [maintDoneByOther, setMaintDoneByOther] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  useEffect(() => { load() }, [])

  // Auto-open asset detail when navigating to /assets/:serialNumber
  useEffect(() => {
    if (!assets.length) return
    const parts = location.pathname.split('/')
    const serialParam = parts[2]
    if (serialParam) {
      const target = assets.find(a => a.serialNumber === serialParam)
      if (target) openDetail(target)
    }
  }, [assets, location.pathname])

  // Auto-open asset detail when navigating via ?open=<serialNumber>
  useEffect(() => {
    if (!assets.length) return
    const params = new URLSearchParams(location.search)
    const openSerial = params.get('open')
    if (openSerial) {
      const target = assets.find(a => String(a.serialNumber) === String(openSerial))
      if (target) {
        openDetail(target)
      }
    }
  }, [assets, location.search])

  // Pre-apply a condition filter when navigating via ?condition=<value> (e.g. from the Dashboard's "Need Attention" card)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const condition = params.get('condition')
    if (condition) setFilters(f => ({ ...f, condition }))
  }, [location.search])

  async function load() {
    setLoading(true)
    try {
      const [a, m] = await Promise.all([apiFetch('getAssets', {}), apiFetch('getMembers', {})])
      setAssets(Array.isArray(a) ? a : [])
      setMembers(Array.isArray(m) ? m : [])
    } catch (err) { toast(err.message, 'error') }
    finally { setLoading(false) }
  }

  const categories = ['All', ...new Set(assets.map(a => a.category).filter(Boolean).sort())]
  const conditions = ['All', ...new Set(assets.map(a => a.condition).filter(Boolean))]

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  const filtered = assets.filter(a => {
    if (!a) return false
    try {
      const s = search.toLowerCase()
      const matchSearch = !s ||
        a.name?.toLowerCase().includes(s) ||
        a.category?.toLowerCase().includes(s) ||
        a.serialNumber?.toLowerCase().includes(s) ||
        a.condition?.toLowerCase().includes(s)
      const matchCat = !filters.cat || filters.cat === 'All' || (a.category?.toLowerCase() === filters.cat.toLowerCase())
      const matchCond = !filters.condition || filters.condition === 'All' || (a.condition?.toLowerCase() === filters.condition.toLowerCase())
      const matchUpdatedBy = !filters.updatedBy || (a.updatedBy || '').toLowerCase().includes(filters.updatedBy.toLowerCase())
      const matchMaintFrom = !filters.maintFrom || (a.lastMaintDate && String(a.lastMaintDate) >= filters.maintFrom)
      const matchMaintTo   = !filters.maintTo   || (a.lastMaintDate && String(a.lastMaintDate) <= filters.maintTo)
      const matchDueFrom   = !filters.dueFrom   || (a.nextDueDate && String(a.nextDueDate) >= filters.dueFrom)
      const matchDueTo     = !filters.dueTo     || (a.nextDueDate && String(a.nextDueDate) <= filters.dueTo)
      return matchSearch && matchCat && matchCond && matchUpdatedBy && matchMaintFrom && matchMaintTo && matchDueFrom && matchDueTo
    } catch { return true }
  })

  async function handlePhotoCapture(e, formSetter) {
    const file = e.target.files?.[0]
    if (!file) return
    formSetter(f => ({ ...f, photoLoading: true }))
    try {
      const compressed = await compressImage(file, 200 * 1024, 800)
      const base64 = compressed.includes(',') ? compressed.split(',')[1] : compressed
      formSetter(f => ({ ...f, photoBase64: base64, photoLoading: false }))
    } catch (err) {
      console.error('Photo capture error:', err)
      toast('Could not process image: ' + err.message, 'error')
      formSetter(f => ({ ...f, photoLoading: false }))
    }
  }

  async function handleSaveAsset(e) {
    e.preventDefault()
    setSaving(true)
    const { photoBase64, photoLoading, ...assetData } = form
    try {
      const result = await apiFetch('createAsset', assetData)
      const internalId = result?.id || null
      const displayId = result?.assetId || internalId
      setSavedAssetId(displayId)
      setForm({ name:'',category:'',subcategory:'',description:'',serialNumber:'',condition:'Good',assignedTo:'',purchaseDate:'',estimatedValue:'',status:'Active',notes:'',photoBase64:'',photoLoading:false })
      load()
      if (photoBase64 && internalId) {
        try {
          await apiFetch('updateAsset', { id: internalId, photoBase64 })
          toast(`Asset added${displayId ? ` — ID: ${displayId}` : ''}`, 'success')
        } catch {
          toast(`Asset saved${displayId ? ` — ID: ${displayId}` : ''}. Photo could not be uploaded — please try again.`, 'warning')
        }
      } else {
        toast(`Asset added${displayId ? ` — ID: ${displayId}` : ''}`, 'success')
      }
    } catch (err) { toast(err.message, 'error') }
    finally { setSaving(false) }
  }

  async function handleMaintPhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    console.log('handleMaintPhoto fired, file:', file.name, file.size, file.type)
    try {
      const compressed = await compressImage(file, 200 * 1024, 800)
      console.log('compressImage done, length:', compressed.length)
      const base64 = compressed.includes(',') ? compressed.split(',')[1] : compressed
      console.log('base64 length:', base64.length)
      setMaintForm(f => ({ ...f, photoBase64: base64 }))
      console.log('maintForm photoBase64 set, length:', base64.length)
    } catch (err) {
      console.error('handleMaintPhoto error:', err)
      toast('Could not process image: ' + err.message, 'error')
    }
  }

  async function handleAddMaintenance(e) {
    e.preventDefault()
    setSaving(true)
    const { photoBase64, ...maintData } = maintForm
    try {
      const doneByValue = maintData.doneBy === '__other__' ? maintDoneByOther.trim() : maintData.doneBy
      const serialNumber = activeAssetSerial
      const result = await apiFetch('addMaintenanceLog', { ...maintData, doneBy: doneByValue, assetId: showMaint.id, serialNumber, submittedBy: member.id })
      const newLogId = result?.id || null
      if (photoBase64 && newLogId) {
        setUploadingPhoto(true)
        try {
          await apiFetch('updateMaintenanceLog', { id: newLogId, photoBase64 })
          toast('Maintenance log added', 'success')
        } catch (photoErr) {
          console.error('Maintenance photo upload failed:', photoErr)
          toast('Maintenance log saved. Photo upload failed: ' + photoErr.message, 'warning')
        }
      } else {
        toast('Maintenance log added', 'success')
      }
      invalidateCache('getAssets')
      invalidateCache('getMembers')
      setShowMaint(null)
      setActiveAssetSerial(null)
      setMaintForm({ date:'',maintenanceType:'',description:'',doneBy:'',cost:'',nextDueDate:'',photoBase64:'' })
      setMaintDoneByOther('')
      load()
    } catch (err) { toast(err.message, 'error') }
    finally { setSaving(false); setUploadingPhoto(false) }
  }

  async function openDetail(asset) {
    setShowDetail(asset)
    setLoadingLogs(true)
    const sn = asset.serialNumber
    if (import.meta.env.DEV) console.log('Fetching logs for:', sn)
    try {
      const logs = await apiFetch('getMaintenanceLogs', { serialNumber: sn })
      const sorted = Array.isArray(logs) ? logs.sort((a, b) => new Date(b.raisedAt || b.date) - new Date(a.raisedAt || a.date)) : []
      setDetailLogsBySerial(prev => ({ ...prev, [sn]: sorted }))
    } catch {
      setDetailLogsBySerial(prev => ({ ...prev, [sn]: [] }))
    }
    finally { setLoadingLogs(false) }
  }

  async function handleMarkComplete(log) {
    setCompletingLog(log.id)
    try {
      await apiFetch('updateMaintenanceLog', { id: log.id, isCompleted: true, completedBy: member.id })
      toast('Maintenance marked complete', 'success')
      if (showDetail?.serialNumber) {
        const sn = showDetail.serialNumber
        const logs = await apiFetch('getMaintenanceLogs', { serialNumber: sn })
        const sorted = Array.isArray(logs) ? logs.sort((a, b) => new Date(b.raisedAt || b.date) - new Date(a.raisedAt || a.date)) : []
        setDetailLogsBySerial(prev => ({ ...prev, [sn]: sorted }))
      }
    } catch (err) { toast(err.message, 'error') }
    finally { setCompletingLog(null) }
  }

  async function handleDeleteLog(log) {
    setDeletingLog(log.id)
    try {
      await apiFetch('deleteMaintenanceLog', { id: log.id })
      toast('Maintenance log deleted', 'success')
      if (showDetail?.serialNumber) {
        const sn = showDetail.serialNumber
        const logs = await apiFetch('getMaintenanceLogs', { serialNumber: sn })
        const sorted = Array.isArray(logs) ? logs.sort((a, b) => new Date(b.raisedAt || b.date) - new Date(a.raisedAt || a.date)) : []
        setDetailLogsBySerial(prev => ({ ...prev, [sn]: sorted }))
      }
    } catch (err) { toast(err.message, 'error') }
    finally { setDeletingLog(null) }
  }

  function dueStatus(asset) {
    if (!asset.nextDueDate) return null
    const due = new Date(asset.nextDueDate)
    const now = new Date()
    const diff = (due - now) / 86400000
    if (diff < 0) return 'overdue'
    if (diff <= 7) return 'week'
    if (diff <= 30) return 'month'
    return null
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Assets"
        subtitle="Equipment tracker & maintenance"
        actions={isAdmin && (
          <button onClick={() => setShowAdd(true)} className="btn-gold text-sm py-2">
            <Plus size={15} /> Add Asset
          </button>
        )}
      />

      <div className="px-4 mb-2 flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search assets..."
            className="worship-input pl-9 py-2.5 text-sm"
          />
        </div>
        <button
          onClick={() => setShowFilters(f => !f)}
          className={`relative btn-outline text-sm py-2 px-3 flex-shrink-0 ${showFilters ? 'bg-gold/10' : ''}`}
          data-tooltip="Filters"
        >
          <Filter size={14} />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-gold text-midnight text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{activeFilterCount}</span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="px-4 mb-3 worship-card p-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1">Category</label>
              <select value={filters.cat} onChange={e => setFilters(f => ({...f,cat:e.target.value}))} className="worship-input py-2 text-sm">
                {categories.map(c => <option key={c} value={c === 'All' ? '' : c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1">Condition</label>
              <select value={filters.condition} onChange={e => setFilters(f => ({...f,condition:e.target.value}))} className="worship-input py-2 text-sm">
                {conditions.map(c => <option key={c} value={c === 'All' ? '' : c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1">Last Maint. From</label>
              <input type="date" value={filters.maintFrom} onChange={e => setFilters(f => ({...f,maintFrom:e.target.value}))} className="worship-input py-2 text-sm" />
            </div>
            <div>
              <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1">Last Maint. To</label>
              <input type="date" value={filters.maintTo} onChange={e => setFilters(f => ({...f,maintTo:e.target.value}))} className="worship-input py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1">Next Due From</label>
              <input type="date" value={filters.dueFrom} onChange={e => setFilters(f => ({...f,dueFrom:e.target.value}))} className="worship-input py-2 text-sm" />
            </div>
            <div>
              <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1">Next Due To</label>
              <input type="date" value={filters.dueTo} onChange={e => setFilters(f => ({...f,dueTo:e.target.value}))} className="worship-input py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1">Updated By</label>
            <input type="text" value={filters.updatedBy} onChange={e => setFilters(f => ({...f,updatedBy:e.target.value}))} className="worship-input py-2 text-sm" placeholder="Member name..." />
          </div>
          {(activeFilterCount > 0 || search) && (
            <button onClick={() => { setFilters({ cat:'', condition:'', maintFrom:'', maintTo:'', dueFrom:'', dueTo:'', updatedBy:'' }); setSearch('') }} className="btn-outline text-xs py-1.5 w-full justify-center">
              <X size={12} /> Clear filters
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><GoldSpinner /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Package} title={search ? `No assets found for '${search}'` : "No assets found"} message={search || activeFilterCount > 0 ? "Try clearing the search or filters." : "Add your first equipment item to get started."} />
      ) : (
        <div className="px-4 flex flex-col gap-3 card-stagger">
          {filtered.map(asset => {
            const status = dueStatus(asset)
            return (
              <div key={asset.id} className="worship-card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-body text-cream font-bold text-base">{asset.name}</h3>
                      <span className={`font-body text-xs font-semibold ${conditionColor[asset.condition] || 'text-cream-muted'}`}>
                        {asset.condition}
                      </span>
                      {status === 'overdue' && <span className="urgency-urgent text-xs px-2 py-0.5 rounded-full">Overdue</span>}
                      {status === 'week' && <span className="urgency-important text-xs px-2 py-0.5 rounded-full">Due this week</span>}
                      {status === 'month' && <span className="urgency-info text-xs px-2 py-0.5 rounded-full">Due this month</span>}
                    </div>
                    <p className="font-body text-cream-muted text-xs mt-0.5">{asset.category}{asset.subcategory ? ` · ${asset.subcategory}` : ''}</p>
                  </div>
                  <button onClick={() => openDetail(asset)} className="text-cream-muted hover:text-gold p-1">
                    <Filter size={15} />
                  </button>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => { setActiveAssetSerial(asset.serialNumber); setShowMaint(asset) }} className="btn-outline text-xs py-1.5 px-3">
                    <Wrench size={12} /> Log Maintenance
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Asset Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setSavedAssetId(null) }} title="Add New Asset">
        <form onSubmit={handleSaveAsset} className="flex flex-col gap-3">
          {savedAssetId && (
            <div className="bg-success/10 border border-success/30 rounded-lg px-3 py-2 flex items-center gap-2">
              <span className="font-body text-success text-xs font-bold">Generated Asset ID:</span>
              <span className="font-mono text-gold text-sm font-bold">{savedAssetId}</span>
            </div>
          )}
          {/* Photo capture */}
          <div>
            <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1">Photo</label>
            <div className="flex items-center gap-3">
              {form.photoBase64 && (
                <img src={`data:image/jpeg;base64,${form.photoBase64}`} alt="" loading="lazy" className="w-16 h-16 rounded-lg object-cover border border-border flex-shrink-0" />
              )}
              {form.photoLoading
                ? <span className="font-body text-cream-muted text-xs flex items-center gap-1.5"><GoldSpinner size={14} /> Processing…</span>
                : (
                  <label className="btn-outline text-xs py-1.5 cursor-pointer flex items-center gap-1.5">
                    <Camera size={13} /> Take / Upload Photo
                    <input type="file" accept="image/*" onChange={e => handlePhotoCapture(e, setForm)} className="hidden" />
                  </label>
                )
              }
              {form.photoBase64 && (
                <button type="button" onClick={() => setForm(f => ({...f,photoBase64:''}))} className="text-danger text-xs hover:underline">Remove</button>
              )}
            </div>
          </div>
          {[
            ['name','Asset Name','text',true],
            ['serialNumber','Serial No.','text',false],
            ['description','Description','text',false],
          ].map(([key,label,type,req]) => (
            <div key={key}>
              <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1">{label}</label>
              <input type={type} value={form[key]} onChange={e => setForm(f => ({...f,[key]:e.target.value}))} className="worship-input" required={req} />
            </div>
          ))}
          <div>
            <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1">Category</label>
            <select value={form.category} onChange={e => setForm(f => ({...f,category:e.target.value}))} className="worship-input" required>
              <option value="">Select category</option>
              {categories.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1">Condition</label>
              <select value={form.condition} onChange={e => setForm(f => ({...f,condition:e.target.value}))} className="worship-input">
                {CONDITION_OPTIONS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({...f,status:e.target.value}))} className="worship-input">
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1">Purchase Date</label>
              <input type="date" value={form.purchaseDate} onChange={e => setForm(f => ({...f,purchaseDate:e.target.value}))} className="worship-input" />
            </div>
            <div>
              <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1">Est. Value (₹)</label>
              <input type="number" value={form.estimatedValue} onChange={e => setForm(f => ({...f,estimatedValue:e.target.value}))} className="worship-input" />
            </div>
          </div>
          <div>
            <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1">Assign To</label>
            <select value={form.assignedTo} onChange={e => setForm(f => ({...f,assignedTo:e.target.value}))} className="worship-input">
              <option value="">Unassigned</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({...f,notes:e.target.value}))} className="worship-input resize-none" rows={2} />
          </div>
          <button type="submit" disabled={saving} className="btn-gold w-full justify-center mt-2">
            {saving ? <GoldSpinner size={18} /> : 'Save Asset'}
          </button>
        </form>
      </Modal>

      {/* Maintenance Modal */}
      <Modal open={!!showMaint} onClose={() => { setShowMaint(null); setActiveAssetSerial(null); setMaintForm({ date:'',maintenanceType:'',description:'',doneBy:'',cost:'',nextDueDate:'',photoBase64:'' }); setMaintDoneByOther('') }} title={`Log Maintenance: ${showMaint?.name}`}>
        <form onSubmit={handleAddMaintenance} className="flex flex-col gap-3">
          {/* Photo */}
          <div>
            <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1">Photo (optional)</label>
            <div className="flex items-center gap-3">
              {maintForm.photoBase64 && (
                <img src={`data:image/jpeg;base64,${maintForm.photoBase64}`} alt="" loading="lazy" className="w-14 h-14 rounded-lg object-cover border border-border flex-shrink-0" />
              )}
              <label className="btn-outline text-xs py-1.5 cursor-pointer flex items-center gap-1.5">
                <Camera size={13} /> Upload Photo
                <input type="file" accept="image/*" onChange={handleMaintPhoto} className="hidden" />
              </label>
              {maintForm.photoBase64 && (
                <button type="button" onClick={() => setMaintForm(f => ({...f,photoBase64:''}))} className="text-danger text-xs hover:underline">Remove</button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1">Date</label>
              <input type="date" value={maintForm.date} onChange={e => setMaintForm(f => ({...f,date:e.target.value}))} className="worship-input" required />
            </div>
            <div>
              <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1">Next Due</label>
              <input type="date" value={maintForm.nextDueDate} onChange={e => setMaintForm(f => ({...f,nextDueDate:e.target.value}))} className="worship-input" />
            </div>
          </div>
          <div>
            <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1">Maintenance Type</label>
            <select value={maintForm.maintenanceType} onChange={e => setMaintForm(f => ({...f,maintenanceType:e.target.value}))} className="worship-input" required>
              <option value="">Select type</option>
              {(MAINTENANCE_TYPES[showMaint?.category] || MAINTENANCE_TYPES['Other / General']).map(t => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1">Description</label>
            <textarea value={maintForm.description} onChange={e => setMaintForm(f => ({...f,description:e.target.value}))} className="worship-input resize-none" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1">Done By</label>
              <select value={maintForm.doneBy} onChange={e => setMaintForm(f => ({...f,doneBy:e.target.value}))} className="worship-input">
                <option value="">Select</option>
                {members.filter(m => m.isActive !== false).map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                <option value="__other__">Other…</option>
              </select>
              {maintForm.doneBy === '__other__' && (
                <input
                  type="text"
                  value={maintDoneByOther}
                  onChange={e => setMaintDoneByOther(e.target.value)}
                  className="worship-input mt-1.5"
                  placeholder="Enter name"
                  required
                />
              )}
            </div>
            <div>
              <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1">Cost (₹)</label>
              <input type="number" value={maintForm.cost} onChange={e => setMaintForm(f => ({...f,cost:e.target.value}))} className="worship-input" />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-gold w-full justify-center mt-2">
            {uploadingPhoto ? <><GoldSpinner size={18} /> Uploading photo…</> : saving ? <GoldSpinner size={18} /> : 'Save Log'}
          </button>
        </form>
      </Modal>

      {/* Asset Detail Modal */}
      {showDetail && (() => {
        const detailLogs = detailLogsBySerial[showDetail.serialNumber] || []
        return (
        <Modal open={!!showDetail} onClose={() => setShowDetail(null)} title={showDetail.name}>
          <div className="flex flex-col gap-4">
            {(showDetail.photoUrl || showDetail.photoBase64) && (
              <img src={showDetail.photoUrl || showDetail.photoBase64} alt="" loading="lazy" className="w-full h-40 object-cover rounded-lg" />
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Category', showDetail.category],
                ['Condition', showDetail.condition],
                ['Status', showDetail.status],
                ['Serial No.', showDetail.serialNumber || '—'],
                ['Purchase Date', showDetail.purchaseDate || '—'],
                ['Est. Value', showDetail.estimatedValue ? `₹${showDetail.estimatedValue}` : '—'],
              ].map(([k,v]) => (
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
            {showDetail.notes && (
              <div>
                <span className="font-body text-cream-muted text-xs">Notes</span>
                <p className="font-body text-cream text-sm mt-0.5">{showDetail.notes}</p>
              </div>
            )}
            {/* Maintenance History */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-body text-cream-muted text-xs uppercase tracking-wide">Maintenance History</span>
                <button onClick={() => { setActiveAssetSerial(showDetail.serialNumber); setShowDetail(null); setShowMaint(showDetail) }} className="btn-outline text-xs py-1 px-2">
                  <Wrench size={11} /> Log New
                </button>
              </div>
              {loadingLogs ? (
                <div className="flex justify-center py-4"><GoldSpinner size={20} /></div>
              ) : detailLogs.length === 0 ? (
                <p className="font-body text-cream-muted text-xs text-center py-3">No maintenance logs yet.</p>
              ) : (
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                  {detailLogs.map(log => {
                    const isComplete = log.isCompleted === true || log.isCompleted === 'true' || log.isCompleted === 'TRUE'
                    const isUuid = log.doneBy && /^[0-9a-f-]{36}$/i.test(log.doneBy)
                    const resolvedName = isUuid ? (members.find(m => m.id === log.doneBy)?.name || 'Team Member') : (log.doneBy || '—')
                    const doneByName = resolvedName
                    return (
                      <div key={log.id} className={`rounded-lg border p-3 ${isComplete ? 'border-success/30 bg-success/5' : 'border-border bg-surface-raised'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-body text-cream text-xs font-bold">{log.maintenanceType}</p>
                            {log.description && <p className="font-body text-cream-muted text-xs mt-0.5">{log.description}</p>}
                            <div className="flex flex-wrap gap-2 mt-1 text-xs font-body text-cream-muted">
                              <span>By: {doneByName}</span>
                              {log.date && <span>· {formatDate(log.date)}</span>}
                              {log.cost != null && log.cost !== '' && <span>· ₹{log.cost}</span>}
                              {log.nextDueDate && <span>· Due: {formatDate(log.nextDueDate)}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {isComplete ? (
                              <span className="text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded font-body">Done</span>
                            ) : isAdmin ? (
                              <button
                                onClick={() => handleMarkComplete(log)}
                                disabled={completingLog === log.id}
                                className="text-[10px] bg-gold/10 text-gold border border-gold/30 px-2 py-0.5 rounded font-body hover:bg-gold/20"
                              >
                                {completingLog === log.id ? '...' : 'Mark Done'}
                              </button>
                            ) : (
                              <span className="text-[10px] bg-warning/10 text-warning px-1.5 py-0.5 rounded font-body">Open</span>
                            )}
                            {isAdmin && (
                              <button
                                onClick={() => setConfirmDeleteLog(log)}
                                disabled={deletingLog === log.id}
                                title="Delete log"
                                className="w-5 h-5 rounded flex items-center justify-center text-danger hover:bg-danger/10"
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                        </div>
                        {(log.photoUrl || log.photoBase64) && (
                          <div>
                            <img src={log.photoUrl || `data:image/jpeg;base64,${log.photoBase64}`} style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', marginTop: '8px', objectFit: 'contain' }} alt="Maintenance photo" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </Modal>
        )
      })()}

      <ConfirmDialog
        open={!!confirmDeleteLog}
        onClose={() => setConfirmDeleteLog(null)}
        onConfirm={() => handleDeleteLog(confirmDeleteLog)}
        title="Delete Maintenance Log"
        message={`Delete this maintenance log entry${confirmDeleteLog?.maintenanceType ? ` (${confirmDeleteLog.maintenanceType})` : ''}? This can't be undone.`}
        confirmLabel="Delete"
        danger
      />
    </div>
  )
}
