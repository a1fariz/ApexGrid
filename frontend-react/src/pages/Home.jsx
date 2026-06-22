import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import RaceCard from '../components/RaceCard'
import RaceCardSkeleton from '../components/RaceCardSkeleton'
import PageTransition from '../components/PageTransition'
import api from '../services/api'
import f1Backdrop from '../assets/f1_backdrop.png'
import { FaSearch, FaTimes, FaFlagCheckered } from 'react-icons/fa'
import { useAuth } from '../hooks/useAuth'

export default function Home() {
  const { isAuthenticated } = useAuth()
  const [races, setRaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Search & Filter state
  const [search, setSearch] = useState('')
  const [season, setSeason] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('date-asc')
  const [seasons, setSeasons] = useState([])

  // Pagination state
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const PAGE_SIZE = 9

  // Countdown Timer State & Hook
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [countdownRace, setCountdownRace] = useState(null)

  useEffect(() => {
    const fetchCountdownRace = async () => {
      try {
        const res = await api.get('/races/upcoming')
        const now = new Date()
        
        // Find future races sorted chronologically
        const futureRaces = res.data
          .filter(r => new Date(r.raceDate) > now)
          .sort((a, b) => new Date(a.raceDate) - new Date(b.raceDate))

        if (futureRaces.length > 0) {
          setCountdownRace(futureRaces[0])
        } else {
          // Fallback to official 2026 Spanish Grand Prix (June 12-14, 2026)
          setCountdownRace({
            name: 'Spanish Grand Prix',
            raceDate: '2026-06-14T15:00:00Z',
            circuitName: 'Circuit de Barcelona-Catalunya',
            location: 'Barcelona, Spain'
          })
        }
      } catch { /* silently ignore countdown load failure */ }
    }
    fetchCountdownRace()
  }, [])

  useEffect(() => {
    const targetDateStr = countdownRace?.raceDate || '2026-06-14T15:00:00Z'
    const target = new Date(targetDateStr).getTime()

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const difference = target - now

      if (difference <= 0) {
        clearInterval(interval)
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      } else {
        const d = Math.floor(difference / (1000 * 60 * 60 * 24))
        const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const s = Math.floor((difference % (1000 * 60)) / 1000)
        setTimeLeft({ days: d, hours: h, minutes: m, seconds: s })
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [countdownRace])

  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const res = await api.get('/races/seasons')
        setSeasons(res.data)
      } catch { /* silently ignore season load failure */ }
    }
    fetchSeasons()
  }, [])

  useEffect(() => {
    fetchRaces()
  }, [page, search, season, statusFilter])

  const fetchRaces = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', page)
      params.append('size', PAGE_SIZE)
      if (search) params.append('search', search)
      if (season) params.append('season', season)
      if (statusFilter) params.append('status', statusFilter)

      const res = await api.get(`/races/search?${params.toString()}`)
      setRaces(res.data.content)
      setTotalPages(res.data.totalPages)
      setTotalElements(res.data.totalElements)
    } catch (err) {
      setError('Failed to load races. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(0)
    fetchRaces()
  }

  const clearFilters = () => {
    setSearch('')
    setSeason('')
    setStatusFilter('')
    setSortBy('date-asc')
    setPage(0)
  }

  const getSortedRaces = () => {
    const racesCopy = [...races]
    switch (sortBy) {
      case 'date-asc':
        return racesCopy // Backend already sorts date-asc with upcoming first, ended last
      case 'date-desc':
        return racesCopy.sort((a, b) => new Date(b.raceDate) - new Date(a.raceDate))
      case 'price-asc':
        return racesCopy.sort((a, b) => (a.ticketPrice || 0) - (b.ticketPrice || 0))
      case 'price-desc':
        return racesCopy.sort((a, b) => (b.ticketPrice || 0) - (a.ticketPrice || 0))
      case 'quota-desc':
        return racesCopy.sort((a, b) => (b.availableQuota || 0) - (a.availableQuota || 0))
      default:
        return racesCopy
    }
  }

  const hasFilters = search || season || statusFilter || sortBy !== 'date-asc'

  return (
    <PageTransition>
      <div className="min-h-screen">
        <Navbar />

        {/* Hero Section */}
        <section className="relative overflow-hidden pt-20 pb-28 px-4"
                 style={{ background: 'var(--f1-hero-bg)' }}>

          {/* Background Image & Pattern Overlays */}
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
            <img 
              src={f1Backdrop} 
              alt="F1 Racetrack Backdrop" 
              className="w-full h-full object-cover transition-opacity duration-500"
              style={{ opacity: 'var(--f1-hero-opacity)' }}
            />
            {/* Telemetry/Dot grid pattern */}
            <div className="absolute inset-0 opacity-[0.07] light:opacity-[0.03]"
                 style={{
                   backgroundImage: `radial-gradient(var(--f1-white) 1px, transparent 1px)`,
                   backgroundSize: '24px 24px'
                 }}
            />
            {/* Diagonal racing lines */}
            <div className="absolute inset-0 opacity-[0.05] light:opacity-[0.02]">
              {[...Array(12)].map((_, i) => (
                <div key={i}
                  className="absolute h-[2px] bg-gradient-to-r from-transparent via-f1-red to-transparent"
                  style={{
                    top: `${5 + i * 8}%`, left: '-10%', right: '-10%',
                    transform: `rotate(${-5 + i * 0.4}deg)`, opacity: 1 - i * 0.08,
                  }}
                />
              ))}
            </div>
            {/* Smooth transition bottom gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-f1-black/50 to-f1-black" />
          </div>

          <div className="max-w-6xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-f1-red/[0.08] border border-f1-red/15 text-f1-red text-sm font-semibold mb-8 animate-fade-in">
              <span className="inline-block w-2 h-2 bg-f1-red rounded-full animate-pulse" />
              2026 Formula 1 Season
            </div>

            <h1 className="font-f1 text-5xl md:text-7xl lg:text-8xl tracking-tight mb-6 animate-fade-in text-f1-white uppercase"
                style={{ animationDelay: '0.1s' }}>
              EXPERIENCE
              <br />
              FORMULA <span style={{ fontVariantNumeric: 'lining-nums' }}>1</span>
            </h1>

            <p className="text-lg md:text-xl text-f1-light max-w-2xl mx-auto mb-8 animate-fade-in leading-relaxed"
               style={{ animationDelay: '0.2s' }}>
              Book your tickets to the most thrilling motorsport events in the world.
              From Monza to Singapore — feel the speed.
            </p>

            {/* Live Ticking Countdown Timer */}
            <div className="mb-10 max-w-xl mx-auto p-5 rounded-2xl bg-f1-surface/40 backdrop-blur-md border border-f1-border shadow-2xl flex flex-col sm:flex-row items-center justify-around text-f1-white animate-fade-in"
                 style={{ animationDelay: '0.25s' }}>
               <div className="text-center sm:text-left mb-4 sm:mb-0">
                <span className="block font-f1 text-[10px] text-f1-red font-black uppercase tracking-widest mb-1">Upcoming Race</span>
                <span className="block text-base font-bold truncate max-w-[200px]">{countdownRace ? countdownRace.name : 'Spanish Grand Prix'}</span>
              </div>
              <div className="hidden sm:block w-px h-10 bg-f1-border" />
              <div className="flex gap-4 items-center">
                <div className="text-center">
                  <span className="block font-f1 text-2xl md:text-3xl font-black tracking-tight">{String(timeLeft.days).padStart(2, '0')}</span>
                  <span className="text-[10px] text-f1-light uppercase font-semibold">Days</span>
                </div>
                <span className="text-xl opacity-30">:</span>
                <div className="text-center">
                  <span className="block font-f1 text-2xl md:text-3xl font-black tracking-tight">{String(timeLeft.hours).padStart(2, '0')}</span>
                  <span className="text-[10px] text-f1-light uppercase font-semibold">Hrs</span>
                </div>
                <span className="text-xl opacity-30">:</span>
                <div className="text-center">
                  <span className="block font-f1 text-2xl md:text-3xl font-black tracking-tight">{String(timeLeft.minutes).padStart(2, '0')}</span>
                  <span className="text-[10px] text-f1-light uppercase font-semibold">Mins</span>
                </div>
                <span className="text-xl opacity-30">:</span>
                <div className="text-center">
                  <span className="block font-f1 text-2xl md:text-3xl font-black tracking-tight text-f1-red">{String(timeLeft.seconds).padStart(2, '0')}</span>
                  <span className="text-[10px] text-f1-light uppercase font-semibold">Secs</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 animate-fade-in"
                 style={{ animationDelay: '0.3s' }}>
              <a href="#races" className="btn-primary px-8 py-3.5 text-base">
                Browse Races
              </a>
              {isAuthenticated() ? (
                <Link to="/bookings" className="btn-outline px-8 py-3.5 text-base">
                  My Bookings
                </Link>
              ) : (
                <Link to="/register" className="btn-outline px-8 py-3.5 text-base">
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* BMW M gradient divider — between hero and content */}
        <div className="m-stripe-divider" aria-hidden="true" />

        {/* Races Section */}
        <section id="races" className="max-w-7xl mx-auto px-4 py-16">
          {/* Section Header */}
          <div className="mb-8">
            <div className="flex flex-col gap-1.5 mb-3">
              <span className="label-machined text-f1-light">Race Calendar</span>
              <div className="f1-stripe" />
            </div>
            <h2 className="font-f1 text-3xl md:text-4xl text-f1-white tracking-tight">
              Explore the Season
            </h2>
            <p className="text-f1-light mt-1.5">
              {totalElements} race{totalElements !== 1 ? 's' : ''} found
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="card-static p-4 md:p-5 mb-8 rounded-xl border border-f1-border">
            <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
              {/* Search Input */}
              <div className="flex-1 relative">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-f1-light pointer-events-none" />
                <input
                  id="race-search-input"
                  type="text"
                  placeholder="Search races, circuits, countries..."
                  className="form-input pl-10 w-full"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(0) }}
                />
              </div>

              {/* Season Filter */}
              <select
                id="season-filter"
                className="form-input w-full md:w-36"
                value={season}
                onChange={(e) => { setSeason(e.target.value); setPage(0) }}
              >
                <option value="">All Seasons</option>
                {seasons.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                id="status-filter"
                className="form-input w-full md:w-40"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}
              >
                <option value="">All Statuses</option>
                <option value="UPCOMING">UPCOMING</option>
                <option value="LIVE">LIVE</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>

              {/* Sort Filter */}
              <select
                id="sort-select"
                className="form-input w-full md:w-44"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date-asc">Date: Earliest First</option>
                <option value="date-desc">Date: Latest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="quota-desc">Quota: Most Available</option>
              </select>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="btn-ghost text-sm text-f1-light hover:text-f1-white flex items-center gap-1"
                >
                  <FaTimes /> Clear
                </button>
              )}
            </form>
          </div>

          {/* Content */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ animationDelay: `${i * 0.08}s` }} className="animate-fade-in">
                  <RaceCardSkeleton />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-24 animate-fade-in">
              <div className="flex justify-center mb-4">
                <svg className="w-12 h-12 text-red-500 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
              <p className="text-red-400 text-lg mb-2 font-semibold">{error}</p>
              <p className="text-f1-light text-sm mb-6">Please check your connection and try again.</p>
              <button onClick={fetchRaces} className="btn-primary">Retry</button>
            </div>
          ) : races.length === 0 ? (
            <div className="text-center py-24 animate-fade-in">
              <FaFlagCheckered className="text-6xl mx-auto mb-4 text-f1-light" />
              <h3 className="text-xl font-semibold text-f1-white mb-2">No races found</h3>
              <p className="text-f1-light mb-6">Try adjusting your search or filters.</p>
              {hasFilters && (
                <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {getSortedRaces().map((race, index) => (
                  <div key={race.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.06}s` }}>
                    <RaceCard race={race} />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium bg-f1-surface text-f1-light hover:bg-f1-surface hover:text-f1-white disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-300 border border-f1-border"
                  >
                    ← Prev
                  </button>

                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-all duration-300 ${
                        page === i
                          ? 'bg-f1-red text-white shadow-lg shadow-red-900/30'
                          : 'bg-f1-surface text-f1-light hover:bg-f1-surface hover:text-f1-white border border-f1-border'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium bg-f1-surface text-f1-light hover:bg-f1-surface hover:text-f1-white disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-300 border border-f1-border"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        <Footer />
      </div>
    </PageTransition>
  )
}
