import { useState, useEffect, useCallback } from 'react';
import { api, User, Permiso } from '../services/api';
import { Users, RotateCw } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [allPermisos, setAllPermisos] = useState<Permiso[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch both users and permissions in parallel
      const [usersResponse, permisosData] = await Promise.all([
        api.getUsuarios(1, 100),
        api.getPermisos()
      ]);
      
      setUsuarios(usersResponse.data);
      setAllPermisos(permisosData);
      
      // Update selected user if it exists to refresh its permissions
      if (selectedUser) {
        const updatedSelectedUser = usersResponse.data.find(u => u.id === selectedUser.id);
        if (updatedSelectedUser) {
          setSelectedUser(updatedSelectedUser);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  }, [selectedUser]);

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount, or when explicitly requested

  const handleTogglePermission = async (permisoId: number) => {
    if (!selectedUser) return;

    try {
      setIsAssigning(true);
      setError(null);

      // Backend returns an array of permission IDs, not objects
      const currentPermisosIds = selectedUser.permisos as unknown as number[] || [];
      const hasPermission = currentPermisosIds.includes(permisoId);
      
      let newPermisosIds: number[];
      if (hasPermission) {
        newPermisosIds = currentPermisosIds.filter(id => id !== permisoId);
      } else {
        newPermisosIds = [...currentPermisosIds, permisoId];
      }

      // Optimistic update
      const updatedUser = { ...selectedUser, permisos: newPermisosIds as any };
      setSelectedUser(updatedUser);
      setUsuarios(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));

      // API call
      await api.assignPermissions(selectedUser.id, newPermisosIds);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al asignar permiso');
      // Revert optimistic update (could be improved by reloading from server, but simple reload is safe)
      loadData();
    } finally {
      setIsAssigning(false);
    }
  };
  
  return (
    <div className="min-h-screen flex bg-[#FDFBF7]">
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden h-screen">
        <header className="bg-white px-8 py-6 border-b border-gray-100 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <Users size={24} className="text-indigo-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">Usuarios</h2>
              <p className="text-xs text-gray-500">Gestión de cuentas y permisos — GET /api/usuarios</p>
            </div>
          </div>
          <button 
            onClick={loadData}
            disabled={isLoading || isAssigning}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RotateCw size={16} className={`text-blue-500 ${isLoading ? 'animate-spin' : ''}`} />
            Recargar
          </button>
        </header>

        <div className="p-8 flex-1 overflow-hidden flex flex-col">
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-lg border border-red-200 text-sm">
              {error}
            </div>
          )}

            <div className="flex justify-between items-center mb-6">
                 <p className="text-sm text-gray-500">{usuarios.length} usuario(s) registrados</p>
                 <span className="text-xs font-medium bg-gray-100 px-3 py-1.5 rounded-full text-gray-600">
                    Selecciona un usuario para asignar permisos
                 </span>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Left Column: Users List */}
                <div className="w-1/2 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-700">Usuarios del sistema</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {isLoading && usuarios.length === 0 ? (
                           <p className="text-center text-gray-500 text-sm mt-4">Cargando usuarios...</p>
                        ) : usuarios.map((user) => (
                          <div 
                            key={user.id} 
                            onClick={() => setSelectedUser(user)}
                            className={`p-4 border rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                              selectedUser?.id === user.id 
                                ? 'border-amber-400 bg-amber-50/50' 
                                : 'border-gray-100 hover:border-amber-200 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">
                                    {(user.nombre || '').charAt(0).toUpperCase()}
                               </div>
                               <div>
                                    <p className="text-sm font-bold text-gray-900">{user.nombre}</p>
                                    <p className="text-xs text-gray-500">{user.email}</p>
                               </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                {(user.rol === 'admin' || user.rol === 'administrador') && (
                                  <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-md">admin</span>
                                )}
                                <div className="flex items-center gap-1">
                                    <div className={`w-1.5 h-1.5 rounded-full ${user.activo ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                    <span className={`text-[10px] font-medium ${user.activo ? 'text-emerald-600' : 'text-red-600'}`}>
                                      {user.activo ? 'activo' : 'inactivo'}
                                    </span>
                                </div>
                            </div>
                          </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Permission Assignment */}
                <div className="w-1/2 flex flex-col bg-white rounded-xl border flex border-gray-200 overflow-hidden shadow-sm">
                     <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-gray-700">
                           {selectedUser ? `Permisos de ${selectedUser.nombre}` : 'Selecciona un usuario'}
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        {!selectedUser ? (
                          <div className="h-full flex items-center justify-center text-center">
                            <p className="text-sm text-gray-400">← Selecciona un usuario para editar sus permisos</p>
                          </div>
                        ) : (
                          <div className="space-y-3 pb-4">
                            {allPermisos.length === 0 ? (
                              <p className="text-center text-sm text-gray-500 mt-4">No hay permisos disponibles en el sistema.</p>
                            ) : (
                              allPermisos.map(permiso => {
                                const userPermisosIds = (selectedUser.permisos as unknown as number[]) || [];
                                const hasPermiso = userPermisosIds.includes(permiso.id_permiso);
                                
                                return (
                                  <div 
                                    key={permiso.id_permiso} 
                                    className={`flex items-center justify-between p-4 border rounded-xl transition-all ${
                                      hasPermiso ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100 hover:border-gray-200 bg-white'
                                    }`}
                                  >
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <p className={`text-sm font-bold ${hasPermiso ? 'text-gray-900' : 'text-gray-700'}`}>
                                          {permiso.nombre}
                                        </p>
                                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                                          {permiso.modulo || 'General'}
                                        </span>
                                      </div>
                                      <p className="text-xs text-gray-500">{permiso.descripcion || 'Sin descripción'}</p>
                                    </div>

                                    {/* Custom Toggle Switch */}
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        className="sr-only peer"
                                        checked={hasPermiso}
                                        disabled={isAssigning}
                                        onChange={() => handleTogglePermission(permiso.id_permiso)}
                                      />
                                      <div className={`w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${
                                        hasPermiso ? 'peer-checked:bg-amber-500' : ''
                                      }`}></div>
                                    </label>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}
