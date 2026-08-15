import { useState } from 'react'
import { apiFetch, setAppsScriptUrl } from '../utils/api'
import { sha256 } from '../utils/sha256'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, ChevronRight } from 'lucide-react'
import GoldSpinner from '../components/GoldSpinner'

const STEPS = ['Connect', 'Team Setup']

export default function SetupWizard() {
  const { setNeedsSetup, login } = useAuth()
  const [step, setStep] = useState(() => localStorage.getItem('appsScriptUrl') ? 1 : 0)
  const [scriptUrl, setScriptUrl] = useState('')
  const [teamName, setTeamName] = useState('CBC Thane Worship Team')
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function testConnection() {
    setError('')
    setLoading(true)
    try {
      setAppsScriptUrl(scriptUrl.trim())
      await apiFetch('ping', {})
      setStep(1)
    } catch (err) {
      setError('Could not connect to Apps Script. Please check the URL and try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSetup(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const hash = await sha256(adminPassword)
      await apiFetch('initialSetup', {
        teamName,
        adminName,
        adminEmail,
        passwordHash: hash,
      })
      await login(adminEmail, adminPassword, true)
      setNeedsSetup(false)
    } catch (err) {
      setError(err.message || 'Setup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-midnight flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mb-4">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path d="M18 2 L18 34 M6 18 L30 18 M10 8 L26 28 M26 8 L10 28" stroke="#c9a84c" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="font-heading text-gold text-2xl font-bold">Welcome to CBC Worship Portal</h1>
          <p className="font-body text-cream-muted text-sm mt-2 text-center">Let's get your team set up. This only takes a moment.</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-body transition-all ${
                i === step ? 'bg-gold text-midnight' : i < step ? 'bg-success text-white' : 'bg-surface text-cream-muted'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`font-body text-xs ${i === step ? 'text-cream' : 'text-cream-muted'}`}>{s}</span>
              {i < STEPS.length - 1 && <ChevronRight size={14} className="text-border" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/30 rounded-lg px-4 py-3 mb-4">
            <p className="font-body text-danger text-sm">{error}</p>
          </div>
        )}

        {step === 0 && (
          <div className="worship-card p-6 flex flex-col gap-4">
            <h2 className="font-heading text-cream text-xl">Step 1: Connect Google Apps Script</h2>
            <p className="font-body text-cream-muted text-sm leading-relaxed">
              Paste your Google Apps Script Web App URL below. See <strong className="text-gold">docs/APPS_SCRIPT_SETUP.md</strong> for instructions on deploying your Code.gs file.
            </p>
            <div>
              <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">Apps Script Web App URL</label>
              <input
                type="url"
                value={scriptUrl}
                onChange={e => setScriptUrl(e.target.value)}
                className="worship-input"
                placeholder="https://script.google.com/macros/s/..."
              />
            </div>
            <button onClick={testConnection} disabled={loading || !scriptUrl} className="btn-gold w-full justify-center">
              {loading ? <GoldSpinner size={20} /> : 'Test Connection & Continue'}
            </button>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleSetup} className="worship-card p-6 flex flex-col gap-4">
            <h2 className="font-heading text-cream text-xl">Step 2: Team Identity</h2>
            <div>
              <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">Team Name</label>
              <input type="text" value={teamName} onChange={e => setTeamName(e.target.value)} className="worship-input" required />
            </div>
            <div>
              <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">Your Full Name (Super Admin)</label>
              <input type="text" value={adminName} onChange={e => setAdminName(e.target.value)} className="worship-input" placeholder="e.g. John Matthew" required />
            </div>
            <div>
              <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">Your Email</label>
              <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} className="worship-input" placeholder="you@example.com" required />
            </div>
            <div>
              <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">Create Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  className="worship-input pr-10"
                  placeholder="Min. 8 characters"
                  minLength={8}
                  required
                />
                <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-muted hover:text-cream">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-gold w-full justify-center py-3">
              {loading ? <GoldSpinner size={20} /> : 'Create Team & Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
