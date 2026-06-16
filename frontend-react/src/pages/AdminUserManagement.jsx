import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import LoadingSpinner from '../components/LoadingSpinner'
import PageTransition from '../components/PageTransition'
import { showToast } from '../components/Toast'
import api from '../services/api'

export default function AdminUserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users')
      setUsers(res.data)
    } catch (err) {
      showToast('Failed to load users', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const toggleUserStatus = async (userId, currentRole) => {
    if (currentRole === 'ADMIN') {
      showToast('Cannot modify ADMIN account status', 'error')
      return
    }
    
    try {
      const res = await api.put(`/users/${userId}/status`)
      showToast(res.data.message, 'success')
      fetchUsers()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update user status', 'error')
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-f1-black text-f1-white">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 py-10">
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
              <h1 className="text-3xl font-bold text-f1-white flex items-center gap-3">
                User Management
                <span className="px-3 py-1 bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-semibold rounded-full">
                  ⚡ ADMIN
                </span>
              </h1>
              <p className="text-f1-light mt-2">Manage customer accounts, monitor activity, and handle suspensions.</p>
            </div>
            
            <div className="bg-f1-surface border border-f1-border rounded-xl px-4 py-3 flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-f1-white">{users.length}</div>
                <div className="text-[10px] text-f1-light uppercase tracking-wider">Total Users</div>
              </div>
              <div className="w-px h-8 bg-f1-border"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{users.filter(u => u.isActive && u.role !== 'ADMIN').length}</div>
                <div className="text-[10px] text-f1-light uppercase tracking-wider">Active</div>
              </div>
              <div className="w-px h-8 bg-f1-border"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{users.filter(u => !u.isActive).length}</div>
                <div className="text-[10px] text-f1-light uppercase tracking-wider">Suspended</div>
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            {loading ? (
              <div className="py-24 flex justify-center">
                <LoadingSpinner size="lg" text="Loading users database..." />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-16 text-f1-light">
                <div className="text-4xl mb-3">👥</div>
                <p>No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th className="w-12">ID</th>
                      <th>User Info</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Verified</th>
                      <th>Joined Date</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-f1-border/40">
                    {users.map(u => (
                      <tr key={u.id} className={!u.isActive ? 'bg-red-900/5' : ''}>
                        <td className="text-f1-light text-sm">#{u.id}</td>
                        <td>
                          <div className="font-semibold text-f1-white">{u.fullName || u.username}</div>
                          <div className="text-xs text-f1-light">@{u.username} • {u.email}</div>
                        </td>
                        <td>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${u.role === 'ADMIN' ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' : 'bg-f1-surface text-f1-light border border-f1-border'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          {u.isActive ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-green-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs text-red-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> Suspended
                            </span>
                          )}
                        </td>
                        <td>
                          {u.isVerified ? (
                            <span className="text-green-400 text-sm">✓ Yes</span>
                          ) : (
                            <span className="text-amber-400 text-sm">⏳ No</span>
                          )}
                        </td>
                        <td className="text-sm text-f1-light">{formatDate(u.createdAt)}</td>
                        <td className="text-right">
                          {u.role !== 'ADMIN' && (
                            <button
                              onClick={() => toggleUserStatus(u.id, u.role)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                u.isActive 
                                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20' 
                                  : 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20'
                              }`}
                            >
                              {u.isActive ? 'Suspend User' : 'Activate User'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
