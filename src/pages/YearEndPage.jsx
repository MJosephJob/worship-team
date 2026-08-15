import { useState, useEffect } from 'react'
import { apiFetch } from '../utils/api'
import { useApp } from '../contexts/AppContext'
import { BookOpen, Printer } from 'lucide-react'
import GoldSpinner from '../components/GoldSpinner'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'

export default function YearEndPage() {
  const { toast } = useApp()
  const [prayers, setPrayers] = useState([])
  const [loading, setLoading] = useState(true)
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await apiFetch('getYearEndSummary', { year: currentYear })
        setPrayers(Array.isArray(data) ? data : [])
      } catch (err) { toast(err.message, 'error') }
      finally { setLoading(false) }
    }
    load()
  }, [])

  function handlePrint() {
    window.print()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title={`Year-End Thanksgiving ${currentYear}`}
        subtitle="All answered prayers this year"
        actions={
          <button onClick={handlePrint} className="btn-outline text-sm py-2">
            <Printer size={14} /> Print / PDF
          </button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16"><GoldSpinner /></div>
      ) : prayers.length === 0 ? (
        <EmptyState icon={BookOpen} title="No answered prayers this year" message="Answered prayers will be collected here at year end." />
      ) : (
        <div className="px-4 print:px-0" id="year-end-print">
          <div className="text-center py-8 print:py-4">
            <h2 className="font-heading text-gold text-3xl font-bold mb-2">Testimonies of God's Faithfulness</h2>
            <p className="font-body text-cream-muted">{currentYear} · CBC Thane Worship Team</p>
            <div className="vm-divider mt-4" />
          </div>

          <div className="flex flex-col gap-8 pb-10">
            {prayers.map((p, i) => (
              <div key={p.id} className="worship-card p-6 print:border print:border-gray-200 print:bg-white print:text-black">
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-heading text-gold text-3xl font-bold opacity-40">{i + 1}</span>
                  <div>
                    <p className="font-body text-cream-muted text-xs">
                      {p.answeredAt ? new Date(p.answeredAt).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }) : ''}
                    </p>
                    <h3 className="font-heading text-cream text-xl font-semibold">{p.title}</h3>
                  </div>
                </div>
                <div className="vm-divider" />
                <div className="mt-4">
                  <p className="font-body text-success text-xs font-bold uppercase tracking-wide mb-2">Testimony</p>
                  <p className="font-heading text-cream text-lg leading-relaxed italic">"{p.testimony}"</p>
                </div>
                {p.postedBy && (
                  <p className="font-body text-cream-muted text-xs mt-4 text-right">— {p.posterName || 'Team Member'}</p>
                )}
              </div>
            ))}
          </div>

          <div className="text-center py-8 border-t border-border">
            <p className="font-heading text-gold text-xl italic">
              "Give thanks to the Lord, for He is good; His love endures forever."
            </p>
            <p className="font-body text-cream-muted text-sm mt-2">Psalm 107:1</p>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .worship-card { box-shadow: none !important; }
          nav, header, button { display: none !important; }
          #year-end-print { padding: 0; }
        }
      `}</style>
    </div>
  )
}
