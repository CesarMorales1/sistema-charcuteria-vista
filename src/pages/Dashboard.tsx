import { useAuth } from '../context/AuthContext';
import { Package2, LayoutDashboard, Users, Key, Building2, ShoppingCart, Package, TrendingUp, FileText, Clock, ArrowRight, Sparkles, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.rol === 'admin' || user?.rol === 'administrador';

  const allModules = [
    { name: 'Usuarios', icon: Users, color: 'bg-gradient-to-br from-indigo-500 to-indigo-600', iconColor: 'text-white', path: '/usuarios', requiresAdmin: true, description: 'Gestión de cuentas' },
    { name: 'Permisos', icon: Key, color: 'bg-gradient-to-br from-amber-500 to-amber-600', iconColor: 'text-white', path: '/permisos', requiresAdmin: true, hasBadge: true, description: 'Control de accesos' },
    { name: 'Productos', icon: Package2, color: 'bg-gradient-to-br from-emerald-500 to-emerald-600', iconColor: 'text-white', path: '/productos', requiresAdmin: false, description: 'Catálogo completo' },
    { name: 'Proveedores', icon: Building2, color: 'bg-gradient-to-br from-rose-500 to-rose-600', iconColor: 'text-white', path: '/proveedores', requiresAdmin: false, description: 'Gestión de empresas' },
    { name: 'Ventas', icon: ShoppingBag, color: 'bg-gradient-to-br from-emerald-600 to-emerald-700', iconColor: 'text-white', path: '/pos', requiresAdmin: false, description: 'Punto de venta (POS)' },
    { name: 'Compras', icon: ShoppingCart, color: 'bg-gradient-to-br from-blue-500 to-blue-600', iconColor: 'text-white', path: '/compras', requiresAdmin: false, description: 'Registro de órdenes' },
    { name: 'Inventario', icon: Package, color: 'bg-gradient-to-br from-amber-600 to-amber-700', iconColor: 'text-white', path: '/inventario', requiresAdmin: false, description: 'Control de stock' },
    { name: 'Tasas de Cambio', icon: TrendingUp, color: 'bg-gradient-to-br from-cyan-500 to-cyan-600', iconColor: 'text-white', path: '/tasas', requiresAdmin: false, description: 'Conversión de divisas' },
    { name: 'Cuentas por Pagar', icon: FileText, color: 'bg-gradient-to-br from-slate-500 to-slate-600', iconColor: 'text-white', path: '/facturas', requiresAdmin: false, description: 'Facturación pendiente' },
  ];

  const visibleModules = allModules.filter(m => !m.requiresAdmin || isAdmin);

  const getCurrentGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#FDFBF7] via-[#FDF8F0] to-[#FCF5E9]">
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Enhanced Header */}
        <header className="bg-white/80 backdrop-blur-sm px-8 py-8 border-b border-gray-100 shadow-sm sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                <LayoutDashboard size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 leading-tight">{getCurrentGreeting()}, {user?.nombre?.split(' ')[0]}</h2>
                <p className="text-sm text-gray-500 flex items-center gap-2 mt-0.5">
                  <Clock size={14} />
                  {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-amber-100 px-4 py-2 rounded-full border border-amber-200">
                <Sparkles size={16} className="text-amber-600" />
                <span className="text-xs font-bold text-amber-700">Modo Administrador</span>
              </div>
            )}
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="p-8 w-full">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Banner for Admin */}
            {isAdmin && (
              <div className="bg-gradient-to-br from-[#2A1F1A] via-[#3A2614] to-[#2A1F1A] rounded-3xl p-8 mb-8 text-white relative overflow-hidden shadow-2xl border border-amber-900/20">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-transparent"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl"></div>

                <div className="relative z-10 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-2 bg-amber-500/20 px-3 py-1.5 rounded-full mb-4 border border-amber-500/30">
                      <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                      <span className="text-xs font-bold text-amber-200 uppercase tracking-wider">Acceso Total</span>
                    </div>
                    <h3 className="text-3xl font-bold mb-3 bg-gradient-to-r from-white to-amber-100 bg-clip-text text-transparent">
                      Panel de Administración
                    </h3>
                    <p className="text-gray-300 text-sm mb-6 max-w-2xl leading-relaxed">
                      Tienes control completo sobre el sistema. Gestiona usuarios, configura permisos, supervisa inventario, procesa compras y administra las finanzas de la empresa desde este panel centralizado.
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-amber-200">
                        <div className="w-1 h-1 bg-amber-400 rounded-full"></div>
                        <span className="text-xs font-medium">Gestión de usuarios y permisos</span>
                      </div>
                      <div className="flex items-center gap-2 text-amber-200">
                        <div className="w-1 h-1 bg-amber-400 rounded-full"></div>
                        <span className="text-xs font-medium">Configuración del sistema</span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden lg:block">
                    <div className="w-32 h-32 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-amber-500/30">
                      <Package2 size={64} className="text-amber-400/80" strokeWidth={1.5} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Summary Cards (Optional enhancement) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <ShoppingCart size={20} className="text-blue-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-500">Este mes</span>
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-1">Actividad</h4>
                <p className="text-sm text-gray-500">Sistema activo y funcionando</p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <Package size={20} className="text-emerald-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-500">En stock</span>
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-1">Inventario</h4>
                <p className="text-sm text-gray-500">Control de productos</p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                    <Building2 size={20} className="text-amber-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-500">Activos</span>
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-1">Proveedores</h4>
                <p className="text-sm text-gray-500">Red de suministro</p>
              </div>
            </div>

            {/* Module Grid Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold text-gray-900">Módulos del Sistema</h4>
                <p className="text-sm text-gray-500 mt-1">{visibleModules.length} módulos disponibles para tu rol</p>
              </div>
            </div>

            {/* Enhanced Module Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {visibleModules.map((module, index) => {
                const Icon = module.icon;
                return (
                  <button
                    key={module.name}
                    onClick={() => navigate(module.path)}
                    style={{ animationDelay: `${index * 50}ms` }}
                    className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all duration-300 overflow-hidden animate-in fade-in slide-in-from-bottom-4"
                  >
                    <div className="p-6 flex flex-col h-full">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-14 h-14 ${module.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                          <Icon size={28} strokeWidth={2} className={module.iconColor} />
                        </div>
                        <ArrowRight size={18} className="text-gray-300 group-hover:text-amber-600 group-hover:translate-x-1 transition-all duration-300" />
                      </div>

                      <div className="flex-1">
                        <h5 className="text-base font-bold text-gray-900 mb-1 group-hover:text-amber-700 transition-colors">
                          {module.name}
                        </h5>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          {module.description}
                        </p>
                      </div>

                      {module.hasBadge && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md">
                            <Key size={10} />
                            ADMIN ONLY
                          </span>
                        </div>
                      )}
                    </div>
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
