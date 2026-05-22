import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import PageTransition from '../components/PageTransition'
import api from '../services/api'

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      login(res.data.token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center px-4"
           style={{ background: 'radial-gradient(ellipse at top, #120505 0%, #0A0A0F 60%)' }}>

        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-f1-red/[0.04] rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-f1-red/[0.02] rounded-full blur-[100px]" />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Logo */}
          <div className="text-center mb-10 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-f1-red rounded-2xl mb-4 shadow-lg shadow-red-900/40">
              <span className="font-f1 text-2xl font-black text-white">F1</span>
            </div>
            <h1 className="font-f1 text-3xl font-black tracking-widest">
              APEX<span className="text-f1-red">GRID</span>
            </h1>
            <p className="text-gray-500 mt-2 text-sm">Sign in to your account</p>
          </div>

          <div className="glass-card p-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="username" className="form-label">Username or Email</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={form.username}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your username or email"
                  required
                  autoComplete="username"
                />
              </div>

              <div>
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/[0.08] border border-red-500/15 text-red-400 text-sm animate-fade-in">
                  <span className="flex-shrink-0">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                id="login-btn"
                disabled={loading}
                className="w-full btn-primary py-3.5 text-base relative overflow-hidden"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin-f1" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In →'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-500 text-sm">
                Don't have an account?{' '}
                <Link to="/register" id="go-register" className="text-f1-red hover:text-red-400 font-semibold transition-colors">
                  Register here
                </Link>
              </p>
            </div>
          </div>

          {/* Tagline */}
          <div className="mt-6 text-center text-xs text-gray-600 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Formula 1 Race Ticket Platform
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
