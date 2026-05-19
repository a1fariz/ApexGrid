export default function LoadingSpinner({ size = 'default', text = '' }) {
  const sizeClass = size === 'sm' ? 'w-6 h-6 border-2' : size === 'lg' ? 'w-16 h-16 border-4' : 'w-10 h-10 border-3'

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeClass} border-white/10 border-t-f1-red rounded-full spin-f1`}
           style={{ borderTopColor: '#E10600', borderWidth: size === 'lg' ? '4px' : '3px' }} />
      {text && <p className="text-sm text-gray-400 animate-pulse">{text}</p>}
    </div>
  )
}
