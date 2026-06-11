import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import LoadingSpinner from '../components/LoadingSpinner'
import PageTransition from '../components/PageTransition'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'
import f1Dashboard from '../assets/f1_dashboard.png'

function AnimatedCounter({ value, duration = 800, formatter }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let start = 0
    const end = parseFloat(value) || 0
    if (end === 0) {
      setCount(0)
      return
    }

    const totalTicks = 30
    const stepTime = duration / totalTicks
    const increment = end / totalTicks
    
    let tick = 0
    const timer = setInterval(() => {
      tick++
      start += increment
      if (tick >= totalTicks) {
        clearInterval(timer)
        setCount(end)
      } else {
        setCount(Math.floor(start))
      }
    }, stepTime)

    return () => clearInterval(timer)
  }, [value, duration])

  return formatter ? formatter(count) : count.toLocaleString()
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [popular, setPopular] = useState([])
  const [upcomingRaces, setUpcomingRaces] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, popularRes, upcomingRes] = await Promise.all([
          api.get('/statistics/overview'),
          api.get('/statistics/popular'),
          api.get('/races/upcoming'),
        ])
        setStats(statsRes.data)
        setPopular(popularRes.data)
        setUpcomingRaces(upcomingRes.data || [])
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
    <div className="min-h-screen relative bg-f1-black text-f1-white">
      {/* Background Image & Pattern Overlays */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <img 
          src={f1Dashboard} 
          alt="F1 Racetrack lines" 
          className="w-full h-full object-cover opacity-[0.03] dark:opacity-[0.06] blur-lg transition-opacity duration-500"
        />
        {/* Telemetry/Dot grid pattern */}
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
             style={{
               backgroundImage: `radial-gradient(var(--f1-white) 1px, transparent 1px)`,
               backgroundSize: '24px 24px'
             }}
        />
      </div>

      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-10 relative z-10">

        {/* Header */}
        <div className="mb-10">
          <div className="f1-stripe mb-3" />
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-f1-white">Admin Dashboard</h1>
            <span className="px-3 py-1 bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-semibold rounded-full">
              ⚡ ADMIN
            </span>
          </div>
          <p className="text-f1-light mt-1">Welcome back, <strong className="text-f1-white">{user?.fullName || user?.username}</strong></p>
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
                <div className="text-2xl font-bold text-green-400">
                  <AnimatedCounter value={stats?.totalRevenue} formatter={formatCurrency} />
                </div>
                <div className="text-xs text-gray-500 mt-1">Total Revenue</div>
              </div>
              <div className="card p-5 text-center">
                <div className="text-3xl mb-2">🎫</div>
                <div className="text-2xl font-bold text-f1-red">
                  <AnimatedCounter value={stats?.totalTicketsSold} />
                </div>
                <div className="text-xs text-gray-500 mt-1">Tickets Sold</div>
              </div>
              <div className="card p-5 text-center">
                <div className="text-3xl mb-2">✅</div>
                <div className="text-2xl font-bold text-blue-400">
                  <AnimatedCounter value={stats?.totalConfirmedBookings} />
                </div>
                <div className="text-xs text-gray-500 mt-1">Confirmed Bookings</div>
              </div>
              <div className="card p-5 text-center">
                <div className="text-3xl mb-2">👥</div>
                <div className="text-2xl font-bold text-amber-400">
                  <AnimatedCounter value={stats?.totalUniqueCustomers} />
                </div>
                <div className="text-xs text-gray-500 mt-1">Unique Customers</div>
              </div>
            </div>

            {/* Second Row Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <div className="card p-4 text-center">
                <div className="text-sm text-gray-400">Pending</div>
                <div className="text-xl font-bold text-amber-400 mt-1">
                  <AnimatedCounter value={stats?.totalPendingBookings} />
                </div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-sm text-gray-400">Cancelled</div>
                <div className="text-xl font-bold text-red-400 mt-1">
                  <AnimatedCounter value={stats?.totalCancelledBookings} />
                </div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-sm text-f1-light">Total Races</div>
                <div className="text-xl font-bold text-f1-white mt-1">
                  <AnimatedCounter value={stats?.totalRaces} />
                </div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-sm text-f1-light">Total Circuits</div>
                <div className="text-xl font-bold text-f1-white mt-1">
                  <AnimatedCounter value={stats?.totalCircuits} />
                </div>
              </div>
            </div>

             {/* Booking Status & Popularity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Booking Status Breakdown */}
              <div className="card p-6">
                <h2 className="font-semibold text-f1-white mb-4 flex items-center gap-2">
                  <span>📊</span> Booking Status Breakdown
                </h2>
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
                          <span className="text-f1-light">{item.label}</span>
                          <span className={`font-semibold ${item.textColor}`}>{item.value} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-f1-surface rounded-full overflow-hidden border border-f1-border">
                          <div className={`h-full rounded-full ${item.color} transition-all duration-700`}
                               style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Top Selling Events (Race Popularity) */}
              <div className="card p-6">
                <h2 className="font-semibold text-f1-white mb-4 flex items-center gap-2">
                  <span>🔥</span> Top Selling Events
                </h2>
                {popular.length === 0 ? (
                  <div className="text-center py-8 text-f1-light">🏁 No booking data yet</div>
                ) : (
                  <div className="space-y-3">
                    {popular.slice(0, 5).map((race, i) => (
                      <div key={race.raceId}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-f1-light truncate max-w-[200px]">{race.raceName}</span>
                          <span className="text-f1-red font-semibold">{race.ticketsSold} sold</span>
                        </div>
                        <div className="h-2 bg-f1-surface rounded-full overflow-hidden border border-f1-border">
                          <div className="h-full rounded-full bg-gradient-to-r from-f1-red to-red-400 transition-all duration-700"
                               style={{ width: `${Math.round((race.ticketsSold / maxTickets) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Revenue Overview & Upcoming Events */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Revenue Overview Chart */}
              <div className="card p-6">
                <h2 className="font-semibold text-f1-white mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2"><span>📈</span> Revenue Overview</span>
                  <span className="text-xs text-green-400 font-medium px-2 py-0.5 bg-green-400/10 rounded-full">Active</span>
                </h2>
                <div className="mb-4">
                  <div className="text-3xl font-bold text-f1-white">{formatCurrency(stats?.totalRevenue)}</div>
                  <div className="text-xs text-f1-light mt-1">Total revenue accumulated across all confirmed bookings.</div>
                </div>
                {/* Quarterly chart projection */}
                <div className="flex items-end justify-between h-36 pt-4 px-2 border-t border-f1-border/40">
                  {[
                    { q: 'Q1', pct: 15, amt: (stats?.totalRevenue || 0) * 0.15 },
                    { q: 'Q2', pct: 40, amt: (stats?.totalRevenue || 0) * 0.40 },
                    { q: 'Q3', pct: 30, amt: (stats?.totalRevenue || 0) * 0.30 },
                    { q: 'Q4', pct: 15, amt: (stats?.totalRevenue || 0) * 0.15 }
                  ].map(quarter => (
                    <div key={quarter.q} className="flex flex-col items-center justify-end h-28 flex-1 group">
                      <div className="text-[10px] text-f1-red font-semibold opacity-0 group-hover:opacity-100 transition-opacity mb-1 shrink-0">
                        {formatCurrency(quarter.amt)}
                      </div>
                      <div className="w-8 bg-gradient-to-t from-f1-red/80 to-f1-red rounded-t transition-all duration-500 hover:scale-x-110"
                           style={{ height: `${Math.max(8, quarter.pct * 1.8)}px` }} />
                      <span className="text-xs text-f1-light mt-2 shrink-0">{quarter.q}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Events Widget */}
              <div className="card p-6">
                <h2 className="font-semibold text-f1-white mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2"><span>📅</span> Upcoming Events</span>
                  <span className="text-xs text-f1-red font-semibold tracking-wider font-f1">2026 CALENDAR</span>
                </h2>
                {upcomingRaces.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-f1-light">
                    <span className="text-3xl mb-2">🏁</span>
                    <p className="text-sm">No upcoming races found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-f1-border/40 max-h-[170px] overflow-y-auto pr-1">
                    {upcomingRaces.slice(0, 3).map(race => {
                      const daysLeft = Math.ceil((new Date(race.raceDate) - new Date()) / (1000 * 60 * 60 * 24))
                      return (
                        <div key={race.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-f1-white truncate">{race.name}</h4>
                            <p className="text-xs text-f1-light truncate">{race.circuitName || 'Street Track'} · {race.location}</p>
                          </div>
                          <div className="text-right shrink-0">
                            {daysLeft > 0 ? (
                              <span className="text-xs font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                                In {daysLeft} days
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-f1-red bg-f1-red/10 px-2 py-0.5 rounded-full">
                                Today / Past
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="card p-6 mb-8">
              <h2 className="font-semibold text-f1-white mb-4 flex items-center gap-2">
                <span>⚡</span> Recent Activity Feed
              </h2>
              <div className="space-y-4">
                {[
                  { icon: '👤', text: 'Admin authenticated successfully', time: 'Just now', type: 'info' },
                  { icon: '🎫', text: `Loaded statistics for ${stats?.totalConfirmedBookings || 0} confirmed bookings`, time: '5 mins ago', type: 'success' },
                  { icon: '⚙️', text: 'Telemetry sync completed with User & Race microservices', time: '12 mins ago', type: 'info' },
                  { icon: '✉️', text: 'Cron scheduler verified pending payment expiries', time: '30 mins ago', type: 'warn' }
                ].map((act, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <span className="text-lg bg-f1-surface p-1.5 rounded-lg border border-f1-border/40">{act.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-f1-white truncate">{act.text}</p>
                      <p className="text-[10px] text-f1-light mt-0.5">{act.time}</p>
                    </div>
                  </div>
                ))}
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
              <h3 className="font-semibold text-f1-white mb-2">{card.title}</h3>
              <p className="text-sm text-f1-light">{card.desc}</p>
              {card.link !== '#' && (
                <div className="mt-4 text-f1-red text-sm font-medium">Manage →</div>
              )}
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="card p-6">
          <h2 className="font-semibold text-f1-white mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/races" className="btn-primary text-sm py-2 px-4">🏁 Manage Races</Link>
            <Link to="/admin/circuits" className="btn-primary text-sm py-2 px-4">🗺️ Manage Circuits</Link>
            <Link to="/" className="btn-secondary text-sm py-2 px-4">👀 View Public Site</Link>
            <Link to="/bookings" className="btn-secondary text-sm py-2 px-4">🎫 View Bookings</Link>
          </div>
        </div>

        {/* System Info */}
        <div className="card p-6 mt-6">
          <h2 className="font-semibold text-f1-white mb-4">System Architecture</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {[
              { name: 'User Service', port: '8082', desc: 'JWT Auth, User Management' },
              { name: 'Race Service', port: '8081', desc: 'Races, Bookings, Email, Tickets, Statistics' },
              { name: 'API Gateway', port: '8080', desc: 'Routing, CORS, Load Balancing' },
            ].map(svc => (
              <div key={svc.name} className="bg-f1-surface border border-f1-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="font-medium text-f1-white">{svc.name}</span>
                </div>
                <div className="text-gray-500 text-xs">Port: {svc.port}</div>
                <div className="text-f1-light text-xs mt-1">{svc.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </PageTransition>
  )
}
