import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('apexgrid_token') || sessionStorage.getItem('apexgrid_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401 (expired/invalid token)
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 429) {
      if (error.response.data && typeof error.response.data === 'object') {
        error.response.data.message = 'Terlalu banyak percobaan. Batas maksimal adalah 10 kali permintaan dalam 1 menit. Silakan coba lagi nanti.'
      } else {
        error.response.data = {
          message: 'Terlalu banyak percobaan. Batas maksimal adalah 10 kali permintaan dalam 1 menit. Silakan coba lagi nanti.'
        }
      }
    }
    const originalRequest = error.config
    
    const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || 
                           originalRequest.url?.includes('/auth/register') ||
                           originalRequest.url?.includes('/auth/refresh') ||
                           originalRequest.url?.includes('/auth/forgot-password') ||
                           originalRequest.url?.includes('/auth/reset-password') ||
                           originalRequest.url?.includes('/auth/resend-verification');

    if (error.response?.status === 401 && !isAuthEndpoint && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('apexgrid_refresh_token') || sessionStorage.getItem('apexgrid_refresh_token')
      
      if (refreshToken) {
        try {
          // Use basic axios to avoid interceptor recursion
          const res = await axios.post('/api/auth/refresh', { refreshToken })
          const { accessToken, refreshToken: newRefreshToken } = res.data
          
          const isRemembered = !!localStorage.getItem('apexgrid_token')
          const storage = isRemembered ? localStorage : sessionStorage
          
          storage.setItem('apexgrid_token', accessToken)
          if (newRefreshToken) {
            storage.setItem('apexgrid_refresh_token', newRefreshToken)
          }

          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          processQueue(null, accessToken)
          return api(originalRequest)
        } catch (refreshError) {
          processQueue(refreshError, null)
          
          localStorage.removeItem('apexgrid_token')
          localStorage.removeItem('apexgrid_refresh_token')
          localStorage.removeItem('apexgrid_user')
          sessionStorage.removeItem('apexgrid_token')
          sessionStorage.removeItem('apexgrid_refresh_token')
          sessionStorage.removeItem('apexgrid_user')
          window.location.href = '/login'
          
          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      } else {
        // No refresh token — clear storage and redirect
        isRefreshing = false
        processQueue(new Error('No refresh token'), null)
        localStorage.removeItem('apexgrid_token')
        localStorage.removeItem('apexgrid_refresh_token')
        localStorage.removeItem('apexgrid_user')
        sessionStorage.removeItem('apexgrid_token')
        sessionStorage.removeItem('apexgrid_refresh_token')
        sessionStorage.removeItem('apexgrid_user')
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)

export default api

