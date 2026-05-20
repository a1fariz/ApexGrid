import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'

export default function UserProfile() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(null)

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await api.get('/bookings')
        setBookings(res.data)
      } catch (err) {
        console.error('Failed to load bookings')
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [])

  const confirmedCount = bookings.filter(b => b.status === 'CONFIRMED').length
  const pendingCount = bookings.filter(b => b.status === 'PENDING').length
  const cancelledCount = bookings.filter(b => b.status === 'CANCELLED').length

  const downloadTicket = async (bookingId, bookingCode) => {
    setDownloading(bookingId)
    try {
      const res = await api.get(`/bookings/${bookingId}/ticket`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `ApexGrid-Ticket-${bookingCode}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to download ticket')
    } finally {
      setDownloading(null)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price)
  }

  const statusBadge = (status) => {
    const map = {
      CONFIRMED: 'bg-green-500/10 text-green-400 border-green-500/20',
      PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
    }
    return `px-2 py-0.5 text-xs font-semibold rounded-full border ${map[status] || 'bg-gray-500/10 text-gray-400'}`
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="f1-stripe mb-3" />
          <h1 className="text-3xl font-bold text-white">My Profile</h1>
          <p className="text-gray-400 mt-1">Account information & booking history</p>
        </div>

        {/* User Info Card */}
        <div className="card p-6 mb-8">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 bg-f1-red rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">{user?.fullName || user?.username}</h2>
              <div className="text-gray-400 text-sm mt-1">@{user?.username}</div>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-400">
                <span>📧 {user?.email}</span>
                <span className="px-2 py-0.5 rounded-full bg-f1-red/10 text-f1-red text-xs font-semibold border border-f1-red/20">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{confirmedCount}</div>
            <div className="text-xs text-gray-500 mt-1">Confirmed</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-amber-400">{pendingCount}</div>
            <div className="text-xs text-gray-500 mt-1">Pending</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{cancelledCount}</div>
            <div className="text-xs text-gray-500 mt-1">Cancelled</div>
          </div>
        </div>

        {/* Booking History */}
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <h2 className="font-semibold text-white">Booking History</h2>
            <p className="text-xs text-gray-500 mt-1">{bookings.length} total bookings</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner text="Loading bookings..." />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">🎫</div>
              <p className="text-gray-400">No bookings yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Booking</th>
                    <th>Race</th>
                    <th>Date</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Ticket</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(booking => (
                    <tr key={booking.id}>
                      <td>
                        <div className="font-mono font-semibold text-f1-red text-sm">{booking.bookingCode}</div>
                        <div className="text-xs text-gray-500">{formatDate(booking.createdAt)}</div>
                      </td>
                      <td>
                        <div className="font-medium text-white text-sm">{booking.raceName}</div>
                        <div className="text-xs text-gray-500">{booking.circuitName}, {booking.country}</div>
                      </td>
                      <td className="text-sm">{formatDate(booking.raceDate)}</td>
                      <td className="text-sm text-center">{booking.quantity}</td>
                      <td className="text-sm font-semibold">{formatPrice(booking.totalPrice)}</td>
                      <td><span className={statusBadge(booking.status)}>{booking.status}</span></td>
                      <td>
                        {booking.status === 'CONFIRMED' ? (
                          <button
                            onClick={() => downloadTicket(booking.id, booking.bookingCode)}
                            disabled={downloading === booking.id}
                            className="px-3 py-1.5 text-xs bg-f1-red/10 hover:bg-f1-red/20 rounded-lg text-f1-red font-medium transition-colors disabled:opacity-50"
                          >
                            {downloading === booking.id ? '⏳...' : '🎫 Download'}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
