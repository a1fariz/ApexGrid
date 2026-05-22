import { useEffect } from 'react'

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

  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div
        className="confirm-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="confirm-modal-icon">
          <span className="text-4xl">{icon}</span>
        </div>

        {/* Title & Message */}
        <h3 className="text-xl font-bold text-white text-center mb-2">{title}</h3>
        <p className="text-gray-400 text-sm text-center mb-8 leading-relaxed">{message}</p>

        {/* Actions */}
        <div className="flex gap-3 w-full">
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
    </div>
  )
}
