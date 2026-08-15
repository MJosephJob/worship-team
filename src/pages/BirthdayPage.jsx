import { useState, useEffect } from 'react'
import { apiFetch } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import PageHeader from '../components/PageHeader'

function getDaysUntilBirthday(ddmm) {
  if (!ddmm) return null
  const [day, month] = ddmm.split('/').map(Number)
  const now = new Date()
  const year = now.getFullYear()
  let bday = new Date(year, month - 1, day)
  if (bday < now) bday = new Date(year + 1, month - 1, day)
  return Math.ceil((bday - now) / 86400000)
}

export default function BirthdayPage() {
  const { member } = useAuth()
  const { toast } = useApp()

  const [tab, setTab] = useState('today')
  const [walls, setWalls] = useState([])
  const [wishes, setWishes] = useState({})
  const [wishInput, setWishInput] = useState({})
  const [posting, setPosting] = useState({})
  const [hasWished, setHasWished] = useState({})
  const [loadingWalls, setLoadingWalls] = useState(true)
  const [loadingWishes, setLoadingWishes] = useState({})
  const [members, setMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [wallsData, membersData] = await Promise.all([
          apiFetch('getBirthdayWalls', {}),
          apiFetch('getMembers', {})
        ])
        const wallsList = wallsData || []
        setWalls(wallsList)
        setMembers(membersData || [])
        setLoadingWalls(false)
        setLoadingMembers(false)

        wallsList.forEach(async (wall) => {
          setLoadingWishes(prev => ({ ...prev, [wall.memberId]: true }))
          try {
            const data = await apiFetch('getBirthdayWishes', { birthdayMemberId: wall.memberId })
            const list = data || []
            setWishes(prev => ({ ...prev, [wall.memberId]: list }))
            const alreadyWished = list.some(w => String(w.wisherId) === String(member.id))
            setHasWished(prev => ({ ...prev, [wall.memberId]: alreadyWished }))
          } catch (e) {
            setWishes(prev => ({ ...prev, [wall.memberId]: [] }))
          }
          setLoadingWishes(prev => ({ ...prev, [wall.memberId]: false }))
        })
      } catch (err) {
        toast(err.message, 'error')
        setLoadingWalls(false)
        setLoadingMembers(false)
      }
    }
    load()
  }, [])

  async function handlePostWish(birthdayMemberId) {
    const text = (wishInput[birthdayMemberId] || '').trim()
    if (text.length < 2) return

    setPosting(prev => ({ ...prev, [birthdayMemberId]: true }))
    try {
      await apiFetch('postBirthdayWish', {
        birthdayMemberId,
        wisherId: member.id,
        wisherName: member.name,
        wish: text
      })
      const newWish = {
        id: Date.now(),
        birthdayMemberId,
        wisherId: member.id,
        wisherName: member.name,
        wish: text,
        createdAt: new Date().toISOString()
      }
      setWishes(prev => ({
        ...prev,
        [birthdayMemberId]: [newWish, ...(prev[birthdayMemberId] || [])]
      }))
      setHasWished(prev => ({ ...prev, [birthdayMemberId]: true }))
      setWishInput(prev => ({ ...prev, [birthdayMemberId]: '' }))
    } catch (e) {
      toast('Could not post blessing', 'error')
    } finally {
      setPosting(prev => ({ ...prev, [birthdayMemberId]: false }))
    }
  }

  const withBirthdays = members
    .filter(m => m.birthday)
    .map(m => ({ ...m, daysUntil: getDaysUntilBirthday(m.birthday) }))
    .filter(m => m.daysUntil !== null && m.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil)

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Birthday Wall" subtitle="Celebrate your team" />

      <div className="px-4 mb-4 flex gap-2">
        {['today', 'upcoming'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg font-body text-sm font-bold transition-all ${
              tab === t
                ? 'bg-gold/10 text-gold border border-gold/30'
                : 'text-cream-muted border border-border hover:text-cream'
            }`}
          >
            {t === 'today' ? 'Today' : 'Upcoming'}
          </button>
        ))}
      </div>

      {tab === 'today' && (
        <div className="px-4">
          {loadingWalls ? (
            <div className="flex flex-col gap-4">
              {[0, 1].map(i => (
                <div key={i} className="worship-card p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full skeleton-shimmer bg-surface-raised flex-shrink-0" />
                    <div className="flex-1">
                      <div className="h-4 w-32 rounded mb-2 skeleton-shimmer bg-surface-raised" />
                      <div className="h-3 w-20 rounded skeleton-shimmer bg-surface-raised" />
                    </div>
                  </div>
                  <div className="h-10 w-full rounded skeleton-shimmer bg-surface-raised" />
                </div>
              ))}
            </div>
          ) : walls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="text-5xl mb-4">🎂</div>
              <h3 className="font-body font-semibold text-cream text-lg mb-2">No birthdays today</h3>
              <p className="font-body text-cream-muted text-sm">
                Check the Upcoming tab to see who's celebrating soon.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {walls.map(wall => (
                <div key={wall.memberId} className="worship-card p-4 mb-4">

                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gold/10 border border-gold/30 flex items-center justify-center">
                      {wall.photo
                        ? <img src={wall.photo} alt="" className="w-full h-full object-cover" />
                        : <span className="font-body text-gold text-lg">{wall.name?.[0]}</span>
                      }
                    </div>
                    <div className="flex-1">
                      <p className="font-body font-semibold text-cream">{wall.name}</p>
                      {wall.instrument && (
                        <p className="font-body text-sm text-cream-muted">{wall.instrument}</p>
                      )}
                    </div>
                    <span className="text-2xl">🎂</span>
                  </div>

                  <div className="border-t border-border pt-3 mb-3">
                    {hasWished[wall.memberId] ? (
                      <p className="font-body text-success text-sm font-semibold">✓ You left a blessing</p>
                    ) : (
                      <>
                        <textarea
                          value={wishInput[wall.memberId] || ''}
                          onChange={e => setWishInput(prev => ({ ...prev, [wall.memberId]: e.target.value }))}
                          placeholder="Leave a blessing, verse or word of encouragement..."
                          className="worship-input w-full text-sm font-body resize-none"
                          rows={3}
                        />
                        <button
                          onClick={() => handlePostWish(wall.memberId)}
                          disabled={posting[wall.memberId]}
                          className="btn-gold w-full mt-2 font-body text-sm justify-center"
                        >
                          {posting[wall.memberId] ? 'Posting...' : '✨ Post Blessing'}
                        </button>
                      </>
                    )}
                  </div>

                  <div className="border-t border-border pt-3">
                    <p className="font-body text-cream-muted text-xs mb-2">
                      {wishes[wall.memberId]?.length || 0} blessings
                    </p>
                    {loadingWishes[wall.memberId] ? (
                      <div className="flex flex-col gap-2">
                        {[0, 1].map(i => (
                          <div key={i}>
                            <div className="h-3 w-20 rounded mb-1 skeleton-shimmer bg-surface-raised" />
                            <div className="h-4 w-full rounded skeleton-shimmer bg-surface-raised" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      (wishes[wall.memberId] || []).map(w => (
                        <div key={w.id} className="py-2 border-b border-border last:border-0">
                          <p className="font-body text-xs text-cream-muted mb-1">{w.wisherName}</p>
                          <p className="font-body text-sm text-cream">{w.wish}</p>
                        </div>
                      ))
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'upcoming' && (
        <div className="px-4">
          {loadingMembers ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map(i => (
                <div key={i} className="worship-card p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full skeleton-shimmer bg-surface-raised flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 w-32 rounded mb-2 skeleton-shimmer bg-surface-raised" />
                    <div className="h-3 w-20 rounded skeleton-shimmer bg-surface-raised" />
                  </div>
                </div>
              ))}
            </div>
          ) : withBirthdays.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="text-5xl mb-4">📅</div>
              <h3 className="font-body font-semibold text-cream text-lg mb-2">
                No birthdays in the next 30 days
              </h3>
            </div>
          ) : (
            <div className="flex flex-col gap-3 card-stagger">
              {withBirthdays.map(m => (
                <div
                  key={m.id}
                  className={`worship-card p-4 flex items-center gap-3 ${
                    m.daysUntil === 0 ? 'border-gold/60 bg-gold/5' : ''
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {(m.photoUrl || m.photoBase64)
                      ? <img src={m.photoUrl || m.photoBase64} alt="" className="w-full h-full object-cover" />
                      : <span className="font-body text-gold text-lg">{m.name?.[0]}</span>
                    }
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-body text-cream font-bold">{m.name}</p>
                      {m.daysUntil === 0 && <span className="text-lg">🎂</span>}
                    </div>
                    <p className="font-body text-cream-muted text-xs">{m.instrument}</p>
                    <p className="font-body text-xs mt-0.5">
                      <span className={`font-bold ${
                        m.daysUntil === 0 ? 'text-gold' : m.daysUntil <= 7 ? 'text-warning' : 'text-cream-muted'
                      }`}>
                        {m.daysUntil === 0 ? '🎉 Today!' : `${m.daysUntil} days away`}
                      </span>
                      <span className="text-cream-muted ml-1">· {m.birthday}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
