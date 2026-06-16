import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'
import { Toast } from './components/Toast'

import Login from './pages/Login'
import Register from './pages/Register'
import VerifyAccount from './pages/VerifyAccount'
import Home from './pages/Home'
import RaceDetail from './pages/RaceDetail'
import BookingHistory from './pages/BookingHistory'
import UserProfile from './pages/UserProfile'
import AdminDashboard from './pages/AdminDashboard'
import AdminRaceManagement from './pages/AdminRaceManagement'
import AdminCircuitManagement from './pages/AdminCircuitManagement'
import AdminUserManagement from './pages/AdminUserManagement'

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-f1-black text-f1-white">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<VerifyAccount />} />
          <Route path="/race/:id" element={<RaceDetail />} />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <BookingHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/races"
            element={
              <AdminRoute>
                <AdminRaceManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/circuits"
            element={
              <AdminRoute>
                <AdminCircuitManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUserManagement />
              </AdminRoute>
            }
          />
        </Routes>
        <Toast />
      </div>
    </AuthProvider>
  )
}

export default App
