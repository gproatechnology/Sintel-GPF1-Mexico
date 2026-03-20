import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!username || !password) {
      toast.error('Por favor ingresa usuario y contraseña')
      return
    }

    setLoading(true)
    const result = await login(username, password)
    setLoading(false)

    if (result.success) {
      toast.success(`Bienvenido, ${result.user.username}!`)

      // Redirect based on role
      switch (result.user.role) {
        case 'ADMIN':
          navigate('/dashboard')
          break
        case 'SUPERVISOR':
          navigate('/monitor')
          break
        case 'CASHIER':
          navigate('/scanner')
          break
        case 'EMPLOYEE':
          navigate('/mis-consumos')
          break
        default:
          navigate('/')
      }
    } else {
      toast.error(result.error || 'Credenciales incorrectas')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">F1 Comedor</h1>
          <p className="text-gray-500 mt-2">Sistema de Gestión de Comedor</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Usuario
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Ingresa tu usuario"
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Ingresa tu contraseña"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        {/* Demo Credentials */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center mb-3">Credenciales de prueba:</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-blue-50 rounded p-2 text-center">
              <p className="font-semibold text-blue-600">Admin</p>
              <p className="text-gray-600">admin</p>
            </div>
            <div className="bg-green-50 rounded p-2 text-center">
              <p className="font-semibold text-green-600">Supervisor</p>
              <p className="text-gray-600">supervisor</p>
            </div>
            <div className="bg-yellow-50 rounded p-2 text-center">
              <p className="font-semibold text-yellow-600">Cajero</p>
              <p className="text-gray-600">cajero</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">Contraseña: [rol]123</p>
        </div>
      </div>
    </div>
  )
}
