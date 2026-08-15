import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { apiFetch } from '../utils/api'
import { changePassword } from '../utils/auth'
import { useTheme } from '../contexts/ThemeContext'
import { requestFCMPermission, saveFCMToken } from '../utils/notifications'
import { User, Camera, Bell, Moon, Sun, Key, Smartphone, LogOut } from 'lucide-react'
import Modal from '../components/Modal'
import IOSInstallModal from '../components/IOSInstallModal'
import GoldSpinner from '../components/GoldSpinner'
import PageHeader from '../components/PageHeader'
import InstrumentPicker from '../components/InstrumentPicker'
import { compressImage } from '../utils/imageCompress'

export default function ProfilePage() {
  const { member, refreshMember, updateMemberLocal, logout } = useAuth()
  const { toast, installPrompt } = useApp()
  const { theme, toggleTheme } = useTheme()
  const [form, setForm] = useState({
    name: member?.name || '',
    phone: member?.phone || '',
    birthday: member?.birthday || '',
    instrument: member?.instrument || '',
    bio: member?.bio || '',
  })
  const [showIOSModal, setShowIOSModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [showPassModal, setShowPassModal] = useState(false)
  const [passForm, setPassForm] = useState({ current:'', newPass:'', confirm:'' })
  const [passSaving, setPassSaving] = useState(false)
  const [badges, setBadges] = useState([])
  const [attendancePct, setAttendancePct] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const [b, a] = await Promise.all([
          apiFetch('getBadges', { memberId: member.id }),
          apiFetch('getMemberAttendance', { memberId: member.id }),
        ])
        setBadges(Array.isArray(b) ? b : [])
        setAttendancePct(a?.pct || 0)
      } catch {}
    }
    if (member?.id) load()
  }, [member?.id])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await apiFetch('updateMember', { id: member.id, ...form })
      updateMemberLocal(form)
      toast('Profile updated', 'success')
    } catch (err) { toast(err.message, 'error') }
    finally { setSaving(false) }
  }

  async function handlePhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoUploading(true)
    try {
      const compressed = await compressImage(file)
      const base64 = compressed.includes(',') ? compressed.split(',')[1] : compressed
      setPhotoPreview(compressed)
      await apiFetch('updateMember', { id: member.id, photoBase64: base64 })
      updateMemberLocal({ photoBase64: compressed })
      setPhotoPreview(null)
      toast('Photo updated', 'success')
    } catch (err) { toast(err.message, 'error') }
    finally { setPhotoUploading(false) }
  }

  async function handleChangePass(e) {
    e.preventDefault()
    if (passForm.newPass !== passForm.confirm) return toast('Passwords do not match', 'warning')
    if (passForm.newPass.length < 8) return toast('Password must be at least 8 characters', 'warning')
    setPassSaving(true)
    try {
      await changePassword(member.id, passForm.current, passForm.newPass)
      toast('Password changed successfully', 'success')
      setShowPassModal(false)
      setPassForm({ current:'', newPass:'', confirm:'' })
    } catch (err) { toast(err.message, 'error') }
    finally { setPassSaving(false) }
  }

  async function enableNotifications() {
    const token = await requestFCMPermission()
    if (token) {
      await saveFCMToken(member.id, token)
      toast('Notifications enabled!', 'success')
    } else {
      toast('Could not enable notifications. Check browser permissions.', 'warning')
    }
  }

  function installApp() {
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) && !navigator.standalone
    if (isIOS) {
      setShowIOSModal(true)
      return
    }
    if (installPrompt) {
      installPrompt.prompt()
    } else {
      toast('Use your browser menu → Add to Home Screen', 'info')
    }
  }

  const initials = member?.name?.split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase() || '?'

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="My Profile" />

      <div className="px-4 flex flex-col gap-4">
        {/* Avatar */}
        <div className="worship-card p-6 flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gold/20 border-2 border-gold/40 flex items-center justify-center overflow-hidden">
              {photoUploading
                ? <GoldSpinner size={28} />
                : (photoPreview || member?.photoUrl || member?.photoBase64)
                  ? <img src={photoPreview || member.photoUrl || member.photoBase64} alt="" className="w-full h-full object-cover" />
                  : <span className="font-heading text-gold text-2xl">{initials}</span>
              }
            </div>
            <label className="absolute bottom-0 right-0 w-7 h-7 bg-gold rounded-full flex items-center justify-center cursor-pointer hover:bg-gold-light transition-colors" data-tooltip="Change photo">
              <Camera size={13} className="text-midnight" />
              <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
            </label>
          </div>
          {photoUploading && <p className="font-body text-gold text-xs">Compressing & uploading…</p>}
          <div className="text-center">
            <h2 className="font-body text-cream text-xl font-bold">{member?.name}</h2>
            <p className="font-body text-cream-muted text-sm">{member?.email}</p>
            <p className="font-body text-gold text-xs mt-1 capitalize">{member?.role?.toLowerCase()}</p>
          </div>
          <div className="flex gap-3 text-center">
            <div>
              <p className="font-body text-gold text-xl font-bold">{badges.length}</p>
              <p className="font-body text-cream-muted text-xs">Badges</p>
            </div>
            <div className="w-px bg-border" />
            <div>
              <p className={`font-body text-xl font-bold ${attendancePct >= 70 ? 'text-success' : attendancePct >= 40 ? 'text-warning' : 'text-danger'}`}>{attendancePct}%</p>
              <p className="font-body text-cream-muted text-xs">Attendance</p>
            </div>
          </div>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="worship-card p-4">
            <h3 className="font-body text-cream font-semibold mb-3">My Badges</h3>
            <div className="flex flex-wrap gap-3">
              {badges.map((b, i) => (
                <div key={i} className="flex flex-col items-center gap-1" title={`${b.badgeName} · ${new Date(b.awardedAt).toLocaleDateString()}`}>
                  <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-2xl">
                    {b.badgeEmoji}
                  </div>
                  <span className="font-body text-cream-muted text-[10px] text-center max-w-[52px]">{b.badgeName}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit profile form */}
        <form onSubmit={handleSave} className="worship-card p-5 flex flex-col gap-4">
          <h3 className="font-body text-cream font-semibold">Edit Profile</h3>
          <div>
            <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">Display Name</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({...f,name:e.target.value}))} className="worship-input" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">Phone</label>
              <input type="tel" value={form.phone} onChange={e => setForm(f => ({...f,phone:e.target.value}))} className="worship-input" />
            </div>
            <div>
              <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">Birthday (DD/MM)</label>
              <input type="text" value={form.birthday} onChange={e => setForm(f => ({...f,birthday:e.target.value}))} className="worship-input" placeholder="e.g. 25/12" maxLength={5} />
            </div>
          </div>
          <div>
            <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">Instrument / Role</label>
            <InstrumentPicker value={form.instrument} onChange={val => setForm(f => ({...f, instrument: val}))} />
          </div>
          <div>
            <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">Bio</label>
            <textarea value={form.bio} onChange={e => setForm(f => ({...f,bio:e.target.value}))} className="worship-input resize-none" rows={3} placeholder="A short bio visible to the team..." maxLength={200} />
          </div>
          <button type="submit" disabled={saving} className="btn-gold w-full justify-center">
            {saving ? <GoldSpinner size={18} /> : 'Save Changes'}
          </button>
        </form>

        {/* Preferences */}
        <div className="worship-card p-5 flex flex-col gap-3">
          <h3 className="font-body text-cream font-semibold mb-1">Preferences</h3>
          <button onClick={toggleTheme} className="flex items-center justify-between p-3 rounded-xl bg-surface-raised hover:bg-border/50 transition-colors">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon size={16} className="text-info" /> : <Sun size={16} className="text-warning" />}
              <span className="font-body text-cream text-sm">App Theme</span>
            </div>
            <span className="font-body text-cream-muted text-sm capitalize">{theme}</span>
          </button>
          <button onClick={enableNotifications} className="flex items-center gap-3 p-3 rounded-xl bg-surface-raised hover:bg-border/50 transition-colors">
            <Bell size={16} className="text-gold" />
            <span className="font-body text-cream text-sm">Enable Push Notifications</span>
          </button>
          <button onClick={installApp} className="flex items-center gap-3 p-3 rounded-xl bg-surface-raised hover:bg-border/50 transition-colors">
            <Smartphone size={16} className="text-success" />
            <span className="font-body text-cream text-sm">Add to Home Screen</span>
          </button>
          <button onClick={() => setShowPassModal(true)} className="flex items-center gap-3 p-3 rounded-xl bg-surface-raised hover:bg-border/50 transition-colors">
            <Key size={16} className="text-cream-muted" />
            <span className="font-body text-cream text-sm">Change Password</span>
          </button>
          <button onClick={logout} className="flex items-center gap-3 p-3 rounded-xl bg-surface-raised hover:bg-danger/10 transition-colors group">
            <LogOut size={16} className="text-danger" />
            <span className="font-body text-cream group-hover:text-danger text-sm transition-colors">Log Out</span>
          </button>
        </div>
      </div>

      <IOSInstallModal isOpen={showIOSModal} onClose={() => setShowIOSModal(false)} />

      {/* Change Password Modal */}
      <Modal open={showPassModal} onClose={() => setShowPassModal(false)} title="Change Password" maxWidth="max-w-sm">
        <form onSubmit={handleChangePass} className="flex flex-col gap-4">
          {['current','newPass','confirm'].map((field, i) => (
            <div key={field}>
              <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">
                {field === 'current' ? 'Current Password' : field === 'newPass' ? 'New Password' : 'Confirm New Password'}
              </label>
              <input
                type="password"
                value={passForm[field]}
                onChange={e => setPassForm(f => ({...f,[field]:e.target.value}))}
                className="worship-input"
                required
                minLength={field !== 'current' ? 8 : undefined}
              />
            </div>
          ))}
          <button type="submit" disabled={passSaving} className="btn-gold w-full justify-center">
            {passSaving ? <GoldSpinner size={18} /> : 'Update Password'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
