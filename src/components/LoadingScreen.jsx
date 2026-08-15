export default function LoadingScreen({ message = 'Loading...' }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-midnight z-50">
      <div className="mb-6">
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
          <path d="M28 4 L28 52 M10 28 L46 28 M16 12 L40 44 M40 12 L16 44" stroke="#c9a84c" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      </div>
      <div className="spinner mb-4" />
      <p className="font-body text-cream-muted text-sm">{message}</p>
    </div>
  )
}
