import { useState, useEffect, useCallback } from 'react';
import { api, Producto, CategoriaProducto, UnidadMedida, PaginatedResponse } from '../services/api';
import Sidebar from '../components/Sidebar';
import { Package2, Plus, Search, Pencil, Trash2, RefreshCw, X, Check, AlertCircle, Loader } from 'lucide-react';

// ----- Types -----
interface ProductFormData {
  nombre: string;
  codigo_barra: string;
  descripcion: string;
  id_categoria: number | '';
  id_unidad_medida: number | '';
  peso_unitario: string;
}

const emptyForm = (): ProductFormData => ({
  nombre: '',
  codigo_barra: '',
  descripcion: '',
  id_categoria: '',
  id_unidad_medida: '',
  peso_unitario: '',
});

// ----- Helper to extract stock quantity -----
const getStock = (inv: Producto['inventario_general']): number => {
  if (!inv) return 0;
  if (typeof inv === 'object') return inv.cantidad_actual ?? 0;
  return inv;
};

export default function Productos() {
  // ----- Data state -----
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<CategoriaProducto[]>([]);
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);

  // ----- UI state -----
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [refsError, setRefsError] = useState<string | null>(null);

  // ----- Pagination & search -----
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // ----- Modal state -----
  const [showModal, setShowModal] = useState(false);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyForm());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canView = true;    // TEMPORARY: bypass permissions
  const canManage = true;  // TEMPORARY: bypass permissions

  // ----- Load reference data on mount -----
  useEffect(() => {
    const loadRefs = async () => {
      try {
        const [cats, units] = await Promise.all([
          api.getCategorias(),
          api.getUnidadesMedida(),
        ]);
        if (!cats.length || !units.length) {
          setRefsError('No se pudieron cargar las categorías o unidades de medida. Verifica la conexión con el servidor.');
        } else {
          setRefsError(null);
        }
        setCategorias(cats);
        setUnidades(units);
      } catch (err) {
        setRefsError('Error al cargar categorías y unidades. El formulario puede no funcionar correctamente.');
      }
    };
    loadRefs();
  }, []);

  // ----- Load productos -----
  const loadProductos = useCallback(async (page = 1, search = '') => {
    if (!canView) {
      setError('No tienes permisos para ver inventario');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response: PaginatedResponse<Producto> = await api.getProductos(page, 10, search);
      setProductos(response.data);
      setCurrentPage(response.meta.page);
      setTotalPages(response.meta.totalPages);
      setTotalItems(response.meta.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar productos';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProductos(1, searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, loadProductos]);

  // ----- Modal helpers -----
  const openModal = (producto?: Producto) => {
    if (producto) {
      setEditingProducto(producto);
      setFormData({
        nombre: producto.nombre,
        codigo_barra: producto.codigo_barra || '',
        descripcion: producto.descripcion || '',
        id_categoria: typeof producto.categoria === 'object' && producto.categoria ? producto.categoria.id_categoria : (producto.id_categoria || ''),
        id_unidad_medida: typeof producto.unidad_medida === 'object' && producto.unidad_medida ? producto.unidad_medida.id_unidad_medida : (producto.id_unidad_medida || ''),
        peso_unitario: producto.peso_unitario != null ? String(producto.peso_unitario) : '',
      });
    } else {
      setEditingProducto(null);
      setFormData(emptyForm());
    }
    setFormErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProducto(null);
    setFormData(emptyForm());
    setFormErrors({});
  };

  // ----- Validation -----
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.nombre.trim()) errors.nombre = 'El nombre es requerido';
    else if (formData.nombre.length > 100) errors.nombre = 'El nombre no puede exceder 100 caracteres';
    if (formData.id_categoria === '' || !Number.isFinite(Number(formData.id_categoria))) errors.id_categoria = 'Selecciona una categoría válida';
    if (formData.id_unidad_medida === '' || !Number.isFinite(Number(formData.id_unidad_medida))) errors.id_unidad_medida = 'Selecciona una unidad de medida válida';
    if (formData.peso_unitario && isNaN(Number(formData.peso_unitario))) errors.peso_unitario = 'El peso debe ser un número';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ----- Submit -----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !canManage) return;

    const idCategoria = Number(formData.id_categoria);
    const idUnidad = Number(formData.id_unidad_medida);

    if (!Number.isFinite(idCategoria) || idCategoria < 1) {
      setFormErrors(prev => ({ ...prev, id_categoria: 'Selecciona una categoría válida' }));
      return;
    }
    if (!Number.isFinite(idUnidad) || idUnidad < 1) {
      setFormErrors(prev => ({ ...prev, id_unidad_medida: 'Selecciona una unidad de medida válida' }));
      return;
    }

    const payload = {
      nombre: formData.nombre,
      codigo_barra: formData.codigo_barra || undefined,
      descripcion: formData.descripcion || undefined,
      id_categoria: idCategoria,
      id_unidad_medida: idUnidad,
      peso_unitario: formData.peso_unitario ? parseFloat(formData.peso_unitario) : undefined,
    };

    setIsSubmitting(true);
    try {
      if (editingProducto) {
        await api.updateProducto(editingProducto.id_producto, payload);
        showSuccess('Producto actualizado exitosamente');
      } else {
        await api.createProducto(payload as Omit<Producto, 'id_producto' | 'activo'>);
        showSuccess('Producto creado exitosamente');
      }
      closeModal();
      loadProductos(currentPage, searchTerm);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar producto';
      setFormErrors({ submit: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----- Toggle active -----
  const handleToggleProducto = async (producto: Producto) => {
    if (!canManage) return;
    try {
      setProductos(prev => prev.map(p =>
        p.id_producto === producto.id_producto ? { ...p, activo: !producto.activo } : p
      ));
      await api.deleteProducto(producto.id_producto);
      showSuccess(`Producto ${producto.activo ? 'desactivado' : 'activado'} exitosamente`);
      await loadProductos(currentPage, searchTerm);
    } catch (err) {
      // Revert
      setProductos(prev => prev.map(p =>
        p.id_producto === producto.id_producto ? { ...p, activo: producto.activo } : p
      ));
      setError(err instanceof Error ? err.message : 'Error al actualizar producto');
      setTimeout(() => setError(null), 3000);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  // ----- Helpers for display -----
  const getCatName = (p: Producto): string => {
    if (p.categoria && typeof p.categoria === 'object') return p.categoria.nombre;
    return '—';
  };

  const getUnitName = (p: Producto): string => {
    if (p.unidad_medida && typeof p.unidad_medida === 'object') return p.unidad_medida.abreviatura || p.unidad_medida.nombre;
    return '—';
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#FDFBF7] via-[#FDF8F0] to-[#FCF5E9]">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm px-8 py-6 border-b border-gray-100 shadow-sm sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <Package2 size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 leading-tight">Productos</h2>
                <p className="text-sm text-gray-500 mt-0.5">{totalItems} producto(s) en el catálogo</p>
              </div>
            </div>
            <button
              onClick={() => loadProductos(currentPage, searchTerm)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span className="text-sm font-medium text-gray-700">Recargar</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {/* Notifications */}
            {successMessage && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                <Check size={18} className="text-emerald-600 flex-shrink-0" />
                <p className="text-sm font-medium text-emerald-700">{successMessage}</p>
              </div>
            )}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            )}

            {/* Table Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Search & Actions Bar */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                  />
                </div>
                {canManage && (
                  <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all font-medium whitespace-nowrap text-sm"
                  >
                    <Plus size={16} strokeWidth={3} />
                    Nuevo Producto
                  </button>
                )}
              </div>

              {/* Table */}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader size={30} className="text-emerald-500 animate-spin" />
                </div>
              ) : productos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Package2 size={48} className="text-gray-200 mb-3" />
                  <p className="text-gray-500 font-medium">
                    {searchTerm ? 'Sin resultados para tu búsqueda' : 'No hay productos aún'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">#</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Producto</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Categoría</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Unidad</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Stock G.</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Stock L.</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Estado</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {productos.map((producto, idx) => (
                        <tr key={producto.id_producto} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-500">{(currentPage - 1) * 10 + idx + 1}</td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{producto.nombre}</p>
                              {producto.codigo_barra && (
                                <p className="text-xs text-gray-400 font-mono mt-0.5">COD: {producto.codigo_barra}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{getCatName(producto)}</td>
                          <td className="px-6 py-4">
                            <span className="inline-block bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-1 rounded-md">
                              {getUnitName(producto)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {getStock(producto.inventario_general)}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {getStock(producto.inventario_legal)}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                              producto.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${producto.activo ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                              {producto.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-1">
                              {canManage && (
                                <>
                                  <button
                                    onClick={() => openModal(producto)}
                                    title="Editar"
                                    className="p-2 hover:bg-blue-50 rounded-lg transition-colors group"
                                  >
                                    <Pencil size={15} className="text-blue-500 group-hover:scale-110 transition-transform" />
                                  </button>
                                  <button
                                    onClick={() => handleToggleProducto(producto)}
                                    title={producto.activo ? 'Desactivar' : 'Activar'}
                                    className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                                  >
                                    <Trash2 size={15} className={`${producto.activo ? 'text-red-500' : 'text-emerald-500'} group-hover:scale-110 transition-transform`} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm">
                  <p className="text-gray-500">Mostrando {productos.length} de {totalItems}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors font-medium"
                    >Anterior</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                      <button
                        key={n}
                        onClick={() => setCurrentPage(n)}
                        className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${currentPage === n ? 'bg-emerald-500 text-white' : 'border border-gray-200 hover:bg-gray-50'}`}
                      >{n}</button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors font-medium"
                    >Siguiente</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">
                {editingProducto ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {refsError && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                  <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />
                  <p className="text-sm font-medium text-amber-700">{refsError}</p>
                </div>
              )}
              {formErrors.submit && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                  <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
                  <p className="text-sm font-medium text-red-700">{formErrors.submit}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Nombre */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">Nombre del Producto *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                    maxLength={100}
                    placeholder="Ej: Jamón Cocido"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm ${formErrors.nombre ? 'border-red-300' : 'border-gray-200'}`}
                  />
                  {formErrors.nombre && <p className="text-xs text-red-600 mt-1">{formErrors.nombre}</p>}
                </div>

                {/* Código de Barras */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">Código de Barras</label>
                  <input
                    type="text"
                    value={formData.codigo_barra}
                    onChange={e => setFormData({ ...formData, codigo_barra: e.target.value })}
                    placeholder="Ej: 7501234567890"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                  />
                </div>

                {/* Peso Unitario */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">Peso / Cantidad por Unidad</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.peso_unitario}
                    onChange={e => setFormData({ ...formData, peso_unitario: e.target.value })}
                    placeholder="Ej: 1.5"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm ${formErrors.peso_unitario ? 'border-red-300' : 'border-gray-200'}`}
                  />
                  {formErrors.peso_unitario && <p className="text-xs text-red-600 mt-1">{formErrors.peso_unitario}</p>}
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">Categoría *</label>
                  <select
                    value={formData.id_categoria}
                    onChange={e => setFormData({ ...formData, id_categoria: e.target.value ? parseInt(e.target.value) : '' })}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm bg-white ${formErrors.id_categoria ? 'border-red-300' : 'border-gray-200'}`}
                  >
                    <option value="">-- Seleccionar --</option>
                    {categorias.map(c => (
                      <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
                    ))}
                  </select>
                  {formErrors.id_categoria && <p className="text-xs text-red-600 mt-1">{formErrors.id_categoria}</p>}
                </div>

                {/* Unidad de Medida */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">Unidad de Medida *</label>
                  <select
                    value={formData.id_unidad_medida}
                    onChange={e => setFormData({ ...formData, id_unidad_medida: e.target.value ? parseInt(e.target.value) : '' })}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm bg-white ${formErrors.id_unidad_medida ? 'border-red-300' : 'border-gray-200'}`}
                  >
                    <option value="">-- Seleccionar --</option>
                    {unidades.map(u => (
                      <option key={u.id_unidad_medida} value={u.id_unidad_medida}>{u.nombre} ({u.abreviatura})</option>
                    ))}
                  </select>
                  {formErrors.id_unidad_medida && <p className="text-xs text-red-600 mt-1">{formErrors.id_unidad_medida}</p>}
                </div>

                {/* Descripción */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">Descripción</label>
                  <textarea
                    rows={3}
                    value={formData.descripcion}
                    onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Descripción opcional del producto..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm"
                >Cancelar</button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:shadow-lg font-medium transition-all disabled:opacity-60 flex items-center gap-2 text-sm"
                >
                  {isSubmitting && <Loader size={14} className="animate-spin" />}
                  {isSubmitting ? 'Guardando...' : (editingProducto ? 'Actualizar Producto' : 'Crear Producto')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
