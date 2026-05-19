import { createContext, useState, useEffect, useCallback } from 'react'

export const AuthContext = createContext(null)

// Simple JWT decoder (no library needed for basic claims)
function decodeToken(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Initialize from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('apexgrid_token')
    if (token) {
      const decoded = decodeToken(token)
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setUser({
          id: decoded.userId,
          username: decoded.username || decoded.sub,
          email: decoded.email,
          role: decoded.role,
          fullName: decoded.fullName,
        })
      } else {
        // Token expired
        localStorage.removeItem('apexgrid_token')
        localStorage.removeItem('apexgrid_user')
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback((token) => {
    localStorage.setItem('apexgrid_token', token)
    const decoded = decodeToken(token)
    if (decoded) {
      const userData = {
        id: decoded.userId,
        username: decoded.username || decoded.sub,
        email: decoded.email,
        role: decoded.role,
        fullName: decoded.fullName,
      }
      setUser(userData)
      localStorage.setItem('apexgrid_user', JSON.stringify(userData))
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('apexgrid_token')
    localStorage.removeItem('apexgrid_user')
    setUser(null)
  }, [])

  const isAuthenticated = useCallback(() => {
    const token = localStorage.getItem('apexgrid_token')
    if (!token) return false
    const decoded = decodeToken(token)
    return decoded && decoded.exp * 1000 > Date.now()
  }, [])

  const isAdmin = useCallback(() => {
    return user?.role === 'ADMIN'
  }, [user])

  const value = {
    user,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
