import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import LoadingSpinner from '../components/LoadingSpinner'
import PageTransition from '../components/PageTransition'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'

export default function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [popular, setPopular] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, popularRes] = await Promise.all([
          api.get('/statistics/overview'),
          api.get('/statistics/popular'),
        ])
        setStats(statsRes.data)
        setPopular(popularRes.data)
      } catch (err) {
        console.error('Failed to load statistics:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0)
  }

  // Find max tickets sold for bar chart scaling
  const maxTickets = popular.length > 0 ? Math.max(...popular.map(r => r.ticketsSold || 0), 1) : 1

  return (
    <PageTransition>
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-10">
          <div className="f1-stripe mb-3" />
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <span className="px-3 py-1 bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-semibold rounded-full">
              ⚡ ADMIN
            </span>
          </div>
          <p className="text-gray-400 mt-1">Welcome back, <strong className="text-white">{user?.fullName || user?.username}</strong></p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <LoadingSpinner size="lg" text="Loading statistics..." />
          </div>
        ) : (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <div className="card p-5 text-center">
                <div className="text-3xl mb-2">💰</div>
                <div className="text-2xl font-bold text-green-400">{formatCurrency(stats?.totalRevenue)}</div>
                <div className="text-xs text-gray-500 mt-1">Total Revenue</div>
              </div>
              <div className="card p-5 text-center">
                <div className="text-3xl mb-2">🎫</div>
                <div className="text-2xl font-bold text-f1-red">{stats?.totalTicketsSold || 0}</div>
                <div className="text-xs text-gray-500 mt-1">Tickets Sold</div>
              </div>
              <div className="card p-5 text-center">
                <div className="text-3xl mb-2">✅</div>
                <div className="text-2xl font-bold text-blue-400">{stats?.totalConfirmedBookings || 0}</div>
                <div className="text-xs text-gray-500 mt-1">Confirmed Bookings</div>
              </div>
              <div className="card p-5 text-center">
                <div className="text-3xl mb-2">👥</div>
                <div className="text-2xl font-bold text-amber-400">{stats?.totalUniqueCustomers || 0}</div>
                <div className="text-xs text-gray-500 mt-1">Unique Customers</div>
              </div>
            </div>

            {/* Second Row Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <div className="card p-4 text-center">
                <div className="text-sm text-gray-400">Pending</div>
                <div className="text-xl font-bold text-amber-400 mt-1">{stats?.totalPendingBookings || 0}</div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-sm text-gray-400">Cancelled</div>
                <div className="text-xl font-bold text-red-400 mt-1">{stats?.totalCancelledBookings || 0}</div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-sm text-gray-400">Total Races</div>
                <div className="text-xl font-bold text-white mt-1">{stats?.totalRaces || 0}</div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-sm text-gray-400">Total Circuits</div>
                <div className="text-xl font-bold text-white mt-1">{stats?.totalCircuits || 0}</div>
              </div>
            </div>

            {/* Booking Status Visual */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {/* Booking Status Breakdown */}
              <div className="card p-6">
                <h2 className="font-semibold text-white mb-4">Booking Status Breakdown</h2>
                <div className="space-y-4">
                  {[
                    { label: 'Confirmed', value: stats?.totalConfirmedBookings || 0, color: 'bg-green-500', textColor: 'text-green-400' },
                    { label: 'Pending', value: stats?.totalPendingBookings || 0, color: 'bg-amber-500', textColor: 'text-amber-400' },
                    { label: 'Cancelled', value: stats?.totalCancelledBookings || 0, color: 'bg-red-500', textColor: 'text-red-400' },
                  ].map(item => {
                    const total = (stats?.totalConfirmedBookings || 0) + (stats?.totalPendingBookings || 0) + (stats?.totalCancelledBookings || 0)
                    const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
                    return (
                      <div key={item.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">{item.label}</span>
                          <span className={`font-semibold ${item.textColor}`}>{item.value} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${item.color} transition-all duration-700`}
                               style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Race Popularity */}
              <div className="card p-6">
                <h2 className="font-semibold text-white mb-4">Race Popularity (Tickets Sold)</h2>
                {popular.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No booking data yet</div>
                ) : (
                  <div className="space-y-3">
                    {popular.slice(0, 6).map((race, i) => (
                      <div key={race.raceId}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300 truncate max-w-[200px]">{race.raceName}</span>
                          <span className="text-f1-red font-semibold">{race.ticketsSold} tickets</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-f1-red to-red-400 transition-all duration-700"
                               style={{ width: `${Math.round((race.ticketsSold / maxTickets) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Admin Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { title: 'Race Management', desc: 'Create, edit, and manage F1 race listings.', icon: '🏁', link: '/admin/races', color: 'from-f1-red/20 to-transparent' },
            { title: 'Circuit Management', desc: 'Manage circuit data for all F1 tracks.', icon: '🗺️', link: '/admin/circuits', color: 'from-blue-500/20 to-transparent' },
            { title: 'System Status', desc: 'All services running. Scheduler active every 5 min.', icon: '⚙️', link: '#', color: 'from-green-500/20 to-transparent' },
          ].map(card => (
            <div
              key={card.title}
              onClick={() => card.link !== '#' && navigate(card.link)}
              className={`card p-6 cursor-pointer ${card.link !== '#' ? 'hover:border-f1-red/40' : 'cursor-default opacity-75'}`}
            >
              <div className={`h-24 rounded-xl mb-4 bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                <span className="text-5xl">{card.icon}</span>
              </div>
              <h3 className="font-semibold text-white mb-2">{card.title}</h3>
              <p className="text-sm text-gray-400">{card.desc}</p>
              {card.link !== '#' && (
                <div className="mt-4 text-f1-red text-sm font-medium">Manage →</div>
              )}
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="card p-6">
          <h2 className="font-semibold text-white mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/races" className="btn-primary text-sm py-2 px-4">🏁 Manage Races</Link>
            <Link to="/admin/circuits" className="btn-primary text-sm py-2 px-4">🗺️ Manage Circuits</Link>
            <Link to="/" className="btn-secondary text-sm py-2 px-4">👀 View Public Site</Link>
            <Link to="/bookings" className="btn-secondary text-sm py-2 px-4">🎫 View Bookings</Link>
          </div>
        </div>

        {/* System Info */}
        <div className="card p-6 mt-6">
          <h2 className="font-semibold text-white mb-4">System Architecture</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {[
              { name: 'User Service', port: '8082', desc: 'JWT Auth, User Management' },
              { name: 'Race Service', port: '8081', desc: 'Races, Bookings, Email, Tickets, Statistics' },
              { name: 'API Gateway', port: '8080', desc: 'Routing, CORS, Load Balancing' },
            ].map(svc => (
              <div key={svc.name} className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="font-medium text-white">{svc.name}</span>
                </div>
                <div className="text-gray-500 text-xs">Port: {svc.port}</div>
                <div className="text-gray-400 text-xs mt-1">{svc.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </PageTransition>
  )
}
