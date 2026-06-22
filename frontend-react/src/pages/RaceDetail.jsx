import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import LoadingSpinner from '../components/LoadingSpinner'
import PageTransition from '../components/PageTransition'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'
import { TRACK_PATHS, normalizeCircuitName } from '../components/CircuitOutline'
import { CIRCUIT_FLAGS, getRaceImage } from '../services/circuitImages'
import {
  FaCampground,
  FaBuilding,
  FaGlassCheers,
  FaFlagCheckered,
  FaFlag,
  FaCalendarAlt,
  FaTrophy,
  FaChartBar,
  FaMap,
  FaRulerHorizontal,
  FaLock,
  FaCar,
  FaExclamationTriangle
} from 'react-icons/fa'

const TICKET_ZONES = {
  GA: {
    name: 'General Admission',
    multiplier: 1.0,
    color: '#00D2BE',
    bgLight: 'rgba(0, 210, 190, 0.05)',
    borderLight: 'rgba(0, 210, 190, 0.2)',
    icon: <FaCampground />,
    description: 'Access to general spectator areas around the circuit, giant screens, and entertainment zones.',
  },
  GS: {
    name: 'Grandstand Seat',
    multiplier: 2.5,
    color: '#FFD700',
    bgLight: 'rgba(255, 215, 0, 0.05)',
    borderLight: 'rgba(255, 215, 0, 0.2)',
    icon: <FaBuilding />,
    description: 'Reserved seat in covered grandstands opposite the main straight or key corners. Excellent viewing angles.',
  },
  VIP: {
    name: 'Paddock Club (VIP)',
    multiplier: 6.0,
    color: '#E10600',
    bgLight: 'rgba(225, 6, 0, 0.05)',
    borderLight: 'rgba(225, 6, 0, 0.2)',
    icon: <FaGlassCheers />,
    description: 'Ultimate luxury. Prime viewing above the pit lane, pit lane walks, open bar, gourmet dining, and driver appearances.',
  },
}

