import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { translations, Language } from '../lib/translations';
import { 
  LayoutDashboard, 
  FileText, 
  AlertCircle, 
  Receipt, 
  Users, 
  Truck, 
  Settings, 
  BarChart3, 
  Building2, 
  ShoppingBag,
  Globe,
  ChevronDown,
  ChevronRight,
  Wallet,
  CreditCard
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

export function Sidebar({ currentView, setCurrentView, language, setLanguage }: SidebarProps) {
  const t = translations[language];
  const [isGastosOpen, setIsGastosOpen] = useState(
    currentView === 'gastos' || currentView === 'pagos_proveedores' || currentView === 'nominas'
  );

  const menuItems = [
    { id: 'registre', label: t.sidebar.registre, icon: FileText },
    { id: 'impagats', label: t.sidebar.impagats, icon: AlertCircle },
    { 
      id: 'gastos_menu', 
      label: t.sidebar.gastos, 
      icon: Receipt,
      subItems: [
        { id: 'gastos', label: t.sidebar.control_gastos || 'Control de Gastos', icon: Wallet },
        { id: 'pagos_proveedores', label: t.sidebar.pagos_proveedores || 'Pagos Proveedores', icon: CreditCard },
        { id: 'nominas', label: t.sidebar.nominas, icon: Users },
      ]
    },
    { id: 'proveidors', label: t.sidebar.proveidors, icon: Truck },
    { id: 'clientes', label: t.sidebar.clientes, icon: Users },
    { id: 'organitzacio', label: t.sidebar.organitzacio, icon: Settings },
    { id: 'analisi', label: t.sidebar.analisi, icon: BarChart3 },
    { id: 'empresa', label: t.sidebar.empresa, icon: Building2 },
    { id: 'pedidos', label: t.sidebar.pedidos, icon: ShoppingBag },
  ];

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 bg-[#464971] rounded-lg flex items-center justify-center text-white">
            CA
          </div>
          CARNS ALIAGA
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <div key={item.id}>
            {item.subItems ? (
              <>
                <button
                  onClick={() => setIsGastosOpen(!isGastosOpen)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    item.subItems.some(sub => sub.id === currentView)
                      ? "bg-[#464971]/5 text-[#464971]"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={cn("w-4 h-4", item.subItems.some(sub => sub.id === currentView) ? "text-[#464971]" : "text-gray-400")} />
                    {item.label}
                  </div>
                  {isGastosOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                </button>
                {isGastosOpen && (
                  <div className="mt-1 ml-4 pl-4 border-l border-gray-100 space-y-1">
                    {item.subItems.map((subItem) => (
                      <button
                        key={subItem.id}
                        onClick={() => setCurrentView(subItem.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                          currentView === subItem.id
                            ? "bg-[#464971]/10 text-[#464971] shadow-sm"
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                        )}
                      >
                        <subItem.icon className={cn("w-4 h-4", currentView === subItem.id ? "text-[#464971]" : "text-gray-400")} />
                        {subItem.label}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={() => setCurrentView(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  currentView === item.id
                    ? "bg-[#464971]/10 text-[#464971] shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className={cn("w-4 h-4", currentView === item.id ? "text-[#464971]" : "text-gray-400")} />
                {item.label}
              </button>
            )}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={() => setLanguage(language === 'ca' ? 'es' : 'ca')}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-all"
        >
          <Globe className="w-4 h-4" />
          {language === 'ca' ? 'Valencià' : 'Español'}
        </button>
      </div>
    </div>
  );
}
