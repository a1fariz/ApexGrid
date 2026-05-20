import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Navbar() {
  const { user, logout, isAuthenticated, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
    setMenuOpen(false)
  }

  return (
    <nav className="navbar-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group" onClick={() => setMenuOpen(false)}>
            <div className="w-8 h-8 bg-f1-red rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-white text-xs font-black">F1</span>
            </div>
            <span className="font-f1 text-xl font-black text-white tracking-widest">
              APEX<span className="text-f1-red">GRID</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            <Link to="/" className="btn-ghost text-sm">Races</Link>

            {isAuthenticated() && (
              <>
                <Link to="/bookings" className="btn-ghost text-sm">My Bookings</Link>
                <Link to="/profile" className="btn-ghost text-sm">Profile</Link>
              </>
            )}

            {isAdmin() && (
              <Link to="/admin" className="btn-ghost text-sm text-amber-400 hover:text-amber-300">
                ⚡ Admin
              </Link>
            )}

            {isAuthenticated() ? (
              <div className="flex items-center gap-3 ml-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
                  <div className="w-7 h-7 bg-f1-red rounded-full flex items-center justify-center text-xs font-bold">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-300">{user?.username}</span>
                </div>
                <button onClick={handleLogout} className="btn-outline text-sm py-2">
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-4">
                <Link to="/login" className="btn-ghost text-sm">Login</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">Register</Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 animate-fade-in border-t border-white/5 mt-2 pt-4 space-y-1">
            <Link to="/" className="block px-4 py-2 rounded-lg hover:bg-white/5 text-sm" onClick={() => setMenuOpen(false)}>
              🏁 Races
            </Link>

            {isAuthenticated() && (
              <>
                <Link to="/bookings" className="block px-4 py-2 rounded-lg hover:bg-white/5 text-sm" onClick={() => setMenuOpen(false)}>
                  🎫 My Bookings
                </Link>
                <Link to="/profile" className="block px-4 py-2 rounded-lg hover:bg-white/5 text-sm" onClick={() => setMenuOpen(false)}>
                  👤 My Profile
                </Link>
              </>
            )}

            {isAdmin() && (
              <Link to="/admin" className="block px-4 py-2 rounded-lg hover:bg-white/5 text-sm text-amber-400" onClick={() => setMenuOpen(false)}>
                ⚡ Admin Dashboard
              </Link>
            )}

            <div className="pt-3 border-t border-white/5">
              {isAuthenticated() ? (
                <>
                  <div className="px-4 py-2 text-sm text-gray-400">Logged in as <strong className="text-white">{user?.username}</strong></div>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 rounded-lg hover:bg-f1-red/10 text-f1-red text-sm">
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex gap-2 px-4">
                  <Link to="/login" className="flex-1 text-center btn-ghost text-sm py-2" onClick={() => setMenuOpen(false)}>Login</Link>
                  <Link to="/register" className="flex-1 text-center btn-primary text-sm py-2" onClick={() => setMenuOpen(false)}>Register</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
