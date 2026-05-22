export default function RaceCardSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      {/* Image placeholder */}
      <div className="h-36 bg-white/[0.03] relative overflow-hidden">
        <div className="absolute inset-0 skeleton-shimmer" />
      </div>

      <div className="p-5 space-y-4">
        {/* Header: flag + title + badge */}
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="w-8 h-8 bg-white/[0.06] rounded-lg" />
            <div className="h-5 bg-white/[0.06] rounded-md w-3/4" />
            <div className="h-4 bg-white/[0.04] rounded-md w-1/2" />
          </div>
          <div className="h-6 bg-white/[0.06] rounded-full w-20 ml-3" />
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/[0.03] rounded-lg p-3 space-y-2">
            <div className="h-3 bg-white/[0.06] rounded w-1/2" />
            <div className="h-4 bg-white/[0.06] rounded w-3/4" />
          </div>
          <div className="bg-white/[0.03] rounded-lg p-3 space-y-2">
            <div className="h-3 bg-white/[0.06] rounded w-1/2" />
            <div className="h-4 bg-white/[0.06] rounded w-3/4" />
          </div>
        </div>

        {/* Price row */}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.03]">
          <div className="space-y-1">
            <div className="h-3 bg-white/[0.04] rounded w-10" />
            <div className="h-6 bg-white/[0.06] rounded w-16" />
          </div>
          <div className="space-y-1.5 flex flex-col items-end">
            <div className="h-3 bg-white/[0.04] rounded w-20" />
            <div className="h-1.5 bg-white/[0.06] rounded-full w-24" />
          </div>
        </div>

        {/* Button */}
        <div className="h-11 bg-white/[0.05] rounded-lg w-full" />
      </div>
    </div>
  )
}
