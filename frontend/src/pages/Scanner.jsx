import { useState, useEffect, useRef } from 'react'
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode'
import { useNavigate } from 'react-router-dom'
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
            <p className="text-sm text-gray-500">Escáner de Consumo</p>
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

// Get current meal type based on time
function getCurrentMealType() {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 11) return 'BREAKFAST'
  if (hour >= 11 && hour < 16) return 'LUNCH'
  if (hour >= 16 && hour < 23) return 'DINNER'
  return 'LUNCH'
}

function getMealTypeName(type) {
  switch (type) {
    case 'BREAKFAST': return 'Desayuno'
    case 'LUNCH': return 'Comida'
    case 'DINNER': return 'Cena'
    default: return type
  }
}

export default function Scanner() {
  const [scanning, setScanning] = useState(false)
  const [scannedEmployee, setScannedEmployee] = useState(null)
  const [scanError, setScanError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [consumptionsToday, setConsumptionsToday] = useState(0)
  const [dailyLimit, setDailyLimit] = useState(3)
  const [duplicateWarning, setDuplicateWarning] = useState(false)
  const [lastScan, setLastScan] = useState(null)
  
  const scannerRef = useRef(null)
  const html5QrcodeScannerRef = useRef(null)
  const { user } = useAuth()
  const navigate = useNavigate()

  const currentMealType = getCurrentMealType()

  useEffect(() => {
    return () => {
      if (html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current.clear().catch(() => {})
      }
    }
  }, [])

  const startScanning = () => {
    setScanning(true)
    setScanError(null)
    
    setTimeout(() => {
      if (!scannerRef.current) return
      
      html5QrcodeScannerRef.current = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false
      )

      html5QrcodeScannerRef.current.render(
        (decodedText) => {
          handleScan(decodedText)
        },
        (error) => {
          // Ignore scan errors (they happen frequently when no QR is visible)
        }
      )
    }, 100)
  }

  const stopScanning = () => {
    if (html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current.clear().catch(() => {})
    }
    setScanning(false)
  }

  const handleScan = async (qrCode) => {
    // Prevent duplicate scans within 2 seconds
    if (lastScan && qrCode === lastScan.qrCode && Date.now() - lastScan.time < 2000) {
      return
    }

    stopScanning()
    setLoading(true)
    setScanError(null)
    setDuplicateWarning(false)

    try {
      // Scan the QR code to get employee info
      const response = await employeesAPI.scan(qrCode)
      const employeeData = response.data
      
      setScannedEmployee(employeeData.employee)
      setConsumptionsToday(employeeData.consumptions_today || 0)
      setDailyLimit(employeeData.category?.daily_limit || 3)
      setLastScan({ qrCode, time: Date.now() })

      // Check for duplicate scan warning
      if (employeeData.is_duplicate) {
        setDuplicateWarning(true)
        toast.error('⚠️ Advertencia: Este empleado ya consumió recientemente')
      }

    } catch (error) {
      const message = error.response?.data?.detail || 'Error al escanear código QR'
      setScanError(message)
      toast.error(message)
      setTimeout(() => {
        setScanning(true)
        startScanning()
      }, 2000)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmConsumption = async () => {
    if (!scannedEmployee) return

    setLoading(true)
    try {
      await consumptionsAPI.create({
        employee_id: scannedEmployee.id,
        meal_type: currentMealType,
        items: [],
        notes: '',
      })

      toast.success(`✅ Consumo registrado para ${scannedEmployee.first_name} ${scannedEmployee.last_name}`)
      
      // Clear and restart scanning after 3 seconds
      setTimeout(() => {
        setScannedEmployee(null)
        setConsumptionsToday(0)
        setDuplicateWarning(false)
        startScanning()
      }, 3000)

    } catch (error) {
      const message = error.response?.data?.detail || 'Error al registrar consumo'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setScannedEmployee(null)
    setConsumptionsToday(0)
    setDuplicateWarning(false)
    startScanning()
  }

  const getStatusColor = () => {
    if (consumptionsToday >= dailyLimit) return 'red'
    if (consumptionsToday === 0) return 'yellow'
    if (duplicateWarning) return 'orange'
    return 'green'
  }

  const getStatusMessage = () => {
    if (consumptionsToday >= dailyLimit) return 'Límite alcanzado'
    if (consumptionsToday === 0) return 'Primer consumo del día'
    if (duplicateWarning) return 'Escaneo duplicado'
    return 'Consumo normal'
  }

  const progress = Math.min((consumptionsToday / dailyLimit) * 100, 100)

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Escáner de Códigos QR</h2>
              <p className="text-gray-500">Turno actual: <span className="font-semibold text-blue-600">{getMealTypeName(currentMealType)}</span></p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">{new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="text-sm text-gray-500">{new Date().toLocaleTimeString('es-MX')}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scanner Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📷 Lector QR</h3>
            
            {!scanning && !scannedEmployee && !loading && !scanError && (
              <div className="text-center py-12">
                <div className="mb-6">
                  <svg className="w-24 h-24 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <button
                  onClick={startScanning}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                >
                  Iniciar Escáner
                </button>
              </div>
            )}

            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Procesando...</p>
              </div>
            )}

            {scanError && !scannedEmployee && (
              <div className="text-center py-8">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  <p className="font-bold">Error</p>
                  <p>{scanError}</p>
                </div>
                <button
                  onClick={startScanning}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg"
                >
                  Reintentar
                </button>
              </div>
            )}

            {scanning && (
              <div>
                <div id="qr-reader" ref={scannerRef} className="w-full"></div>
                <button
                  onClick={stopScanning}
                  className="mt-4 w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg"
                >
                  Detener Escáner
                </button>
              </div>
            )}
          </div>

          {/* Result Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Resultado del Escaneo</h3>
            
            {!scannedEmployee ? (
              <div className="text-center py-12 text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>Escanea un código QR para ver el resultado</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Employee Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-blue-600">
                        {scannedEmployee.first_name[0]}{scannedEmployee.last_name[0]}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-800">
                        {scannedEmployee.first_name} {scannedEmployee.last_name}
                      </h4>
                      <p className="text-gray-600">{scannedEmployee.employee_number}</p>
                      <p className="text-sm text-gray-500">{scannedEmployee.company?.name || 'Empresa'}</p>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className={`rounded-lg p-4 border-2 ${
                  getStatusColor() === 'red' ? 'bg-red-50 border-red-300' :
                  getStatusColor() === 'yellow' ? 'bg-yellow-50 border-yellow-300' :
                  getStatusColor() === 'orange' ? 'bg-orange-50 border-orange-300' :
                  'bg-green-50 border-green-300'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Estado:</span>
                    <span className={`font-bold ${
                      getStatusColor() === 'red' ? 'text-red-600' :
                      getStatusColor() === 'yellow' ? 'text-yellow-600' :
                      getStatusColor() === 'orange' ? 'text-orange-600' :
                      'text-green-600'
                    }`}>
                      {getStatusMessage()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Consumos hoy:</span>
                    <span className="font-bold">{consumptionsToday} de {dailyLimit}</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-4 mt-2">
                    <div 
                      className={`h-4 rounded-full transition-all ${
                        getStatusColor() === 'red' ? 'bg-red-500' :
                        getStatusColor() === 'yellow' ? 'bg-yellow-500' :
                        getStatusColor() === 'orange' ? 'bg-orange-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Duplicate Warning */}
                {duplicateWarning && (
                  <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded">
                    <p className="font-bold">⚠️ Advertencia</p>
                    <p>Este empleado ya realizó un consumo hace menos de 5 minutos</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-4">
                  <button
                    onClick={handleConfirmConsumption}
                    disabled={loading || consumptionsToday >= dailyLimit}
                    className={`flex-1 font-semibold py-4 px-6 rounded-lg transition-colors ${
                      consumptionsToday >= dailyLimit
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {loading ? 'Registrando...' : 'CONFIRMAR CONSUMO'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
                  >
                    CANCELAR
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
