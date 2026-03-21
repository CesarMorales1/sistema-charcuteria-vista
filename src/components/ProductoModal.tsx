import { useState, useEffect } from 'react';
import { X, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { inventarioApi, ProductoInventario, Categoria, UnidadMedida } from '../services/inventarioApi';

interface ProductoModalProps {
  producto: ProductoInventario | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ProductoModal({ producto, onClose, onSaved }: ProductoModalProps) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    nombre: producto?.nombre || '',
    id_categoria: producto?.id_categoria || 0,
    id_unidad_medida: producto?.id_unidad_medida || 0,
    codigo_barra: producto?.codigo_barra || '',
    descripcion: producto?.descripcion || '',
    peso_unitario: producto?.peso_unitario || '',
  });

  useEffect(() => {
    const loadCatalogos = async () => {
      try {
        const [cats, unis] = await Promise.all([
          inventarioApi.getCategorias(),
          inventarioApi.getUnidadesMedida(),
        ]);
        setCategorias(cats);
        setUnidades(unis);
      } catch (err) {
        setError('Error al cargar catálogos');
      }
    };
    loadCatalogos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    if (!formData.id_categoria || formData.id_categoria === 0) {
      setError('Debe seleccionar una categoría');
      return;
    }

    if (!formData.id_unidad_medida || formData.id_unidad_medida === 0) {
      setError('Debe seleccionar una unidad de medida');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        nombre: formData.nombre.trim(),
        id_categoria: formData.id_categoria,
        id_unidad_medida: formData.id_unidad_medida,
        codigo_barra: formData.codigo_barra.trim() || undefined,
        descripcion: formData.descripcion.trim() || undefined,
        peso_unitario: formData.peso_unitario ? Number(formData.peso_unitario) : undefined,
      };

      if (producto) {
        await inventarioApi.updateProducto(producto.id_producto, payload);
      } else {
        await inventarioApi.createProducto(payload);
      }

      setSuccess(true);
      setTimeout(() => {
        onSaved();
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-50 pt-8 pb-8 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {producto ? 'Editar Producto' : 'Nuevo Producto'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Complete la información del producto
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X size={18} className="text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
              <p className="text-sm font-medium text-emerald-700">
                Producto {producto ? 'actualizado' : 'creado'} exitosamente
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nombre del Producto <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={e => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm"
              placeholder="Ej: Jamón Serrano Premium"
              disabled={loading || success}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Categoría <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.id_categoria}
                onChange={e => setFormData({ ...formData, id_categoria: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm"
                disabled={loading || success}
              >
                <option value={0}>Seleccionar...</option>
                {categorias.map(c => (
                  <option key={c.id_categoria} value={c.id_categoria}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Unidad de Medida <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.id_unidad_medida}
                onChange={e => setFormData({ ...formData, id_unidad_medida: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm"
                disabled={loading || success}
              >
                <option value={0}>Seleccionar...</option>
                {unidades.map(u => (
                  <option key={u.id_unidad_medida} value={u.id_unidad_medida}>
                    {u.nombre} ({u.abreviatura})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Código de Barras
              </label>
              <input
                type="text"
                value={formData.codigo_barra}
                onChange={e => setFormData({ ...formData, codigo_barra: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm font-mono"
                placeholder="Ej: 123456789012"
                disabled={loading || success}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Peso Unitario
              </label>
              <input
                type="number"
                step="0.001"
                value={formData.peso_unitario}
                onChange={e => setFormData({ ...formData, peso_unitario: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm"
                placeholder="Ej: 0.250"
                disabled={loading || success}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm resize-none"
              rows={3}
              placeholder="Descripción adicional del producto..."
              disabled={loading || success}
            />
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              disabled={loading || success}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader size={14} className="animate-spin" />}
              {producto ? 'Actualizar' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
