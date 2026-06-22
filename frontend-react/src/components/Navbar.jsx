import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { FaBolt, FaFlagCheckered, FaTicketAlt, FaUser, FaLock } from 'react-icons/fa'

export default function Navbar() {
  const { user, logout, isAuthenticated, isAdmin } = useAuth()
  const { theme, toggleTheme } = useTheme()
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
          <Link to="/" className="flex items-center gap-3.5 group" onClick={() => setMenuOpen(false)}>
            <div className="w-12 h-6 flex items-center justify-center">
              <svg
                viewBox="0 0 120 30"
                className="w-full h-full text-f1-red fill-current group-hover:scale-110 transition-transform duration-300"
              >
                <path d="M101.086812,30 L101.711812,30 L101.711812,27.106875 L101.722437,27.106875 L102.761812,30 L103.302437,30 L104.341812,27.106875 L104.352437,27.106875 L104.352437,30 L104.977437,30 L104.977437,26.25125 L104.063687,26.25125 L103.055562,29.18625 L103.044937,29.18625 L102.011187,26.25125 L101.086812,26.25125 L101.086812,30 Z M97.6274375,26.818125 L98.8136875,26.818125 L98.8136875,30 L99.4699375,30 L99.4699375,26.818125 L100.661812,26.818125 L100.661812,26.25125 L97.6274375,26.25125 L97.6274375,26.818125 Z M89.9999375,30 L119.999937,0 L101.943687,0 L71.9443125,30 L89.9999375,30 Z M85.6986875,13.065 L49.3818125,13.065 C38.3136875,13.065 36.3768125,13.651875 31.6361875,18.3925 C27.2024375,22.82625 20.0005625,30 20.0005625,30 L35.7324375,30 L39.4855625,26.246875 C41.9530625,23.779375 43.2255625,23.52375 48.4068125,23.52375 L75.2405625,23.52375 L85.6986875,13.065 Z M31.1518125,16.253125 C27.8774375,19.3425 20.7530625,26.263125 16.9130625,30 L-6.25e-05,30 C-6.25e-05,30 13.5524375,16.486875 21.0849375,9.0725 C28.8455625,1.685 32.7143125,0 46.9486875,0 L98.7643125,0 L87.5449375,11.21875 L48.0011875,11.21875 C37.9993125,11.21875 35.7518125,11.911875 31.1518125,16.253125 Z" />
              </svg>
            </div>
            <div className="flex flex-col items-start">
              <span className="font-f1 text-lg font-black italic tracking-[0.12em] text-f1-white leading-none">
                APEX<span className="text-f1-red font-light">GRID</span>
              </span>
              <div className="h-[2px] w-6 group-hover:w-full mt-1.5 bg-gradient-to-r from-[#0066b1] via-[#1c69d4] to-[#e22718] rounded-full transition-all duration-300" />
            </div>
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
              <Link to="/admin" className="btn-ghost text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1">
                <FaBolt /> Admin
              </Link>
            )}

            {isAuthenticated() ? (
              <div className="flex items-center gap-3 ml-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-f1-surface">
                  <div className="w-7 h-7 bg-f1-red rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-f1-white">{user?.username}</span>
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

            {/* Theme Toggle (desktop) */}
            <button
              onClick={toggleTheme}
              className="relative w-10 h-10 ml-2 rounded-full flex items-center justify-center text-f1-light hover:text-f1-white border border-f1-border hover:border-f1-light hover:bg-f1-surface transition-all duration-300 active:scale-90 group"
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile Hamburger & Theme Toggle */}
          <div className="flex items-center gap-1 md:hidden">
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full flex items-center justify-center text-f1-light hover:text-f1-white border border-f1-border hover:bg-f1-surface transition-all duration-300 active:scale-90"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button
              className="flex flex-col gap-1.5 p-2 rounded-lg hover:bg-f1-surface transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span className={`block w-5 h-0.5 bg-f1-white transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-5 h-0.5 bg-f1-white transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-0.5 bg-f1-white transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 animate-fade-in border-t border-f1-border mt-2 pt-4 space-y-1">
            <Link to="/" className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-f1-surface text-sm" onClick={() => setMenuOpen(false)}>
              <FaFlagCheckered /> Races
            </Link>

            {isAuthenticated() && (
              <>
                <Link to="/bookings" className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-f1-surface text-sm" onClick={() => setMenuOpen(false)}>
                  <FaTicketAlt /> My Bookings
                </Link>
                <Link to="/profile" className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-f1-surface text-sm" onClick={() => setMenuOpen(false)}>
                  <FaUser /> My Profile
                </Link>
              </>
            )}

            {isAdmin() && (
              <Link to="/admin" className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-f1-surface text-sm text-amber-400" onClick={() => setMenuOpen(false)}>
                <FaBolt /> Admin Dashboard
              </Link>
            )}

            <div className="pt-3 border-t border-f1-border">
              {isAuthenticated() ? (
                <>
                  <div className="px-4 py-2 text-sm text-f1-light">Logged in as <strong className="text-f1-white">{user?.username}</strong></div>
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
