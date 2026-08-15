import { useState, useEffect } from 'react'
import { useApp } from '../contexts/AppContext'
import { Download, X } from 'lucide-react'

const DISMISS_KEY = 'cbc_install_dismissed'
const DISMISS_DAYS = 7

export default function InstallBanner() {
  const { installPrompt } = useApp()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!installPrompt) return
    const dismissed = localStorage.getItem(DISMISS_KEY)
    if (dismissed) {
      const daysSince = (Date.now() - Number(dismissed)) / 86400000
      if (daysSince < DISMISS_DAYS) return
    }
    const timer = setTimeout(() => setVisible(true), 30000)
    return () => clearTimeout(timer)
  }, [installPrompt])

  if (!visible || !installPrompt) return null

  const handleInstall = async () => {
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setVisible(false)
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setVisible(false)
  }

  return (
    <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-4 right-4 z-50 animate-fade-up">
      <div className="worship-card p-4 flex items-center gap-3">
        <div className="flex-1">
          <p className="font-body text-cream text-sm font-bold">Install the app</p>
          <p className="font-body text-cream-muted text-xs mt-0.5">For the best experience, add to your home screen</p>
        </div>
        <button onClick={handleInstall} className="btn-gold text-sm px-3 py-2">
          <Download size={14} /> Install
        </button>
        <button onClick={handleDismiss} aria-label="Dismiss install prompt" className="text-cream-muted hover:text-cream p-1">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
