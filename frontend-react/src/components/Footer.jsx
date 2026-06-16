import { Link } from 'react-router-dom'

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="relative footer-glow border-t border-f1-border mt-auto pt-16 pb-10 px-4 md:px-8 overflow-hidden">
      
      {/* Decorative Top Accent Line (F1 Red Accent Line) */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-f1-red to-transparent opacity-80" />

      {/* Grid Pattern Background overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Main Grid Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-12 border-b border-f1-border/60">
          
          {/* Column 1: Brand & Bio */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-6 flex items-center justify-center">
                <svg viewBox="0 0 120 30" className="w-full h-full text-f1-red fill-current hover:scale-105 transition-transform duration-300">
                  <path d="M101.086812,30 L101.711812,30 L101.711812,27.106875 L101.722437,27.106875 L102.761812,30 L103.302437,30 L104.341812,27.106875 L104.352437,27.106875 L104.352437,30 L104.977437,30 L104.977437,26.25125 L104.063687,26.25125 L103.055562,29.18625 L103.044937,29.18625 L102.011187,26.25125 L101.086812,26.25125 L101.086812,30 Z M97.6274375,26.818125 L98.8136875,26.818125 L98.8136875,30 L99.4699375,30 L99.4699375,26.818125 L100.661812,26.818125 L100.661812,26.25125 L97.6274375,26.25125 L97.6274375,26.818125 Z M89.9999375,30 L119.999937,0 L101.943687,0 L71.9443125,30 L89.9999375,30 Z M85.6986875,13.065 L49.3818125,13.065 C38.3136875,13.065 36.3768125,13.651875 31.6361875,18.3925 C27.2024375,22.82625 20.0005625,30 20.0005625,30 L35.7324375,30 L39.4855625,26.246875 C41.9530625,23.779375 43.2255625,23.52375 48.4068125,23.52375 L75.2405625,23.52375 L85.6986875,13.065 Z M31.1518125,16.253125 C27.8774375,19.3425 20.7530625,26.263125 16.9130625,30 L-6.25e-05,30 C-6.25e-05,30 13.5524375,16.486875 21.0849375,9.0725 C28.8455625,1.685 32.7143125,0 46.9486875,0 L98.7643125,0 L87.5449375,11.21875 L48.0011875,11.21875 C37.9993125,11.21875 35.7518125,11.911875 31.1518125,16.253125 Z" />
                </svg>
              </div>
              <span className="font-f1 text-lg font-black italic tracking-[0.12em] text-f1-white">
                APEX<span className="text-f1-red font-light">GRID</span>
              </span>
            </div>
            <p className="text-f1-light text-sm leading-relaxed max-w-sm">
              The ultimate ticketing experience for Formula 1 fans. Manage bookings, monitor schedules, and view live circuit geometry in real time.
            </p>
          </div>

          {/* Column 2: Navigation & Quick Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-f1-white font-f1">Navigation</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm text-f1-light">
              <Link to="/" className="w-fit hover:text-f1-red transition-colors flex items-center gap-1.5 group">
                <span className="text-xs group-hover:translate-x-0.5 transition-transform">🏁</span> Races
              </Link>
              <Link to="/bookings" className="w-fit hover:text-f1-red transition-colors flex items-center gap-1.5 group">
                <span className="text-xs group-hover:translate-x-0.5 transition-transform">🎫</span> My Bookings
              </Link>
              <Link to="/profile" className="w-fit hover:text-f1-red transition-colors flex items-center gap-1.5 group">
                <span className="text-xs group-hover:translate-x-0.5 transition-transform">👤</span> Profile
              </Link>
              <Link to="/login" className="w-fit hover:text-f1-red transition-colors flex items-center gap-1.5 group">
                <span className="text-xs group-hover:translate-x-0.5 transition-transform">🔒</span> Login
              </Link>
            </div>
          </div>

          {/* Column 3: Live Telemetry / System Stats */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-f1-white font-f1">Live Telemetry</h4>
            <div className="bg-f1-surface border border-f1-border rounded-xl p-4 space-y-2.5 font-mono text-[11px] text-f1-light">
              <div className="flex items-center justify-between">
                <span>SYSTEM STATUS</span>
                <span className="text-f1-green flex items-center gap-1.5 font-bold">
                  <span className="w-1.5 h-1.5 bg-f1-green rounded-full animate-pulse" />
                  ONLINE
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>GATEWAY RESP</span>
                <span className="text-f1-white font-bold">24 ms (OK)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>ACTIVE SEASON</span>
                <span className="text-f1-red font-bold">F1 2026</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Back To Top */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-xs text-f1-light">
          <p>© 2026 ApexGrid. Created with passion for motorsport fans.</p>
          
          <button 
            onClick={scrollToTop}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-f1-border bg-f1-surface hover:bg-f1-red hover:text-white hover:border-f1-red active:scale-95 transition-all duration-300 cursor-pointer"
          >
            <span>Back to top</span>
            <span className="text-[10px]">▲</span>
          </button>
        </div>

      </div>
    </footer>
  )
}
