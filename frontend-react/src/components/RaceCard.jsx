import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CircuitOutline from './CircuitOutline'
import { CIRCUIT_FLAGS, getRaceImage } from '../services/circuitImages'


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

function RaceFallbackImage({ name }) {
  return (
    <div className="race-fallback-image">
      <span className="text-3xl opacity-20 relative z-10">🏎️</span>
      <span className="text-[10px] text-gray-600 font-f1 mt-2 tracking-widest relative z-10 uppercase">
        {name?.split(' ')[0] || 'APEXGRID'}
      </span>
    </div>
  )
}

export default function RaceCard({ race }) {
  const navigate = useNavigate()
  const [imgError, setImgError] = useState(false)
  const flag = CIRCUIT_FLAGS[race.country] || '🏳️'
  const quotaPercent = Math.round((race.availableQuota / race.totalQuota) * 100)
  const isLowQuota = quotaPercent < 20
  const isSoldOut = race.availableQuota === 0
  const displayImageUrl = getRaceImage(race)

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
      {/* Image Header */}
      <div className="h-36 w-full overflow-hidden relative">
        {displayImageUrl && !imgError ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-[#14141E] via-black/40 to-transparent z-10" />
            <img
              src={displayImageUrl}
              alt={race.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          </>
        ) : (
          <RaceFallbackImage name={race.name} />
        )}
        {/* Low quota / sold out overlay badge */}
        {isSoldOut && (
          <div className="absolute top-3 right-3 z-20 px-3 py-1 rounded-full bg-f1-red/90 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
            Sold Out
          </div>
        )}
        {isLowQuota && !isSoldOut && (
          <div className="absolute top-3 right-3 z-20 px-3 py-1 rounded-full bg-amber-500/90 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
            🔥 Almost Gone
          </div>
        )}
        {/* Track Outline Overlay */}
        <div className="absolute right-3 bottom-3 z-20 w-14 h-14 opacity-35 group-hover:opacity-100 text-f1-light group-hover:text-f1-red transition-all duration-500 transform group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(225,6,0,0.8)]">
          <CircuitOutline circuitName={race.name} country={race.country} />
        </div>
      </div>

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="text-2xl mb-1">{flag}</div>
            <h3 className="font-semibold text-[15px] text-f1-white leading-tight group-hover:text-f1-red transition-colors duration-300 truncate">
              {race.name}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5 truncate">{race.circuitName}</p>
          </div>
          <div className="ml-2 flex-shrink-0">
            <StatusBadge status={race.status} />
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="bg-f1-surface rounded-xl p-3 border border-f1-border">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Date</div>
            <div className="text-sm font-medium">{formatDate(race.raceDate)}</div>
          </div>
          <div className="bg-f1-surface rounded-xl p-3 border border-f1-border">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Location</div>
            <div className="text-sm font-medium truncate">{race.location}, {race.country}</div>
          </div>
        </div>

        {/* Price & Quota */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-f1-border">
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">From</div>
            <div className="text-xl font-bold text-f1-red">{formatPrice(race.ticketPrice)}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] mb-1">
              <span className={isLowQuota ? 'text-amber-400 font-semibold' : 'text-gray-500'}>
                {race.availableQuota.toLocaleString()} left
              </span>
            </div>
            <div className="w-24 h-1.5 bg-f1-surface rounded-full overflow-hidden border border-f1-border">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isSoldOut ? 'bg-f1-red' : isLowQuota ? 'bg-amber-400' : 'bg-f1-green'
                }`}
                style={{ width: `${Math.max(2, quotaPercent)}%` }}
              />
            </div>
          </div>
        </div>

        {/* CTA */}
        <button className={`w-full mt-4 text-sm py-2.5 rounded-xl font-semibold transition-all duration-300 ${
          isSoldOut
            ? 'bg-white/[0.03] text-gray-500 cursor-not-allowed'
            : 'btn-primary group-hover:shadow-lg group-hover:shadow-red-900/30'
        }`}>
          {isSoldOut ? 'Sold Out' : 'Book Tickets →'}
        </button>
      </div>
    </div>
  )
}
