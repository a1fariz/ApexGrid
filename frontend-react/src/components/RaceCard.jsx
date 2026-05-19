import { useNavigate } from 'react-router-dom'

const CIRCUIT_FLAGS = {
  'Italy': '🇮🇹',
  'United Kingdom': '🇬🇧',
  'Belgium': '🇧🇪',
  'Japan': '🇯🇵',
  'Singapore': '🇸🇬',
  'Brazil': '🇧🇷',
  'Germany': '🇩🇪',
  'Spain': '🇪🇸',
  'Monaco': '🇲🇨',
  'Australia': '🇦🇺',
}

function StatusBadge({ status }) {
  const map = {
    UPCOMING: 'badge-upcoming',
    LIVE: 'badge-confirmed',
    COMPLETED: 'badge-cancelled',
    CANCELLED: 'badge-cancelled',
  }
  return (
    <span className={map[status] || 'badge-upcoming'}>
      {status === 'UPCOMING' ? '🏁' : status === 'LIVE' ? '🔴' : '✅'} {status}
    </span>
  )
}

export default function RaceCard({ race }) {
  const navigate = useNavigate()
  const flag = CIRCUIT_FLAGS[race.country] || '🏳️'
  const quotaPercent = Math.round((race.availableQuota / race.totalQuota) * 100)
  const isLowQuota = quotaPercent < 20

  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBD'
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price)
  }

  return (
    <div
      className="card cursor-pointer overflow-hidden group"
      onClick={() => navigate(`/race/${race.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/race/${race.id}`)}
      id={`race-card-${race.id}`}
    >
      {/* Top color strip */}
      <div className="h-1 bg-gradient-to-r from-f1-red to-red-800 group-hover:from-red-400 transition-all duration-300" />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-2xl mb-1">{flag}</div>
            <h3 className="font-semibold text-base text-white leading-tight group-hover:text-f1-red transition-colors">
              {race.name}
            </h3>
            <p className="text-sm text-gray-400 mt-0.5">{race.circuitName}</p>
          </div>
          <StatusBadge status={race.status} />
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Date</div>
            <div className="text-sm font-medium">{formatDate(race.raceDate)}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Location</div>
            <div className="text-sm font-medium truncate">{race.location}, {race.country}</div>
          </div>
        </div>

        {/* Price & Quota */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
          <div>
            <div className="text-xs text-gray-500 mb-0.5">From</div>
            <div className="text-xl font-bold text-f1-red">{formatPrice(race.ticketPrice)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">
              <span className={isLowQuota ? 'text-amber-400' : 'text-gray-500'}>
                {race.availableQuota.toLocaleString()} available
              </span>
            </div>
            <div className="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isLowQuota ? 'bg-amber-400' : 'bg-f1-green'}`}
                style={{ width: `${quotaPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* CTA */}
        <button className="w-full mt-4 btn-primary text-sm py-2.5 group-hover:shadow-lg group-hover:shadow-red-900/30 transition-all">
          Book Tickets →
        </button>
      </div>
    </div>
  )
}
