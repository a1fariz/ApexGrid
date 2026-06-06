import { useState, useEffect } from 'react'

let toastIdCounter = 0
let toastListeners = []
const toastStore = []

function notifyListeners() {
  toastListeners.forEach(fn => fn([...toastStore]))
}

function dismissToast(id) {
  const index = toastStore.findIndex(t => t.id === id)
  if (index === -1) return
  toastStore[index] = { ...toastStore[index], exiting: true }
  notifyListeners()
  setTimeout(() => {
    const i = toastStore.findIndex(t => t.id === id)
    if (i !== -1) {
      toastStore.splice(i, 1)
      notifyListeners()
    }
  }, 380)
}

export function showToast(message, type = 'success', duration = 4000) {
  const id = ++toastIdCounter
  toastStore.push({ id, message, type, duration, exiting: false })
  notifyListeners()
  setTimeout(() => dismissToast(id), duration)
}

const ICONS = {
  success: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 8l2.2 2.2 3.8-3.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 2.5L14 13.5H2L8 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 6.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="11.25" r="0.75" fill="currentColor" />
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7.5v3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="5.5" r="0.75" fill="currentColor" />
    </svg>
  ),
}

const CLOSE_ICON = (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 1l9 9M10 1L1 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

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
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 pointer-events-none">
      {list.map((toast) => (
        <div
          key={toast.id}
          className={`toast-wrapper toast-${toast.type} ${toast.exiting ? 'toast-exit' : 'toast-enter'}`}
          style={{ minWidth: '300px', maxWidth: '440px' }}
        >
          <div className="flex items-start gap-3 px-4 pt-3.5 pb-3.5">
            <span className={`toast-icon-${toast.type} flex-shrink-0 mt-0.5`}>
              {ICONS[toast.type]}
            </span>
            <p className="text-sm font-medium leading-snug flex-1 text-white/90">
              {toast.message}
            </p>
            <button
              onClick={() => dismissToast(toast.id)}
              className="toast-dismiss flex-shrink-0 mt-0.5 pointer-events-auto"
              aria-label="Dismiss notification"
            >
              {CLOSE_ICON}
            </button>
          </div>
          <div className="toast-progress-track">
            <div
              className={`toast-progress-fill toast-progress-${toast.type}`}
              style={{ animationDuration: `${toast.duration}ms` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default Toast
