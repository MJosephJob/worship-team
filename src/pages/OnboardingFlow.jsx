import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { apiFetch } from '../utils/api'
import { useNavigate } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import GoldSpinner from '../components/GoldSpinner'

function sanitize(html) {
  return html
    .replace(/<script[^>]*>.*?<\/script>/gsi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
}

export default function OnboardingFlow() {
  const { member, refreshMember, updateMemberLocal } = useAuth()
  const { toast } = useApp()
  const navigate = useNavigate()
  const [phase, setPhase] = useState('vm-accept') // vm-accept | confirm | checklist | complete
  const [vmContent, setVmContent] = useState(null)
  const [confirmKey, setConfirmKey] = useState('')
  const [checklistItems, setChecklistItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [typedConfirm, setTypedConfirm] = useState('')
  const [confirmMatch, setConfirmMatch] = useState(false)
  const [checkedItems, setCheckedItems] = useState({})
  const [checklistProgress, setChecklistProgress] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [vm, settings, checklist] = await Promise.all([
          apiFetch('getVMContent', {}),
          apiFetch('getSettings', { key: 'confirmKeyPhrase' }),
          apiFetch('getOnboardingChecklist', {}),
        ])
        setVmContent(vm)
        setConfirmKey(settings?.value || 'I am committed to worship')
        setChecklistItems(Array.isArray(checklist) ? checklist : [])
        const prog = await apiFetch('getOnboardingProgress', { memberId: member.id })
        const checked = {}
        if (Array.isArray(prog)) {
          prog.forEach(p => { if (p.isCompleted) checked[p.step] = true })
        }
        setCheckedItems(checked)
      } catch (err) {
        toast(err.message, 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [member.id])

  function handleTypedConfirm(val) {
    setTypedConfirm(val)
    setConfirmMatch(val.trim().toLowerCase() === confirmKey.trim().toLowerCase())
  }

  async function handleConfirmContinue() {
    await apiFetch('updateOnboardingProgress', {
      memberId: member.id, step: 'confirm', isCompleted: true
    })
    // Record VM review immediately so dashboard shows green this month
    try {
      await apiFetch('recordVMReview', { memberId: member.id })
      updateMemberLocal({ lastVMReview: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }), isOnboarded: true })
    } catch {}
    setPhase('checklist')
  }

  async function toggleChecklistItem(itemId, required) {
    const newChecked = { ...checkedItems, [itemId]: !checkedItems[itemId] }
    setCheckedItems(newChecked)
    await apiFetch('updateOnboardingProgress', {
      memberId: member.id, step: itemId, isCompleted: newChecked[itemId]
    })
    const requiredItems = checklistItems.filter(i => i.required)
    const allRequired = requiredItems.every(i => newChecked[i.id])
    const total = checklistItems.length
    const done = Object.values(newChecked).filter(Boolean).length
    setChecklistProgress(Math.round((done / total) * 100))
    if (allRequired) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
      await apiFetch('completeOnboarding', { memberId: member.id })
      setPhase('complete')
    }
  }

  async function finishOnboarding() {
    await refreshMember()
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center">
        <GoldSpinner size={40} />
      </div>
    )
  }

  if (phase === 'vm-accept') {
    return (
      <div className="min-h-screen bg-midnight flex flex-col">
        <div className="bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-body text-gold text-xl font-bold">Vision & Mission</h1>
          </div>
          <span className="font-body text-cream-muted text-sm">Step 1 of 3</span>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="prose-vm vm-reader max-w-2xl mx-auto">
            {vmContent?.vision && (
              <div className="mb-8">
                <h2>Our Vision</h2>
                <div className="vm-divider" />
                {vmContent.vision.startsWith('<')
                  ? <div dangerouslySetInnerHTML={{ __html: sanitize(vmContent.vision) }} />
                  : vmContent.vision.split('\n').map((line, i) => <p key={i}>{line}</p>)
                }
              </div>
            )}
            {vmContent?.mission && (
              <div className="mb-8">
                <h2>Our Mission</h2>
                <div className="vm-divider" />
                {vmContent.mission.startsWith('<')
                  ? <div dangerouslySetInnerHTML={{ __html: sanitize(vmContent.mission) }} />
                  : vmContent.mission.split('\n').map((line, i) => <p key={i}>{line}</p>)
                }
              </div>
            )}
            {vmContent?.values && (
              <div className="mb-8">
                <h2>Expectations & Values</h2>
                <div className="vm-divider" />
                {vmContent.values.startsWith('<')
                  ? <div dangerouslySetInnerHTML={{ __html: sanitize(vmContent.values) }} />
                  : vmContent.values.split('\n').map((line, i) => <p key={i}>{line}</p>)
                }
              </div>
            )}
            <div className="h-8" />
          </div>
        </div>
        <div className="px-6 py-4 bg-surface border-t border-border">
          <button
            onClick={() => setPhase('confirm')}
            className="btn-gold w-full justify-center py-3"
          >
            I have read and accept the Vision & Mission
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'confirm') {
    const phrase = confirmKey
    const typed = typedConfirm
    return (
      <div className="min-h-screen bg-midnight flex flex-col items-center justify-center px-6">
        <div className="worship-card p-8 max-w-md w-full text-center">
          <CheckCircle size={40} className="text-success mx-auto mb-4" />
          <h2 className="font-body text-gold text-2xl mb-2">Step 3 of 4</h2>
          <p className="font-body text-cream-muted text-sm mb-6">
            Type the phrase below to confirm your commitment to the team.
          </p>
          <p className="font-body text-gold text-xl mb-6 py-4 border-y border-border">{phrase}</p>
          <input
            type="text"
            value={typedConfirm}
            onChange={e => handleTypedConfirm(e.target.value)}
            className="worship-input text-center text-lg mb-1"
            placeholder="Type here..."
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
          />
          <div className="h-1.5 w-full bg-surface-raised rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-gold transition-all duration-300"
              style={{ width: `${Math.min(100, (typed.length / phrase.length) * 100)}%` }}
            />
          </div>
          <button onClick={handleConfirmContinue} disabled={!confirmMatch} className={`btn-gold w-full justify-center py-3 ${!confirmMatch ? 'opacity-40 cursor-not-allowed' : 'gold-flash'}`}>
            Confirm & Continue
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'checklist') {
    const requiredItems = checklistItems.filter(i => i.required)
    const allRequired = requiredItems.every(i => checkedItems[i.id])
    return (
      <div className="min-h-screen bg-midnight flex flex-col">
        <div className="bg-surface border-b border-border px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-body text-gold text-xl">Onboarding Checklist</h1>
            <span className="font-body text-cream-muted text-sm">Step 4 of 4</span>
          </div>
          <div className="w-full h-1.5 bg-surface-raised rounded-full overflow-hidden">
            <div className="h-full bg-gold transition-all" style={{ width: `${checklistProgress}%` }} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <p className="font-body text-cream-muted text-sm mb-4">Complete the required items to finish onboarding. Optional items can be done later.</p>
          <div className="flex flex-col gap-3 card-stagger">
            {checklistItems.map(item => (
              <button
                key={item.id}
                onClick={() => toggleChecklistItem(item.id, item.required)}
                className={`worship-card p-4 flex items-start gap-3 text-left transition-all ${checkedItems[item.id] ? 'border-success/40 bg-success/5' : ''}`}
              >
                <div className={`w-5 h-5 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${checkedItems[item.id] ? 'bg-success border-success' : 'border-border'}`}>
                  {checkedItems[item.id] && <CheckCircle size={12} className="text-white" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-body text-sm ${checkedItems[item.id] ? 'text-cream-muted line-through' : 'text-cream'}`}>{item.title}</span>
                    {item.required && <span className="text-[10px] bg-gold/10 text-gold px-1.5 py-0.5 rounded font-body">Required</span>}
                  </div>
                  {item.description && <p className="font-body text-cream-muted text-xs mt-1">{item.description}</p>}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'complete') {
    return (
      <div className="min-h-screen bg-midnight flex flex-col items-center justify-center px-6 relative overflow-hidden">
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full confetti-piece"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 40}%`,
                  background: i % 3 === 0 ? '#c9a84c' : i % 3 === 1 ? '#4caf82' : '#4c8ce8',
                  animationDelay: `${Math.random() * 0.5}s`,
                }}
              />
            ))}
          </div>
        )}
        <div className="worship-card p-10 max-w-sm w-full text-center relative z-10">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="font-heading text-gold text-2xl mb-3">Welcome to the Team!</h2>
          <p className="font-body text-cream-muted text-sm leading-relaxed mb-6">
            You've completed onboarding. We're glad you're here. Let's worship together!
          </p>
          <button onClick={finishOnboarding} className="btn-gold w-full justify-center py-3">
            Enter the Portal
          </button>
        </div>
      </div>
    )
  }

  return null
}
