export default function GoldSpinner({ size = 36, className = '' }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`rounded-full border-surface-raised border-t-gold animate-spin ${className}`}
      style={{
        width: size,
        height: size,
        borderWidth: Math.max(2, size / 12),
        borderTopColor: 'var(--color-gold)',
        borderStyle: 'solid',
      }}
    />
  )
}
