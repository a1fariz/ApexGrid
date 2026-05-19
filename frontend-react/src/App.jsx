import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'
import { Toast } from './components/Toast'

import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import RaceDetail from './pages/RaceDetail'
import BookingHistory from './pages/BookingHistory'
import AdminDashboard from './pages/AdminDashboard'
import AdminRaceManagement from './pages/AdminRaceManagement'

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-f1-black text-white">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
        </Routes>
        <Toast />
      </div>
    </AuthProvider>
  )
}

export default App
