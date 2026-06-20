import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import ConfirmModal from './ConfirmModal'
import { showToast } from './Toast'

function StatusBadge({ status }) {
  const config = {
    PENDING: {
      cls: 'badge-pending',
      icon: (
        <svg className="w-3.5 h-3.5 mr-1.5 inline-block" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Pending'
    },
    CONFIRMED: {
      cls: 'badge-confirmed',
      icon: (
        <svg className="w-3.5 h-3.5 mr-1.5 inline-block" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ),
      label: 'Confirmed'
    },
    CANCELLED: {
      cls: 'badge-cancelled',
      icon: (
        <svg className="w-3.5 h-3.5 mr-1.5 inline-block" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
        </svg>
      ),
      label: 'Cancelled'
    },
  }
  const { cls, icon, label } = config[status] || config.PENDING
  return <span className={`${cls} inline-flex items-center`}>{icon}{label}</span>
}

function ZoneBadge({ zone }) {
  const config = {
    GA:  { label: 'General Admission', color: '#00D2BE', bg: 'rgba(0,210,190,0.08)',  border: 'rgba(0,210,190,0.2)' },
    GS:  { label: 'Grandstand',        color: '#FFD700', bg: 'rgba(255,215,0,0.08)',  border: 'rgba(255,215,0,0.2)' },
    VIP: { label: 'Paddock Club (VIP)',color: '#E10600', bg: 'rgba(225,6,0,0.08)',    border: 'rgba(225,6,0,0.2)' },
  }
  const z = zone?.toUpperCase() || 'GA'
  const { label, color, bg, border } = config[z] || config.GA
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{ color, background: bg, border: `1px solid ${border}` }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, display: 'inline-block' }} />
      {z} · {label}
    </span>
  )
}

function CircularCountdown({ expiredAt }) {
  const [timeLeft, setTimeLeft] = useState('')
  const [progress, setProgress] = useState(100)
  const TOTAL_DURATION = 30 * 60 // 30 minutes in seconds
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_DURATION)

  useEffect(() => {
    const update = () => {
      setSecondsLeft(prev => {
        const next = prev - 1;
        if (next <= 0) {
          setTimeLeft('Expired')
          setProgress(0)
          return 0;
        }
        const mins = String(Math.floor(next / 60)).padStart(2, '0')
        const secs = String(next % 60).padStart(2, '0')
        setTimeLeft(`${mins}:${secs}`)
        setProgress((next / TOTAL_DURATION) * 100)
        return next;
      })
    }
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  if (!timeLeft || timeLeft === 'Expired') return null

  const radius = 22
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (progress / 100) * circumference
  const isUrgent = progress < 33

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="countdown-container" style={{ width: 52, height: 52 }}>
        <svg width="52" height="52" className="countdown-ring" viewBox="0 0 52 52">
          <circle className="countdown-ring-bg" cx="26" cy="26" r={radius} />
          <circle
            className="countdown-ring-progress"
            cx="26" cy="26" r={radius}
            stroke={isUrgent ? '#E10600' : '#FFD700'}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <span className={`countdown-text ${isUrgent ? 'text-f1-red' : 'text-amber-400'}`}>
          {timeLeft}
        </span>
      </div>
      <div>
        <div className={`text-xs font-semibold ${isUrgent ? 'text-f1-red' : 'text-amber-400'}`}>
          {isUrgent ? '⚡ Hurry up!' : '⏱ Time Remaining'}
        </div>
        <div className="text-[10px] text-gray-500">Confirm before expiry</div>
      </div>
    </div>
  )
}

