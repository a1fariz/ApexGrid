import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function Register() {
  const [form, setForm] = useState({
    username: '', email: '', fullName: '', password: '', confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' })
  }

  const validate = () => {
    const newErrors = {}
    if (!form.username || form.username.length < 3) newErrors.username = 'Username must be at least 3 characters'
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Please enter a valid email'
    if (!form.fullName) newErrors.fullName = 'Full name is required'
    if (!form.password || form.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/register', {
        username: form.username,
        email: form.email,
        fullName: form.fullName,
        password: form.password,
      })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed'
      setErrors({ general: msg })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center animate-fade-in">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-2xl font-bold text-white mb-2">Registration Successful!</h2>
          <p className="text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  const inputClass = (field) =>
    `form-input ${errors[field] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10"
         style={{ background: 'radial-gradient(ellipse at top, #1a0a0a 0%, #15151E 60%)' }}>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-f1-red/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center w-14 h-14 bg-f1-red rounded-xl mb-4 shadow-lg shadow-red-900/50">
            <span className="font-f1 text-xl font-black text-white">F1</span>
          </Link>
          <h1 className="font-f1 text-2xl font-black tracking-widest">
            JOIN <span className="text-f1-red">APEXGRID</span>
          </h1>
          <p className="text-gray-400 mt-1 text-sm">Create your account to book F1 tickets</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {errors.general && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                ⚠️ {errors.general}
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="form-label">Full Name</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={form.fullName}
                onChange={handleChange}
                className={inputClass('fullName')}
                placeholder="Lewis Hamilton"
              />
              {errors.fullName && <p className="mt-1 text-xs text-red-400">{errors.fullName}</p>}
            </div>

            <div>
              <label htmlFor="reg-username" className="form-label">Username</label>
              <input
                id="reg-username"
                name="username"
                type="text"
                value={form.username}
                onChange={handleChange}
                className={inputClass('username')}
                placeholder="lewishamilton44"
                autoComplete="username"
              />
              {errors.username && <p className="mt-1 text-xs text-red-400">{errors.username}</p>}
            </div>

            <div>
              <label htmlFor="reg-email" className="form-label">Email</label>
              <input
                id="reg-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className={inputClass('email')}
                placeholder="lewis@mercedes.com"
                autoComplete="email"
              />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="reg-password" className="form-label">Password</label>
              <input
                id="reg-password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                className={inputClass('password')}
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                className={inputClass('confirmPassword')}
                placeholder="Repeat your password"
                autoComplete="new-password"
              />
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              id="register-btn"
              disabled={loading}
              className="w-full btn-primary py-3 text-base mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin-f1" />
                  Creating account...
                </span>
              ) : (
                'Create Account 🏎️'
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link to="/login" id="go-login" className="text-f1-red hover:text-red-400 font-semibold transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
