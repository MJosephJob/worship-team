import Modal from './Modal'
import { Globe, Share2, PlusSquare, CheckCircle } from 'lucide-react'

const steps = [
  {
    icon: Globe,
    title: 'Open this page in Safari',
    sub: 'Chrome and Edge do not support install on iPhone',
  },
  {
    icon: Share2,
    title: 'Tap the Share button',
    sub: 'The ↑ icon at the bottom of your screen',
  },
  {
    icon: PlusSquare,
    title: "Tap 'Add to Home Screen'",
    sub: 'Scroll down in the share menu to find it',
  },
  {
    icon: CheckCircle,
    title: "Tap 'Add' in the top right",
    sub: 'The app will appear on your home screen',
  },
]

export default function IOSInstallModal({ isOpen, onClose }) {
  function handleGotIt() {
    localStorage.setItem('ios_install_dismissed', 'true')
    onClose()
  }

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
        <button onClick={handleGotIt} className="btn-gold w-full justify-center mt-1">
          Got it
        </button>
      </div>
    </Modal>
  )
}
