import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import LoadingSpinner from '../components/LoadingSpinner'
import PageTransition from '../components/PageTransition'
import { showToast } from '../components/Toast'
import api from '../services/api'
import qrisImage from '../assets/qris.png'

const PAYMENT_METHODS = [
  {
    id: 'qris',
    label: 'QRIS E-Wallet',
    icon: '📱',
    desc: 'Scan with GoPay, OVO, Dana, LinkAja, or m-Banking',
  },
  {
    id: 'bank',
    label: 'Bank Transfer (VA)',
    icon: '🏦',
    desc: 'Pay using BCA, Mandiri, BNI, or BRI Virtual Account',
  },
  {
    id: 'card',
    label: 'Credit / Debit Card',
    icon: '💳',
    desc: 'Visa, Mastercard, JCB, or Amex credit/debit card',
  },
]

const BANK_ACCOUNTS = {
  bca: {
    bankName: 'BCA Virtual Account',
    number: '880 8080 1234 5678',
    holder: 'ApexGrid Racing BCA',
  },
  mandiri: {
    bankName: 'Mandiri Virtual Account',
    number: '900 7070 8765 4321',
    holder: 'ApexGrid Racing Mandiri',
  },
  bni: {
    bankName: 'BNI Virtual Account',
    number: '827 1010 5555 4444',
    holder: 'ApexGrid Racing BNI',
  },
  bri: {
    bankName: 'BRI Virtual Account',
    number: '802 9090 9999 1111',
    holder: 'ApexGrid Racing BRI',
  },
}

function CountdownTimer({ onExpire }) {
  // Always start at 30 minutes when page opens.
  // Backend enforces actual expiry server-side.
  const [secondsLeft, setSecondsLeft] = useState(30 * 60)

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(id)
          onExpire?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [onExpire])

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const secs = String(secondsLeft % 60).padStart(2, '0')
  const isUrgent = secondsLeft < 120

  return (
    <span className={`font-mono font-bold text-lg ${isUrgent ? 'text-red-500 animate-pulse' : 'text-amber-400'}`}>
      {mins}:{secs}
    </span>
  )
}

