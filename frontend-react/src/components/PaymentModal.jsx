import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import { showToast } from './Toast'

const PAYMENT_METHODS = [
  {
    id: 'qris',
    label: 'QRIS',
    icon: '⬛',
    desc: 'Scan with any e-wallet or mobile banking',
  },
  {
    id: 'bank',
    label: 'Bank Transfer',
    icon: '🏦',
    desc: 'Transfer to virtual account number',
  },
  {
    id: 'card',
    label: 'Credit / Debit Card',
    icon: '💳',
    desc: 'Visa, Mastercard, JCB accepted',
  },
]

const BANK_DETAILS = {
  bank: 'BCA Virtual Account',
  number: '880 8080 1234 5678',
  name: 'ApexGrid Racing Tickets',
}

function CountdownTimer({ expiredAt, onExpire }) {
  const [secondsLeft, setSecondsLeft] = useState(null)

  useEffect(() => {
    if (!expiredAt) return
    const update = () => {
      const diff = Math.max(0, Math.floor((new Date(expiredAt) - Date.now()) / 1000))
      setSecondsLeft(diff)
      if (diff === 0) onExpire?.()
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [expiredAt, onExpire])

  if (secondsLeft === null) return null
  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const secs = String(secondsLeft % 60).padStart(2, '0')
  const isUrgent = secondsLeft < 120

  return (
    <span className={`font-mono font-bold text-lg ${isUrgent ? 'text-red-400 animate-pulse' : 'text-amber-400'}`}>
      {mins}:{secs}
    </span>
  )
}

export default function PaymentModal({ isOpen, booking, race, onSuccess, onClose }) {
  const [method, setMethod] = useState('qris')
  const [step, setStep] = useState('select') // select | processing | success
  const [cardNum, setCardNum] = useState('')
  const [cardExp, setCardExp] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [expired, setExpired] = useState(false)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('select')
      setMethod('qris')
      setCardNum('')
      setCardExp('')
      setCardCvv('')
      setExpired(false)
    }
  }, [isOpen])

  const handleExpire = useCallback(() => setExpired(true), [])

  const handlePay = async () => {
    if (expired) return
    setStep('processing')
    try {
      // Simulate processing delay (1.8s)
      await new Promise((r) => setTimeout(r, 1800))
      await api.put(`/bookings/${booking.id}/confirm`)
      setStep('success')
    } catch (err) {
      showToast(err.response?.data?.message || 'Payment failed. Please try again.', 'error')
      setStep('select')
    }
  }

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)

  const formatCardNum = (val) =>
    val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()

  const formatExp = (val) =>
    val.replace(/\D/g, '').slice(0, 4).replace(/^(\d{2})(\d)/, '$1/$2')

  if (!isOpen || !booking) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && step !== 'processing' && onClose()}
    >
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-fade-in"
        style={{ background: 'var(--f1-confirm-bg)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-f1-red rounded-lg flex items-center justify-center text-white font-black text-xs">AG</div>
            <div>
              <div className="text-white font-bold text-sm leading-tight">ApexGrid</div>
              <div className="text-gray-500 text-[10px] tracking-widest uppercase">Secure Payment</div>
            </div>
          </div>
          {step !== 'processing' && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-colors text-lg leading-none"
            >×</button>
          )}
        </div>

        {/* ── Order Summary ── */}
        {step !== 'success' && (
          <div className="mx-6 mt-5 rounded-xl bg-white/[0.03] border border-white/[0.05] p-4">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Order Summary</div>
            <div className="flex justify-between items-start">
              <div>
                <div className="text-white font-semibold text-sm">{race?.name || booking.raceName}</div>
                <div className="text-gray-400 text-xs mt-0.5">
                  Zone: <span className="text-white font-medium">{booking.zone}</span>
                  {' · '}{booking.quantity} ticket{booking.quantity > 1 ? 's' : ''}
                </div>
                <div className="font-mono text-[10px] text-gray-600 mt-1">{booking.bookingCode}</div>
              </div>
              <div className="text-f1-red font-bold text-base">{formatPrice(booking.totalPrice)}</div>
            </div>

            {/* Countdown */}
            {!expired && booking.expiredAt && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.05]">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Complete in</span>
                <CountdownTimer expiredAt={booking.expiredAt} onExpire={handleExpire} />
              </div>
            )}
            {expired && (
              <div className="mt-3 pt-3 border-t border-red-900/30 text-red-400 text-xs font-semibold flex items-center gap-1.5">
                ⏰ Payment window has expired
              </div>
            )}
          </div>
        )}

        {/* ── Step: Select Method ── */}
        {step === 'select' && (
          <div className="px-6 pb-6 mt-5">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">Payment Method</div>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 text-left ${
                    method === m.id
                      ? 'border-f1-red/50 bg-f1-red/[0.06]'
                      : 'border-white/[0.05] bg-white/[0.02] hover:border-white/10'
                  }`}
                >
                  <span className="text-xl">{m.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold text-sm">{m.label}</div>
                    <div className="text-gray-500 text-xs">{m.desc}</div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${
                    method === m.id ? 'border-f1-red bg-f1-red' : 'border-gray-600'
                  }`}>
                    {method === m.id && <div className="w-full h-full rounded-full scale-50 bg-white" />}
                  </div>
                </button>
              ))}
            </div>

            {/* QRIS */}
            {method === 'qris' && (
              <div className="mt-4 flex flex-col items-center gap-2 p-4 bg-white rounded-2xl">
                <div className="text-gray-800 text-xs font-semibold mb-1">Scan to pay</div>
                <svg viewBox="0 0 100 100" className="w-36 h-36">
                  {/* Simplified QR-like pattern for demo */}
                  <rect width="100" height="100" fill="white"/>
                  {[...Array(7)].map((_, r) =>
                    [...Array(7)].map((_, c) => {
                      const pos = [[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[1,0],[1,6],[2,0],[2,2],[2,3],[2,4],[2,6],[3,0],[3,2],[3,4],[3,6],[4,0],[4,2],[4,3],[4,4],[4,6],[5,0],[5,6],[6,0],[6,1],[6,2],[6,3],[6,4],[6,5],[6,6]]
                      const filled = pos.some(([pr,pc]) => pr === r && pc === c)
                      return filled ? (
                        <rect key={`${r}-${c}`} x={r * 14 + 1} y={c * 14 + 1} width="12" height="12" fill="#111" rx="1"/>
                      ) : null
                    })
                  )}
                  {/* Center data dots */}
                  {[20,34,48,62,76].map(x =>
                    [20,34,48,62,76].map(y =>
                      Math.random() > 0.5 ? <rect key={`${x}-${y}`} x={x} y={y} width="10" height="10" fill="#111" rx="1"/> : null
                    )
                  )}
                </svg>
                <div className="text-[10px] text-gray-400 text-center">
                  Use GoPay, OVO, Dana, ShopeePay,<br/>or any m-banking app
                </div>
              </div>
            )}

            {/* Bank Transfer */}
            {method === 'bank' && (
              <div className="mt-4 rounded-xl bg-white/[0.03] border border-white/[0.05] p-4 space-y-3">
                <div className="text-gray-400 text-xs font-semibold">{BANK_DETAILS.bank}</div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Virtual Account Number</div>
                  <div className="font-mono text-white font-bold text-lg tracking-widest">{BANK_DETAILS.number}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Account Name</div>
                  <div className="text-white text-sm font-medium">{BANK_DETAILS.name}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Amount</div>
                  <div className="text-f1-red font-bold">{formatPrice(booking.totalPrice)}</div>
                </div>
              </div>
            )}

            {/* Card */}
            {method === 'card' && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Card Number</label>
                  <input
                    value={cardNum}
                    onChange={(e) => setCardNum(formatCardNum(e.target.value))}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3 text-white font-mono text-sm placeholder-gray-700 focus:outline-none focus:border-f1-red/40 transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Expiry</label>
                    <input
                      value={cardExp}
                      onChange={(e) => setCardExp(formatExp(e.target.value))}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3 text-white font-mono text-sm placeholder-gray-700 focus:outline-none focus:border-f1-red/40 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">CVV</label>
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
                <div className="flex items-center gap-2 text-[10px] text-gray-600">
                  🔒 Your card data is encrypted and not stored
                </div>
              </div>
            )}

            {/* Pay Button */}
            <button
              onClick={handlePay}
              disabled={expired}
              id="payment-pay-btn"
              className={`w-full mt-5 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 ${
                expired
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-f1-red hover:bg-red-600 text-white hover:shadow-lg hover:shadow-red-900/30 hover:scale-[1.01] active:scale-[0.99]'
              }`}
            >
              {expired ? 'Payment Expired' : `Pay ${formatPrice(booking.totalPrice)}`}
            </button>

            <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-gray-700">
              <span>🔒 SSL Secured</span>
              <span>·</span>
              <span>🏦 PCI DSS Compliant</span>
              <span>·</span>
              <span>✅ 256-bit Encryption</span>
            </div>
          </div>
        )}

        {/* ── Step: Processing ── */}
        {step === 'processing' && (
          <div className="px-6 py-12 flex flex-col items-center gap-5 text-center">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-white/[0.05]" />
              <div className="absolute inset-0 rounded-full border-4 border-t-f1-red animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-2xl">💳</div>
            </div>
            <div>
              <div className="text-white font-bold text-lg">Processing Payment</div>
              <div className="text-gray-400 text-sm mt-1">Please do not close this window...</div>
            </div>
            <div className="flex gap-1.5 mt-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-f1-red rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Step: Success ── */}
        {step === 'success' && (
          <div className="px-6 py-10 flex flex-col items-center gap-4 text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <span className="text-4xl">✅</span>
            </div>
            <div>
              <div className="text-white font-bold text-xl">Payment Successful!</div>
              <div className="text-gray-400 text-sm mt-1">Your ticket has been confirmed</div>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-4 w-full text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Booking Code</span>
                <span className="font-mono text-f1-red font-bold">{booking.bookingCode}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount Paid</span>
                <span className="text-white font-bold">{formatPrice(booking.totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span className="text-green-400 font-semibold">CONFIRMED ✓</span>
              </div>
            </div>
            <button
              onClick={() => { onSuccess?.(); onClose() }}
              id="payment-success-btn"
              className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-green-900/30 mt-2"
            >
              View My Ticket →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
