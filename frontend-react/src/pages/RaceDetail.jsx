import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import LoadingSpinner from '../components/LoadingSpinner'
import PageTransition from '../components/PageTransition'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'

const CIRCUIT_FLAGS = {
  'Italy': '🇮🇹', 'United Kingdom': '🇬🇧', 'Belgium': '🇧🇪',
  'Japan': '🇯🇵', 'Singapore': '🇸🇬', 'Brazil': '🇧🇷',
  'Germany': '🇩🇪', 'Spain': '🇪🇸', 'Monaco': '🇲🇨', 'Australia': '🇦🇺',
}

const TICKET_ZONES = {
  GA: {
    name: 'General Admission',
    multiplier: 1.0,
    color: '#00D2BE',
    bgLight: 'rgba(0, 210, 190, 0.05)',
    borderLight: 'rgba(0, 210, 190, 0.2)',
    icon: '🏕️',
    description: 'Access to general spectator areas around the circuit, giant screens, and entertainment zones.',
  },
  GS: {
    name: 'Grandstand Seat',
    multiplier: 2.5,
    color: '#FFD700',
    bgLight: 'rgba(255, 215, 0, 0.05)',
    borderLight: 'rgba(255, 215, 0, 0.2)',
    icon: '🏟️',
    description: 'Reserved seat in covered grandstands opposite the main straight or key corners. Excellent viewing angles.',
  },
  VIP: {
    name: 'Paddock Club (VIP)',
    multiplier: 6.0,
    color: '#E10600',
    bgLight: 'rgba(225, 6, 0, 0.05)',
    borderLight: 'rgba(225, 6, 0, 0.2)',
    icon: '🥂',
    description: 'Ultimate luxury. Prime viewing above the pit lane, pit lane walks, open bar, gourmet dining, and driver appearances.',
  },
}

