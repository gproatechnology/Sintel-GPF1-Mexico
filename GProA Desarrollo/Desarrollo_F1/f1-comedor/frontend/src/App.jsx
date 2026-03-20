import { Suspense, lazy, useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import { AnimatePresence } from 'framer-motion'
import Splashscreen from '@/components/Splashscreen'

const Login = lazy(() => import('@/pages/Login'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const AccessControl = lazy(() => import('@/pages/AccessControl/AccessControl'))
const Monitor = lazy(() => import('@/pages/Monitor'))
const MyConsumptions = lazy(() => import('@/pages/MyConsumptions'))
const Admin = lazy(() => import('@/pages/Admin'))

function App() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const [showSplash, setShowSplash] = useState(true)

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location])

  // Show splashscreen during initial load
  if (showSplash && loading) {
    return <Splashscreen onComplete={() => setShowSplash(false)} />
  }

  return (
    <>
      {showSplash && <Splashscreen onComplete={() => setShowSplash(false)} />}
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0A192F]">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#E10600]"></div>
        </div>
      }>
        <AnimatePresence>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/scanner" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'CASHIER']}>
                <AccessControl />
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
        </AnimatePresence>
      </Suspense>
    </>
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
