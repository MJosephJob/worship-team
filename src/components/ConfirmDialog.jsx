import Modal from './Modal'
import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="flex flex-col items-center text-center gap-4"
      >
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${danger ? 'bg-danger/10' : 'bg-warning/10'}`}>
          <AlertTriangle size={22} className={danger ? 'text-danger' : 'text-warning'} />
        </div>
        <p id="confirm-dialog-title" className="font-body text-cream-muted text-sm">{message}</p>
        <div className="flex gap-3 w-full">
          <button onClick={onClose} className="btn-outline flex-1 justify-center">Cancel</button>
          <button
            onClick={() => {
              try {
                onConfirm()
              } finally {
                onClose()
              }
            }}
            className={`flex-1 py-2.5 rounded-lg font-body font-bold transition-all ${
              danger ? 'btn-danger' : 'btn-gold'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
