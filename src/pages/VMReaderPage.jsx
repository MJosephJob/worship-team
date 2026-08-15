import { useState, useEffect } from 'react'
import { apiFetch } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { useNavigate } from 'react-router-dom'
import GoldSpinner from '../components/GoldSpinner'

function sanitize(html) {
  return html
    .replace(/<script[^>]*>.*?<\/script>/gsi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
}

function VMSection({ label, content }) {
  if (!content) return null
  return (
    <div className="mb-8">
      <h2>{label}</h2>
      <div className="vm-divider" />
      {content.startsWith('<')
        ? <div dangerouslySetInnerHTML={{ __html: sanitize(content) }} />
        : content.split('\n').map((line, i) => <p key={i}>{line}</p>)
      }
    </div>
  )
}

function formatSignedAt(raw) {
  if (!raw) return ''
  const clean = String(raw).replace(' IST', '').replace(' ', 'T')
  const d = new Date(clean)
  if (isNaN(d)) return raw
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function VMReaderPage() {
  const { member } = useAuth()
  const { toast } = useApp()
  const navigate = useNavigate()
  const [vmContent, setVmContent] = useState(null)
  const [hasSigned, setHasSigned] = useState(false)
  const [signedAt, setSignedAt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [vm, status] = await Promise.all([
          apiFetch('getVMContent', {}),
          apiFetch('getVMReviewStatus', { memberId: member.id }),
        ])
        setVmContent(vm)
        setHasSigned(status.hasSigned || false)
        setSignedAt(status.signedAt || null)
      } catch (err) { toast(err.message, 'error') }
      finally { setLoading(false) }
    }
    load()
  }, [])

  async function handleAccept() {
    setSaving(true)
    try {
      const result = await apiFetch('recordVMReview', { memberId: member.id })
      setHasSigned(true)
      setSignedAt(result.signedAt || null)
      toast('Vision & Mission accepted', 'success')
    } catch (err) { toast(err.message, 'error') }
    finally { setSaving(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <GoldSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-midnight flex flex-col">
      <div className="bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
        <h1 className="font-heading text-gold text-xl font-bold">Vision & Mission</h1>
        <button onClick={() => navigate(-1)} className="font-body text-cream-muted text-sm hover:text-cream">Back</button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {hasSigned && (
          <div className="mb-6 bg-success/10 border border-success/30 rounded-xl px-4 py-3 flex items-center gap-2">
            <span className="text-success font-bold">✓</span>
            <span className="font-body text-success text-sm">
              You accepted the Vision & Mission on {formatSignedAt(signedAt)}
            </span>
          </div>
        )}

        <div className="vm-reader prose-vm max-w-2xl mx-auto">
          <VMSection label="Our Vision"              content={vmContent?.vision}  />
          <VMSection label="Our Mission"             content={vmContent?.mission} />
          <VMSection label="Expectations & Values"   content={vmContent?.values}  />
          <div className="h-8" />
        </div>
      </div>

      {!hasSigned && (
        <div className="px-6 py-4 bg-surface border-t border-border">
          <button
            onClick={handleAccept}
            disabled={saving}
            className="btn-gold w-full justify-center py-3"
          >
            {saving ? <GoldSpinner size={18} /> : 'I have read and accept the Vision & Mission'}
          </button>
        </div>
      )}
    </div>
  )
}
