import { useState, useRef, useEffect } from 'react';
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
    
    // El searchTerm ahora es el código de barras que la persona escaneó/escribió
    const [formData, setFormData] = useState({
        nombre: '',
        codigo_barra: searchTerm,
        id_categoria: '' as number | '',
        id_unidad_medida: '' as number | '',
    });

    // Refs para navegación de teclado
    const nombreRef = useRef<HTMLInputElement>(null);
    const categoriaRef = useRef<HTMLSelectElement>(null);
    const unidadRef = useRef<HTMLSelectElement>(null);
    const submitBtnRef = useRef<HTMLButtonElement>(null);

    // Cancel on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onCancel]);

    const handleEnterPress = (e: React.KeyboardEvent, nextRef: React.RefObject<HTMLElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            nextRef.current?.focus();
        }
    };

    const unidadesFiltradas = unidadesMedida.filter(u => 
        ['kg', 'l', 'und'].includes(u.abreviatura.toLowerCase())
    );

    const handleSubmit = async (e: React.MouseEvent | React.KeyboardEvent) => {
        e.preventDefault();
        e.stopPropagation();
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
        <div className="p-6 bg-gradient-to-br from-emerald-50/50 to-white">
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-200">
                    <Package2 size={20} className="text-white" />
                </div>
                <div>
                    <h5 className="text-sm font-black text-emerald-800 uppercase tracking-tight">Crear Producto Nuevo</h5>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase">Selección automática al guardar</p>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border-2 border-red-100 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-700 font-bold leading-tight">{error}</p>
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label className="block text-[11px] font-black text-gray-500 mb-1.5 uppercase tracking-wider ml-1">
                        Nombre del Producto <span className="text-red-500">*</span>
                    </label>
                    <input
                        ref={nombreRef}
                        type="text"
                        value={formData.nombre}
                        onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                        onKeyDown={e => handleEnterPress(e, categoriaRef)}
                        placeholder="Escriba el nombre..."
                        required
                        autoFocus
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm font-bold transition-all bg-white/50 focus:bg-white"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[11px] font-black text-gray-500 mb-1.5 uppercase tracking-wider ml-1">
                            Cód. Barra <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.codigo_barra}
                            onChange={e => setFormData({ ...formData, codigo_barra: e.target.value })}
                            placeholder="Ej: 759..."
                            required
                            readOnly
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm font-mono font-bold bg-gray-100 text-gray-500"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-black text-gray-500 mb-1.5 uppercase tracking-wider ml-1">Categoría</label>
                        <select
                            ref={categoriaRef}
                            value={formData.id_categoria}
                            onChange={e => {
                                setFormData({ ...formData, id_categoria: e.target.value ? parseInt(e.target.value) : '' });
                                if (e.target.value) {
                                    setTimeout(() => unidadRef.current?.focus(), 50);
                                }
                            }}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    try {
                                        if ('showPicker' in HTMLSelectElement.prototype) {
                                            (e.target as HTMLSelectElement).showPicker();
                                        }
                                    } catch (err) {
                                        // Fallback si no está soportado o ya está abierto
                                    }
                                }
                            }}
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm font-bold transition-all bg-white/50 focus:bg-white appearance-none cursor-pointer"
                        >
                            <option value="">Sin Categoría</option>
                            {categorias.map(c => (
                                <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-[11px] font-black text-gray-500 mb-1.5 uppercase tracking-wider ml-1">Unidad</label>
                    <select
                        ref={unidadRef}
                        value={formData.id_unidad_medida}
                        onChange={e => {
                            setFormData({ ...formData, id_unidad_medida: e.target.value ? parseInt(e.target.value) : '' });
                            if (e.target.value) {
                                setTimeout(() => submitBtnRef.current?.focus(), 50);
                            }
                        }}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                try {
                                    if ('showPicker' in HTMLSelectElement.prototype) {
                                        (e.target as HTMLSelectElement).showPicker();
                                    }
                                } catch (err) {
                                    // Fallback si no está soportado o ya está abierto
                                }
                            }
                        }}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm font-bold transition-all bg-white/50 focus:bg-white appearance-none cursor-pointer"
                    >
                        <option value="">Seleccione Unidad...</option>
                        {unidadesFiltradas.map(u => (
                            <option key={u.id_unidad_medida} value={u.id_unidad_medida}>{u.abreviatura}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isCreating}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        ref={submitBtnRef}
                        type="button"
                        onClick={handleSubmit}
                        disabled={isCreating || !formData.nombre.trim() || !formData.codigo_barra.trim()}
                        className="flex-[1.5] px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 font-black text-xs uppercase tracking-widest transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {isCreating ? (
                            <>
                                <Loader size={14} className="animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Plus size={14} strokeWidth={3} />
                                Guardar
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
