import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import PageTransition from '../components/PageTransition'
import api from '../services/api'
import f1Login from '../assets/f1_login.png'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

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

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!token) {
      setError('Reset token is missing from the URL link.')
      return
    }

    if (form.newPassword.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/auth/reset-password', {
        token,
        newPassword: form.newPassword
      })
      setSuccessMessage(res.data.message || 'Password has been reset successfully. Redirecting to login...')
      setForm({ newPassword: '', confirmPassword: '' })
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired or is invalid.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col md:flex-row bg-f1-black text-f1-white">
        {/* Left Side: F1 Brand Visuals (60% width, hidden on mobile) */}
        <div className="hidden md:flex md:w-[60%] relative overflow-hidden items-center justify-center bg-black border-r border-f1-border">
          <img 
            src={f1Login} 
            alt="F1 Cockpit" 
            className="absolute inset-0 w-full h-full object-cover opacity-60 select-none pointer-events-none"
          />
          {/* Telemetry Pattern */}
          <div className="absolute inset-0 opacity-10 mix-blend-overlay"
               style={{
                 backgroundImage: `radial-gradient(var(--f1-white) 1px, transparent 1px)`,
                 backgroundSize: '20px 20px'
               }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/70" />
          <div className="relative z-10 text-center px-8">
            <div className="inline-flex items-center justify-center w-24 h-12 bg-white/5 border border-white/10 backdrop-blur-md rounded-xl mb-5 shadow-xl">
              <svg viewBox="0 0 120 30" className="w-16 h-8 text-f1-red fill-current">
                <path d="M101.086812,30 L101.711812,30 L101.711812,27.106875 L101.722437,27.106875 L102.761812,30 L103.302437,30 L104.341812,27.106875 L104.352437,27.106875 L104.352437,30 L104.977437,30 L104.977437,26.25125 L104.063687,26.25125 L103.055562,29.18625 L103.044937,29.18625 L102.011187,26.25125 L101.086812,26.25125 L101.086812,30 Z M97.6274375,26.818125 L98.8136875,26.818125 L98.8136875,30 L99.4699375,30 L99.4699375,26.818125 L100.661812,26.818125 L100.661812,26.25125 L97.6274375,26.25125 L97.6274375,26.818125 Z M89.9999375,30 L119.999937,0 L101.943687,0 L71.9443125,30 L89.9999375,30 Z M85.6986875,13.065 L49.3818125,13.065 C38.3136875,13.065 36.3768125,13.651875 31.6361875,18.3925 C27.2024375,22.82625 20.0005625,30 20.0005625,30 L35.7324375,30 L39.4855625,26.246875 C41.9530625,23.779375 43.2255625,23.52375 48.4068125,23.52375 L75.2405625,23.52375 L85.6986875,13.065 Z M31.1518125,16.253125 C27.8774375,19.3425 20.7530625,26.263125 16.9130625,30 L-6.25e-05,30 C-6.25e-05,30 13.5524375,16.486875 21.0849375,9.0725 C28.8455625,1.685 32.7143125,0 46.9486875,0 L98.7643125,0 L87.5449375,11.21875 L48.0011875,11.21875 C37.9993125,11.21875 35.7518125,11.911875 31.1518125,16.253125 Z" />
              </svg>
            </div>
            <h1 className="font-f1 text-3xl font-black italic tracking-[0.12em] text-white mb-3">
              APEX<span className="text-f1-red font-light">GRID</span>
            </h1>
            <p className="text-gray-300 text-sm max-w-xs mx-auto leading-relaxed">
              Reset your password. Secure your account and return to the race.
            </p>
          </div>
        </div>

        {/* Right Side: Form Container */}
        <div className="w-full md:w-[40%] flex items-center justify-center px-6 py-12 relative bg-f1-black">
          <div className="absolute inset-0 opacity-[0.05] light:opacity-[0.02] pointer-events-none"
               style={{
                 backgroundImage: `radial-gradient(var(--f1-white) 1px, transparent 1px)`,
                 backgroundSize: '24px 24px'
               }}
          />

          <div className="w-full max-w-md relative z-10">
            {/* Mobile Branding (Visible on mobile, hidden on desktop) */}
            <div className="md:hidden text-center mb-8">
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
            <div className="hidden md:block mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="f1-stripe" />
                <span className="label-machined text-f1-light">Account Security</span>
              </div>
              <h2 className="font-f1 text-2xl font-semibold text-f1-white tracking-tight animate-fade-in">
                Reset Password
              </h2>
              <p className="text-f1-light text-sm mt-1 animate-fade-in" style={{ animationDelay: '0.05s' }}>
                Create a new strong password for your account.
              </p>
            </div>

            <div className="card p-8 shadow-xl border border-f1-border bg-f1-card animate-scale-in">
              {!token ? (
                <div className="f1-alert-error animate-fade-in">
                  <svg className="w-5 h-5 text-f1-red shrink-0" fill="none" stroke="currentColor" strokeWidth="2.0" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                  <span>Invalid password reset link. Reset token is missing.</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="newPassword" className="form-label text-f1-light">New Password</label>
                    <input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={form.newPassword}
                      onChange={handleChange}
                      className="form-input font-medium"
                      placeholder="At least 6 characters"
                      required
                      autoComplete="new-password"
                    />
                    {form.newPassword && (
                      <div className="mt-1.5">
                        <div className="flex justify-between items-center text-[10px] mb-1">
                          <span className="text-f1-light">Password Strength:</span>
                          <span className={`font-bold uppercase ${getPasswordStrength(form.newPassword).text}`}>
                            {getPasswordStrength(form.newPassword).label}
                          </span>
                        </div>
                        <div className="h-1 w-full bg-f1-surface rounded-full overflow-hidden border border-f1-border">
                          <div className={`h-full transition-all duration-300 ${getPasswordStrength(form.newPassword).color}`} />
                        </div>
                      </div>
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
                      className="form-input font-medium"
                      placeholder="Repeat your new password"
                      required
                      autoComplete="new-password"
                    />
                  </div>

                  {error && (
                    <div className="f1-alert-error animate-fade-in">
                      <svg className="w-5 h-5 text-f1-red shrink-0" fill="none" stroke="currentColor" strokeWidth="2.0" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                      </svg>
                      <span>{error}</span>
                    </div>
                  )}

                  {successMessage && (
                    <div className="f1-alert-success animate-fade-in">
                      <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.0" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <span>{successMessage}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary py-3.5 text-base relative overflow-hidden font-semibold mt-2"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin-f1" />
                        Resetting Password...
                      </span>
                    ) : (
                      'Reset Password'
                    )}
                  </button>
                </form>
              )}

              <div className="mt-6 text-center">
                <Link to="/login" className="text-f1-red hover:text-red-400 font-semibold transition-colors text-sm">
                  Back to Login
                </Link>
              </div>
            </div>

            <div className="mt-8 text-center text-xs text-gray-500">
              © 2026 ApexGrid — Ultimate Motorsport Experience
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
