import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import RaceCard from '../components/RaceCard'
import LoadingSpinner from '../components/LoadingSpinner'
import api from '../services/api'

const STATS = [
  { label: 'Active Races', value: '6', icon: '🏁' },
  { label: 'Circuits', value: '6', icon: '🗺️' },
  { label: 'Countries', value: '6', icon: '🌍' },
  { label: 'Season', value: '2026', icon: '📅' },
]

export default function Home() {
  const [races, setRaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    const fetchRaces = async () => {
      try {
        const res = await api.get('/races')
        setRaces(res.data)
      } catch (err) {
        setError('Failed to load races. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchRaces()
  }, [])

  const filteredRaces = races.filter(race => {
    if (filter === 'ALL') return true
    return race.status === filter
  })

  const statuses = ['ALL', ...new Set(races.map(r => r.status))]

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

          {/* F1 speed lines */}
          <div className="absolute inset-0 opacity-5">
            {[...Array(8)].map((_, i) => (
              <div key={i}
                className="absolute h-px bg-gradient-to-r from-transparent via-f1-red to-transparent"
                style={{
                  top: `${10 + i * 12}%`,
                  left: '-10%',
                  right: '-10%',
                  transform: `rotate(-3deg)`,
                  opacity: 1 - i * 0.1,
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

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 animate-fade-in"
               style={{ animationDelay: '0.4s' }}>
            {STATS.map((stat) => (
              <div key={stat.label} className="glass-card p-4 text-center">
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className="font-f1 text-2xl font-bold text-f1-red">{stat.value}</div>
                <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Races Section */}
      <section id="races" className="max-w-7xl mx-auto px-4 py-16">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <div className="f1-stripe mb-3" />
            <h2 className="text-3xl font-bold text-white">Race Calendar</h2>
            <p className="text-gray-400 mt-1">
              {races.length} race{races.length !== 1 ? 's' : ''} available
            </p>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                id={`filter-${status}`}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === status
                    ? 'bg-f1-red text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
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
            <button onClick={() => window.location.reload()} className="btn-primary mt-4">
              Retry
            </button>
          </div>
        ) : filteredRaces.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🏁</div>
            <p className="text-gray-400 text-lg">No races found for this filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredRaces.map((race, index) => (
              <div key={race.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                <RaceCard race={race} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-gray-600 text-sm">
        <p>© 2026 ApexGrid — The Ultimate F1 Ticket Experience</p>
      </footer>
    </div>
  )
}