export default function BookingCard({ booking, onUpdate }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [confirmModal, setConfirmModal] = useState({ open: false, type: null })

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
    setConfirmModal({ open: false, type: null })
    setLoading(true)
    try {
      await api.put(`/bookings/${booking.id}/confirm`)
      showToast(`Booking ${booking.bookingCode} confirmed`, 'success')
      onUpdate?.()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to confirm booking', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    setConfirmModal({ open: false, type: null })
    setLoading(true)
    try {
      await api.put(`/bookings/${booking.id}/cancel`, { reason: 'Cancelled by user' })
      showToast(`Booking ${booking.bookingCode} has been cancelled`, 'success')
      onUpdate?.()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel booking', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadTicket = async () => {
    setDownloading(true)
    try {
      const res = await api.get(`/bookings/${booking.id}/ticket`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `ApexGrid-Ticket-${booking.bookingCode}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      showToast('Ticket downloaded successfully', 'success')
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to download ticket', 'error')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <>
      <div className="card overflow-hidden" id={`booking-card-${booking.id}`}>
        {/* Status stripe */}
        <div className={`h-1 ${
          booking.status === 'CONFIRMED' ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
          booking.status === 'CANCELLED' ? 'bg-gradient-to-r from-f1-red to-red-400' :
          'bg-gradient-to-r from-amber-400 to-yellow-300'
        }`} />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="font-mono text-f1-red font-bold text-sm mb-1 tracking-wider">{booking.bookingCode}</div>
              <h3 className="font-semibold text-white">{booking.raceName}</h3>
              <p className="text-sm text-gray-500">{booking.circuitName} • {booking.country}</p>
              <div className="mt-2">
                <ZoneBadge zone={booking.zone} />
              </div>
            </div>
            <StatusBadge status={booking.status} />
          </div>

          {/* Details */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-white/[0.03] rounded-xl p-2.5 text-center">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Date</div>
              <div className="text-xs font-medium">{formatDate(booking.raceDate)}</div>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-2.5 text-center">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Tickets</div>
              <div className="text-sm font-bold text-white">{booking.quantity}</div>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-2.5 text-center">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Total</div>
              <div className="text-xs font-bold text-f1-red">{formatPrice(booking.totalPrice)}</div>
            </div>
          </div>

          {/* Circular Countdown for PENDING */}
          {booking.status === 'PENDING' && (
            <div className="mb-4 bg-amber-400/[0.04] rounded-xl px-3 py-1 border border-amber-400/10">
              <CircularCountdown expiredAt={booking.expiredAt} />
            </div>
          )}

          {/* Cancellation reason */}
          {booking.status === 'CANCELLED' && booking.cancellationReason && (
            <p className="text-xs text-gray-500 mb-3 italic bg-white/[0.02] rounded-lg px-3 py-2">
              "{booking.cancellationReason}"
            </p>
          )}

          {/* Actions */}
          {booking.status === 'PENDING' && (
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/payment/${booking.bookingCode}`)}
                disabled={loading}
                id={`pay-btn-${booking.id}`}
                className="flex-1 py-2.5 text-sm bg-f1-red/90 hover:bg-f1-red text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 hover:shadow-lg hover:shadow-red-900/30 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5"
              >
                {loading ? '...' : '💳 Pay Now'}
              </button>
              <button
                onClick={() => setConfirmModal({ open: true, type: 'cancel' })}
                disabled={loading}
                id={`cancel-btn-${booking.id}`}
                className="flex-1 py-2.5 text-sm bg-white/[0.04] hover:bg-red-900/30 hover:text-f1-red text-gray-400 font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 border border-white/[0.04] hover:border-f1-red/20 hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? '...' : 'Cancel'}
              </button>
            </div>
          )}

          {/* Download Ticket for CONFIRMED */}
          {booking.status === 'CONFIRMED' && (
            <button
              onClick={handleDownloadTicket}
              disabled={downloading}
              id={`download-ticket-${booking.id}`}
              className="w-full py-2.5 text-sm bg-f1-red/[0.08] hover:bg-f1-red/[0.15] text-f1-red font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 border border-f1-red/10 hover:border-f1-red/25 hover:scale-[1.01] active:scale-[0.99]"
            >
              {downloading ? (
                <>
                  <span className="w-4 h-4 border-2 border-f1-red/30 border-t-f1-red rounded-full spin-f1" />
                  Generating...
                </>
              ) : (
                'Download Ticket (PDF)'
              )}
            </button>
          )}

          <div className="mt-3 text-[10px] text-gray-600 tracking-wide">
            Booked {formatDate(booking.createdAt)}
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.open && confirmModal.type === 'confirm'}
        title="Confirm Booking"
        message={`Are you sure you want to confirm booking ${booking.bookingCode}? This action will finalize your ticket purchase.`}
        icon="🏆"
        confirmText="Yes, Confirm"
        confirmColor="green"
        loading={loading}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmModal({ open: false, type: null })}
      />

      {/* Cancel Modal */}
      <ConfirmModal
        isOpen={confirmModal.open && confirmModal.type === 'cancel'}
        title="Cancel Booking"
        message={`Are you sure you want to cancel booking ${booking.bookingCode}? Your tickets will be released and the quota will be restored.`}
        icon="⚠️"
        confirmText="Yes, Cancel Booking"
        confirmColor="red"
        loading={loading}
        onConfirm={handleCancel}
        onCancel={() => setConfirmModal({ open: false, type: null })}
      />
    </>
  )
}