export default function Payment() {
  const { code } = useParams()
  const navigate = useNavigate()

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [method, setMethod] = useState('qris')
  const [step, setStep] = useState('select') // select | processing | success
  const [selectedBank, setSelectedBank] = useState('bca')
  
  // Card states
  const [cardNum, setCardNum] = useState('')
  const [cardExp, setCardExp] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  
  const [expired, setExpired] = useState(false)

  // Fetch booking details
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await api.get(`/bookings/${code}`)
        const data = res.data
        setBooking(data)

        if (data.status === 'CONFIRMED') {
          // Already paid
          setStep('success')
        } else if (data.status === 'CANCELLED') {
          const reason = data.cancellationReason || ''
          const isAutoExpired = reason.toLowerCase().includes('expired') || reason.toLowerCase().includes('auto-cancelled')
          if (isAutoExpired) {
            // Truly expired by the system auto-canceller
            setExpired(true)
          } else {
            // Manually cancelled by user
            setError(`Booking ${data.bookingCode} has been cancelled.`)
          }
        }
        // PENDING: always show payment page, let countdown handle visual expiry
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch booking details. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchBooking()
  }, [code])

  const handleExpire = useCallback(() => setExpired(true), [])

  const handlePay = async () => {
    if (expired) return
    setStep('processing')
    try {
      // Simulate payment processing delay (1.8s)
      await new Promise((r) => setTimeout(r, 1800))
      await api.put(`/bookings/${booking.id}/confirm`)
      setStep('success')
      showToast('Payment successful!', 'success')
    } catch (err) {
      showToast(err.response?.data?.message || 'Payment failed. Please try again.', 'error')
      setStep('select')
    }
  }

  const handleAutofillCard = () => {
    setCardNum('4111 1111 1111 1111')
    setCardExp('12/28')
    setCardCvv('123')
    showToast('Demo card credentials auto-filled', 'success')
  }

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)

  const formatCardNum = (val) =>
    val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()

  const formatExp = (val) =>
    val.replace(/\D/g, '').slice(0, 4).replace(/^(\d{2})(\d)/, '$1/$2')

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    showToast('Copied to clipboard', 'success')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" text="Initializing secure payment gateway..." />
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-20 text-center flex-1">
          <div className="glass-card p-8 border border-white/[0.05]">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-white mb-2">Checkout Error</h2>
            <p className="text-gray-400 text-sm mb-6">{error || 'Booking not found.'}</p>
            <button onClick={() => navigate('/bookings')} className="w-full btn-primary">
              Back to Bookings
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const selectedBankDetails = BANK_ACCOUNTS[selectedBank]

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-f1-black">
        <Navbar />

        {/* ── Main Payment Container with explicit pb-48 margin for footer clearance ── */}
        <div className="flex-1 max-w-5xl mx-auto w-full px-4 pt-10 pb-48 mb-20">
          
          {/* Header & Back Link */}
          <div className="mb-6 flex items-center justify-between">
            <Link to="/bookings" className="text-gray-400 hover:text-white transition-colors text-sm font-semibold flex items-center gap-1.5">
              ← Back to My Bookings
            </Link>
            <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.05] rounded-full px-3 py-1 text-xs text-gray-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Secure 256-bit Connection
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left/Middle: Payment Selection & Forms */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Payment Card Wrapper */}
              <div className="glass-card overflow-hidden border border-white/[0.05] rounded-2xl shadow-xl">
                
                {/* Header Badge */}
                <div className="bg-gradient-to-r from-f1-red to-red-600 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-f1-red font-black text-xs shadow-md">AG</div>
                    <span className="text-white font-bold tracking-wide text-sm">APEXGRID SECURE CHECKOUT</span>
                  </div>
                  <span className="text-[10px] text-white/80 font-bold uppercase tracking-widest bg-black/25 px-2.5 py-1 rounded-full">
                    Demo Mode
                  </span>
                </div>

                {step === 'select' && (
                  <div className="p-6 space-y-6">
                    
                    {/* Method Selector */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Select Payment Method</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {PAYMENT_METHODS.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => setMethod(m.id)}
                            className={`flex flex-col items-center justify-between p-4 rounded-xl border transition-all duration-200 text-center ${
                              method === m.id
                                ? 'border-f1-red/60 bg-f1-red/[0.05] shadow-lg shadow-red-950/20'
                                : 'border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/15'
                            }`}
                          >
                            <span className="text-3xl mb-2">{m.icon}</span>
                            <div>
                              <div className="text-white font-semibold text-xs mb-1">{m.label}</div>
                              <div className="text-[9px] text-gray-500 leading-tight">{m.desc}</div>
                            </div>
                            <div className={`mt-3 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                              method === m.id ? 'border-f1-red bg-f1-red' : 'border-gray-600'
                            }`}>
                              {method === m.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dynamic Forms */}
                    <div className="pt-4 border-t border-white/[0.05]">
                      
                      {/* 1. QRIS */}
                      {method === 'qris' && (
                        <div className="flex flex-col md:flex-row items-center gap-6 bg-white/[0.02] border border-white/[0.05] rounded-xl p-5">
                          <div className="bg-white p-3 rounded-xl shadow-lg shrink-0">
                            <img 
                              src={qrisImage} 
                              alt="QRIS QR Code" 
                              className="w-40 h-40 object-contain" 
                            />
                            <div className="text-[10px] text-center font-bold text-gray-800 tracking-wider mt-1.5">
                              QRIS INDONESIA
                            </div>
                          </div>
                          <div className="space-y-3">
                            <h4 className="text-white font-bold text-sm">Scan QRIS code to pay</h4>
                            <p className="text-xs text-gray-400 leading-relaxed">
                              Scan this static QR code using GoPay, ShopeePay, OVO, Dana, LinkAja, or any Indonesian mobile banking application.
                            </p>
                            <div className="flex flex-wrap gap-2 pt-1">
                              <span className="text-[9px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-400">Instantly Confirmed</span>
                              <span className="text-[9px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-400">Zero Extra Fee</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 2. Bank Transfer */}
                      {method === 'bank' && (
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5">Choose Bank</h4>
                            <div className="grid grid-cols-4 gap-2">
                              {Object.keys(BANK_ACCOUNTS).map((b) => (
                                <button
                                  key={b}
                                  onClick={() => setSelectedBank(b)}
                                  className={`py-2 px-3 rounded-lg border font-mono font-bold text-xs uppercase transition-all ${
                                    selectedBank === b
                                      ? 'border-f1-red bg-f1-red/10 text-f1-red font-extrabold shadow-sm'
                                      : 'border-white/[0.05] bg-white/[0.02] text-gray-400 hover:border-white/10 hover:text-white'
                                  }`}
                                >
                                  {b}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-5 space-y-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Virtual Account Bank</div>
                                <div className="text-white font-bold text-sm mt-0.5">{selectedBankDetails.bankName}</div>
                              </div>
                              <span className="text-xl">🏦</span>
                            </div>

                            <div>
                              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Virtual Account Number</div>
                              <div className="flex items-center justify-between mt-1">
                                <span className="font-mono text-white font-bold text-lg md:text-xl tracking-widest">
                                  {selectedBankDetails.number}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(selectedBankDetails.number.replace(/\s+/g, ''))}
                                  className="text-xs bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 font-semibold px-2.5 py-1 rounded transition-colors active:scale-95 cursor-pointer"
                                >
                                  📋 Copy
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/[0.04]">
                              <div>
                                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Account Name</div>
                                <div className="text-white text-xs font-semibold mt-0.5">{selectedBankDetails.holder}</div>
                              </div>
                              <div>
                                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Staging Amount</div>
                                <div className="text-f1-red text-xs font-bold mt-0.5">{formatPrice(booking.totalPrice)}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 3. Card */}
                      {method === 'card' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Card Credentials</span>
                            <button
                              type="button"
                              onClick={handleAutofillCard}
                              className="text-[10px] bg-f1-red/10 border border-f1-red/20 text-f1-red font-bold px-2 py-1 rounded hover:bg-f1-red/20 transition-all active:scale-95 cursor-pointer"
                            >
                              💡 Fill Demo Card
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Card Number</label>
                              <div className="relative">
                                <input
                                  value={cardNum}
                                  onChange={(e) => setCardNum(formatCardNum(e.target.value))}
                                  placeholder="4111 1111 1111 1111 (Demo)"
                                  maxLength={19}
                                  className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3 text-white font-mono text-sm placeholder-gray-700 focus:outline-none focus:border-f1-red/40 transition-colors"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg">💳</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Expiry Date</label>
                                <input
                                  value={cardExp}
                                  onChange={(e) => setCardExp(formatExp(e.target.value))}
                                  placeholder="MM/YY"
                                  maxLength={5}
                                  className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3 text-white font-mono text-sm placeholder-gray-700 focus:outline-none focus:border-f1-red/40 transition-colors"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">CVV / CVC</label>
                                <input
                                  value={cardCvv}
                                  onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                  placeholder="•••"
                                  maxLength={4}
                                  type="password"
                                  className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3 text-white font-mono text-sm placeholder-gray-700 focus:outline-none focus:border-f1-red/40 transition-colors"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="text-[10px] text-gray-600 flex items-center gap-1.5">
                            🛡️ Demo staging gateway — inputs are simulated and never stored.
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Pay Action Button */}
                    <div>
                      <button
                        onClick={handlePay}
                        disabled={expired}
                        id="payment-pay-btn"
                        className={`w-full py-4 rounded-xl font-bold text-sm tracking-widest uppercase transition-all duration-300 ${
                          expired
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                            : 'bg-f1-red hover:bg-red-600 text-white hover:shadow-lg hover:shadow-red-600/20 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
                        }`}
                      >
                        {expired ? 'Payment Expired' : `Confirm Payment: ${formatPrice(booking.totalPrice)}`}
                      </button>
                    </div>

                  </div>
                )}

                {/* Processing Step */}
                {step === 'processing' && (
                  <div className="p-12 flex flex-col items-center gap-6 text-center">
                    <div className="relative w-20 h-20">
                      <div className="absolute inset-0 rounded-full border-4 border-white/[0.05]" />
                      <div className="absolute inset-0 rounded-full border-4 border-t-f1-red animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center text-3xl">🏁</div>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-xl tracking-wide">Processing Secure Payment</h3>
                      <p className="text-gray-400 text-sm mt-1 max-w-xs mx-auto">
                        We are communicating with the staging servers. Please do not close or refresh this page...
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-2.5 h-2.5 bg-f1-red rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Success Step */}
                {step === 'success' && (
                  <div className="p-10 flex flex-col items-center gap-6 text-center animate-fade-in">
                    <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-4xl shadow-lg animate-bounce">
                      ✅
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-2xl tracking-wide">Payment Successful!</h3>
                      <p className="text-green-400 text-sm font-semibold mt-1">Your F1 Ticket has been confirmed</p>
                    </div>

                    <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-5 w-full max-w-sm text-left space-y-3.5">
                      <div className="flex justify-between text-sm border-b border-white/[0.03] pb-2">
                        <span className="text-gray-500">Booking Code</span>
                        <span className="font-mono text-f1-red font-extrabold tracking-wider">{booking.bookingCode}</span>
                      </div>
                      <div className="flex justify-between text-sm border-b border-white/[0.03] pb-2">
                        <span className="text-gray-500">Amount Paid</span>
                        <span className="text-white font-bold">{formatPrice(booking.totalPrice)}</span>
                      </div>
                      <div className="flex justify-between text-sm border-b border-white/[0.03] pb-2">
                        <span className="text-gray-500">Payment Status</span>
                        <span className="text-green-400 font-bold uppercase tracking-wider">CONFIRMED</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Completed At</span>
                        <span className="text-gray-300 font-semibold">{new Date().toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex gap-3 w-full max-w-sm mt-2">
                      <button
                        onClick={() => navigate('/bookings')}
                        id="payment-success-btn"
                        className="flex-1 py-3.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-green-950/20 active:scale-95 cursor-pointer"
                      >
                        View My Tickets →
                      </button>
                      <button
                        onClick={() => navigate('/')}
                        className="flex-1 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm tracking-wide border border-white/10 transition-all active:scale-95 cursor-pointer"
                      >
                        Back to Home
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* Secure payment logos block */}
              {step !== 'success' && (
                <div className="flex flex-wrap items-center justify-center gap-6 py-4 px-6 bg-white/[0.01] border border-white/[0.03] rounded-xl text-[10px] text-gray-500 font-mono">
                  <span>🔒 SSL SECURED CONNECTION</span>
                  <span>🏦 PCI DSS COMPLIANT</span>
                  <span>🛡️ 256-BIT ENCRYPTION</span>
                  <span>🇮🇩 BANK INDONESIA LICENSE</span>
                </div>
              )}
            </div>

            {/* Right: Booking Order Summary */}
            <div className="space-y-6">
              
              {/* Order Summary Panel */}
              <div className="glass-card border border-white/[0.05] rounded-2xl p-6 shadow-xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 pb-2 border-b border-white/[0.04]">
                  Order Summary
                </h3>

                <div className="space-y-4">
                  
                  {/* Race / Circuit Details */}
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Grand Prix Event</span>
                    <h4 className="text-white font-bold text-base mt-0.5">{booking.raceName}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{booking.circuitName}, {booking.country}</p>
                  </div>

                  {/* Seat Zone & Date */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-semibold font-mono">Zone</span>
                      <div className="mt-1 font-bold text-xs uppercase tracking-wide bg-f1-red/10 border border-f1-red/20 text-f1-red px-2.5 py-1 rounded w-fit">
                        {booking.zone}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-semibold">Race Date</span>
                      <p className="text-white font-bold text-xs mt-1">
                        {booking.raceDate ? new Date(booking.raceDate).toLocaleDateString('en-US', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        }) : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Quantity & Base Pricing */}
                  <div className="pt-4 border-t border-white/[0.04] space-y-2">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Ticket Quantity</span>
                      <span className="text-white font-bold">{booking.quantity}x</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Booking Code</span>
                      <span className="font-mono text-gray-300">{booking.bookingCode}</span>
                    </div>
                  </div>

                  {/* Total Pricing Badge */}
                  <div className="pt-4 border-t border-white/[0.04] flex justify-between items-center">
                    <span className="text-xs font-bold uppercase text-gray-400">Total Price</span>
                    <span className="text-f1-red font-black text-xl tracking-tight">{formatPrice(booking.totalPrice)}</span>
                  </div>

                  {/* Countdown timer for incomplete payment */}
                  {step !== 'success' && (
                    <div className="pt-4 border-t border-white/[0.04]">
                      {!expired && booking.expiredAt && (
                        <div className="flex items-center justify-between bg-amber-500/[0.04] border border-amber-500/10 rounded-xl p-3">
                          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Pay before expiry</span>
                          <CountdownTimer onExpire={handleExpire} />
                        </div>
                      )}
                      {expired && (
                        <div className="bg-red-500/[0.05] border border-red-500/10 rounded-xl p-3 text-red-500 text-xs font-bold text-center">
                          ⏰ Booking has expired
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>

              {/* Backing Card Helper */}
              {step !== 'success' && (
                <div className="glass-card border border-white/[0.05] rounded-2xl p-5 text-xs text-gray-400 leading-relaxed">
                  <h4 className="text-white font-bold mb-1 flex items-center gap-1">
                    <span>💡</span> Staging Simulator Tips
                  </h4>
                  All payments are processed in staging/demo environment. Choose your method, review details, check the parameters, and hit confirm to simulate successful purchase completion.
                </div>
              )}

            </div>

          </div>

        </div>

        <Footer />
      </div>
    </PageTransition>
  )
}
