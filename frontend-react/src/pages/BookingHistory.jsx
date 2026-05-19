import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import BookingCard from '../components/BookingCard'
import LoadingSpinner from '../components/LoadingSpinner'
import api from '../services/api'

export default function BookingHistory() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('ALL')
  const navigate = useNavigate()

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const res = await api.get('/bookings')
      setBookings(res.data)
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login')
      } else {
        setError('Failed to load bookings')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const filteredBookings = bookings.filter(b => {
    if (filter === 'ALL') return true
    return b.status === filter
  })

  const counts = {
    ALL: bookings.length,
    PENDING: bookings.filter(b => b.status === 'PENDING').length,
    CONFIRMED: bookings.filter(b => b.status === 'CONFIRMED').length,
    CANCELLED: bookings.filter(b => b.status === 'CANCELLED').length,
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="f1-stripe mb-3" />
          <h1 className="text-3xl font-bold text-white">My Bookings</h1>
          <p className="text-gray-400 mt-1">Track and manage your F1 ticket bookings</p>
        </div>

        {/* Stats Summary */}
        {!loading && !error && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Object.entries(counts).map(([status, count]) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                id={`filter-${status}`}
                className={`card p-4 text-center transition-all ${filter === status ? 'border-f1-red' : ''}`}
              >
                <div className={`text-2xl font-bold ${
                  status === 'ALL' ? 'text-white' :
                  status === 'PENDING' ? 'text-amber-400' :
                  status === 'CONFIRMED' ? 'text-green-400' :
                  'text-red-400'
                }`}>{count}</div>
                <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide">{status}</div>
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <LoadingSpinner size="lg" text="Loading your bookings..." />
          </div>
        ) : error ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">⚠️</div>
            <p className="text-red-400">{error}</p>
            <button onClick={fetchBookings} className="btn-primary mt-4">Retry</button>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-24 animate-fade-in">
            <div className="text-6xl mb-4">🎫</div>
            <h2 className="text-xl font-semibold text-white mb-2">
              {filter === 'ALL' ? 'No bookings yet' : `No ${filter.toLowerCase()} bookings`}
            </h2>
            <p className="text-gray-400 mb-6">
              {filter === 'ALL'
                ? 'Start your Formula 1 journey by booking your first race!'
                : `You don't have any ${filter.toLowerCase()} bookings.`}
            </p>
            {filter === 'ALL' && (
              <button onClick={() => navigate('/')} className="btn-primary">
                Browse Races 🏎️
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredBookings.map((booking, index) => (
              <div key={booking.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                <BookingCard booking={booking} onUpdate={fetchBookings} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
