import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { requestPasswordReset } from '../utils/auth'
import { sha256 } from '../utils/sha256'
import { apiFetch } from '../utils/api'
import { Eye, EyeOff, Music } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const { toast } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [stay, setStay] = useState(true)
  const [loading, setLoading] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetDone, setResetDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      setResetToken(token)
      setShowReset(true)
    }
  }, [])

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password, stay)
    } catch (err) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  async function handleForgot(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await requestPasswordReset(forgotEmail)
      setForgotSent(true)
    } catch (err) {
      toast(err.message || 'Could not send reset link', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      const newHash = await sha256(newPassword)
      await apiFetch('confirmPasswordReset', { token: resetToken, newHash })
      setResetDone(true)
      setTimeout(() => {
        setShowReset(false)
        setForgotMode(false)
        setForgotSent(false)
        setResetToken('')
        setNewPassword('')
        setConfirmPassword('')
        setResetDone(false)
        setError('')
        window.history.replaceState({}, '', '/login')
      }, 2000)
    } catch (err) {
      setError(err.message || 'Could not reset password. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  function backToLogin() {
    setForgotMode(false)
    setForgotSent(false)
    setShowReset(false)
    setResetToken('')
    setNewPassword('')
    setConfirmPassword('')
    setResetDone(false)
    setError('')
    window.history.replaceState({}, '', '/login')
  }

  return (
    <div className="min-h-screen bg-midnight flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mb-4">
            <img src="/icons/CBC_logo.png" alt="CBC Thane" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="font-heading text-gold text-2xl font-bold text-center">CBC Thane</h1>
          <p className="font-body text-cream-muted text-sm mt-1">Worship Team Portal</p>
        </div>

        {/* Reset password form — shown when token in URL or after forgotSent */}
        {(showReset || forgotSent) ? (
          <div className="worship-card p-6 flex flex-col gap-4">
            <h2 className="font-body text-cream text-xl font-semibold text-center mb-2">Set New Password</h2>

            {resetDone ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                  <Music size={22} className="text-success" />
                </div>
                <p className="font-body text-cream text-sm text-center">
                  Password reset successfully. You can now log in.
                </p>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                {error && (
                  <div className="bg-danger/10 border border-danger/30 rounded-lg px-4 py-3">
                    <p className="font-body text-danger text-sm">{error}</p>
                  </div>
                )}
                <div>
                  <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">Reset Token</label>
                  <input
                    type="text"
                    value={resetToken}
                    onChange={e => setResetToken(e.target.value)}
                    className="worship-input font-mono text-sm"
                    placeholder="Paste token from email"
                    required
                  />
                </div>
                <div>
                  <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="worship-input"
                    placeholder="At least 8 characters"
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="worship-input"
                    placeholder="Repeat new password"
                    required
                    autoComplete="new-password"
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-gold w-full justify-center">
                  {loading ? <span className="spinner !w-5 !h-5" /> : 'Reset Password'}
                </button>
                <button type="button" onClick={backToLogin} className="font-body text-cream-muted text-sm text-center">
                  Back to Login
                </button>
              </form>
            )}
          </div>

        ) : !forgotMode ? (
          <form onSubmit={handleLogin} className="worship-card p-6 flex flex-col gap-4">
            <h2 className="font-body text-cream text-xl font-semibold text-center mb-2">Welcome back</h2>

            {error && (
              <div className="bg-danger/10 border border-danger/30 rounded-lg px-4 py-3">
                <p className="font-body text-danger text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="worship-input"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="font-body text-cream-muted text-xs uppercase tracking-wide block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="worship-input pr-10"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-muted hover:text-cream"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={stay}
                onChange={e => setStay(e.target.checked)}
                className="w-4 h-4 accent-gold"
              />
              <span className="font-body text-cream-muted text-sm">Stay signed in for 7 days</span>
            </label>

            <button type="submit" disabled={loading} className="btn-gold w-full justify-center text-base py-3">
              {loading ? <span className="spinner !w-5 !h-5" /> : 'Sign In'}
            </button>

            <button
              type="button"
              onClick={() => setForgotMode(true)}
              className="font-body text-gold text-sm text-center hover:text-gold-light transition-colors"
            >
              Forgot your password?
            </button>
          </form>

        ) : (
          <div className="worship-card p-6 flex flex-col gap-4">
            <h2 className="font-body text-cream text-xl font-semibold text-center mb-2">Reset Password</h2>
            <form onSubmit={handleForgot} className="flex flex-col gap-4">
              <p className="font-body text-cream-muted text-sm">Enter your email and we'll send you a reset link.</p>
              <input
                type="email"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                className="worship-input"
                placeholder="you@example.com"
                required
              />
              <button type="submit" disabled={loading} className="btn-gold w-full justify-center">
                {loading ? <span className="spinner !w-5 !h-5" /> : 'Send Reset Link'}
              </button>
              <button type="button" onClick={() => setForgotMode(false)} className="font-body text-cream-muted text-sm text-center">
                Back to Login
              </button>
            </form>
          </div>
        )}

        <p className="font-body text-cream-muted text-xs text-center mt-6">
          Private portal — authorised members only
        </p>
      </div>
    </div>
  )
}
