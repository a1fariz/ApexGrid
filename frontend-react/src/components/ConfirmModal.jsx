import { useEffect } from 'react'
import { createPortal } from 'react-dom'

function renderModalIcon(icon) {
  if (icon === '⚠️' || icon === 'warning') {
    return (
      <svg className="w-12 h-12 text-red-500 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
    )
  }
  if (icon === '🗑️' || icon === 'trash') {
    return (
      <svg className="w-12 h-12 text-red-500 animate-pulse" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
      </svg>
    )
  }
  if (icon === '🏆' || icon === 'trophy') {
    return (
      <svg className="w-12 h-12 text-green-500 animate-bounce" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.375M16.5 7.5c.346 0 .686.035 1.015.103a3 3 0 012.485 2.964v2.5a3 3 0 01-2.485 2.964A13.5 13.5 0 0116.5 16.5M16.5 7.5v8.625M16.5 7.5V3.75c0-.621-.503-1.125-1.125-1.125h-6.75C8.003 2.625 7.5 3.129 7.5 3.75v3.75m0 8.625V7.5m0 8.625A13.5 13.5 0 017.5 16.5M7.5 7.5a13.5 13.5 0 00-1.015.103 3 3 0 00-2.485 2.964v2.5a3 3 0 002.485 2.964A13.5 13.5 0 007.5 16.5M12 16.5c-1.18 0-2.09-.91-2.201-2.09L9.186 9h5.628l-.613 5.41c-.11 1.18-1.02 2.09-2.201 2.09z"/>
      </svg>
    )
  }
  return icon
}

export default function ConfirmModal({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'red', // 'red' | 'green'
  icon = '⚠️',
  onConfirm,
  onCancel,
  loading = false,
  children
}) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => {
      if (e.key === 'Escape') onCancel?.()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  const confirmBtnClass = confirmColor === 'green'
    ? 'bg-green-600 hover:bg-green-500 shadow-green-900/30'
    : 'bg-f1-red hover:bg-red-700 shadow-red-900/30'

  return createPortal(
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div
        className="confirm-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="confirm-modal-icon flex justify-center mb-4">
          {renderModalIcon(icon)}
        </div>

        {/* Title & Message */}
        <h3 className="text-xl font-bold text-white text-center mb-2">{title}</h3>
        <p className="text-f1-light text-sm text-center mb-4 leading-relaxed">{message}</p>

        {children}

        {/* Actions */}
        <div className="flex gap-3 w-full mt-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-semibold text-sm transition-all duration-200 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-3 px-4 rounded-xl text-white font-semibold text-sm transition-all duration-200 shadow-lg disabled:opacity-50 ${confirmBtnClass}`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin-f1" />
                Processing...
              </span>
            ) : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
