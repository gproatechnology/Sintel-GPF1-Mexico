import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsAPI } from '@/services/api'
import toast from 'react-hot-toast'

const DEFAULT_WIDGETS = [
  { id: 'stats', label: 'Estadísticas Principales', visible: true, order: 1 },
  { id: 'consumptions_chart', label: 'Consumos por Hora', visible: true, order: 2 },
  { id: 'company_chart', label: 'Por Empresa', visible: true, order: 3 },
  { id: 'category_chart', label: 'Por Categoría', visible: true, order: 4 },
  { id: 'recent_consumptions', label: 'Consumos Recientes', visible: true, order: 5 },
]

export function DashboardSettings({ isOpen, onClose }) {
  const queryClient = useQueryClient()
  const [widgets, setWidgets] = useState(DEFAULT_WIDGETS)
  const [refreshInterval, setRefreshInterval] = useState(60)

  // Fetch current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['userSettings'],
    queryFn: settingsAPI.get,
    enabled: isOpen,
  })

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: settingsAPI.updateDashboardLayout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings'] })
      toast.success('Configuración guardada')
      onClose()
    },
    onError: () => {
      toast.error('Error al guardar configuración')
    }
  })

  // Load settings when fetched
  useEffect(() => {
    if (settings?.dashboard_layout?.widgets) {
      setWidgets(settings.dashboard_layout.widgets)
      setRefreshInterval(settings.dashboard_layout.refresh_interval || 60)
    }
  }, [settings])

  const toggleWidget = (widgetId) => {
    setWidgets(prev => prev.map(w => 
      w.id === widgetId ? { ...w, visible: !w.visible } : w
    ))
  }

  const handleSave = () => {
    const layout = {
      widgets: widgets.sort((a, b) => a.order - b.order),
      refresh_interval: refreshInterval,
      theme: 'light'
    }
    updateMutation.mutate(layout)
  }

  const handleReset = () => {
    setWidgets(DEFAULT_WIDGETS)
    setRefreshInterval(60)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Configurar Dashboard</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Widgets */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-600 mb-3">Widgets a mostrar</h3>
                <div className="space-y-2">
                  {widgets.map(widget => (
                    <label 
                      key={widget.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <span className="text-slate-700">{widget.label}</span>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={widget.visible}
                          onChange={() => toggleWidget(widget.id)}
                          className="sr-only"
                        />
                        <div 
                          className={`w-11 h-6 rounded-full transition-colors ${
                            widget.visible ? 'bg-blue-600' : 'bg-slate-300'
                          }`}
                          onClick={() => toggleWidget(widget.id)}
                        >
                          <div 
                            className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform mt-0.5 ${
                              widget.visible ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'
                            }`}
                          />
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Refresh Interval */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-600 mb-3">Intervalo de actualización</h3>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={30}>30 segundos</option>
                  <option value={60}>1 minuto</option>
                  <option value={120}>2 minutos</option>
                  <option value={300}>5 minutos</option>
                  <option value={0}>Manual (sin auto-refresh)</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors font-medium"
          >
            Restablecer
          </button>
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook to get widget visibility
export function useWidgetVisibility() {
  const { data: settings } = useQuery({
    queryKey: ['userSettings'],
    queryFn: settingsAPI.get,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const getWidgetVisibility = (widgetId) => {
    if (!settings?.dashboard_layout?.widgets) {
      return true // Default to visible
    }
    const widget = settings.dashboard_layout.widgets.find(w => w.id === widgetId)
    return widget?.visible ?? true
  }

  const getRefreshInterval = () => {
    return settings?.dashboard_layout?.refresh_interval ?? 60
  }

  return { getWidgetVisibility, getRefreshInterval, settings }
}

export default DashboardSettings