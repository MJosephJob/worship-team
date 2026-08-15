import Modal from './Modal'
import { Globe, MoreVertical, PlusSquare, CheckCircle } from 'lucide-react'

const steps = [
  {
    icon: Globe,
    title: 'Open this page in Chrome',
    sub: 'Other Android browsers may not support installing apps',
  },
  {
    icon: MoreVertical,
    title: 'Tap the menu button',
    sub: 'The ⋮ icon in the top-right corner',
  },
  {
    icon: PlusSquare,
    title: "Tap 'Add to Home screen' or 'Install app'",
    sub: 'The exact wording depends on your Chrome version',
  },
  {
    icon: CheckCircle,
    title: "Tap 'Install' to confirm",
    sub: 'The app will appear on your home screen',
  },
]

export default function AndroidInstallModal({ isOpen, onClose }) {
  return (
    <Modal open={isOpen} onClose={onClose} title="Add to Home Screen" maxWidth="max-w-sm">
      <div className="flex flex-col gap-5">
        {steps.map((step, i) => {
          const Icon = step.icon
          return (
            <div key={i} className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-surface flex items-center justify-center">
                <Icon size={20} className="text-gold" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-body text-cream-muted text-xs">Step {i + 1}</span>
                <p className="font-body text-cream text-sm font-semibold">{step.title}</p>
                <p className="font-body text-cream-muted text-xs">{step.sub}</p>
              </div>
            </div>
          )
        })}
        <button onClick={onClose} className="btn-gold w-full justify-center mt-1">
          Got it
        </button>
      </div>
    </Modal>
  )
}
