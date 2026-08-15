export default function EmptyState({ icon: Icon, title, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mb-4">
          <Icon size={28} className="text-gold/60" />
        </div>
      )}
      <h3 className="font-body text-cream text-xl font-semibold mb-2">{title}</h3>
      <p className="font-body text-cream-muted text-sm max-w-xs">{message}</p>
    </div>
  )
}
