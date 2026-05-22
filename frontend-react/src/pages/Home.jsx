import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import RaceCard from '../components/RaceCard'
import RaceCardSkeleton from '../components/RaceCardSkeleton'
import PageTransition from '../components/PageTransition'
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
    <PageTransition>
      <div className="min-h-screen">
        <Navbar />

        {/* Hero Section */}
        <section className="relative overflow-hidden pt-20 pb-28 px-4"
                 style={{ background: 'linear-gradient(180deg, #120505 0%, #0A0A0F 100%)' }}>

          {/* Animated background elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-f1-red/[0.04] rounded-full blur-[120px]" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-f1-red/[0.02] rounded-full blur-[100px]" />
            {/* Racing line grid */}
            <div className="absolute inset-0 opacity-[0.03]">
              {[...Array(10)].map((_, i) => (
                <div key={i}
                  className="absolute h-px bg-gradient-to-r from-transparent via-f1-red to-transparent"
                  style={{
                    top: `${8 + i * 10}%`, left: '-10%', right: '-10%',
                    transform: `rotate(${-2 + i * 0.3}deg)`, opacity: 1 - i * 0.08,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="max-w-6xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-f1-red/[0.08] border border-f1-red/15 text-f1-red text-sm font-semibold mb-8 animate-fade-in">
              <span className="inline-block w-2 h-2 bg-f1-red rounded-full animate-pulse" />
              2026 Formula 1 Season
            </div>

            <h1 className="font-f1 text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 animate-fade-in"
                style={{ animationDelay: '0.1s' }}>
              <span className="text-white">EXPERIENCE</span>
              <br />
              <span className="bg-gradient-to-r from-f1-red to-red-400 bg-clip-text text-transparent">FORMULA 1</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-12 animate-fade-in leading-relaxed"
               style={{ animationDelay: '0.2s' }}>
              Book your tickets to the most thrilling motorsport events in the world.
              From Monza to Singapore — feel the speed.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 animate-fade-in"
                 style={{ animationDelay: '0.3s' }}>
              <a href="#races" className="btn-primary px-8 py-3.5 text-base">
                Browse Races 🏎️
              </a>
              <Link to="/register" className="btn-outline px-8 py-3.5 text-base">
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
            <p className="text-gray-500 mt-1">
              {totalElements} race{totalElements !== 1 ? 's' : ''} found
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="card-static p-4 mb-8 rounded-2xl border border-white/[0.04]">
            <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
              {/* Search Input */}
              <div className="flex-1 relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 text-sm">🔍</span>
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
                  className="btn-ghost text-sm text-gray-500 hover:text-white"
                >
                  ✕ Clear
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
              <div className="text-5xl mb-4">⚠️</div>
              <p className="text-red-400 text-lg mb-2">{error}</p>
              <p className="text-gray-500 text-sm mb-6">Please check your connection and try again.</p>
              <button onClick={() => window.location.reload()} className="btn-primary">Retry</button>
            </div>
          ) : races.length === 0 ? (
            <div className="text-center py-24 animate-fade-in">
              <div className="text-6xl mb-4">🏁</div>
              <h3 className="text-xl font-semibold text-white mb-2">No races found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your search or filters.</p>
              {hasFilters && (
                <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {races.map((race, index) => (
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
                    className="px-4 py-2.5 rounded-xl text-sm font-medium bg-white/[0.03] text-gray-500 hover:bg-white/[0.06] hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-300 border border-white/[0.04]"
                  >
                    ← Prev
                  </button>

                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={`w-10 h-10 rounded-xl text-sm font-medium transition-all duration-300 ${
                        page === i
                          ? 'bg-f1-red text-white shadow-lg shadow-red-900/30'
                          : 'bg-white/[0.03] text-gray-500 hover:bg-white/[0.06] hover:text-white border border-white/[0.04]'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium bg-white/[0.03] text-gray-500 hover:bg-white/[0.06] hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-300 border border-white/[0.04]"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Footer */}
        <footer className="footer-glow border-t border-white/[0.03] py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-f1-red rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-black">F1</span>
                </div>
                <span className="font-f1 text-lg font-black text-white tracking-widest">
                  APEX<span className="text-f1-red">GRID</span>
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <Link to="/" className="hover:text-gray-400 transition-colors">Races</Link>
                <Link to="/login" className="hover:text-gray-400 transition-colors">Login</Link>
                <Link to="/register" className="hover:text-gray-400 transition-colors">Register</Link>
              </div>
              <p className="text-gray-600 text-xs">© 2026 ApexGrid — The Ultimate F1 Ticket Experience</p>
            </div>
          </div>
        </footer>
      </div>
    </PageTransition>
  )
}
