import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { employeesAPI, consumptionsAPI } from '../services/api'
import toast from 'react-hot-toast'

// Componente Navbar
function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white shadow-md px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">F1 Comedor</h1>
            <p className="text-sm text-gray-500">Mis Consumos</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            <span className="font-medium">{user?.username}</span>
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs">
              {user?.role}
            </span>
          </span>
          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-red-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  )
}

export default function MyConsumptions() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [employeeData, setEmployeeData] = useState(null)
  const [myConsumptions, setMyConsumptions] = useState([])
  const [loadingEmployee, setLoadingEmployee] = useState(true)

  // Find employee by user ID
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        // Try to find employee by scanning a placeholder QR (we'll use userId)
        // For now, fetch first employee that matches
        const response = await employeesAPI.getAll({ limit: 100 })
        const employees = response.data.items || []
        // For demo, use first employee
        if (employees.length > 0) {
          setEmployeeData(employees[0])
        }
      } catch (error) {
        console.error('Error fetching employee:', error)
      } finally {
        setLoadingEmployee(false)
      }
    }
    fetchEmployee()
  }, [user])

  // Fetch employee consumptions
  const { data: consumptionsData, isLoading: consumptionsLoading } = useQuery({
    queryKey: ['myConsumptions', employeeData?.id, selectedMonth],
    queryFn: () => {
      if (!employeeData?.id) return Promise.resolve({ data: { items: [] } })
      const [year, month] = selectedMonth.split('-')
      const dateFrom = `${year}-${month}-01`
      const dateTo = `${year}-${month}-31`
      return consumptionsAPI.getAll({ 
        employee_id: employeeData.id,
        date_from: dateFrom, 
        date_to: dateTo 
      })
    },
    enabled: !!employeeData?.id,
  })

  // Get today's consumptions
  const { data: todayData } = useQuery({
    queryKey: ['todayConsumptions', employeeData?.id],
    queryFn: () => {
      if (!employeeData?.id) return Promise.resolve({ data: { items: [] } })
      const today = new Date().toISOString().split('T')[0]
      return consumptionsAPI.getAll({ 
        employee_id: employeeData.id,
        date_from: today, 
        date_to: today 
      })
    },
    enabled: !!employeeData?.id,
  })

  const handleDownloadQR = async () => {
    if (!employeeData?.id) return
    
    try {
      const response = await employeesAPI.getQR(employeeData.id)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `QR_${employeeData.employee_number}.png`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('✅ QR descargado')
    } catch (error) {
      toast.error('Error al descargar QR')
    }
  }

  const consumptions = consumptionsData?.data?.items || []
  const todayConsumptions = todayData?.data?.items || []
  
  const dailyLimit = employeeData?.category?.daily_limit || 3
  const consumptionsToday = todayConsumptions.length
  const progress = Math.min((consumptionsToday / dailyLimit) * 100, 100)

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0)
  }

  const getMonthName = (monthStr) => {
    const [year, month] = monthStr.split('-')
    const date = new Date(year, parseInt(month) - 1)
    return date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
  }

  if (loadingEmployee) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Card with Profile */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-4xl font-bold text-blue-600">
                {employeeData ? `${employeeData.first_name[0]}${employeeData.last_name[0]}` : 'U'}
              </span>
            </div>
            
            {/* Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800">
                {employeeData ? `${employeeData.first_name} ${employeeData.last_name}` : 'Usuario'}
              </h2>
              <p className="text-gray-500">{employeeData?.employee_number || 'N/A'}</p>
              <div className="flex flex-wrap gap-4 mt-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  {employeeData?.company?.name || 'Empresa'}
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  {employeeData?.category?.name || 'Categoría'}
                </span>
              </div>
            </div>

            {/* QR Button */}
            <button
              onClick={handleDownloadQR}
              className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 rounded-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Descargar QR
            </button>
          </div>
        </div>

        {/* Today's Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Estado de Hoy</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Consumos Usados</p>
              <p className="text-3xl font-bold text-gray-800">{consumptionsToday}</p>
              <p className="text-sm text-gray-400">de {dailyLimit} permitidos</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Consumos Restantes</p>
              <p className="text-3xl font-bold text-gray-800">{Math.max(0, dailyLimit - consumptionsToday)}</p>
              <p className="text-sm text-gray-400">para hoy</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Monto Consumido</p>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(todayConsumptions.reduce((sum, c) => sum + (c.total || 0), 0))}
              </p>
              <p className="text-sm text-gray-400">hoy</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Progreso del día</span>
              <span className="text-sm font-medium text-gray-600">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className={`h-4 rounded-full transition-all ${
                  consumptionsToday >= dailyLimit ? 'bg-red-500' :
                  consumptionsToday >= dailyLimit * 0.7 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            {consumptionsToday >= dailyLimit && (
              <p className="text-red-600 text-sm mt-2">⚠️ Has alcanzado tu límite diario de consumos</p>
            )}
          </div>
        </div>

        {/* History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Historial de Consumos</h3>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date()
                date.setMonth(date.getMonth() - i)
                const value = date.toISOString().slice(0, 7)
                return (
                  <option key={value} value={value}>
                    {getMonthName(value)}
                  </option>
                )
              })}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Fecha</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Hora</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Turno</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Detalles</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {consumptions.map((consumption, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {consumption.created_at 
                        ? new Date(consumption.created_at).toLocaleDateString('es-MX')
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {consumption.created_at 
                        ? new Date(consumption.created_at).toLocaleTimeString('es-MX')
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        consumption.meal_type === 'BREAKFAST' ? 'bg-yellow-100 text-yellow-800' :
                        consumption.meal_type === 'LUNCH' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {consumption.meal_type === 'BREAKFAST' ? 'Desayuno' :
                         consumption.meal_type === 'LUNCH' ? 'Comida' : 'Cena'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {consumption.items?.map((item, i) => (
                        <span key={i} className="block text-gray-600">
                          {item.name} x{item.quantity}
                        </span>
                      )) || '-'}
                    </td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(consumption.total)}</td>
                  </tr>
                ))}
                {consumptions.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                      No hay consumos registrados este mes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
