import { useState } from 'react';
import { Plus, Loader, AlertCircle, Package2 } from 'lucide-react';
import { api, CategoriaProducto, UnidadMedida } from '../services/api';

interface QuickAddProductFormProps {
    searchTerm: string;
    categorias: CategoriaProducto[];
    unidadesMedida: UnidadMedida[];
    onSuccess: (productId: number, productName: string) => void;
    onCancel: () => void;
    onProductsRefresh: () => void;
}

export default function QuickAddProductForm({
    searchTerm,
    categorias,
    unidadesMedida,
    onSuccess,
    onCancel,
    onProductsRefresh
}: QuickAddProductFormProps) {
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        nombre: searchTerm,
        codigo_barra: '',
        id_categoria: '' as number | '',
        id_unidad_medida: '' as number | '',
        descripcion: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nombre.trim() || !formData.codigo_barra.trim()) {
            setError('Nombre y Código de Barras son obligatorios');
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            const nuevo = await api.createProducto({
                nombre: formData.nombre.trim(),
                codigo_barra: formData.codigo_barra.trim(),
                ...(formData.descripcion && { descripcion: formData.descripcion }),
                ...(formData.id_categoria && { id_categoria: Number(formData.id_categoria) }),
                ...(formData.id_unidad_medida && { id_unidad_medida: Number(formData.id_unidad_medida) }),
            });

            onProductsRefresh();
            onSuccess(nuevo.id_producto, nuevo.nombre);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al crear producto');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="p-4 bg-gradient-to-br from-emerald-50 to-white border-t-2 border-emerald-200">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <Package2 size={16} className="text-white" />
                </div>
                <div>
                    <h5 className="text-xs font-black text-emerald-700 uppercase">Crear Producto Nuevo</h5>
                    <p className="text-xs text-emerald-600 font-medium">Se seleccionará automáticamente</p>
                </div>
            </div>

            {error && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-700 font-medium">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-2.5">
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                        Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.nombre}
                        onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                        placeholder="Nombre del producto"
                        required
                        autoFocus
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold"
                    />
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Cód. Barra <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.codigo_barra}
                            onChange={e => setFormData({ ...formData, codigo_barra: e.target.value })}
                            placeholder="123456"
                            required
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono font-semibold"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Categoría</label>
                        <select
                            value={formData.id_categoria}
                            onChange={e => setFormData({ ...formData, id_categoria: e.target.value ? parseInt(e.target.value) : '' })}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold bg-white"
                        >
                            <option value="">Ninguna</option>
                            {categorias.map(c => (
                                <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Unidad</label>
                        <select
                            value={formData.id_unidad_medida}
                            onChange={e => setFormData({ ...formData, id_unidad_medida: e.target.value ? parseInt(e.target.value) : '' })}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold bg-white"
                        >
                            <option value="">Ninguna</option>
                            {unidadesMedida.map(u => (
                                <option key={u.id_unidad_medida} value={u.id_unidad_medida}>{u.abreviatura}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Descripción</label>
                        <input
                            type="text"
                            value={formData.descripcion}
                            onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                            placeholder="Opcional"
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isCreating}
                        className="flex-1 px-3 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-bold text-xs transition-all disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isCreating || !formData.nombre.trim() || !formData.codigo_barra.trim()}
                        className="flex-1 px-3 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:shadow-lg font-bold text-xs transition-all disabled:opacity-60 flex items-center justify-center gap-1.5"
                    >
                        {isCreating ? (
                            <>
                                <Loader size={12} className="animate-spin" />
                                Creando...
                            </>
                        ) : (
                            <>
                                <Plus size={12} />
                                Crear
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
