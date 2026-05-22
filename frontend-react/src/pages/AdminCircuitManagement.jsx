import { useState, useEffect } from 'react'
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
      } else {
        await api.post('/circuits', payload)
      }
      setShowModal(false)
      fetchCircuits()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save circuit')
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="f1-stripe mb-3" />
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
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-xl font-semibold text-white">
                {editing ? 'Edit Circuit' : 'Add New Circuit'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white text-2xl leading-none">
                ×
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && (
                <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  ⚠️ {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 btn-primary py-3">
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin-f1" />
                      Saving...
                    </span>
                  ) : (
                    editing ? 'Update Circuit' : 'Create Circuit'
                  )}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary py-3">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
