import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Scanner from './pages/Scanner'
import Monitor from './pages/Monitor'
import MyConsumptions from './pages/MyConsumptions'
import Admin from './pages/Admin'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={getDefaultRoute(user.role)} /> : <Login />} />
      
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/scanner" element={
        <ProtectedRoute allowedRoles={['ADMIN', 'CASHIER']}>
          <Scanner />
        </ProtectedRoute>
      } />
      
      <Route path="/monitor" element={
        <ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR']}>
          <Monitor />
        </ProtectedRoute>
      } />
      
      <Route path="/mis-consumos" element={
        <ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR', 'CASHIER', 'EMPLOYEE']}>
          <MyConsumptions />
        </ProtectedRoute>
      } />
      
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <Admin />
        </ProtectedRoute>
      } />
      
      <Route path="/" element={<Navigate to={user ? getDefaultRoute(user.role) : '/login'} />} />
      <Route path="*" element={<Navigate to={user ? getDefaultRoute(user.role) : '/login'} />} />
    </Routes>
  )
}

function getDefaultRoute(role) {
  switch (role) {
    case 'ADMIN':
      return '/dashboard'
    case 'SUPERVISOR':
      return '/monitor'
    case 'CASHIER':
      return '/scanner'
    case 'EMPLOYEE':
      return '/mis-consumos'
    default:
      return '/login'
  }
}

export default App
