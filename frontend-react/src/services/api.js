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

// Response interceptor — handle 401 (expired/invalid token) only
// NOTE: 403 (Forbidden, e.g. unverified email) is intentionally NOT auto-redirected
// so the calling page can display the specific error message.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only clear token and redirect on true unauthorized (invalid/expired JWT)
      const isAuthEndpoint = error.config?.url?.includes('/auth/login') || 
                             error.config?.url?.includes('/auth/register');
      if (!isAuthEndpoint) {
        localStorage.removeItem('apexgrid_token')
        localStorage.removeItem('apexgrid_user')
        sessionStorage.removeItem('apexgrid_token')
        sessionStorage.removeItem('apexgrid_user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
