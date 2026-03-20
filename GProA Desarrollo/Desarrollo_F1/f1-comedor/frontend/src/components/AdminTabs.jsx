const tabs = [
  { id: 'employees', label: 'Empleados', icon: '👥' },
  { id: 'companies', label: 'Empresas', icon: '🏢' },
  { id: 'categories', label: 'Categorías', icon: '📁' },
  { id: 'menu', label: 'Menú', icon: '🍽️' },
]

export default function AdminTabs({ activeTab, onTabChange }) {
  return (
    <div className="bg-white flex rounded-xl border border-slate-200 overflow-hidden mb-8 shadow-sm p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wider rounded-lg transition-all ${
            activeTab === tab.id
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  )
}

export { tabs }