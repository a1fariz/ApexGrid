import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import BookingCard from '../components/BookingCard'
import PageTransition from '../components/PageTransition'
import api from '../services/api'

function BookingCardSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="h-1 bg-white/[0.06]" />
      <div className="p-5 space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-white/[0.06] rounded w-24" />
            <div className="h-5 bg-white/[0.06] rounded w-40" />
            <div className="h-3 bg-white/[0.04] rounded w-32" />
          </div>
          <div className="h-6 bg-white/[0.06] rounded-full w-20" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="h-14 bg-white/[0.03] rounded-xl" />
          <div className="h-14 bg-white/[0.03] rounded-xl" />
          <div className="h-14 bg-white/[0.03] rounded-xl" />
        </div>
        <div className="flex gap-2">
          <div className="flex-1 h-10 bg-white/[0.04] rounded-xl" />
          <div className="flex-1 h-10 bg-white/[0.04] rounded-xl" />
        </div>
      </div>
    </div>
  )
}

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

  const filterConfig = {
    ALL: { color: 'text-white', activeColor: 'border-white/20' },
    PENDING: { color: 'text-amber-400', activeColor: 'border-amber-400/40' },
    CONFIRMED: { color: 'text-green-400', activeColor: 'border-green-400/40' },
    CANCELLED: { color: 'text-red-400', activeColor: 'border-f1-red/40' },
  }

  return (
    <PageTransition>
      <div className="min-h-screen">
        <Navbar />

        <div className="max-w-6xl mx-auto px-4 py-10">

          {/* Header */}
          <div className="mb-8">
            <div className="f1-stripe mb-3" />
            <h1 className="text-3xl font-bold text-white">My Bookings</h1>
            <p className="text-gray-500 mt-1">Track and manage your F1 ticket bookings</p>
          </div>

          {/* Stats Summary */}
          {!loading && !error && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {Object.entries(counts).map(([status, count]) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  id={`filter-${status}`}
                  className={`card-static p-4 text-center transition-all duration-300 rounded-2xl border ${
                    filter === status
                      ? filterConfig[status].activeColor
                      : 'border-white/[0.04] hover:border-white/[0.08]'
                  }`}
                >
                  <div className={`text-2xl font-bold ${filterConfig[status].color}`}>{count}</div>
                  <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">{status}</div>
                </button>
              ))}
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                  <BookingCardSkeleton />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-24 animate-fade-in">
              <div className="text-5xl mb-4">⚠️</div>
              <p className="text-red-400 mb-2">{error}</p>
              <p className="text-gray-500 text-sm mb-6">Please check your connection and try again.</p>
              <button onClick={fetchBookings} className="btn-primary">Retry</button>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-24 animate-fade-in">
              <div className="w-20 h-20 bg-white/[0.03] rounded-3xl flex items-center justify-center mx-auto mb-6">
                <span className="text-5xl">🎫</span>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                {filter === 'ALL' ? 'No bookings yet' : `No ${filter.toLowerCase()} bookings`}
              </h2>
              <p className="text-gray-500 mb-6 text-sm max-w-sm mx-auto">
                {filter === 'ALL'
                  ? 'Start your Formula 1 journey by booking your first race!'
                  : `You don't have any ${filter.toLowerCase()} bookings.`}
              </p>
              {filter === 'ALL' && (
                <button onClick={() => navigate('/')} className="btn-primary">
                  Browse Races
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredBookings.map((booking, index) => (
                <div key={booking.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.06}s` }}>
                  <BookingCard booking={booking} onUpdate={fetchBookings} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
