import { useNavigate } from 'react-router-dom'
import { Home } from 'lucide-react'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-midnight flex flex-col items-center justify-center px-6 text-center">
      <p className="font-heading text-gold text-7xl font-bold mb-4">404</p>
      <h1 className="font-heading text-cream text-2xl mb-2">Page Not Found</h1>
      <p className="font-body text-cream-muted text-sm mb-8">The page you're looking for doesn't exist.</p>
      <button onClick={() => navigate('/')} className="btn-gold">
        <Home size={16} /> Back to Dashboard
      </button>
    </div>
  )
}
