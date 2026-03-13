import { useState, useEffect } from 'react'

// Mensajes de carga dinámicos
const LOADING_MESSAGES = [
  "Iniciando motores...",
  "Cargando bases de datos...",
  "Sincronizando con Directorio Central...",
  "Iniciando módulos de red...",
  "Preparando pit wall...",
  "Listo para la carrera!"
]

export default function Splashscreen({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const [currentMessage, setCurrentMessage] = useState(LOADING_MESSAGES[0])
  const [isVisible, setIsVisible] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // Duración total: 3.5 segundos
    const totalDuration = 3500
    const intervalTime = totalDuration / 100
    
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 1
        
        // Actualizar mensaje según progreso
        const messageIndex = Math.floor((newProgress / 100) * LOADING_MESSAGES.length)
        if (messageIndex < LOADING_MESSAGES.length) {
          setCurrentMessage(LOADING_MESSAGES[messageIndex])
        }
        
        // Iniciar fade-out al final
        if (newProgress >= 100) {
          clearInterval(interval)
          setFadeOut(true)
          setTimeout(() => {
            setIsVisible(false)
            if (onComplete) onComplete()
          }, 500)
        }
        
        return newProgress
      })
    }, intervalTime)

    return () => clearInterval(interval)
  }, [onComplete])

  // Efecto de estela (trail) en la barra
  const getTrailStyle = (progress) => {
    return {
      width: `${progress}%`,
      boxShadow: progress > 10 
        ? `0 0 20px rgba(239, 68, 68, 0.8), 0 0 40px rgba(239, 68, 68, 0.5), 0 0 60px rgba(239, 68, 68, 0.3)` 
        : 'none',
      transition: 'width 0.1s ease-out, box-shadow 0.1s ease-out'
    }
  }

  if (!isVisible) return null

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        background: `
          linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%),
          url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23222' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
        `,
        backgroundColor: '#0a0a0a'
      }}
    >
      {/* Carbon fiber pattern overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`
      }}></div>

      {/* Logo Container */}
      <div className="relative z-10 mb-16">
        {/* Glow effect behind logo */}
        <div className="absolute inset-0 blur-3xl opacity-50 bg-red-600 rounded-full transform scale-150"></div>
        
        {/* Logo */}
        <div className="relative w-32 h-32 bg-gradient-to-br from-red-600 via-red-700 to-red-900 rounded-3xl flex items-center justify-center shadow-2xl transform rotate-[-5deg] hover:rotate-0 transition-transform duration-500" style={{
          boxShadow: '0 0 60px rgba(239, 68, 68, 0.6), 0 0 100px rgba(239, 68, 68, 0.3), inset 0 0 30px rgba(255, 255, 255, 0.1)'
        }}>
          <span className="text-white font-black italic text-6xl tracking-widest transform -rotate-3">F1</span>
        </div>
      </div>

      {/* Title */}
      <h1 className="relative z-10 text-4xl font-black italic uppercase tracking-[0.3em] text-white mb-2" style={{
        textShadow: '0 0 30px rgba(239, 68, 68, 0.8), 0 0 60px rgba(239, 68, 68, 0.4)'
      }}>
        Comedor
      </h1>
      <p className="text-red-500 font-bold uppercase tracking-[0.5em] text-sm mb-12">
        Paddock Club
      </p>

      {/* Progress Bar Container */}
      <div className="relative z-10 w-80 h-1 bg-slate-800 rounded-full overflow-hidden">
        {/* Progress bar with trail effect */}
        <div 
          className="h-full bg-gradient-to-r from-red-600 via-red-500 to-red-600 rounded-full"
          style={getTrailStyle(progress)}
        ></div>
        
        {/* Trail particles */}
        {progress > 5 && progress < 95 && (
          <div 
            className="absolute top-0 h-full w-2 bg-white rounded-full opacity-80"
            style={{
              left: `${progress}%`,
              transform: 'translateX(-50%)',
              boxShadow: '0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(239, 68, 68, 0.8)'
            }}
          ></div>
        )}
      </div>

      {/* Status Text */}
      <p className="relative z-10 mt-6 text-slate-400 font-medium text-sm tracking-wider animate-pulse">
        {currentMessage}
      </p>

      {/* Version */}
      <p className="absolute bottom-8 text-slate-600 text-xs font-mono">
        GProA Technology v1.0.0
      </p>
    </div>
  )
}
