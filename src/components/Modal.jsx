import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 flex items-end md:items-center justify-center p-0 md:p-4" style={{ zIndex: 9999 }}>
      <div className="absolute inset-0 bg-midnight/80 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} bg-surface-raised border border-border rounded-t-2xl md:rounded-2xl shadow-card animate-fade-up max-h-[85vh] overflow-hidden flex flex-col`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 className="font-body text-cream text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-cream-muted hover:text-cream p-1 rounded-lg hover:bg-surface transition-colors" title="Close">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto p-5 flex-1">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