export default function RaceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [race, setRace] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pathLength, setPathLength] = useState(0)
  const [gaPin, setGaPin] = useState({ x: 0, y: 0 })
  const [gsPin, setGsPin] = useState({ x: 0, y: 0 })
  const [vipPin, setVipPin] = useState({ x: 0, y: 0 })
  
  const pathRefVal = useRef(null)
  const setPathRef = (node) => {
    if (node) {
      pathRefVal.current = node
      setTimeout(() => {
        try {
          const length = node.getTotalLength()
          setPathLength(length)
          
          const pGa = node.getPointAtLength(length * 0.2)
          setGaPin({ x: pGa.x, y: pGa.y })
          
          const pGs = node.getPointAtLength(length * 0.65)
          setGsPin({ x: pGs.x, y: pGs.y })
          
          const pVip = node.getPointAtLength(length * 0.92)
          setVipPin({ x: pVip.x, y: pVip.y })
        } catch (e) {
          // silently ignore SVG path calculation errors
        }
      }, 50)
    }
  }
  const [imgError, setImgError] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [selectedZone, setSelectedZone] = useState('GA')
  const [booking, setBooking] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState(null)
  
  const displayImageUrl = race ? getRaceImage(race) : ''

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

  useEffect(() => {
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

    if (quantity < 1 || quantity > Math.min(race.availableQuota, 10)) {
      setBookingError(`Quantity must be between 1 and ${Math.min(race.availableQuota, 10)}`)
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
      // L-05 Fix: refresh race data to update availableQuota after booking
      fetchRace()
      navigate(`/payment/${res.data.bookingCode}`)
    } catch (err) {
      if (err.response?.data?.errors) {
        const fieldErrors = err.response.data.errors;
        const messages = Object.values(fieldErrors).join('. ');
        setBookingError(messages);
      } else {
        setBookingError(err.response?.data?.message || 'Booking failed. Please try again.');
      }
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
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="text-center py-24 animate-fade-in flex-1">
          <FaFlagCheckered className="text-6xl mx-auto mb-4 text-f1-light" />
          <h2 className="text-xl text-f1-white mb-2">Race not found</h2>
          <p className="text-f1-light mb-6 text-sm">The race you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => navigate('/')} className="btn-primary mt-4">Back to Races</button>
        </div>
        <Footer />
      </div>
    )
  }

  const flag = CIRCUIT_FLAGS[race.country] || <FaFlag className="inline text-gray-500" />
  const quotaPercent = Math.round((race.availableQuota / race.totalQuota) * 100)
  const isLowQuota = quotaPercent < 20
  const isPastEvent = race.raceDate ? new Date(race.raceDate) < new Date() : false

  const normKey = normalizeCircuitName(race.circuitName, race.country)
  const track = normKey ? TRACK_PATHS[normKey] : null
  const fallbackTrack = {
    path: 'M 20 50 C 20 30, 40 20, 50 20 C 70 20, 80 35, 80 50 C 80 65, 65 80, 50 80 C 30 80, 20 70, 20 50 Z',
    viewBox: '0 0 100 100'
  }
  
  const activeTrack = track || fallbackTrack
  const isFallback = activeTrack === fallbackTrack
  
  const strokeWidthVal = isFallback ? 5 : 20
  const selectedStrokeWidthVal = isFallback ? 8 : 30
  const pinRadiusOuterVal = isFallback ? 3.5 : 14
  const pinRadiusInnerVal = isFallback ? 1.5 : 6
  const pinStrokeWidthVal = isFallback ? 0.75 : 3
  const labelOffsetVal = isFallback ? -6 : -22
  const labelFontSizeVal = isFallback ? 3.5 : 12
  const textStrokeWidthVal = isFallback ? 1 : 4

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col">
        <Navbar />

        {/* Hero Banner */}
        <div className="relative h-60 md:h-80 overflow-hidden"
             style={displayImageUrl && !imgError
               ? { backgroundColor: 'var(--f1-darker)' }
               : { background: 'linear-gradient(135deg, var(--f1-dark) 0%, var(--f1-darker) 100%)' }}>

          {displayImageUrl && !imgError && (
            <img
              src={displayImageUrl}
              alt={race.name}
              className="absolute inset-0 w-full h-full object-cover opacity-40"
              onError={() => setImgError(true)}
            />
          )}

          {/* Large flag watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none">
            <span className="text-[200px] font-black select-none">{flag}</span>
          </div>

          {/* Bottom gradient — fade into page background token */}
          <div className="absolute bottom-0 left-0 right-0 h-32"
               style={{ background: 'linear-gradient(to top, var(--f1-black), transparent)' }} />

          {/* Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 h-full flex flex-col justify-end pb-8">
            <button onClick={() => navigate('/')} className="text-f1-light hover:text-f1-white text-sm transition-colors duration-300 mb-3 w-fit">
              ← Back to Races
            </button>
            <div className="f1-stripe mb-3" />
            <h1 className="font-f1 text-3xl md:text-5xl font-semibold text-f1-white leading-tight tracking-tight">{race.name}</h1>
            <p className="text-f1-light mt-2 text-lg">{race.circuitName} · {race.location}, {race.country}</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-10 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left: Race Info & Seating Selection */}
            <div className="lg:col-span-2 space-y-6">

              {/* Seating & Zone Selection Section */}
              <div className="card p-6 md:p-8 animate-fade-in" style={{ animationDelay: '0.05s' }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="f1-stripe" />
                  <span className="label-machined text-f1-light">Seating</span>
                </div>
                <h2 className="font-f1 text-2xl font-semibold text-f1-white tracking-tight mb-1">Select Your Zone</h2>
                <p className="text-f1-light text-sm mb-6">Click a track segment or pick a tier below to customize your ticket.</p>

                {/* Interactive Racetrack SVG */}
                <div className="rounded-xl p-6 md:p-8 border border-f1-border flex flex-col md:flex-row items-center gap-8 mb-8 justify-center section-soft">
                  <div className="relative w-64 h-64 shrink-0">
                    <svg viewBox={activeTrack.viewBox} className="w-full h-full">
                      {/* Track Silhouette */}
                      <path
                        ref={setPathRef}
                        d={activeTrack.path}
                        fill="none"
                        stroke={selectedZone ? 'var(--f1-border)' : '#2A2A35'}
                        strokeWidth={strokeWidthVal}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {/* GA Zone (Green Segment) */}
                      {pathLength > 0 && (
                        <path
                          d={activeTrack.path}
                          fill="none"
                          stroke={selectedZone === 'GA' ? '#00D2BE' : '#00D2BE70'}
                          strokeWidth={selectedZone === 'GA' ? selectedStrokeWidthVal : strokeWidthVal}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeDasharray={`${pathLength * 0.45} ${pathLength}`}
                          strokeDashoffset="0"
                          className="cursor-pointer transition-all duration-300 hover:stroke-[#00D2BE]"
                          onClick={() => setSelectedZone('GA')}
                          style={{ filter: selectedZone === 'GA' ? 'drop-shadow(0 0 8px #00D2BE)' : 'none' }}
                        />
                      )}

                      {/* Grandstand Zone (Yellow Segment) */}
                      {pathLength > 0 && (
                        <path
                          d={activeTrack.path}
                          fill="none"
                          stroke={selectedZone === 'GS' ? '#FFD700' : '#FFD70070'}
                          strokeWidth={selectedZone === 'GS' ? selectedStrokeWidthVal : strokeWidthVal}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeDasharray={`${pathLength * 0.4} ${pathLength}`}
                          strokeDashoffset={-pathLength * 0.45}
                          className="cursor-pointer transition-all duration-300 hover:stroke-[#FFD700]"
                          onClick={() => setSelectedZone('GS')}
                          style={{ filter: selectedZone === 'GS' ? 'drop-shadow(0 0 8px #FFD700)' : 'none' }}
                        />
                      )}

                      {/* VIP Paddock Club (Red Segment) */}
                      {pathLength > 0 && (
                        <path
                          d={activeTrack.path}
                          fill="none"
                          stroke={selectedZone === 'VIP' ? '#E10600' : '#E1060070'}
                          strokeWidth={selectedZone === 'VIP' ? selectedStrokeWidthVal : strokeWidthVal}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeDasharray={`${pathLength * 0.15} ${pathLength}`}
                          strokeDashoffset={-pathLength * 0.85}
                          className="cursor-pointer transition-all duration-300 hover:stroke-[#E10600]"
                          onClick={() => setSelectedZone('VIP')}
                          style={{ filter: selectedZone === 'VIP' ? 'drop-shadow(0 0 8px #E10600)' : 'none' }}
                        />
                      )}

                      {/* Interactive Pins and Labels */}
                      {pathLength > 0 && (
                        <>
                          {/* GA Pin & Label */}
                          <g className="cursor-pointer group" onClick={() => setSelectedZone('GA')} transform={`translate(${gaPin.x}, ${gaPin.y})`}>
                            <circle r={pinRadiusOuterVal} fill="var(--f1-darker)" stroke="#00D2BE" strokeWidth={pinStrokeWidthVal} className="transition-transform duration-300 group-hover:scale-125" />
                            <circle r={pinRadiusInnerVal} fill="#00D2BE" />
                            <text
                              y={labelOffsetVal}
                              textAnchor="middle"
                              fill="#FFFFFF"
                              stroke="#0F0F14"
                              strokeWidth={textStrokeWidthVal}
                              paintOrder="stroke"
                              strokeLinejoin="round"
                              fontSize={labelFontSizeVal}
                              fontWeight="bold"
                              className="pointer-events-none select-none font-f1 tracking-wider opacity-85 group-hover:opacity-100 transition-opacity"
                            >
                              GA ZONE
                            </text>
                          </g>

                          {/* GS Pin & Label */}
                          <g className="cursor-pointer group" onClick={() => setSelectedZone('GS')} transform={`translate(${gsPin.x}, ${gsPin.y})`}>
                            <circle r={pinRadiusOuterVal} fill="var(--f1-darker)" stroke="#FFD700" strokeWidth={pinStrokeWidthVal} className="transition-transform duration-300 group-hover:scale-125" />
                            <circle r={pinRadiusInnerVal} fill="#FFD700" />
                            <text
                              y={labelOffsetVal}
                              textAnchor="middle"
                              fill="#FFFFFF"
                              stroke="#0F0F14"
                              strokeWidth={textStrokeWidthVal}
                              paintOrder="stroke"
                              strokeLinejoin="round"
                              fontSize={labelFontSizeVal}
                              fontWeight="bold"
                              className="pointer-events-none select-none font-f1 tracking-wider opacity-85 group-hover:opacity-100 transition-opacity"
                            >
                              GRANDSTAND
                            </text>
                          </g>

                          {/* VIP Pin & Label */}
                          <g className="cursor-pointer group" onClick={() => setSelectedZone('VIP')} transform={`translate(${vipPin.x}, ${vipPin.y})`}>
                            <circle r={pinRadiusOuterVal} fill="var(--f1-darker)" stroke="#E10600" strokeWidth={pinStrokeWidthVal} className="transition-transform duration-300 group-hover:scale-125" />
                            <circle r={pinRadiusInnerVal} fill="#E10600" />
                            <text 
                              y={labelOffsetVal} 
                              textAnchor="middle" 
                              fill="#FFFFFF" 
                              stroke="#0F0F14" 
                              strokeWidth={textStrokeWidthVal} 
                              paintOrder="stroke" 
                              strokeLinejoin="round" 
                              fontSize={labelFontSizeVal} 
                              fontWeight="bold" 
                              className="pointer-events-none select-none font-f1 tracking-wider opacity-85 group-hover:opacity-100 transition-opacity"
                            >
                              VIP PADDOCK
                            </text>
                          </g>
                        </>
                      )}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-2xl" style={{ color: zoneInfo.color }}>
                      {zoneInfo.icon}
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 max-w-xs">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                        style={{ color: zoneInfo.color, backgroundColor: zoneInfo.bgLight, border: `1px solid ${zoneInfo.borderLight}` }}
                      >
                        {zoneInfo.icon}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-f1-white text-base truncate">{zoneInfo.name}</h3>
                        <span
                          className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          style={{ backgroundColor: zoneInfo.bgLight, color: zoneInfo.color, border: `1px solid ${zoneInfo.borderLight}` }}
                        >
                          ×{zoneInfo.multiplier.toFixed(1)} Price
                        </span>
                      </div>
                    </div>
                    <p className="text-f1-light text-sm leading-relaxed">{zoneInfo.description}</p>
                    <div className="pt-3 border-t border-f1-border flex items-center justify-between">
                      <span className="text-f1-light text-xs">Price per ticket</span>
                      <span className="font-bold text-base" style={{ color: zoneInfo.color }}>
                        {formatPrice(ticketPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Zone Select Buttons — clean tier cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.entries(TICKET_ZONES).map(([key, zone]) => {
                    const isActive = selectedZone === key
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedZone(key)}
                        className={`card-static card-m-accent ${isActive ? 'is-active' : ''} relative p-5 text-left transition-all duration-300 rounded-xl border overflow-hidden ${
                          isActive
                            ? 'scale-[1.01] shadow-lg'
                            : 'hover:-translate-y-0.5 hover:border-f1-light/40'
                        }`}
                        style={{ borderColor: isActive ? zone.color : 'var(--f1-border)' }}
                      >
                        {/* Selected accent bar (zone color) */}
                        {isActive && (
                          <span
                            className="absolute top-0 left-0 right-0 h-[3px]"
                            style={{ background: zone.color }}
                          />
                        )}
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-colors"
                            style={{
                              color: isActive ? zone.color : 'var(--f1-light)',
                              backgroundColor: isActive ? zone.bgLight : 'var(--f1-surface)',
                              border: `1px solid ${isActive ? zone.borderLight : 'var(--f1-border)'}`,
                            }}
                          >
                            {zone.icon}
                          </span>
                          <span className="label-machined text-f1-light">Tier {key}</span>
                        </div>
                        <div className="font-semibold text-f1-white text-sm truncate">{zone.name}</div>
                        <div
                          className="text-sm font-bold mt-1.5"
                          style={{ color: isActive ? zone.color : 'var(--f1-white)' }}
                        >
                          {formatPrice(race.ticketPrice * zone.multiplier)}
                          <span className="text-[11px] font-normal text-f1-light ml-1">/ ticket</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Key Info */}
              <div className="card p-6 md:p-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="f1-stripe" />
                  <span className="label-machined text-f1-light">Race Information</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: 'Date', value: formatDate(race.raceDate), icon: <FaCalendarAlt className="text-f1-red" /> },
                    { label: 'Season', value: `${race.season} · Round ${race.round}`, icon: <FaTrophy className="text-amber-400" /> },
                    { label: 'Status', value: race.status, icon: <FaChartBar className="text-blue-400" /> },
                    { label: 'Circuit', value: race.circuitName, icon: <FaMap className="text-green-400" /> },
                    { label: 'Country', value: `${flag} ${race.country}`, icon: <FaFlag className="text-f1-light" /> },
                    { label: 'Track Length', value: race.lengthKm ? `${race.lengthKm} km` : 'N/A', icon: <FaRulerHorizontal className="text-purple-400" /> },
                  ].map((item, i) => (
                    <div key={item.label} className="bg-f1-surface border border-f1-border rounded-xl p-4 hover:bg-f1-surface/60 transition-colors duration-300"
                         style={{ animationDelay: `${i * 0.05}s` }}>
                      <div className="text-[10px] text-f1-light uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      <div className="text-sm font-semibold text-f1-white">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              {race.description && (
                <div className="card p-6 md:p-8 animate-fade-in" style={{ animationDelay: '0.15s' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="f1-stripe" />
                    <span className="label-machined text-f1-light">About This Race</span>
                  </div>
                  <p className="text-f1-light leading-relaxed">{race.description}</p>
                </div>
              )}

              {/* Ticket Availability */}
              <div className="card p-6 md:p-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="f1-stripe" />
                  <span className="label-machined text-f1-light">Ticket Availability</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-f1-light">{race.availableQuota.toLocaleString()} of {race.totalQuota.toLocaleString()} tickets remaining</span>
                  <span className={`text-sm font-bold ${isLowQuota ? 'text-amber-400' : 'text-f1-green'}`}>{quotaPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-f1-surface border border-f1-border rounded-full overflow-hidden">
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
              <div className="card p-6 sticky top-24 animate-fade-in rounded-2xl" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center gap-3 mb-1">
                  <div className="f1-stripe" />
                  <span className="label-machined text-f1-light">Booking</span>
                </div>
                <h2 className="font-f1 text-xl font-semibold text-f1-white tracking-tight">Book Tickets</h2>
                <p className="text-sm text-f1-light mb-6 mt-0.5">Secure your spot at {race.name}</p>

                <div className="space-y-5">
                  {/* Selected Class info */}
                  <div className="bg-f1-surface border border-f1-border rounded-lg p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-f1-light text-xs font-medium">Selected Class</span>
                      <span className="font-semibold text-xs" style={{ color: zoneInfo.color }}>{zoneInfo.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-f1-light text-xs font-medium">Price per ticket</span>
                      <span className="text-f1-white font-bold text-sm">{formatPrice(ticketPrice)}</span>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="form-label">Number of Tickets</label>
                    <div className="flex items-center justify-between bg-f1-surface border border-f1-border p-1.5 rounded-lg w-full">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        id="qty-decrease"
                        className="w-10 h-10 bg-f1-card hover:bg-f1-surface active:scale-95 rounded-md flex items-center justify-center text-f1-white transition-all duration-300 text-lg font-bold border border-f1-border"
                      >
                        −
                      </button>
                      <input
                        id="quantity-input"
                        type="number"
                        min="1"
                        max={Math.min(race.availableQuota, 10)}
                        value={quantity}
                        disabled={isPastEvent}
                        onChange={(e) => setQuantity(Math.min(Math.min(race.availableQuota, 10), Math.max(1, parseInt(e.target.value) || 1)))}
                        className="bg-transparent text-center text-f1-white font-bold text-lg focus:outline-none w-16 disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.min(Math.min(race.availableQuota, 10), quantity + 1))}
                        id="qty-increase"
                        className="w-10 h-10 bg-f1-card hover:bg-f1-surface active:scale-95 rounded-md flex items-center justify-center text-f1-white transition-all duration-300 text-lg font-bold border border-f1-border"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-[10px] text-f1-light mt-1.5 px-1">Maximum 10 tickets per booking.</p>
                  </div>

                  {/* Total */}
                  <div className="bg-f1-red/[0.06] light:bg-f1-red/[0.04] rounded-lg p-5 border border-f1-red/15 animate-scale-in" key={selectedZone}>
                    <div className="flex items-center justify-between">
                      <span className="text-f1-white opacity-80 text-sm font-semibold">Total Price</span>
                      <span className="text-2xl font-bold text-f1-red">{formatPrice(totalPrice)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="inline-block w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                      <p className="text-[11px] text-f1-light">Booking expires 30 minutes after creation</p>
                    </div>
                  </div>

                  {bookingError && (
                    <div className="text-red-400 text-sm bg-red-500/[0.08] rounded-lg p-3.5 border border-red-500/15 animate-fade-in flex items-center gap-2.5">
                      <FaExclamationTriangle className="text-red-500 shrink-0 text-lg" />
                      <span>{bookingError}</span>
                    </div>
                  )}

                  <button
                    onClick={handleBook}
                    id="book-now-btn"
                    disabled={booking || race.availableQuota === 0 || isPastEvent}
                    className="w-full btn-primary py-3.5 text-base rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {booking ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin-f1" />
                        Processing...
                      </span>
                    ) : isPastEvent ? (
                      <span className="flex items-center justify-center gap-1.5"><FaFlagCheckered /> Event Ended</span>
                    ) : race.availableQuota === 0 ? (
                      'Sold Out'
                    ) : !isAuthenticated() ? (
                      <span className="flex items-center justify-center gap-1.5"><FaLock /> Login to Book</span>
                    ) : (
                      <span className="flex items-center justify-center gap-1.5"><FaCar className="animate-pulse" /> Book Now</span>
                    )}
                  </button>

                  {!isAuthenticated() && (
                    <p className="text-center text-xs text-f1-light">
                      <button onClick={() => navigate('/login')} className="text-f1-red hover:text-red-400 font-semibold transition-colors">Sign in</button> to book tickets
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </PageTransition>
  )
}
