const INSTRUMENTS = ['Vocals','Guitar','Electric Guitar','Bass','Keyboard','Drums','Sound','DLP','Stage Setup','Other']

export default function InstrumentPicker({ value, onChange }) {
  const selected = value ? String(value).split(',').filter(Boolean) : []

  function toggle(inst) {
    const next = selected.includes(inst)
      ? selected.filter(i => i !== inst)
      : [...selected, inst]
    onChange(next.join(','))
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {INSTRUMENTS.map(inst => (
          <button
            key={inst}
            type="button"
            onClick={() => toggle(inst)}
            className={`px-2 py-1.5 rounded-lg border font-body text-xs font-bold transition-all ${
              selected.includes(inst)
                ? 'bg-gold/20 border-gold text-gold'
                : 'border-border text-cream-muted hover:border-gold/50 hover:text-cream'
            }`}
          >
            {inst}
          </button>
        ))}
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map(inst => (
            <span key={inst} className="flex items-center gap-1 bg-gold/15 text-gold text-xs px-2 py-0.5 rounded-full font-body font-bold">
              {inst}
              <button type="button" onClick={() => toggle(inst)} className="text-gold/60 hover:text-danger ml-0.5 leading-none">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
