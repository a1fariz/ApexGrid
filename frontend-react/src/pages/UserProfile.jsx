import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import LoadingSpinner from '../components/LoadingSpinner'
import PageTransition from '../components/PageTransition'
import { showToast } from '../components/Toast'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'
import { FaPencilAlt, FaEnvelope, FaTicketAlt, FaHourglassHalf, FaTimes } from 'react-icons/fa'

export default function UserProfile() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ fullName: '', currentPassword: '', password: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await api.get('/bookings?page=0&size=100')
        setBookings(res.data.content || [])
      } catch (err) {
        // Fail silently — booking stats will show 0
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
      showToast(err.response?.data?.message || 'Failed to download ticket', 'error')
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

  const handleEditClick = () => {
    setEditForm({ fullName: user?.fullName || '', currentPassword: '', password: '' })
    setIsEditing(true)
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/users/profile', {
        fullName: editForm.fullName,
        currentPassword: editForm.currentPassword || undefined,
        password: editForm.password || undefined,
      })
      showToast('Profile updated successfully! Refreshing...', 'success')
      setTimeout(() => window.location.reload(), 1200)
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageTransition>
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-10 flex-1 w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Link to="/" className="text-f1-light hover:text-f1-red transition-colors text-sm flex items-center gap-1 font-semibold">
              ← Back to Home
            </Link>
            <div className="f1-stripe" />
          </div>
          <h1 className="text-3xl font-bold text-f1-white">My Profile</h1>
          <p className="text-f1-light mt-1">Account information & booking history</p>
        </div>

        {/* User Info Card */}
        <div className="card p-6 mb-8">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 bg-f1-red rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-f1-white">{user?.fullName || user?.username}</h2>
                  <div className="text-f1-light text-sm mt-1">@{user?.username}</div>
                </div>
                <button onClick={handleEditClick} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5">
                  <FaPencilAlt /> Edit Profile
                </button>
              </div>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-f1-light">
                <span className="flex items-center gap-1.5"><FaEnvelope /> {user?.email}</span>
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
            <div className="text-xs text-f1-light mt-1">Confirmed</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-amber-400">{pendingCount}</div>
            <div className="text-xs text-f1-light mt-1">Pending</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{cancelledCount}</div>
            <div className="text-xs text-f1-light mt-1">Cancelled</div>
          </div>
        </div>

        {/* Booking History */}
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-f1-border">
            <h2 className="font-semibold text-f1-white">Booking History</h2>
            <p className="text-xs text-f1-light mt-1">{bookings.length} total bookings</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner text="Loading bookings..." />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-16">
              <FaTicketAlt className="text-4xl mx-auto mb-3 text-f1-light" />
              <p className="text-f1-light">No bookings yet</p>
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
                        <div className="text-xs text-f1-light">{formatDate(booking.createdAt)}</div>
                      </td>
                      <td>
                        <div className="font-medium text-f1-white text-sm">{booking.raceName}</div>
                        <div className="text-xs text-f1-light">{booking.circuitName}, {booking.country}</div>
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
                            className="px-3 py-1.5 text-xs bg-f1-red/10 hover:bg-f1-red/20 rounded-lg text-f1-red font-medium transition-colors disabled:opacity-50 flex items-center gap-1 mx-auto"
                          >
                            {downloading === booking.id ? (
                              <><FaHourglassHalf className="animate-spin" /> ...</>
                            ) : (
                              <><FaTicketAlt /> Download</>
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-f1-light">—</span>
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

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-f1-card border border-f1-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-5 border-b border-f1-border flex items-center justify-between">
              <h3 className="font-bold text-f1-white">Edit Profile</h3>
              <button onClick={() => setIsEditing(false)} className="text-f1-light hover:text-white transition-colors flex items-center justify-center"><FaTimes /></button>
            </div>
            <form onSubmit={handleSaveProfile} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="form-label text-f1-light">Full Name</label>
                  <input
                    type="text"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({...editForm, fullName: e.target.value})}
                    className="form-input"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="form-label text-f1-light">Current Password</label>
                  <input
                    type="password"
                    value={editForm.currentPassword}
                    onChange={(e) => setEditForm({...editForm, currentPassword: e.target.value})}
                    className="form-input"
                    placeholder="Required only when changing password"
                  />
                </div>
                <div>
                  <label className="form-label text-f1-light">New Password</label>
                  <input
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                    className="form-input"
                    placeholder="Leave blank to keep current password"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 6 characters if you want to change it.</p>
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 btn-ghost border border-f1-border text-sm py-2 rounded-lg">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 btn-primary text-sm py-2 rounded-lg">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
    </PageTransition>
  )
}
