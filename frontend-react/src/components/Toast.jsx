import { useState, useEffect, useCallback } from 'react'

let toastId = 0

// Global toast store
let toastListeners = []
const toasts = []

function notifyListeners() {
  toastListeners.forEach(fn => fn([...toasts]))
}

export function showToast(message, type = 'success', duration = 4000) {
  const id = ++toastId
  toasts.push({ id, message, type })
  notifyListeners()
  setTimeout(() => {
    const index = toasts.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.splice(index, 1)
      notifyListeners()
    }
  }, duration)
}

export function Toast() {
  const [list, setList] = useState([])

  useEffect(() => {
    const listener = (updated) => setList(updated)
    toastListeners.push(listener)
    return () => {
      toastListeners = toastListeners.filter(l => l !== listener)
    }
  }, [])

  if (list.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {list.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md pointer-events-auto animate-fade-in
            ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}
          style={{ minWidth: '280px', maxWidth: '420px' }}
        >
          <span className="text-lg flex-shrink-0">
            {toast.type === 'success' ? '✅' : '❌'}
          </span>
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      ))}
    </div>
  )
}

export default Toast
