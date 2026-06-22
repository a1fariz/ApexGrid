import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import LoadingSpinner from '../components/LoadingSpinner'
import PageTransition from '../components/PageTransition'
import ConfirmModal from '../components/ConfirmModal'
import { showToast } from '../components/Toast'
import api from '../services/api'
import { FaBolt, FaTicketAlt, FaCheck } from 'react-icons/fa'

export default function AdminBookingManagement() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelReason, setCancelReason] = useState('Cancelled by administrator')
  const [cancelling, setCancelling] = useState(false)

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('page', page)
      params.append('size', 15)
      if (statusFilter) {
        params.append('status', statusFilter)
      }
      
      const res = await api.get(`/bookings/admin?${params.toString()}`)
      setBookings(res.data.content || [])
      setTotalPages(res.data.totalPages || 0)
      setTotalElements(res.data.totalElements || 0)
    } catch (err) {
      showToast('Failed to load bookings database', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [page, statusFilter])

  const handleCancelBooking = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await api.put(`/bookings/admin/${cancelTarget.id}/cancel`, { reason: cancelReason })
      showToast(`Booking ${cancelTarget.bookingCode} cancelled successfully`, 'success')
      setCancelTarget(null)
      setCancelReason('Cancelled by administrator')
      fetchBookings()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel booking', 'error')
    } finally {
      setCancelling(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
  }

  const getStatusBadge = (status) => {
    const map = {
      CONFIRMED: 'badge-confirmed',
      PENDING: 'badge-pending',
      CANCELLED: 'badge-cancelled',
    }
    return map[status] || 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-f1-black text-f1-white">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 py-10">
          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link to="/admin" className="text-f1-light hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </Link>
                <div className="f1-stripe" />
              </div>
              <h1 className="text-3xl font-bold text-f1-white flex items-center gap-3">
                Booking Management
                <span className="px-3 py-1 bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-bold rounded-full flex items-center gap-1">
                  <FaBolt /> ADMIN
                </span>
              </h1>
              <p className="text-f1-light mt-2">Monitor tickets sales, view order details, and administratively cancel bookings.</p>
            </div>

            <div className="bg-f1-surface border border-f1-border rounded-xl px-4 py-3 flex items-center gap-4 shrink-0">
              <div className="text-center">
                <div className="text-2xl font-bold text-f1-white">{totalElements}</div>
                <div className="text-[10px] text-f1-light uppercase tracking-wider font-semibold">Total Orders</div>
              </div>
            </div>
          </div>

          {/* Filtering Bar */}
          <div className="card-static p-4 mb-6 rounded-2xl border border-f1-border flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold text-f1-light uppercase tracking-wider mr-2">Filter by Status:</span>
            {[
              { label: 'All Bookings', value: '' },
              { label: 'Pending Payment', value: 'PENDING' },
              { label: 'Confirmed (Paid)', value: 'CONFIRMED' },
              { label: 'Cancelled', value: 'CANCELLED' }
            ].map(tab => (
              <button
                key={tab.label}
                onClick={() => { setStatusFilter(tab.value); setPage(0); }}
                className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all duration-300 ${
                  statusFilter === tab.value
                    ? 'bg-f1-red border-f1-red text-white shadow-lg shadow-red-900/20'
                    : 'bg-f1-surface border-f1-border text-f1-light hover:text-f1-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Booking Data Grid */}
          <div className="card overflow-hidden">
            {loading ? (
              <div className="py-24 flex justify-center">
                <LoadingSpinner size="lg" text="Loading bookings records..." />
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-20 text-f1-light">
                <FaTicketAlt className="text-5xl mb-4 text-f1-light mx-auto" />
                <h3 className="text-lg font-bold text-f1-white mb-1">No Bookings Found</h3>
                <p className="text-xs">There are no bookings matching the selected status filter.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="data-table w-full">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Customer</th>
                        <th>Race details</th>
                        <th>Zone</th>
                        <th>Qty</th>
                        <th>Total Price</th>
                        <th>Status</th>
                        <th>Date Booked</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-f1-border/40">
                      {bookings.map(b => (
                        <tr key={b.id}>
                          <td className="font-mono text-xs font-bold text-f1-red">{b.bookingCode}</td>
                          <td>
                            <div className="font-semibold text-white">{b.userFullName || 'ApexGrid Customer'}</div>
                            <div className="text-xs text-f1-light">@{b.username || 'unknown'} · {b.userEmail || 'no email'}</div>
                          </td>
                          <td>
                            <div className="font-semibold text-white">{b.raceName}</div>
                            <div className="text-xs text-f1-light truncate max-w-[200px]">{b.circuitName} · {b.location}</div>
                          </td>
                          <td className="font-bold text-xs">{b.zone}</td>
                          <td className="text-center font-medium">{b.quantity}</td>
                          <td className="font-semibold text-f1-red text-sm">{formatPrice(b.totalPrice)}</td>
                          <td>
                            <span className={`${getStatusBadge(b.status)} px-2.5 py-0.5 rounded-full text-xs font-semibold`}>
                              {b.status}
                            </span>
                            {b.status === 'CONFIRMED' && b.scannedAt && (
                              <span className="flex items-center gap-1 mt-1 text-[10px] text-green-400 font-bold uppercase tracking-wider">
                                <FaCheck /> Scanned
                              </span>
                            )}
                          </td>
                          <td className="text-xs text-f1-light">{formatDate(b.createdAt)}</td>
                          <td className="text-right">
                            {b.status !== 'CANCELLED' ? (
                              <button
                                onClick={() => setCancelTarget(b)}
                                className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg border border-red-500/10 transition-colors"
                              >
                                Force Cancel
                              </button>
                            ) : (
                              <span className="text-xs text-gray-600 font-medium">No actions</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card List View */}
                <div className="flex flex-col gap-4 md:hidden p-4">
                  {bookings.map(b => (
                    <div 
                      key={b.id} 
                      className={`card-static p-5 rounded-xl border border-f1-border flex flex-col gap-4 bg-f1-card/40 ${b.status === 'CANCELLED' ? 'opacity-70 bg-black/20' : ''}`}
                    >
                      {/* Top Header Row of Card */}
                      <div className="flex items-center justify-between border-b border-f1-border/40 pb-3">
                        <span className="font-mono text-xs font-bold text-f1-red">{b.bookingCode}</span>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`${getStatusBadge(b.status)} px-2.5 py-0.5 rounded-full text-[10px] font-bold`}>
                            {b.status}
                          </span>
                          {b.status === 'CONFIRMED' && b.scannedAt && (
                            <span className="flex items-center gap-1 text-[9px] text-green-400 font-bold uppercase tracking-wider">
                              <FaCheck /> Scanned
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Customer Details */}
                      <div>
                        <div className="text-[10px] text-f1-light uppercase tracking-wider font-semibold mb-1">Customer</div>
                        <h4 className="font-semibold text-f1-white text-sm">{b.userFullName || 'ApexGrid Customer'}</h4>
                        <p className="text-xs text-f1-light truncate">@{b.username || 'unknown'} · {b.userEmail || 'no email'}</p>
                      </div>

                      {/* Race Details */}
                      <div>
                        <div className="text-[10px] text-f1-light uppercase tracking-wider font-semibold mb-1">Race Event</div>
                        <h4 className="font-semibold text-f1-white text-sm">{b.raceName}</h4>
                        <p className="text-xs text-f1-light truncate">{b.circuitName} · {b.location}</p>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs border-t border-f1-border/40 pt-3">
                        <div>
                          <div className="text-[10px] text-f1-light uppercase tracking-wider font-semibold mb-0.5">Zone & Qty</div>
                          <span className="text-f1-white font-medium">{b.zone} (x{b.quantity})</span>
                        </div>
                        <div>
                          <div className="text-[10px] text-f1-light uppercase tracking-wider font-semibold mb-0.5">Total Price</div>
                          <span className="text-f1-red font-bold text-sm">{formatPrice(b.totalPrice)}</span>
                        </div>
                        <div className="col-span-2">
                          <div className="text-[10px] text-f1-light uppercase tracking-wider font-semibold mb-0.5">Booked Date</div>
                          <span className="text-f1-white">{formatDate(b.createdAt)}</span>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      {b.status !== 'CANCELLED' && (
                        <div className="border-t border-f1-border/40 pt-3 mt-1">
                          <button
                            onClick={() => setCancelTarget(b)}
                            className="w-full px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg border border-red-500/20 transition-colors text-center"
                          >
                            Force Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Pagination Controls */}
          {(() => {
            const renderPageNumbers = () => {
              const pages = []
              const range = 1
              for (let i = 0; i < totalPages; i++) {
                if (i === 0 || i === totalPages - 1 || (i >= page - range && i <= page + range)) {
                  pages.push(i)
                } else if ((i === 1 && page - range > 1) || (i === totalPages - 2 && page + range < totalPages - 2)) {
                  pages.push('ellipsis')
                }
              }
              const uniquePages = pages.filter((item, index) => pages.indexOf(item) === index)
              return uniquePages.map((p, idx) => {
                if (p === 'ellipsis') {
                  return (
                    <span key={`ellipsis-${idx}`} className="px-2 text-f1-light text-xs font-semibold select-none">
                      ...
                    </span>
                  )
                }
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-xs font-medium border transition-all ${
                      page === p
                        ? 'bg-f1-red border-f1-red text-white shadow-lg shadow-red-900/20'
                        : 'bg-f1-surface border-f1-border text-f1-light hover:text-white'
                    }`}
                  >
                    {p + 1}
                  </button>
                )
              })
            }

            return !loading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-f1-surface text-f1-light hover:text-f1-white border border-f1-border disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                >
                  ← Previous
                </button>
                {renderPageNumbers()}
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-f1-surface text-f1-light hover:text-f1-white border border-f1-border disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                >
                  Next →
                </button>
              </div>
            )
          })()}
        </div>

        {/* Force Cancel Modal */}
        {cancelTarget && (
          <ConfirmModal
            isOpen={!!cancelTarget}
            title="Force Cancel Booking"
            message={`Are you sure you want to administratively cancel booking "${cancelTarget.bookingCode}" for user @${cancelTarget.username}?`}
            icon="warning"
            confirmText="Yes, Cancel"
            confirmColor="red"
            loading={cancelling}
            onConfirm={handleCancelBooking}
            onCancel={() => { setCancelTarget(null); setCancelReason('Cancelled by administrator'); }}
          >
            <div className="w-full mt-4">
              <label className="block text-xs text-left font-semibold text-f1-light mb-1.5">
                Reason for Cancellation:
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="form-input text-sm resize-none min-h-[70px] py-2 px-3 border border-f1-border"
                placeholder="Enter cancellation reason..."
                required
              />
            </div>
          </ConfirmModal>
        )}
      </div>
    </PageTransition>
  )
}