export default function RaceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [race, setRace] = useState(null)
  const [loading, setLoading] = useState(true)
  const [imgError, setImgError] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [selectedZone, setSelectedZone] = useState('GA')
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

  const zoneInfo = TICKET_ZONES[selectedZone]
  const ticketPrice = race ? race.ticketPrice * zoneInfo.multiplier : 0
  const totalPrice = ticketPrice * quantity

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
      const res = await api.post('/bookings', {
        raceId: race.id,
        quantity,
        zone: selectedZone,
      })
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
        <div className="text-center py-24 animate-fade-in">
          <div className="text-6xl mb-4">🏁</div>
          <h2 className="text-xl text-white mb-2">Race not found</h2>
          <p className="text-gray-500 mb-6 text-sm">The race you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => navigate('/')} className="btn-primary mt-4">Back to Races</button>
        </div>
      </div>
    )
  }

  const flag = CIRCUIT_FLAGS[race.country] || '🏳️'
  const quotaPercent = Math.round((race.availableQuota / race.totalQuota) * 100)
  const isLowQuota = quotaPercent < 20

  if (bookingSuccess) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-20 text-center animate-fade-in">
          <div className="glass-card p-10">
            {/* Success checkmark */}
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
              <span className="text-5xl">🏆</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Booking Created!</h2>
            <div className="font-mono text-f1-red text-2xl font-bold my-4 tracking-widest">{bookingSuccess.bookingCode}</div>
            <p className="text-gray-400 text-sm mb-2">{race.name}</p>
            <p className="text-gray-400 text-sm mb-3">
              Zone: <span className="text-white font-semibold">{bookingSuccess.simulatedZone}</span>
            </p>
            <p className="text-gray-400 text-sm mb-6">
              {bookingSuccess.quantity} ticket(s) — {formatPrice(bookingSuccess.simulatedTotalPrice)}
            </p>
            <div className="badge-pending mb-8">⏳ PENDING — Expires in 30 minutes</div>
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
    <PageTransition>
      <div className="min-h-screen">
        <Navbar />

        {/* Hero Banner */}
        <div className="relative h-60 md:h-80 overflow-hidden"
             style={race.imageUrl && !imgError
               ? { backgroundColor: '#0A0A0F' }
               : { background: 'linear-gradient(135deg, #150505 0%, #1a0808 40%, #0A0A0F 100%)' }}>

          {race.imageUrl && !imgError && (
            <img
              src={race.imageUrl}
              alt={race.name}
              className="absolute inset-0 w-full h-full object-cover opacity-40"
              onError={() => setImgError(true)}
            />
          )}

          {/* Large flag watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none">
            <span className="text-[200px] font-black select-none">{flag}</span>
          </div>

          {/* Bottom gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0A0A0F] to-transparent" />

          {/* Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 h-full flex flex-col justify-end pb-8">
            <button onClick={() => navigate('/')} className="text-gray-500 hover:text-white text-sm transition-colors duration-300 mb-3 w-fit">
              ← Back to Races
            </button>
            <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">{race.name}</h1>
            <p className="text-gray-400 mt-2 text-lg">{race.circuitName} · {race.location}, {race.country}</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left: Race Info & Seating Selection */}
            <div className="lg:col-span-2 space-y-6">

              {/* Seating & Zone Selection Section */}
              <div className="card p-6 animate-fade-in" style={{ animationDelay: '0.05s' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="f1-stripe" />
                  <h2 className="text-lg font-bold text-white uppercase tracking-wider font-f1">Select Seating Zone</h2>
                </div>
                <p className="text-gray-500 text-sm mb-6">Click on a track zone or select a tier below to customize your ticket</p>

                {/* Interactive Racetrack SVG */}
                <div className="bg-black/40 rounded-2xl p-6 border border-white/[0.04] flex flex-col md:flex-row items-center gap-8 mb-8 justify-center">
                  <div className="relative w-64 h-64 shrink-0">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                      {/* Track Silhouette */}
                      <path
                        d="M 30,100 C 30,50 60,30 100,30 C 140,30 170,50 170,80 C 170,110 140,110 130,120 C 120,130 140,160 110,170 C 80,180 60,150 50,140 C 40,130 30,120 30,100 Z"
                        fill="none"
                        stroke="#2A2A35"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {/* GA Zone (Green Segment) */}
                      <path
                        d="M 30,100 C 30,50 60,30 100,30"
                        fill="none"
                        stroke={selectedZone === 'GA' ? '#00D2BE' : '#00D2BE70'}
                        strokeWidth={selectedZone === 'GA' ? "14" : "10"}
                        className="cursor-pointer transition-all duration-300"
                        onClick={() => setSelectedZone('GA')}
                        style={{ filter: selectedZone === 'GA' ? 'drop-shadow(0 0 4px #00D2BE)' : 'none' }}
                      />

                      {/* Grandstand Zone (Yellow Segment) */}
                      <path
                        d="M 100,30 C 140,30 170,50 170,80 C 170,110 140,110 130,120"
                        fill="none"
                        stroke={selectedZone === 'GS' ? '#FFD700' : '#FFD70070'}
                        strokeWidth={selectedZone === 'GS' ? "14" : "10"}
                        className="cursor-pointer transition-all duration-300"
                        onClick={() => setSelectedZone('GS')}
                        style={{ filter: selectedZone === 'GS' ? 'drop-shadow(0 0 4px #FFD700)' : 'none' }}
                      />

                      {/* VIP Paddock Club (Red Segment) */}
                      <path
                        d="M 130,120 C 120,130 140,160 110,170 C 80,180 60,150 50,140 C 40,130 30,120 30,100"
                        fill="none"
                        stroke={selectedZone === 'VIP' ? '#E10600' : '#E1060070'}
                        strokeWidth={selectedZone === 'VIP' ? "14" : "10"}
                        className="cursor-pointer transition-all duration-300"
                        onClick={() => setSelectedZone('VIP')}
                        style={{ filter: selectedZone === 'VIP' ? 'drop-shadow(0 0 4px #E10600)' : 'none' }}
                      />

                      {/* Text Markers */}
                      <text x="50" y="55" fill="#FFFFFF" fontSize="10" fontWeight="bold" className="pointer-events-none opacity-80">GA Zone</text>
                      <text x="130" y="65" fill="#FFFFFF" fontSize="10" fontWeight="bold" className="pointer-events-none opacity-80">Grandstand</text>
                      <text x="80" y="145" fill="#FFFFFF" fontSize="10" fontWeight="bold" className="pointer-events-none opacity-80">VIP Club</text>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-2xl">{zoneInfo.icon}</span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{zoneInfo.icon}</span>
                      <h3 className="font-bold text-white text-lg">{zoneInfo.name}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                            style={{ backgroundColor: zoneInfo.bgLight, color: zoneInfo.color, border: `1px solid ${zoneInfo.borderLight}` }}>
                        x{zoneInfo.multiplier.toFixed(1)} Price
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">{zoneInfo.description}</p>
                    <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between">
                      <span className="text-gray-500 text-xs">Estimated Price per Ticket</span>
                      <span className="font-bold text-white" style={{ color: zoneInfo.color }}>
                        {formatPrice(ticketPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Zone Select Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.entries(TICKET_ZONES).map(([key, zone]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedZone(key)}
                      className={`card-static p-4 text-left transition-all duration-300 rounded-2xl border ${
                        selectedZone === key
                          ? 'bg-white/[0.03] scale-[1.01]'
                          : 'border-white/[0.04] hover:bg-white/[0.01]'
                      }`}
                      style={{ borderColor: selectedZone === key ? zone.color : 'rgba(255, 255, 255, 0.04)' }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xl">{zone.icon}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Tier {key}</span>
                      </div>
                      <div className="font-bold text-white text-sm truncate">{zone.name}</div>
                      <div className="text-xs text-gray-400 mt-1 font-semibold" style={{ color: selectedZone === key ? zone.color : undefined }}>
                        {formatPrice(race.ticketPrice * zone.multiplier)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Key Info */}
              <div className="card p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <h2 className="text-lg font-semibold text-white mb-5">Race Information</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: 'Date', value: formatDate(race.raceDate), icon: '📅' },
                    { label: 'Season', value: `${race.season} · Round ${race.round}`, icon: '🏆' },
                    { label: 'Status', value: race.status, icon: '📊' },
                    { label: 'Circuit', value: race.circuitName, icon: '🗺️' },
                    { label: 'Country', value: `${flag} ${race.country}`, icon: '' },
                    { label: 'Track Length', value: race.lengthKm ? `${race.lengthKm} km` : 'N/A', icon: '📏' },
                  ].map((item, i) => (
                    <div key={item.label} className="bg-white/[0.03] rounded-xl p-4 hover:bg-white/[0.05] transition-colors duration-300"
                         style={{ animationDelay: `${i * 0.05}s` }}>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">{item.label}</div>
                      <div className="text-sm font-semibold text-white">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              {race.description && (
                <div className="card p-6 animate-fade-in" style={{ animationDelay: '0.15s' }}>
                  <h2 className="text-lg font-semibold text-white mb-3">About This Race</h2>
                  <p className="text-gray-400 leading-relaxed">{race.description}</p>
                </div>
              )}

              {/* Ticket Availability */}
              <div className="card p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <h2 className="text-lg font-semibold text-white mb-4">Ticket Availability</h2>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-400">{race.availableQuota.toLocaleString()} of {race.totalQuota.toLocaleString()} tickets remaining</span>
                  <span className={`text-sm font-bold ${isLowQuota ? 'text-amber-400' : 'text-f1-green'}`}>{quotaPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-white/[0.04] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${isLowQuota ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-gradient-to-r from-emerald-500 to-f1-green'}`}
                    style={{ width: `${quotaPercent}%` }}
                  />
                </div>
                {isLowQuota && (
                  <div className="flex items-center gap-2 mt-3 text-amber-400 text-xs font-medium bg-amber-400/[0.06] rounded-lg px-3 py-2 border border-amber-400/10">
                    <span className="inline-block w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                    Almost sold out! Book now to secure your tickets.
                  </div>
                )}
              </div>
            </div>

            {/* Right: Booking Card */}
            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-24 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <h2 className="text-lg font-semibold text-white mb-1">Book Tickets</h2>
                <p className="text-sm text-gray-500 mb-6">Secure your spot at {race.name}</p>

                <div className="space-y-5">
                  {/* Selected Class info */}
                  <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs">Selected Class</span>
                      <span className="font-semibold text-xs" style={{ color: zoneInfo.color }}>{zoneInfo.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs">Price per ticket</span>
                      <span className="text-white font-bold text-sm">{formatPrice(ticketPrice)}</span>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="form-label">Number of Tickets</label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        id="qty-decrease"
                        className="w-11 h-11 bg-white/[0.04] hover:bg-white/[0.08] rounded-xl flex items-center justify-center text-white transition-all duration-300 border border-white/[0.04] hover:border-white/10 text-lg"
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
                        className="form-input text-center w-20 flex-shrink-0 font-bold text-lg"
                      />
                      <button
                        onClick={() => setQuantity(Math.min(race.availableQuota, quantity + 1))}
                        id="qty-increase"
                        className="w-11 h-11 bg-white/[0.04] hover:bg-white/[0.08] rounded-xl flex items-center justify-center text-white transition-all duration-300 border border-white/[0.04] hover:border-white/10 text-lg"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="bg-f1-red/[0.06] rounded-2xl p-5 border border-f1-red/15 animate-scale-in" key={selectedZone}>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">Total Price</span>
                      <span className="text-2xl font-bold text-f1-red">{formatPrice(totalPrice)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="inline-block w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                      <p className="text-[11px] text-gray-500">Booking expires 30 minutes after creation</p>
                    </div>
                  </div>

                  {bookingError && (
                    <div className="text-red-400 text-sm bg-red-500/[0.08] rounded-xl p-3 border border-red-500/15 animate-fade-in">
                      ⚠️ {bookingError}
                    </div>
                  )}

                  <button
                    onClick={handleBook}
                    id="book-now-btn"
                    disabled={booking || race.availableQuota === 0}
                    className="w-full btn-primary py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <p className="text-center text-xs text-gray-600">
                      <button onClick={() => navigate('/login')} className="text-f1-red hover:text-red-400 font-semibold transition-colors">Sign in</button> to book tickets
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
