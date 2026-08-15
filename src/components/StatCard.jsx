export default function StatCard({ icon: Icon, label, value, color = 'text-gold', onClick }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: '1rem', padding: '1rem', textAlign: 'left', width: '100%' }}
      className={`flex flex-col gap-2 ${onClick ? 'cursor-pointer active:opacity-70 hover:border-gold/40 transition-colors' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span style={{ fontSize: '11px', color: 'var(--color-cream-muted)' }} className="font-body uppercase tracking-wide">{label}</span>
        {Icon && <Icon size={16} className={color} />}
      </div>
      <span style={{ fontSize: '22px', fontWeight: 500 }} className={`font-body ${color}`}>{value}</span>
    </Tag>
  )
}
