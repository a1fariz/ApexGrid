import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../hooks/useAuth'

const ADMIN_CARDS = [
  {
    title: 'Race Management',
    desc: 'Create, edit, and manage F1 race listings and ticket availability.',
    icon: '🏁',
    link: '/admin/races',
    color: 'from-f1-red/20 to-transparent',
  },
  {
    title: 'Total Races',
    desc: '6 races scheduled for the 2026 season across 6 iconic circuits.',
    icon: '🗺️',
    link: '/admin/races',
    color: 'from-blue-500/20 to-transparent',
  },
  {
    title: 'System Status',
    desc: 'All services running normally. Scheduler active every 5 minutes.',
    icon: '⚙️',
    link: '#',
    color: 'from-green-500/20 to-transparent',
  },
]

export default function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
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

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Total Races', value: '6', icon: '🏁', color: 'text-f1-red' },
            { label: 'Active Circuits', value: '6', icon: '🗺️', color: 'text-blue-400' },
            { label: 'Season', value: '2026', icon: '📅', color: 'text-amber-400' },
            { label: 'Scheduler', value: 'Active', icon: '⏰', color: 'text-green-400' },
          ].map((stat) => (
            <div key={stat.label} className="card p-5 text-center">
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Admin Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {ADMIN_CARDS.map((card) => (
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
                <div className="mt-4 text-f1-red text-sm font-medium">Manage → </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="card p-6">
          <h2 className="font-semibold text-white mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/races" id="go-manage-races" className="btn-primary text-sm py-2 px-4">
              🏁 Manage Races
            </Link>
            <Link to="/" className="btn-secondary text-sm py-2 px-4">
              👀 View Public Site
            </Link>
            <Link to="/bookings" className="btn-secondary text-sm py-2 px-4">
              🎫 View Bookings
            </Link>
          </div>
        </div>

        {/* System Info */}
        <div className="card p-6 mt-6">
          <h2 className="font-semibold text-white mb-4">System Architecture</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {[
              { name: 'User Service', port: '8082', status: 'running', desc: 'JWT Auth, User Management' },
              { name: 'Race Service', port: '8081', status: 'running', desc: 'Races, Bookings, Email, Scheduler' },
              { name: 'API Gateway', port: '8080', status: 'running', desc: 'Routing, CORS, Load Balancing' },
            ].map((svc) => (
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
  )
}
