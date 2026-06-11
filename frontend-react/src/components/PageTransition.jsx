import { useEffect, useState } from 'react'

export default function PageTransition({ children }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Small delay to trigger CSS transition
    const timer = setTimeout(() => setMounted(true), 25)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className={`page-transition ${mounted ? 'page-transition-enter' : ''}`}
    >
      {children}
    </div>
  )
}
