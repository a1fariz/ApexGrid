import { useState, useEffect } from 'react'
import api from '../services/api'

function StatusBadge({ status }) {
  const config = {
    PENDING: { cls: 'badge-pending', icon: '⏳', label: 'Pending' },
    CONFIRMED: { cls: 'badge-confirmed', icon: '✅', label: 'Confirmed' },
    CANCELLED: { cls: 'badge-cancelled', icon: '❌', label: 'Cancelled' },
  }
  const { cls, icon, label } = config[status] || config.PENDING
  return <span className={cls}>{icon} {label}</span>
}

function Countdown({ expiredAt }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    if (!expiredAt) return

    const update = () => {
      const diff = new Date(expiredAt) - new Date()
      if (diff <= 0) {
        setTimeLeft('Expired')
        return
      }
      const mins = Math.floor(diff / 60000)
      const secs = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${mins}m ${secs}s`)
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [expiredAt])

  if (!timeLeft || timeLeft === 'Expired') return null

  return (
    <div className="flex items-center gap-1.5 text-amber-400 text-xs">
      <span className="inline-block w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
      Expires in {timeLeft}
    </div>
  )
}

export default function BookingCard({ booking, onUpdate }) {
  const [loading, setLoading] = useState(false)

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
  }

  const handleConfirm = async () => {
    if (!confirm('Confirm this booking?')) return
    setLoading(true)
    try {
      await api.put(`/bookings/${booking.id}/confirm`)
      onUpdate?.()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to confirm booking')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Cancel this booking?')) return
    setLoading(true)
    try {
      await api.put(`/bookings/${booking.id}/cancel`, { reason: 'Cancelled by user' })
      onUpdate?.()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card overflow-hidden" id={`booking-card-${booking.id}`}>
      {/* Status stripe */}
      <div className={`h-1 ${
        booking.status === 'CONFIRMED' ? 'bg-green-500' :
        booking.status === 'CANCELLED' ? 'bg-f1-red' :
        'bg-amber-400'
      }`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="font-mono text-f1-red font-bold text-sm mb-1">{booking.bookingCode}</div>
            <h3 className="font-semibold text-white">{booking.raceName}</h3>
            <p className="text-sm text-gray-400">{booking.circuitName} • {booking.country}</p>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        {/* Details */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white/5 rounded-lg p-2.5 text-center">
            <div className="text-xs text-gray-500 mb-0.5">Race Date</div>
            <div className="text-xs font-medium">{formatDate(booking.raceDate)}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2.5 text-center">
            <div className="text-xs text-gray-500 mb-0.5">Tickets</div>
            <div className="text-sm font-bold text-white">{booking.quantity}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2.5 text-center">
            <div className="text-xs text-gray-500 mb-0.5">Total</div>
            <div className="text-xs font-bold text-f1-red">{formatPrice(booking.totalPrice)}</div>
          </div>
        </div>

        {/* Countdown for PENDING */}
        {booking.status === 'PENDING' && (
          <div className="mb-4">
            <Countdown expiredAt={booking.expiredAt} />
          </div>
        )}

        {/* Cancellation reason */}
        {booking.status === 'CANCELLED' && booking.cancellationReason && (
          <p className="text-xs text-gray-500 mb-3 italic">"{booking.cancellationReason}"</p>
        )}

        {/* Actions */}
        {booking.status === 'PENDING' && (
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              disabled={loading}
              id={`confirm-btn-${booking.id}`}
              className="flex-1 py-2 text-sm bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? '...' : '✅ Confirm'}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              id={`cancel-btn-${booking.id}`}
              className="flex-1 py-2 text-sm bg-f1-gray hover:bg-red-900/50 hover:text-f1-red text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? '...' : '❌ Cancel'}
            </button>
          </div>
        )}

        <div className="mt-3 text-xs text-gray-600">
          Booked {formatDate(booking.createdAt)}
        </div>
      </div>
    </div>
  )
}
