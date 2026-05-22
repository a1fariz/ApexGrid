import { useEffect, useState } from 'react'

export default function PageTransition({ children }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Small delay to trigger CSS transition
    const timer = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(timer)
  }, [])

  return (
    <div
      className={`page-transition ${mounted ? 'page-transition-enter' : ''}`}
    >
      {children}
    </div>
  )
}
