import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import RaceCard from '../components/RaceCard'
import LoadingSpinner from '../components/LoadingSpinner'
import api from '../services/api'

export default function Home() {
  const [races, setRaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Search & Filter state
  const [search, setSearch] = useState('')
  const [season, setSeason] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [seasons, setSeasons] = useState([])

  // Pagination state
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const PAGE_SIZE = 9

  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const res = await api.get('/races/seasons')
        setSeasons(res.data)
      } catch (err) {
        console.error('Failed to load seasons')
      }
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
    setPage(0)
  }

  const hasFilters = search || season || statusFilter

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 px-4"
               style={{ background: 'linear-gradient(180deg, #1a0505 0%, #15151E 100%)' }}>

        {/* Animated background elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-f1-red/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-f1-red/3 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-5">
            {[...Array(8)].map((_, i) => (
              <div key={i}
                className="absolute h-px bg-gradient-to-r from-transparent via-f1-red to-transparent"
                style={{
                  top: `${10 + i * 12}%`, left: '-10%', right: '-10%',
                  transform: 'rotate(-3deg)', opacity: 1 - i * 0.1,
                }}
              />
            ))}
          </div>
        </div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-f1-red/10 border border-f1-red/20 text-f1-red text-sm font-semibold mb-6 animate-fade-in">
            <span className="inline-block w-2 h-2 bg-f1-red rounded-full animate-pulse" />
            2026 Formula 1 Season
          </div>

          <h1 className="font-f1 text-5xl md:text-7xl font-black tracking-tight mb-6 animate-fade-in"
              style={{ animationDelay: '0.1s' }}>
            <span className="text-white">EXPERIENCE</span>
            <br />
            <span className="text-f1-red">FORMULA 1</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 animate-fade-in"
             style={{ animationDelay: '0.2s' }}>
            Book your tickets to the most thrilling motorsport events in the world.
            From Monza to Singapore — feel the speed.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 animate-fade-in"
               style={{ animationDelay: '0.3s' }}>
            <a href="#races" className="btn-primary px-8 py-3 text-base">
              Browse Races 🏎️
            </a>
            <Link to="/register" className="btn-outline px-8 py-3 text-base">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Races Section */}
      <section id="races" className="max-w-7xl mx-auto px-4 py-16">
        {/* Section Header */}
        <div className="mb-8">
          <div className="f1-stripe mb-3" />
          <h2 className="text-3xl font-bold text-white">Race Calendar</h2>
          <p className="text-gray-400 mt-1">
            {totalElements} race{totalElements !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="card p-4 mb-8">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
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

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="btn-ghost text-sm text-gray-400 hover:text-white"
              >
                ✕ Clear
              </button>
            )}
          </form>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <LoadingSpinner size="lg" text="Loading races..." />
          </div>
        ) : error ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">⚠️</div>
            <p className="text-red-400 text-lg">{error}</p>
            <button onClick={() => window.location.reload()} className="btn-primary mt-4">Retry</button>
          </div>
        ) : races.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🏁</div>
            <p className="text-gray-400 text-lg">No races found</p>
            {hasFilters && (
              <button onClick={clearFilters} className="btn-primary mt-4">Clear Filters</button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {races.map((race, index) => (
                <div key={race.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                  <RaceCard race={race} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  ← Prev
                </button>

                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                      page === i
                        ? 'bg-f1-red text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-gray-600 text-sm">
        <p>© 2026 ApexGrid — The Ultimate F1 Ticket Experience</p>
      </footer>
    </div>
  )
}
