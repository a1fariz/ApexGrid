import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { createPortal } from 'react-dom'
import Navbar from '../components/Navbar'
import LoadingSpinner from '../components/LoadingSpinner'
import PageTransition from '../components/PageTransition'
import ConfirmModal from '../components/ConfirmModal'
import { showToast } from '../components/Toast'
import api from '../services/api'
import { FaTimes, FaTrash } from 'react-icons/fa'

const EMPTY_FORM = {
  name: '', circuitId: '', raceDate: '', raceTime: '',
  season: 2026, round: '', totalQuota: 1000, ticketPrice: '',
  description: '', status: 'UPCOMING', imageUrl: '',
}

export default function AdminRaceManagement() {
  const [races, setRaces] = useState([])
  const [circuits, setCircuits] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fetchData = async () => {
    try {
      const [racesRes, circuitsRes] = await Promise.all([
        api.get('/races'),
        api.get('/races/circuits'),
      ])
      setRaces(racesRes.data)
      setCircuits(circuitsRes.data)
    } catch (err) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [showModal])

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setEditing(null)
    setShowModal(true)
    setError('')
  }

  const openEdit = (race) => {
    setForm({
      name: race.name,
      circuitId: circuits.find(c => c.name === race.circuitName)?.id || '',
      raceDate: race.raceDate ? race.raceDate.slice(0, 16) : '',
      raceTime: race.raceTime || '',
      season: race.season,
      round: race.round || '',
      totalQuota: race.totalQuota,
      ticketPrice: race.ticketPrice,
      description: race.description || '',
      status: race.status,
      imageUrl: race.imageUrl || '',
    })
    setEditing(race)
    setShowModal(true)
    setError('')
  }


  const handleDelete = async (race) => {
    setDeleteTarget(null)
    try {
      await api.delete(`/races/${race.id}`)
      showToast(`Race "${race.name}" deleted successfully`, 'success')
      fetchData()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete race', 'error')
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        circuitId: parseInt(form.circuitId),
        season: parseInt(form.season),
        round: form.round ? parseInt(form.round) : null,
        totalQuota: parseInt(form.totalQuota),
        ticketPrice: parseFloat(form.ticketPrice),
        raceDate: form.raceDate ? new Date(form.raceDate).toISOString().slice(0, 19) : null,
      }

      if (editing) {
        await api.put(`/races/${editing.id}`, payload)
        showToast('Race updated successfully', 'success')
      } else {
        await api.post('/races', payload)
        showToast('Race created successfully', 'success')
      }
      setShowModal(false)
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save race')
      showToast(err.response?.data?.message || 'Failed to save race', 'error')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price)
  }

  return (
    <PageTransition>
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link to="/admin" className="text-f1-light hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div className="f1-stripe" />
            </div>
            <h1 className="text-3xl font-bold text-white">Race Management</h1>
            <p className="text-gray-400 mt-1">{races.length} races in the system</p>
          </div>
          <button onClick={openCreate} id="add-race-btn" className="btn-primary">
            + Add New Race
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <LoadingSpinner size="lg" text="Loading races..." />
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Race</th>
                    <th>Circuit</th>
                    <th>Date</th>
                    <th>Quota</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {races.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center text-gray-500 py-12">No races found</td>
                    </tr>
                  ) : (
                    races.map((race) => (
                      <tr key={race.id}>
                        <td>
                          <div className="font-semibold text-white">{race.name}</div>
                          <div className="text-xs text-gray-500">Round {race.round} · {race.season}</div>
                        </td>
                        <td>
                          <div>{race.circuitName}</div>
                          <div className="text-xs text-gray-500">{race.location}, {race.country}</div>
                        </td>
                        <td className="text-sm">{formatDate(race.raceDate)}</td>
                        <td>
                          <div className="text-sm font-semibold text-white">
                            {race.availableQuota} left
                          </div>
                          <div className="text-xs text-gray-400">
                            {race.totalQuota - race.availableQuota} sold / {race.totalQuota} total
                          </div>
                          <div className="w-24 h-1.5 bg-gray-700 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                race.availableQuota === 0 ? 'bg-red-500' :
                                race.availableQuota <= race.totalQuota * 0.1 ? 'bg-amber-400' : 'bg-f1-green'
                              }`}
                              style={{ width: `${Math.round((race.availableQuota / race.totalQuota) * 100)}%` }}
                            />
                          </div>
                          {/* Ticket Status Badge */}
                          <div className="mt-1">
                            {race.availableQuota === 0 ? (
                              <span className="px-1.5 py-0.5 bg-red-500/10 border border-red-500/25 text-red-500 text-[10px] font-bold rounded">SOLD OUT</span>
                            ) : race.availableQuota <= race.totalQuota * 0.1 ? (
                              <span className="px-1.5 py-0.5 bg-amber-400/10 border border-amber-400/25 text-amber-400 text-[10px] font-bold rounded">LOW STOCK</span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-green-500/10 border border-green-500/25 text-green-500 text-[10px] font-bold rounded text-f1-green">AVAILABLE</span>
                            )}
                          </div>
                        </td>
                        <td className="font-semibold text-f1-red">{formatPrice(race.ticketPrice)}</td>
                        <td>
                          <span className={
                            race.status === 'UPCOMING' ? 'badge-upcoming' :
                            race.status === 'LIVE' ? 'badge-confirmed' : 'badge-cancelled'
                          }>
                            {race.status}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEdit(race)}
                              id={`edit-race-${race.id}`}
                              className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 font-medium transition-colors border border-white/10"
                            >
                              Edit
                            </button>
                            <button
                            onClick={() => setDeleteTarget(race)}
                              id={`delete-race-${race.id}`}
                              className="px-3 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 font-medium transition-colors border border-red-500/20"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
             style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="glass-card w-full max-w-3xl flex flex-col animate-fade-in overflow-hidden shadow-2xl border border-white/10 relative max-h-[90dvh] sm:max-h-[85vh]">
            
            <div className="flex items-center justify-between p-6 sm:px-8 sm:py-6 border-b border-white/10 shrink-0 bg-white/[0.02]">
              <h2 className="text-2xl font-bold text-f1-white tracking-tight">
                {editing ? 'Edit Race Details' : 'Add New Race'}
              </h2>
              <button type="button" onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-f1-red text-f1-light hover:text-white transition-all">
                <FaTimes />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto flex-1 custom-scrollbar">
              <form id="race-form" onSubmit={handleSave} className="space-y-6">
              {error && (
                <div className="px-4 py-3 rounded-lg bg-red-500/[0.08] border border-red-500/15 text-red-400 text-sm flex items-center gap-2.5">
                  <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="form-label">Race Name *</label>
                  <input id="race-name-input" className="form-input" required
                    value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="Italian Grand Prix 2026" />
                </div>

                <div>
                  <label className="form-label">Circuit *</label>
                  <select id="circuit-select" className="form-input" required
                    value={form.circuitId} onChange={e => setForm({...form, circuitId: e.target.value})}>
                    <option value="">Select circuit...</option>
                    {circuits.map(c => (
                      <option key={c.id} value={c.id}>{c.name} — {c.country}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Status</label>
                  <select id="status-select" className="form-input"
                    value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="LIVE">LIVE</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Race Date & Time *</label>
                  <input id="race-date-input" type="datetime-local" className="form-input" required
                    value={form.raceDate} onChange={e => setForm({...form, raceDate: e.target.value})} />
                </div>

                <div>
                  <label className="form-label">Season *</label>
                  <input id="season-input" type="number" className="form-input" required min="2020" max="2030"
                    value={form.season} onChange={e => setForm({...form, season: e.target.value})} />
                </div>

                <div>
                  <label className="form-label">Round Number</label>
                  <input id="round-input" type="number" className="form-input" min="1"
                    value={form.round} onChange={e => setForm({...form, round: e.target.value})}
                    placeholder="e.g. 14" />
                </div>

                <div>
                  <label className="form-label">Total Quota *</label>
                  <input id="quota-input" type="number" className="form-input" required min="1"
                    value={form.totalQuota} onChange={e => setForm({...form, totalQuota: e.target.value})} />
                </div>

                <div>
                  <label className="form-label">Ticket Price (USD) *</label>
                  <input id="price-input" type="number" className="form-input" required min="0" step="0.01"
                    value={form.ticketPrice} onChange={e => setForm({...form, ticketPrice: e.target.value})}
                    placeholder="299.99" />
                </div>

                <div className="md:col-span-2">
                  <label className="form-label">Description</label>
                  <textarea id="description-input" className="form-input min-h-[80px] resize-y"
                    value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                    placeholder="Race description..." />
                </div>

                <div className="md:col-span-2">
                  <label className="form-label">Image URL</label>
                  <input id="image-url-input" type="url" className="form-input"
                    value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})}
                    placeholder="https://..." />
                </div>
              </div>

              </form>
            </div>

            <div className="p-6 sm:px-8 sm:py-6 border-t border-white/10 shrink-0 flex items-center justify-end gap-4 bg-white/[0.02]">
              <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 rounded-lg text-f1-light hover:text-f1-white hover:bg-f1-surface transition-colors font-medium text-sm">
                Cancel
              </button>
              <button type="submit" form="race-form" id="save-race-btn" disabled={saving} className="btn-primary min-w-[160px] py-2.5 shadow-lg shadow-red-900/20">
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin-f1" />
                    Saving...
                  </span>
                ) : (
                  editing ? 'Update Race' : 'Create Race'
                )}
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Race"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        icon="trash"
        confirmText="Yes, Delete"
        confirmColor="red"
        onConfirm={() => handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
    </PageTransition>
  )
}
