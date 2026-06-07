import React from 'react'

export function ToastHost({ toasts }) {
  return (
    <div className="toast-host">
      {toasts.map(t => <div className={`toast ${t.type || 'info'}`} key={t.id}>{t.message}</div>)}
    </div>
  )
}

export function useToastState() {
  const [toasts, setToasts] = React.useState([])
  function push(message, type = 'info') {
    const id = crypto.randomUUID()
    setToasts(x => [...x, { id, message, type }])
    setTimeout(() => setToasts(x => x.filter(t => t.id !== id)), 3600)
  }
  return { toasts, push }
}
