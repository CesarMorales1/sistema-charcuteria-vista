import { useState, useEffect, useCallback } from 'react';
import { api, Permiso } from '../services/api';
import { Key, RotateCw, Plus } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function Permisos() {
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const loadPermisos = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getPermisos();
      setPermisos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar permisos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPermisos();
  }, [loadPermisos]);
  
  return (
    <div className="min-h-screen flex bg-[#FDFBF7]">
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden h-screen">
        <header className="bg-white px-8 py-6 border-b border-gray-100 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <Key size={24} className="text-amber-500" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">Permisos</h2>
              <p className="text-xs text-gray-500">Permisos del sistema — GET /api/permisos - Solo administrador</p>
            </div>
          </div>
          <button 
            onClick={loadPermisos}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RotateCw size={16} className={`text-blue-500 ${isLoading ? 'animate-spin' : ''}`} />
            Recargar
          </button>
        </header>

        <div className="p-8 flex-1 overflow-y-auto w-full">
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-lg border border-red-200 text-sm max-w-6xl mx-auto">
              {error}
            </div>
          )}

           <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <p className="text-sm text-gray-500">{permisos.length} permiso(s) en el sistema</p>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-[#D98A19] hover:bg-[#c27914] text-white text-sm font-bold rounded-lg transition-colors shadow-sm">
                        <Plus size={16} strokeWidth={3} />
                        Nuevo permiso
                    </button>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="py-4 px-6 text-sm font-semibold text-gray-700 w-16">#</th>
                                    <th className="py-4 px-6 text-sm font-semibold text-gray-700 w-1/4">Nombre</th>
                                    <th className="py-4 px-6 text-sm font-semibold text-gray-700 w-1/5">Módulo</th>
                                    <th className="py-4 px-6 text-sm font-semibold text-gray-700">Descripción</th>
                                    <th className="py-4 px-6 text-sm font-semibold text-gray-700 w-24 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoading && permisos.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-sm text-gray-500">
                                            Cargando permisos...
                                        </td>
                                    </tr>
                                ) : permisos.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-sm text-gray-500">
                                            No hay permisos registrados.
                                        </td>
                                    </tr>
                                ) : (
                                    permisos.map((permiso) => (
                                        <tr key={permiso.id_permiso} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="py-4 px-6 text-sm text-gray-400 font-medium">{permiso.id_permiso}</td>
                                            <td className="py-4 px-6">
                                                <span className="inline-block text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md tracking-wider">
                                                    {permiso.nombre}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-sm text-gray-600">{permiso.modulo || 'General'}</td>
                                            <td className="py-4 px-6 text-sm text-gray-500">{permiso.descripcion || 'Sin descripción'}</td>
                                            <td className="py-4 px-6 text-right">
                                                <button className="text-xs font-semibold text-red-500 hover:text-red-700 hover:underline transition-colors">
                                                    Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}
