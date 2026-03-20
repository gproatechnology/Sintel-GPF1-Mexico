import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')

    if (token && savedUser) {
      try {
        // Validar que el token sea un JWT válido antes de aceptar la sesión
        if (token.startsWith('bypass_')) {
          // Tokens de bypass no son válidos - limpiar credenciales
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        } else {
          setUser(JSON.parse(savedUser))
        }
      } catch (e) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    try {
      const response = await authAPI.login(username, password)
      const { access_token, token_type } = response.data

      localStorage.setItem('token', access_token)

      // Decode JWT to get user info (simplified)
      const userInfo = decodeJWT(access_token)
      setUser(userInfo)
      localStorage.setItem('user', JSON.stringify(userInfo))

      return { success: true, user: userInfo }
    } catch (error) {
      const message = error.response?.data?.detail || 'Error al iniciar sesión'
      return { success: false, error: message }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const hasRole = (allowedRoles) => {
    if (!user) return false
    return allowedRoles.includes(user.role)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Simple JWT decoder (for getting user info from token)
function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    const payload = JSON.parse(jsonPayload)

    return {
      username: payload.sub,
      role: payload.role || 'EMPLOYEE',
      userId: payload.user_id,
    }
  } catch (e) {
    console.error('Error decoding JWT:', e)
    return { username: 'unknown', role: 'EMPLOYEE', userId: 0 }
  }
}
