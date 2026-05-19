import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'

const CIRCUIT_FLAGS = {
  'Italy': '🇮🇹', 'United Kingdom': '🇬🇧', 'Belgium': '🇧🇪',
  'Japan': '🇯🇵', 'Singapore': '🇸🇬', 'Brazil': '🇧🇷',
}

export default function RaceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [race, setRace] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [booking, setBooking] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState(null)

  useEffect(() => {
    const fetchRace = async () => {
      try {
        const res = await api.get(`/races/${id}`)
        setRace(res.data)
      } catch {
        setLoading(false)
      } finally {
        setLoading(false)
      }
    }
    fetchRace()
  }, [id])

  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBD'
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
  }

  const totalPrice = race ? (race.ticketPrice * quantity).toFixed(2) : 0

  const handleBook = async () => {
    if (!isAuthenticated()) {
      navigate('/login')
      return
    }

    if (quantity < 1 || quantity > race.availableQuota) {
      setBookingError(`Quantity must be between 1 and ${race.availableQuota}`)
      return
    }

    setBooking(true)
    setBookingError('')
    try {
      const res = await api.post('/bookings', { raceId: race.id, quantity })
      setBookingSuccess(res.data)
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Booking failed. Please try again.')
    } finally {
      setBooking(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" text="Loading race details..." />
        </div>
      </div>
    )
  }

  if (!race) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="text-center py-24">
          <div className="text-5xl mb-4">🏁</div>
          <h2 className="text-xl text-white mb-2">Race not found</h2>
          <button onClick={() => navigate('/')} className="btn-primary mt-4">Back to Races</button>
        </div>
      </div>
    )
  }

  const flag = CIRCUIT_FLAGS[race.country] || '🏳️'
  const quotaPercent = Math.round((race.availableQuota / race.totalQuota) * 100)

  if (bookingSuccess) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-20 text-center animate-fade-in">
          <div className="glass-card p-10">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-2xl font-bold text-white mb-2">Booking Created!</h2>
            <div className="font-mono text-f1-red text-xl font-bold my-4">{bookingSuccess.bookingCode}</div>
            <p className="text-gray-400 text-sm mb-2">{race.name}</p>
            <p className="text-gray-400 text-sm mb-6">
              {bookingSuccess.quantity} ticket(s) — {formatPrice(bookingSuccess.totalPrice)}
            </p>
            <div className="badge-pending mb-6">⏳ PENDING — Expires in 30 minutes</div>
            <div className="flex gap-3">
              <button onClick={() => navigate('/bookings')} className="flex-1 btn-primary">
                View My Bookings →
              </button>
              <button onClick={() => navigate('/')} className="flex-1 btn-secondary">
                Back to Races
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Banner */}
      <div className="relative h-56 md:h-72 overflow-hidden"
           style={{ background: 'linear-gradient(135deg, #1a0505 0%, #2d0808 50%, #15151E 100%)' }}>
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <span className="text-[200px] font-black text-f1-red select-none">{flag}</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-f1-black to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 h-full flex flex-col justify-end pb-8">
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white text-sm transition-colors">
              ← Back to Races
            </button>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">{race.name}</h1>
          <p className="text-gray-400 mt-1">{race.circuitName} · {race.location}, {race.country}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: Race Info */}
          <div className="lg:col-span-2 space-y-6">

            {/* Key Info */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Race Information</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Date', value: formatDate(race.raceDate), icon: '📅' },
                  { label: 'Season', value: `${race.season} · Round ${race.round}`, icon: '🏆' },
                  { label: 'Status', value: race.status, icon: '📊' },
                  { label: 'Circuit', value: race.circuitName, icon: '🗺️' },
                  { label: 'Country', value: `${flag} ${race.country}`, icon: '' },
                  { label: 'Track Length', value: race.lengthKm ? `${race.lengthKm} km` : 'N/A', icon: '📏' },
                ].map((item) => (
                  <div key={item.label} className="bg-white/5 rounded-xl p-4">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{item.label}</div>
                    <div className="text-sm font-semibold text-white">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            {race.description && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-white mb-3">About This Race</h2>
                <p className="text-gray-400 leading-relaxed">{race.description}</p>
              </div>
            )}

            {/* Ticket Availability */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Ticket Availability</h2>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">{race.availableQuota.toLocaleString()} of {race.totalQuota.toLocaleString()} tickets remaining</span>
                <span className={`text-sm font-semibold ${quotaPercent < 20 ? 'text-amber-400' : 'text-f1-green'}`}>{quotaPercent}%</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${quotaPercent < 20 ? 'bg-amber-400' : 'bg-f1-green'}`}
                  style={{ width: `${quotaPercent}%` }}
                />
              </div>
              {quotaPercent < 20 && (
                <p className="text-amber-400 text-xs mt-2">⚠️ Almost sold out!</p>
              )}
            </div>
          </div>

          {/* Right: Booking Card */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-white mb-1">Book Tickets</h2>
              <p className="text-sm text-gray-400 mb-6">Secure your spot at {race.name}</p>

              <div className="space-y-4">
                {/* Price per ticket */}
                <div className="flex items-center justify-between py-3 border-b border-white/5">
                  <span className="text-gray-400 text-sm">Price per ticket</span>
                  <span className="text-white font-semibold">{formatPrice(race.ticketPrice)}</span>
                </div>

                {/* Quantity */}
                <div>
                  <label className="form-label">Number of Tickets</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      id="qty-decrease"
                      className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-white transition-colors"
                    >
                      −
                    </button>
                    <input
                      id="quantity-input"
                      type="number"
                      min="1"
                      max={race.availableQuota}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.min(race.availableQuota, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="form-input text-center w-20 flex-shrink-0"
                    />
                    <button
                      onClick={() => setQuantity(Math.min(race.availableQuota, quantity + 1))}
                      id="qty-increase"
                      className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-white transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Total */}
                <div className="bg-f1-red/10 rounded-xl p-4 border border-f1-red/20">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Total Price</span>
                    <span className="text-2xl font-bold text-f1-red">{formatPrice(totalPrice)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Booking expires after 30 minutes</p>
                </div>

                {bookingError && (
                  <div className="text-red-400 text-sm bg-red-500/10 rounded-lg p-3">
                    ⚠️ {bookingError}
                  </div>
                )}

                <button
                  onClick={handleBook}
                  id="book-now-btn"
                  disabled={booking || race.availableQuota === 0}
                  className="w-full btn-primary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {booking ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin-f1" />
                      Processing...
                    </span>
                  ) : race.availableQuota === 0 ? (
                    'Sold Out'
                  ) : !isAuthenticated() ? (
                    '🔒 Login to Book'
                  ) : (
                    '🏎️ Book Now'
                  )}
                </button>

                {!isAuthenticated() && (
                  <p className="text-center text-xs text-gray-500">
                    <button onClick={() => navigate('/login')} className="text-f1-red hover:underline">Sign in</button> to book tickets
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
