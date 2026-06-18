import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { createPortal } from 'react-dom'
import Navbar from '../components/Navbar'
import LoadingSpinner from '../components/LoadingSpinner'
import PageTransition from '../components/PageTransition'
import ConfirmModal from '../components/ConfirmModal'
import { showToast } from '../components/Toast'
import api from '../services/api'

const EMPTY_FORM = {
  name: '', location: '', country: '', lengthKm: '',
  numberOfLaps: '', lapRecord: '', lapRecordHolder: '',
  imageUrl: '', description: '',
}

export default function AdminCircuitManagement() {
  const [circuits, setCircuits] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fetchCircuits = async () => {
    try {
      const res = await api.get('/circuits')
      setCircuits(res.data)
    } catch (err) {
      setError('Failed to load circuits')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCircuits() }, [])

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

  const openEdit = (circuit) => {
    setForm({
      name: circuit.name || '',
      location: circuit.location || '',
      country: circuit.country || '',
      lengthKm: circuit.lengthKm || '',
      numberOfLaps: circuit.numberOfLaps || '',
      lapRecord: circuit.lapRecord || '',
      lapRecordHolder: circuit.lapRecordHolder || '',
      imageUrl: circuit.imageUrl || '',
      description: circuit.description || '',
    })
    setEditing(circuit)
    setShowModal(true)
    setError('')
  }

  const handleDelete = async (circuit) => {
    setDeleteTarget(null)
    try {
      await api.delete(`/circuits/${circuit.id}`)
      showToast(`Circuit "${circuit.name}" deleted successfully`, 'success')
      fetchCircuits()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete circuit', 'error')
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        lengthKm: form.lengthKm ? parseFloat(form.lengthKm) : null,
        numberOfLaps: form.numberOfLaps ? parseInt(form.numberOfLaps) : null,
      }
      if (editing) {
        await api.put(`/circuits/${editing.id}`, payload)
        showToast('Circuit updated successfully', 'success')
      } else {
        await api.post('/circuits', payload)
        showToast('Circuit created successfully', 'success')
      }
      setShowModal(false)
      fetchCircuits()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save circuit')
      showToast(err.response?.data?.message || 'Failed to save circuit', 'error')
    } finally {
      setSaving(false)
    }
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
            <h1 className="text-3xl font-bold text-white">Circuit Management</h1>
            <p className="text-gray-400 mt-1">{circuits.length} circuits in the system</p>
          </div>
          <button onClick={openCreate} id="add-circuit-btn" className="btn-primary">
            + Add New Circuit
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <LoadingSpinner size="lg" text="Loading circuits..." />
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Circuit</th>
                    <th>Location</th>
                    <th>Track Length</th>
                    <th>Laps</th>
                    <th>Lap Record</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {circuits.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center text-gray-500 py-12">No circuits found</td>
                    </tr>
                  ) : (
                    circuits.map((circuit) => (
                      <tr key={circuit.id}>
                        <td>
                          <div className="font-semibold text-white">{circuit.name}</div>
                          {circuit.description && (
                            <div className="text-xs text-gray-500 max-w-48 truncate">{circuit.description}</div>
                          )}
                        </td>
                        <td>
                          <div>{circuit.location}</div>
                          <div className="text-xs text-gray-500">{circuit.country}</div>
                        </td>
                        <td className="text-sm">{circuit.lengthKm ? `${circuit.lengthKm} km` : '—'}</td>
                        <td className="text-sm">{circuit.numberOfLaps || '—'}</td>
                        <td>
                          <div className="text-sm">{circuit.lapRecord || '—'}</div>
                          <div className="text-xs text-gray-500">{circuit.lapRecordHolder || ''}</div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEdit(circuit)}
                              className="px-3 py-1 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                            onClick={() => setDeleteTarget(circuit)}
                              className="px-3 py-1 text-xs bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
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
                {editing ? 'Edit Circuit Details' : 'Add New Circuit'}
              </h2>
              <button type="button" onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-f1-red text-f1-light hover:text-white transition-all">
                ✕
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto flex-1 custom-scrollbar">
              <form id="circuit-form" onSubmit={handleSave} className="space-y-6">
              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-500/[0.08] border border-red-500/15 text-red-400 text-sm flex items-center gap-2.5">
                  <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="form-label">Circuit Name *</label>
                  <input className="form-input" required
                    value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="Autodromo Nazionale di Monza" />
                </div>

                <div>
                  <label className="form-label">Location *</label>
                  <input className="form-input" required
                    value={form.location} onChange={e => setForm({...form, location: e.target.value})}
                    placeholder="Monza" />
                </div>

                <div>
                  <label className="form-label">Country *</label>
                  <input className="form-input" required
                    value={form.country} onChange={e => setForm({...form, country: e.target.value})}
                    placeholder="Italy" />
                </div>

                <div>
                  <label className="form-label">Track Length (km)</label>
                  <input type="number" step="0.001" className="form-input"
                    value={form.lengthKm} onChange={e => setForm({...form, lengthKm: e.target.value})}
                    placeholder="5.793" />
                </div>

                <div>
                  <label className="form-label">Number of Laps</label>
                  <input type="number" min="1" className="form-input"
                    value={form.numberOfLaps} onChange={e => setForm({...form, numberOfLaps: e.target.value})}
                    placeholder="53" />
                </div>

                <div>
                  <label className="form-label">Lap Record</label>
                  <input className="form-input"
                    value={form.lapRecord} onChange={e => setForm({...form, lapRecord: e.target.value})}
                    placeholder="1:21.046" />
                </div>

                <div>
                  <label className="form-label">Lap Record Holder</label>
                  <input className="form-input"
                    value={form.lapRecordHolder} onChange={e => setForm({...form, lapRecordHolder: e.target.value})}
                    placeholder="Rubens Barrichello" />
                </div>

                <div className="md:col-span-2">
                  <label className="form-label">Description</label>
                  <textarea className="form-input min-h-[80px] resize-y"
                    value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                    placeholder="Circuit description..." />
                </div>

                <div className="md:col-span-2">
                  <label className="form-label">Image URL</label>
                  <input type="url" className="form-input"
                    value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})}
                    placeholder="https://..." />
                </div>
              </div>

              </form>
            </div>

            <div className="p-6 sm:px-8 sm:py-6 border-t border-white/10 shrink-0 flex items-center justify-end gap-4 bg-white/[0.02]">
              <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 rounded-xl text-f1-light hover:text-white hover:bg-white/5 transition-colors font-semibold">
                Cancel
              </button>
              <button type="submit" form="circuit-form" disabled={saving} className="btn-primary min-w-[160px] py-2.5 shadow-lg shadow-red-900/20">
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin-f1" />
                    Saving...
                  </span>
                ) : (
                  editing ? 'Update Circuit' : 'Create Circuit'
                )}
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Circuit"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        icon="🗑️"
        confirmText="Yes, Delete"
        confirmColor="red"
        onConfirm={() => handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
    </PageTransition>
  )
}
