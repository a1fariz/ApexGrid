import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import LoadingSpinner from '../components/LoadingSpinner'
import PageTransition from '../components/PageTransition'
import ConfirmModal from '../components/ConfirmModal'
import { showToast } from '../components/Toast'
import api from '../services/api'
import { FaBolt, FaSearch, FaUsers, FaCheck, FaHourglassHalf, FaKey, FaShieldAlt } from 'react-icons/fa'

export default function AdminUserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearch(searchInput)
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchInput])
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  // Actions states

  const [roleChangeTarget, setRoleChangeTarget] = useState(null)
  const [newRole, setNewRole] = useState('USER')
  const [updatingRole, setUpdatingRole] = useState(false)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('page', page)
      params.append('size', 10)
      if (search) {
        params.append('search', search)
      }
      const res = await api.get(`/users?${params.toString()}`)
      
      setUsers(res.data.content || [])
      setTotalPages(res.data.totalPages || 0)
      setTotalElements(res.data.totalElements || 0)
    } catch (err) {
      showToast('Failed to load users', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, search])

  const toggleUserStatus = async (userId, currentRole) => {
    if (currentRole === 'ADMIN') {
      showToast('Cannot modify ADMIN account status', 'error')
      return
    }
    
    try {
      const res = await api.put(`/users/${userId}/status`)
      showToast(res.data.message || 'Status updated successfully', 'success')
      fetchUsers()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update user status', 'error')
    }
  }


  const handleChangeRole = async () => {
    if (!roleChangeTarget) return
    setUpdatingRole(true)
    try {
      const res = await api.put(`/users/${roleChangeTarget.id}/role`, { newRole })
      showToast(res.data.message || `Role updated successfully`, 'success')
      setRoleChangeTarget(null)
      fetchUsers()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update role', 'error')
    } finally {
      setUpdatingRole(false)
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
                User Management
                <span className="px-3 py-1 bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-bold rounded-full flex items-center gap-1">
                  <FaBolt /> ADMIN
                </span>
              </h1>
              <p className="text-f1-light mt-2">Manage customer accounts, monitor activity, and handle suspensions.</p>
            </div>
            
            <div className="bg-f1-surface border border-f1-border rounded-lg px-4 py-3 flex items-center gap-4 shrink-0">
              <div className="text-center">
                <div className="text-2xl font-bold text-f1-white">{totalElements}</div>
                <div className="text-[10px] text-f1-light uppercase tracking-wider font-semibold">Total Accounts</div>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="card-static p-4 mb-6 rounded-xl border border-f1-border">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-f1-light text-sm"><FaSearch /></span>
              <input
                type="text"
                placeholder="Search users by username, name, or email..."
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); setPage(0); }}
                className="form-input pl-10 w-full"
              />
            </div>
          </div>

          <div className="card overflow-hidden">
            {loading ? (
              <div className="py-24 flex justify-center">
                <LoadingSpinner size="lg" text="Loading users database..." />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-16 text-f1-light">
                <FaUsers className="text-4xl mb-3 text-f1-light mx-auto" />
                <p>No users found</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
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
                              <span className="text-green-400 text-sm flex items-center gap-1"><FaCheck /> Yes</span>
                            ) : (
                              <span className="text-amber-400 text-sm flex items-center gap-1"><FaHourglassHalf /> No</span>
                            )}
                          </td>
                          <td className="text-sm text-f1-light">{formatDate(u.createdAt)}</td>
                          <td className="text-right">
                            <div className="flex justify-end items-center gap-2">
                              {u.role !== 'ADMIN' && (
                                <>
                                  <button
                                    onClick={() => { setRoleChangeTarget(u); setNewRole(u.role); }}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-gray-300 transition-colors border border-white/10"
                                  >
                                    Change Role
                                  </button>

                                  <button
                                    onClick={() => toggleUserStatus(u.id, u.role)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                      u.isActive 
                                        ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20' 
                                        : 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20'
                                    }`}
                                  >
                                    {u.isActive ? 'Suspend' : 'Activate'}
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card List View */}
                <div className="flex flex-col gap-4 md:hidden p-4">
                  {users.map(u => (
                    <div 
                      key={u.id} 
                      className={`card-static p-5 rounded-xl border border-f1-border flex flex-col gap-4 bg-f1-card/40 ${!u.isActive ? 'border-red-500/20 bg-red-950/5' : ''}`}
                    >
                      {/* Top Header Row of Card */}
                      <div className="flex items-center justify-between border-b border-f1-border/40 pb-3">
                        <span className="text-f1-light text-xs font-semibold">User #{u.id}</span>
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-green-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-red-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> Suspended
                          </span>
                        )}
                      </div>

                      {/* Main User Profile Row */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-f1-surface border border-f1-border flex items-center justify-center text-sm font-bold text-f1-white select-none shrink-0 uppercase">
                          {u.fullName ? u.fullName.slice(0, 2) : u.username.slice(0, 2)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-f1-white text-base truncate">{u.fullName || u.username}</h3>
                          <p className="text-xs text-f1-light truncate">@{u.username}</p>
                          <p className="text-xs text-f1-light truncate mt-0.5">{u.email}</p>
                        </div>
                      </div>

                      {/* Details (Role, Verified, Date) */}
                      <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs border-t border-f1-border/40 pt-3">
                        <div>
                          <div className="text-[10px] text-f1-light uppercase tracking-wider font-semibold mb-1">Role</div>
                          <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full ${u.role === 'ADMIN' ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' : 'bg-f1-surface text-f1-light border border-f1-border'}`}>
                            {u.role}
                          </span>
                        </div>
                        <div>
                          <div className="text-[10px] text-f1-light uppercase tracking-wider font-semibold mb-1">Verified</div>
                          {u.isVerified ? (
                            <span className="text-green-400 text-xs flex items-center gap-1 font-semibold"><FaCheck className="text-2xs" /> Yes</span>
                          ) : (
                            <span className="text-amber-400 text-xs flex items-center gap-1 font-semibold"><FaHourglassHalf className="text-2xs" /> No</span>
                          )}
                        </div>
                        <div className="col-span-2">
                          <div className="text-[10px] text-f1-light uppercase tracking-wider font-semibold mb-0.5">Joined Date</div>
                          <span className="text-f1-white text-xs">{formatDate(u.createdAt)}</span>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      {u.role !== 'ADMIN' && (
                        <div className="flex items-center gap-2 border-t border-f1-border/40 pt-3 mt-1">
                          <button
                            onClick={() => { setRoleChangeTarget(u); setNewRole(u.role); }}
                            className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 transition-colors border border-white/10 text-center"
                          >
                            Change Role
                          </button>

                          <button
                            onClick={() => toggleUserStatus(u.id, u.role)}
                            className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors text-center ${
                              u.isActive 
                                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20' 
                                : 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20'
                            }`}
                          >
                            {u.isActive ? 'Suspend' : 'Activate'}
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


        {/* Change Role Modal */}
        {roleChangeTarget && (
          <ConfirmModal
            isOpen={!!roleChangeTarget}
            title="Change User Role"
            message={`Select a new system privilege level for user @${roleChangeTarget.username}.`}
            icon={<FaShieldAlt className="text-3xl text-blue-500" />}
            confirmText="Update Privilege"
            confirmColor="green"
            loading={updatingRole}
            onConfirm={handleChangeRole}
            onCancel={() => setRoleChangeTarget(null)}
          >
            <div className="w-full mt-4">
              <label className="block text-xs text-left font-semibold text-f1-light mb-1.5">
                System Role Privilege:
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="form-input text-sm py-2 px-3 border border-f1-border"
              >
                <option value="USER">USER (Standard Customer)</option>
                <option value="ADMIN">ADMIN (Full System Access)</option>
              </select>
            </div>
          </ConfirmModal>
        )}
      </div>
    </PageTransition>
  )
}
