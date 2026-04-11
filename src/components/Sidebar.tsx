import { useAuth } from '../context/AuthContext';
import { Package2, LogOut, Users, ShoppingCart, Building2, FileText, TrendingUp, Package, LayoutDashboard, Key, ShoppingBag, BarChart3 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isAdmin = user?.rol === 'admin' || user?.rol === 'administrador';

  const allModules = [
    { name: 'Usuarios', icon: Users, path: '/usuarios', requiresAdmin: true },
    { name: 'Permisos', icon: Key, path: '/permisos', requiresAdmin: true, hasBadge: true },
    { name: 'Productos', icon: Package2, path: '/productos', requiresAdmin: false },
    { name: 'Proveedores', icon: Building2, path: '/proveedores', requiresAdmin: false },
    { name: 'Ventas', icon: ShoppingBag, path: '/pos', requiresAdmin: false },
    { name: 'Compras', icon: ShoppingCart, path: '/compras', requiresAdmin: false },
    { name: 'Inventario', icon: Package, path: '/inventario', requiresAdmin: false },
    { name: 'Tasas de Cambio', icon: TrendingUp, path: '/tasas', requiresAdmin: false },
    { name: 'Rentabilidad', icon: BarChart3, path: '/rentabilidad', requiresAdmin: false },
    { name: 'Cuentas por Pagar', icon: FileText, path: '/facturas', requiresAdmin: false },
  ];

  const visibleModules = allModules.filter(m => !m.requiresAdmin || isAdmin);

  return (
    <aside className="w-64 bg-[#23150D] text-white flex flex-col justify-between shrink-0 h-screen overflow-y-auto">
      <div>
        {/* Logo Area */}
        <div className="p-6 flex items-center gap-3 border-b border-[#3A2A20]">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-amber-800 rounded-lg flex items-center justify-center shadow-inner">
            <Package2 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider leading-tight">Charcutería<br/><span className="text-amber-600 font-normal text-xs">GESTIÓN</span></h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-4 space-y-2 pb-6">
          <button 
            onClick={() => navigate('/dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl transition-colors ${
              location.pathname === '/dashboard' || location.pathname === '/' 
                ? 'bg-[#E5A823] text-[#23150D]' 
                : 'text-gray-400 hover:text-white hover:bg-[#3A2A20]'
            }`}
          >
            <LayoutDashboard size={18} />
            <span className="text-sm">Dashboard</span>
          </button>
          
          {visibleModules.map((module) => {
            const Icon = module.icon;
            const isActive = location.pathname.startsWith(module.path);
            
            return (
              <button
                key={module.name}
                onClick={() => navigate(module.path)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors group ${
                  isActive
                    ? 'bg-[#E5A823] text-[#23150D] font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-[#3A2A20]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={isActive ? '' : 'group-hover:text-amber-500 transition-colors'} />
                  <span className="text-sm">{module.name}</span>
                </div>
                {module.hasBadge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors ${
                    isActive
                        ? 'bg-[#23150D] text-amber-500'
                        : 'bg-[#3A2A20] text-amber-500 group-hover:bg-amber-500 group-hover:text-[#23150D]'
                  }`}>
                    ADMIN
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Profile Summary */}
      <div className="p-4 border-t border-[#3A2A20] sticky bottom-0 bg-[#23150D]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-[#23150D] font-bold text-sm shrink-0">
            {(user?.nombre || '').charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">{user?.nombre}</p>
            <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium px-2 py-1 bg-[#FDFBF7] text-[#23150D] rounded-full capitalize">
              {user?.rol || 'Usuario'}
            </span>
            <button
            onClick={logout}
            className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-amber-500 transition-colors"
          >
            Cerrar sesión <LogOut size={12} />
          </button>
        </div>
      </div>
    </aside>
  );
}
