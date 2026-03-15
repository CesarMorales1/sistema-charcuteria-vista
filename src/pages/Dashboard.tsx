import { useAuth } from '../context/AuthContext';
import { Package2, LayoutDashboard, Users, Key, Building2, ShoppingCart, Package, TrendingUp, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const isAdmin = user?.rol === 'admin' || user?.rol === 'administrador';

  const allModules = [
    { name: 'Usuarios', icon: Users, color: 'text-indigo-600', path: '/usuarios', requiresAdmin: true },
    { name: 'Permisos', icon: Key, color: 'text-amber-500', path: '/permisos', requiresAdmin: true, hasBadge: true },
    { name: 'Productos', icon: Package2, color: 'text-emerald-500', path: '/productos', requiresAdmin: false },
    { name: 'Proveedores', icon: Building2, color: 'text-red-400', path: '/proveedores', requiresAdmin: false },
    { name: 'Compras', icon: ShoppingCart, color: 'text-blue-400', path: '/compras', requiresAdmin: false },
    { name: 'Inventario', icon: Package, color: 'text-amber-700', path: '/inventario', requiresAdmin: false },
    { name: 'Tasas de Cambio', icon: TrendingUp, color: 'text-blue-500', path: '/tasas', requiresAdmin: false },
    { name: 'Cuentas por Pagar', icon: FileText, color: 'text-purple-400', path: '/facturas', requiresAdmin: false },
  ];

  const visibleModules = allModules.filter(m => !m.requiresAdmin || isAdmin);

  return (
    <div className="min-h-screen flex bg-[#FDFBF7]">
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white px-8 py-6 border-b border-gray-100 flex items-center gap-3 shadow-sm">
          <LayoutDashboard size={24} className="text-gray-800" />
          <div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight">Dashboard</h2>
            <p className="text-xs text-gray-500">Panel de control</p>
          </div>
        </header>

        {/* Centered Content Wrapper */}
        <div className="p-8 w-full h-full flex flex-col items-center">
          <div className="w-full max-w-5xl">
            {/* Admin Welcome Banner */}
            {isAdmin && (
              <div className="bg-[#2A1F1A] rounded-2xl p-8 mb-8 text-white relative overflow-hidden shadow-lg w-full">
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-2">¡Bienvenido, Administrador!</h3>
                  <p className="text-gray-300 text-sm mb-6 max-w-lg">
                    Tienes acceso completo al sistema como Administrador. Puedes gestionar usuarios, permisos, inventario, compras y configuraciones financieras.
                  </p>
                  <span className="inline-block bg-[#E5A823] text-[#2A1F1A] text-xs font-bold px-4 py-2 rounded-full shadow-sm">
                    Acceso total (admin)
                  </span>
                </div>
                {/* Optional Decoration */}
                <div className="absolute top-0 right-0 w-64 h-full opacity-10 pointer-events-none flex items-center justify-center">
                   <Package2 size={200} className="text-amber-500 translate-x-12" />
                </div>
              </div>
            )}

            {/* Module Grid Header */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700">Módulos disponibles ({visibleModules.length})</h4>
            </div>

            {/* Module Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {visibleModules.map((module) => {
                const Icon = module.icon;
                return (
                  <button
                    key={module.name}
                    onClick={() => navigate(module.path)}
                    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all text-left group flex flex-col items-center justify-center h-40"
                  >
                    <div className={`mb-4 ${module.color} group-hover:scale-110 transition-transform`}>
                      <Icon size={32} strokeWidth={1.5} />
                    </div>
                    <span className="text-sm font-semibold text-gray-800 group-hover:text-black">{module.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
