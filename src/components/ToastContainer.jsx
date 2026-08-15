import { useApp } from '../contexts/AppContext'
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'

const icons = {
  success: <CheckCircle size={18} className="text-success" />,
  error: <AlertCircle size={18} className="text-danger" />,
  warning: <AlertTriangle size={18} className="text-warning" />,
  info: <Info size={18} className="text-info" />,
}

const borders = {
  success: 'border-l-4 border-success',
  error: 'border-l-4 border-danger',
  warning: 'border-l-4 border-warning',
  info: 'border-l-4 border-info',
}

export default function ToastContainer() {
  const { toasts } = useApp()

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full px-4">
      {toasts.map(t => (
        <div
          key={t.id}
          onClick={t.onClick}
          className={`worship-card ${borders[t.type] || borders.info} flex items-start gap-3 p-4 animate-fade-up ${t.onClick ? 'cursor-pointer' : ''}`}
        >
          <span className="mt-0.5 flex-shrink-0">{icons[t.type] || icons.info}</span>
          <div className="flex-1 min-w-0">
            <p className="font-body text-cream text-sm">{t.message}</p>
            {t.subtitle && <p className="font-body text-cream-muted text-xs mt-0.5 truncate">{t.subtitle}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}
