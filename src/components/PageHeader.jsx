export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="px-4 pt-6 pb-4 flex items-start justify-between">
      <div>
        <h1 className="font-body text-cream text-2xl font-semibold">{title}</h1>
        {subtitle && <p className="font-body text-cream-muted text-sm mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 mt-1">{actions}</div>}
    </div>
  )
}
