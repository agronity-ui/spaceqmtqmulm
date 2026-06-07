export default function LoadingState({ label = 'Memuat data...' }) {
  return (
    <div className="loading-state" aria-live="polite">
      <span className="spinner" />
      <p>{label}</p>
    </div>
  )
}
