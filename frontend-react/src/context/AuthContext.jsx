import { createContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'

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

  // Initialize from storage on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('apexgrid_token') || sessionStorage.getItem('apexgrid_token')
      const refreshToken = localStorage.getItem('apexgrid_refresh_token') || sessionStorage.getItem('apexgrid_refresh_token')
      const isRemembered = !!localStorage.getItem('apexgrid_token')
      const storage = isRemembered ? localStorage : sessionStorage

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
        } else if (refreshToken) {
          // Attempt silent refresh
          try {
            const res = await axios.post('/api/auth/refresh', { refreshToken })
            const { accessToken, refreshToken: newRefreshToken } = res.data
            
            storage.setItem('apexgrid_token', accessToken)
            if (newRefreshToken) {
              storage.setItem('apexgrid_refresh_token', newRefreshToken)
            }

            const newDecoded = decodeToken(accessToken)
            if (newDecoded) {
              const userData = {
                id: newDecoded.userId,
                username: newDecoded.username || newDecoded.sub,
                email: newDecoded.email,
                role: newDecoded.role,
                fullName: newDecoded.fullName,
              }
              setUser(userData)
              storage.setItem('apexgrid_user', JSON.stringify(userData))
            }
          } catch (err) {
            if (import.meta.env.DEV) console.error('Silent refresh failed during initial mount:', err)
            localStorage.removeItem('apexgrid_token')
            localStorage.removeItem('apexgrid_refresh_token')
            localStorage.removeItem('apexgrid_user')
            sessionStorage.removeItem('apexgrid_token')
            sessionStorage.removeItem('apexgrid_refresh_token')
            sessionStorage.removeItem('apexgrid_user')
          }
        } else {
          localStorage.removeItem('apexgrid_token')
          localStorage.removeItem('apexgrid_user')
          sessionStorage.removeItem('apexgrid_token')
          sessionStorage.removeItem('apexgrid_user')
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = useCallback((token, refreshToken, rememberMe = true) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    
    // Clear other storage to avoid conflicts
    if (rememberMe) {
        sessionStorage.removeItem('apexgrid_token');
        sessionStorage.removeItem('apexgrid_refresh_token');
        sessionStorage.removeItem('apexgrid_user');
    } else {
        localStorage.removeItem('apexgrid_token');
        localStorage.removeItem('apexgrid_refresh_token');
        localStorage.removeItem('apexgrid_user');
    }

    storage.setItem('apexgrid_token', token)
    if (refreshToken) {
      storage.setItem('apexgrid_refresh_token', refreshToken)
    }
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
      storage.setItem('apexgrid_user', JSON.stringify(userData))
    }
  }, [])

  const logout = useCallback(async () => {
    const token = localStorage.getItem('apexgrid_token') || sessionStorage.getItem('apexgrid_token')
    if (token) {
      try {
        await axios.post('/api/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
      } catch (err) {
        if (import.meta.env.DEV) console.error('Logout request to server failed:', err)
      }
    }
    localStorage.removeItem('apexgrid_token')
    localStorage.removeItem('apexgrid_refresh_token')
    localStorage.removeItem('apexgrid_user')
    sessionStorage.removeItem('apexgrid_token')
    sessionStorage.removeItem('apexgrid_refresh_token')
    sessionStorage.removeItem('apexgrid_user')
    setUser(null)
  }, [])

  const isAuthenticated = useCallback(() => {
    const token = localStorage.getItem('apexgrid_token') || sessionStorage.getItem('apexgrid_token')
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
