import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageTransition from '../components/PageTransition'
import api from '../services/api'
import f1Register from '../assets/f1_register.png'

export default function Register() {
  const [form, setForm] = useState({
    username: '', email: '', fullName: '', password: '', confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm({ ...form, [e.target.name]: value })
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' })
  }

  const getPasswordStrength = (pwd) => {
    if (!pwd) return null
    if (pwd.length < 6) return { label: 'Weak', color: 'w-1/3 bg-red-500', text: 'text-red-500' }
    const hasNumbers = /\d/.test(pwd)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    const hasMixed = /[a-z]/.test(pwd) && /[A-Z]/.test(pwd)
    if (pwd.length >= 8 && hasNumbers && hasSpecial && hasMixed) {
      return { label: 'Strong', color: 'w-full bg-green-500', text: 'text-green-400' }
    }
    return { label: 'Medium', color: 'w-2/3 bg-amber-500', text: 'text-amber-400' }
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
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed'
      setErrors({ general: msg })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-f1-black text-f1-white">
        <div className="text-center animate-fade-in card p-8 border border-f1-border bg-f1-card max-w-md w-full shadow-2xl rounded-2xl">
          <div className="w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-f1-white mb-2">Check Your Email</h2>
          <p className="text-f1-light mb-6">
            We've sent a magic link to <span className="text-white font-semibold">{form.email}</span>.
            <br />Please click the link to verify your account.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            You can close this tab and proceed to login after verifying.
          </p>
          <button 
            onClick={() => navigate('/login')}
            className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg font-medium transition-colors border border-white/10"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  const inputClass = (field) =>
    `form-input ${errors[field] ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/20' : ''}`

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col md:flex-row bg-f1-black text-f1-white">
        
        {/* Left Side: F1 Brand Visuals (60% width, hidden on mobile) */}
        <div className="auth-brand-sidebar hidden md:flex md:w-[60%] relative overflow-hidden items-center justify-center bg-black border-r border-f1-border">
          <img 
            src={f1Register} 
            alt="F1 Night Race Track" 
            className="absolute inset-0 w-full h-full object-cover opacity-60 select-none pointer-events-none"
          />
          {/* Telemetry Grid Overlay */}
          <div className="absolute inset-0 opacity-10 mix-blend-overlay"
               style={{
                 backgroundImage: `radial-gradient(var(--f1-white) 1px, transparent 1px)`,
                 backgroundSize: '20px 20px'
               }}
          />
          {/* Glowing racing lines */}
          <div className="absolute inset-0 opacity-[0.03]">
            {[...Array(6)].map((_, i) => (
              <div key={i}
                className="absolute h-[2px] bg-gradient-to-r from-transparent via-f1-red to-transparent w-full"
                style={{
                  top: `${20 + i * 15}%`,
                  transform: `rotate(${-15 + i * 4}deg)`
                }}
              />
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/70" />
          
          <div className="relative z-10 text-center px-8">
            <Link to="/" className="inline-flex items-center justify-center w-24 h-12 bg-white/5 border border-white/10 backdrop-blur-md rounded-xl mb-5 shadow-xl transition-transform hover:scale-105">
              <svg viewBox="0 0 120 30" className="w-16 h-8 text-f1-red fill-current">
                <path d="M101.086812,30 L101.711812,30 L101.711812,27.106875 L101.722437,27.106875 L102.761812,30 L103.302437,30 L104.341812,27.106875 L104.352437,27.106875 L104.352437,30 L104.977437,30 L104.977437,26.25125 L104.063687,26.25125 L103.055562,29.18625 L103.044937,29.18625 L102.011187,26.25125 L101.086812,26.25125 L101.086812,30 Z M97.6274375,26.818125 L98.8136875,26.818125 L98.8136875,30 L99.4699375,30 L99.4699375,26.818125 L100.661812,26.818125 L100.661812,26.25125 L97.6274375,26.25125 L97.6274375,26.818125 Z M89.9999375,30 L119.999937,0 L101.943687,0 L71.9443125,30 L89.9999375,30 Z M85.6986875,13.065 L49.3818125,13.065 C38.3136875,13.065 36.3768125,13.651875 31.6361875,18.3925 C27.2024375,22.82625 20.0005625,30 20.0005625,30 L35.7324375,30 L39.4855625,26.246875 C41.9530625,23.779375 43.2255625,23.52375 48.4068125,23.52375 L75.2405625,23.52375 L85.6986875,13.065 Z M31.1518125,16.253125 C27.8774375,19.3425 20.7530625,26.263125 16.9130625,30 L-6.25e-05,30 C-6.25e-05,30 13.5524375,16.486875 21.0849375,9.0725 C28.8455625,1.685 32.7143125,0 46.9486875,0 L98.7643125,0 L87.5449375,11.21875 L48.0011875,11.21875 C37.9993125,11.21875 35.7518125,11.911875 31.1518125,16.253125 Z" />
              </svg>
            </Link>
            <h1 className="font-f1 text-3xl font-black italic tracking-[0.12em] text-white mb-3">
              APEX<span className="text-f1-red font-light">GRID</span>
            </h1>
            <p className="text-gray-300 text-sm max-w-xs mx-auto leading-relaxed">
              Create an account to track bookings, secure zones, and experience the speed of the Formula 1 season.
            </p>
          </div>
        </div>

        {/* Right Side: Form Container (40% width) */}
        <div className="w-full md:w-[40%] flex items-center justify-center px-6 py-12 relative bg-f1-black">
          {/* Technical pattern overlay */}
          <div className="absolute inset-0 opacity-[0.05] light:opacity-[0.02] pointer-events-none"
               style={{
                 backgroundImage: `radial-gradient(var(--f1-white) 1px, transparent 1px)`,
                 backgroundSize: '24px 24px'
               }}
          />

          <div className="w-full max-w-md relative z-10">
            {/* Mobile Branding (Visible on mobile, hidden on desktop) */}
            <div className="md:hidden text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-10 bg-f1-surface border border-f1-border rounded-xl mb-3">
                <svg viewBox="0 0 120 30" className="w-12 h-6 text-f1-red fill-current">
                  <path d="M101.086812,30 L101.711812,30 L101.711812,27.106875 L101.722437,27.106875 L102.761812,30 L103.302437,30 L104.341812,27.106875 L104.352437,27.106875 L104.352437,30 L104.977437,30 L104.977437,26.25125 L104.063687,26.25125 L103.055562,29.18625 L103.044937,29.18625 L102.011187,26.25125 L101.086812,26.25125 L101.086812,30 Z M97.6274375,26.818125 L98.8136875,26.818125 L98.8136875,30 L99.4699375,30 L99.4699375,26.818125 L100.661812,26.818125 L100.661812,26.25125 L97.6274375,26.25125 L97.6274375,26.818125 Z M89.9999375,30 L119.999937,0 L101.943687,0 L71.9443125,30 L89.9999375,30 Z M85.6986875,13.065 L49.3818125,13.065 C38.3136875,13.065 36.3768125,13.651875 31.6361875,18.3925 C27.2024375,22.82625 20.0005625,30 20.0005625,30 L35.7324375,30 L39.4855625,26.246875 C41.9530625,23.779375 43.2255625,23.52375 48.4068125,23.52375 L75.2405625,23.52375 L85.6986875,13.065 Z M31.1518125,16.253125 C27.8774375,19.3425 20.7530625,26.263125 16.9130625,30 L-6.25e-05,30 C-6.25e-05,30 13.5524375,16.486875 21.0849375,9.0725 C28.8455625,1.685 32.7143125,0 46.9486875,0 L98.7643125,0 L87.5449375,11.21875 L48.0011875,11.21875 C37.9993125,11.21875 35.7518125,11.911875 31.1518125,16.253125 Z" />
                </svg>
              </div>
              <h1 className="font-f1 text-2xl font-black italic tracking-[0.12em] text-f1-white">
                APEX<span className="text-f1-red font-light">GRID</span>
              </h1>
              <p className="text-xs text-f1-light mt-1">Formula 1 Race Ticket Platform</p>
            </div>

            {/* Desktop Brand Subtitle */}
            <div className="hidden md:block mb-6">
              <h2 className="text-2xl font-bold text-f1-white animate-fade-in">Create Account</h2>
              <p className="text-f1-light text-sm mt-1 animate-fade-in" style={{ animationDelay: '0.05s' }}>Fill in the details to secure your F1 ticket access</p>
            </div>

            <div className="card p-8 shadow-xl border border-f1-border bg-f1-card animate-scale-in">
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {errors.general && (
                  <div className="f1-alert-error animate-fade-in mb-4">
                    <svg className="w-5 h-5 text-f1-red shrink-0" fill="none" stroke="currentColor" strokeWidth="2.0" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    <span>{errors.general}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="fullName" className="form-label text-f1-light">Full Name</label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={form.fullName}
                    onChange={handleChange}
                    className={inputClass('fullName')}
                    placeholder="Lewis Hamilton"
                  />
                  {errors.fullName && (
                    <p className="mt-1.5 text-xs text-red-400 font-semibold flex items-center gap-1.5 animate-fade-in">
                      <svg className="w-3.5 h-3.5 text-f1-red shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                      </svg>
                      {errors.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="reg-username" className="form-label text-f1-light">Username</label>
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
                  {errors.username && (
                    <p className="mt-1.5 text-xs text-red-400 font-semibold flex items-center gap-1.5 animate-fade-in">
                      <svg className="w-3.5 h-3.5 text-f1-red shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                      </svg>
                      {errors.username}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="reg-email" className="form-label text-f1-light">Email</label>
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
                  {errors.email && (
                    <p className="mt-1.5 text-xs text-red-400 font-semibold flex items-center gap-1.5 animate-fade-in">
                      <svg className="w-3.5 h-3.5 text-f1-red shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                      </svg>
                      {errors.email}
                    </p>
                  )}
                </div>

                 <div>
                  <label htmlFor="reg-password" className="form-label text-f1-light">Password</label>
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
                  {form.password && (
                    <div className="mt-1.5">
                      <div className="flex justify-between items-center text-[10px] mb-1">
                        <span className="text-f1-light">Password Strength:</span>
                        <span className={`font-bold uppercase ${getPasswordStrength(form.password).text}`}>
                          {getPasswordStrength(form.password).label}
                        </span>
                      </div>
                      <div className="h-1 w-full bg-f1-surface rounded-full overflow-hidden border border-f1-border">
                        <div className={`h-full transition-all duration-300 ${getPasswordStrength(form.password).color}`} />
                      </div>
                    </div>
                  )}
                  {errors.password && (
                    <p className="mt-1.5 text-xs text-red-400 font-semibold flex items-center gap-1.5 animate-fade-in">
                      <svg className="w-3.5 h-3.5 text-f1-red shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                      </svg>
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="form-label text-f1-light">Confirm Password</label>
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
                  {errors.confirmPassword && (
                    <p className="mt-1.5 text-xs text-red-400 font-semibold flex items-center gap-1.5 animate-fade-in">
                      <svg className="w-3.5 h-3.5 text-f1-red shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                      </svg>
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>



                <button
                  type="submit"
                  id="register-btn"
                  disabled={loading}
                  className="w-full btn-primary py-3.5 text-base relative overflow-hidden font-semibold mt-2"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin-f1" />
                      Creating account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              <div className="mt-5 text-center">
                <p className="text-f1-light text-sm">
                  Already have an account?{' '}
                  <Link to="/login" id="go-login" className="text-f1-red hover:text-red-400 font-semibold transition-colors">
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>

            {/* Bottom branding footer */}
            <div className="mt-6 text-center text-xs text-gray-500">
              © 2026 ApexGrid — Ultimate Motorsport Experience
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
