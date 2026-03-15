import { useState, useEffect, useCallback } from 'react';
import { api, Proveedor } from '../services/api';
import { Building2, RotateCw, Plus, Search, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function Proveedores() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    ruc: '',
    telefono: '',
    email: '',
    direccion: '',
    terminos_pago: ''
  });
  
  const loadProveedores = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getProveedores(1, 100, searchTerm);
      setProveedores(data.data);
    } catch (err) {
      if (err instanceof Error && err.message.includes('403')) {
        setError('No tienes permisos para acceder a este módulo. (Requiere: GESTION_PROVEEDORES)');
      } else {
        setError(err instanceof Error ? err.message : 'Error al cargar proveedores');
      }
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadProveedores();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [loadProveedores]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      setFormError('El nombre es obligatorio');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      
      const payload = {
        ...formData,
        ruc: formData.ruc || undefined,
        telefono: formData.telefono || undefined,
        email: formData.email || undefined,
        direccion: formData.direccion || undefined,
        terminos_pago: formData.terminos_pago || undefined,
      };

      if (editingId) {
        const updatedProveedor = await api.updateProveedor(editingId, payload);
        setProveedores(prev => prev.map(p => p.id_proveedor === editingId ? updatedProveedor : p));
      } else {
        const newProveedor = await api.createProveedor(payload);
        setProveedores(prev => [newProveedor, ...prev]);
      }
      
      setIsModalOpen(false);
      
      // Reset form
      setFormData({
        nombre: '', ruc: '', telefono: '', email: '', direccion: '', terminos_pago: ''
      });
      setEditingId(null);
      
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar el proveedor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (proveedor: Proveedor) => {
    setEditingId(proveedor.id_proveedor);
    setFormData({
      nombre: proveedor.nombre,
      ruc: proveedor.ruc || '',
      telefono: proveedor.telefono || '',
      email: proveedor.email || '',
      direccion: proveedor.direccion || '',
      terminos_pago: proveedor.terminos_pago || ''
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (proveedor: Proveedor) => {
    try {
      // Optimistic update
      setProveedores(prev => prev.map(p => 
        p.id_proveedor === proveedor.id_proveedor 
          ? { ...p, activo: !proveedor.activo } 
          : p
      ));

      if (proveedor.activo) {
        await api.deleteProveedor(proveedor.id_proveedor);
      } else {
        await api.updateProveedor(proveedor.id_proveedor, { activo: true });
      }
    } catch (err) {
      // Revert if error
      setProveedores(prev => prev.map(p => 
        p.id_proveedor === proveedor.id_proveedor 
          ? { ...p, activo: proveedor.activo } 
          : p
      ));
      alert('Error al cambiar el estado del proveedor');
    }
  };
  
  const handleAddNewClick = () => {
    setEditingId(null);
    setFormData({
      nombre: '', ruc: '', telefono: '', email: '', direccion: '', terminos_pago: ''
    });
    setFormError(null);
    setIsModalOpen(true);
  };
  
  return (
    <div className="min-h-screen flex bg-[#FDFBF7] relative">
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden h-screen">
        <header className="bg-white px-8 py-6 border-b border-gray-100 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <Building2 size={24} className="text-red-500" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">Proveedores</h2>
              <p className="text-xs text-gray-500">Gestión de proveedores — GET /api/proveedores</p>
            </div>
          </div>
          <button 
            onClick={loadProveedores}
            disabled={isLoading || isSubmitting}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RotateCw size={16} className={`text-blue-500 ${isLoading ? 'animate-spin' : ''}`} />
            Recargar
          </button>
        </header>

        <div className="p-8 flex-1 overflow-y-auto w-full">
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-lg border border-red-200 text-sm max-w-6xl mx-auto flex items-start gap-2">
                <span className="font-bold">Acceso denegado:</span>
              {error}
            </div>
          )}

           <div className="max-w-6xl mx-auto">
                {/* Actions Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <p className="text-sm text-gray-500">{proveedores.length} proveedor(es) registrados</p>
                    
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search size={16} className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar proveedor..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-white"
                            />
                        </div>
                        <button 
                            onClick={handleAddNewClick}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#D98A19] hover:bg-[#c27914] text-white text-sm font-bold rounded-lg transition-colors shadow-sm shrink-0"
                        >
                            <Plus size={16} strokeWidth={3} />
                            Nuevo proveedor
                        </button>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="py-4 px-6 text-sm font-semibold text-gray-700 w-16">#</th>
                                    <th className="py-4 px-6 text-sm font-semibold text-gray-700">Nombre / RUC</th>
                                    <th className="py-4 px-6 text-sm font-semibold text-gray-700">Contacto</th>
                                    <th className="py-4 px-6 text-sm font-semibold text-gray-700">Términos</th>
                                    <th className="py-4 px-6 text-sm font-semibold text-gray-700 w-24 text-center">Estado</th>
                                    <th className="py-4 px-6 text-sm font-semibold text-gray-700 w-24 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoading && proveedores.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-sm text-gray-500">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <RotateCw className="animate-spin text-amber-500" size={24} />
                                                Cargando proveedores...
                                            </div>
                                        </td>
                                    </tr>
                                ) : proveedores.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-sm text-gray-500">
                                            {error ? 'No se pueden mostrar los proveedores.' : 'No se encontraron proveedores que coincidan con la búsqueda.'}
                                        </td>
                                    </tr>
                                ) : (
                                    proveedores.map((proveedor) => (
                                        <tr key={proveedor.id_proveedor} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="py-4 px-6 text-sm text-gray-400 font-medium">
                                                {proveedor.id_proveedor}
                                            </td>
                                            <td className="py-4 px-6">
                                                <p className="text-sm font-bold text-gray-900">{proveedor.nombre}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{proveedor.ruc || 'Sin RUC'}</p>
                                            </td>
                                            <td className="py-4 px-6">
                                                <p className="text-sm text-gray-700">{proveedor.telefono || 'Sin teléfono'}</p>
                                                <p className="text-xs text-gray-500">{proveedor.email || 'Sin email'}</p>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-600 text-[10px] font-medium uppercase tracking-wider">
                                                    {proveedor.terminos_pago || 'CONTADO'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <div className="flex justify-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                                        proveedor.activo ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                                                    }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${proveedor.activo ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                                        {proveedor.activo ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button 
                                                        onClick={() => handleEditClick(proveedor)}
                                                        className="text-xs font-semibold text-blue-500 hover:text-blue-700 transition-colors"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button 
                                                        onClick={() => handleToggleStatus(proveedor)}
                                                        className={`text-xs font-semibold transition-colors ${
                                                          proveedor.activo ? 'text-red-500 hover:text-red-700' : 'text-emerald-500 hover:text-emerald-700'
                                                        }`}
                                                    >
                                                        {proveedor.activo ? 'Desactivar' : 'Activar'}
                                                    </button>
                                                </div>
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

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">{editingId ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="p-6">
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                  {formError}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre / Razón Social <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    value={formData.nombre}
                    onChange={e => setFormData(p => ({...p, nombre: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
                    placeholder="Distribuidora Ejemplo C.A."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RUC / RIF</label>
                    <input 
                      type="text" 
                      value={formData.ruc}
                      onChange={e => setFormData(p => ({...p, ruc: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
                      placeholder="J-12345678-9"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input 
                      type="text" 
                      value={formData.telefono}
                      onChange={e => setFormData(p => ({...p, telefono: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
                      placeholder="+58 412 0000000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={e => setFormData(p => ({...p, email: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
                      placeholder="contacto@empresa.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Términos de Pago</label>
                    <input 
                      type="text" 
                      value={formData.terminos_pago}
                      onChange={e => setFormData(p => ({...p, terminos_pago: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
                      placeholder="Contado, 15 días, etc."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Física</label>
                  <textarea 
                    value={formData.direccion}
                    onChange={e => setFormData(p => ({...p, direccion: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm resize-none"
                    rows={2}
                    placeholder="Dirección completa del proveedor"
                  ></textarea>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2 bg-[#D98A19] hover:bg-[#c27914] text-white text-sm font-bold rounded-lg transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting && <RotateCw size={14} className="animate-spin" />}
                  {isSubmitting ? 'Guardando...' : (editingId ? 'Actualizar Proveedor' : 'Crear Proveedor')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
