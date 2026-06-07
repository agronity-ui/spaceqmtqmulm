export default function EmptyState({ icon = '🌙', title = 'Belum ada data', body = 'Mulai buat data pertama kamu.', action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  )
}
