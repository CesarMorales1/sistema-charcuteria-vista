import { useRef, useState, useEffect, useCallback } from 'react';
import { Search, X, Trash2, Plus } from 'lucide-react';
import { Producto, CategoriaProducto, UnidadMedida } from '../services/api';
import QuickAddProductForm from './QuickAddProductForm';

interface LineaDetalle {
    tempId: string;
    id_producto: number | '';
    cantidad: string;
    precio_unitario: string;
    subtotal: number;
    aplicar_iva: boolean;
    producto?: Producto;
}

interface ProductLineItemProps {
    linea: LineaDetalle;
    index: number;
    productos: Producto[];
    productosSeleccionados: (number | '')[];
    categorias: CategoriaProducto[];
    unidadesMedida: UnidadMedida[];
    onChange: (field: keyof LineaDetalle, value: any) => void;
    onRemove: () => void;
    canRemove: boolean;
    onProductsRefresh: () => void;
    onAddNewLine?: () => void;
}

export default function ProductLineItem({
    linea,
    index,
    productos,
    productosSeleccionados,
    categorias,
    unidadesMedida,
    onChange,
    onRemove,
    canRemove,
    onProductsRefresh,
    onAddNewLine
}: ProductLineItemProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const updatePosition = useCallback(() => {
        if (inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect();
            setDropdownPos({
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width
            });
        }
    }, []);

    useEffect(() => {
        if (showDropdown) {
            updatePosition();
            // Listen to scroll events in the entire capture phase to catch scrolls in parent containers
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
        }
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [showDropdown, updatePosition]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                inputRef.current && !inputRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
                setShowQuickAdd(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getProductosFiltrados = () => {
        const search = searchTerm.toLowerCase();
        let filtrados = productos.filter(p => !productosSeleccionados.includes(p.id_producto));

        if (!search) return filtrados.slice(0, 50);

        return filtrados.filter(p =>
            p.codigo_barra?.toLowerCase().includes(search) ||
            p.nombre.toLowerCase().includes(search)
        ).slice(0, 50);
    };


    const handleQuickAddSuccess = (productId: number, _productName: string) => {
        onChange('id_producto', productId);
        setSearchTerm('');
        setShowDropdown(false);
        setShowQuickAdd(false);
        
        // Foco automático a "Cantidad" luego de crear el producto
        setTimeout(() => {
            const cantidadInput = document.getElementById(`cantidad-prod-${index}`);
            if (cantidadInput) cantidadInput.focus();
        }, 50);
    };

    const productosFiltrados = getProductosFiltrados();
    const productoSeleccionado = linea.id_producto
        ? productos.find(p => p.id_producto === linea.id_producto)
        : null;

    return (
        <tr className="hover:bg-blue-50/50 transition-colors">
            <td className="px-4 py-3 w-12">
                <span className="inline-flex items-center justify-center w-7 h-7 bg-blue-100 text-blue-700 rounded-lg text-xs font-black">
                    {index + 1}
                </span>
            </td>
            <td className="px-4 py-3 min-w-[280px]">
                <div className="relative" ref={dropdownRef}>
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
                    <input
                        id={`search-prod-${index}`}
                        ref={inputRef}
                        type="text"
                        placeholder="Escanear o buscar código de barra..."
                        value={productoSeleccionado ? productoSeleccionado.nombre : searchTerm}
                        onChange={e => {
                            if (!linea.id_producto) {
                                setSearchTerm(e.target.value);
                                setShowDropdown(true);
                                setShowQuickAdd(false);
                            }
                        }}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !linea.id_producto) {
                                e.preventDefault();
                                
                                if (!searchTerm.trim()) {
                                    // Si el escáner está vacío y se presiona Enter, el usuario terminó de registrar líneas.
                                    // Mandamos el cursor directamente al botón de enviar compra.
                                    const submitBtn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
                                    if (submitBtn) submitBtn.focus();
                                    return;
                                }

                                if (productosFiltrados.length === 0) {
                                    setShowQuickAdd(true);
                                } else if (productosFiltrados.length > 0) {
                                    // Comportamiento inteligente: autoseleccionar si hay coincidencia exacta por código
                                    const exactMatch = productosFiltrados.find(p => p.codigo_barra === searchTerm);
                                    const prodToSelect = exactMatch || productosFiltrados[0];
                                    
                                    onChange('id_producto', prodToSelect.id_producto);
                                    setSearchTerm('');
                                    setShowDropdown(false);
                                    
                                    // Jump to cantidad
                                    setTimeout(() => {
                                        const cantidadInput = document.getElementById(`cantidad-prod-${index}`);
                                        if (cantidadInput) cantidadInput.focus();
                                    }, 50);
                                }
                            }
                        }}
                        onFocus={() => {
                            if (!linea.id_producto) {
                                setShowDropdown(true);
                            }
                        }}
                        readOnly={!!linea.id_producto}
                        className="w-full pl-9 pr-9 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-semibold selection:bg-blue-200"
                    />
                    {linea.id_producto && (
                        <button
                            type="button"
                            onClick={() => {
                                onChange('id_producto', '');
                                setSearchTerm('');
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                        >
                            <X size={16} />
                        </button>
                    )}

                    {showDropdown && !linea.id_producto && (
                        <div 
                            className={`fixed bg-white border-2 border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col transition-all duration-300 ${showQuickAdd ? 'max-h-[600px] w-[450px]' : 'max-h-[350px] w-[350px]'}`}
                            style={{
                                top: `${dropdownPos.top}px`,
                                left: `${dropdownPos.left}px`,
                            }}
                        >
                            {!showQuickAdd ? (
                                <>
                                    <div className="overflow-y-auto flex-1">
                                        {productosFiltrados.length === 0 ? (
                                            <div className="p-4 text-center">
                                                <p className="text-xs text-gray-500 font-semibold mb-3">
                                                    {searchTerm ? 'No se encontraron productos' : 'No hay productos disponibles'}
                                                </p>
                                                {searchTerm && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowQuickAdd(true)}
                                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-300 border-dashed rounded-lg transition-all text-xs font-bold text-emerald-700"
                                                    >
                                                        <Plus size={14} />
                                                        Crear "{searchTerm}"
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <>
                                                {productosFiltrados.map(p => (
                                                    <button
                                                        key={p.id_producto}
                                                        type="button"
                                                        onClick={() => {
                                                            onChange('id_producto', p.id_producto);
                                                            setSearchTerm('');
                                                            setShowDropdown(false);
                                                            setTimeout(() => {
                                                                const cantidadInput = document.getElementById(`cantidad-prod-${index}`);
                                                                if (cantidadInput) cantidadInput.focus();
                                                            }, 50);
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors flex justify-between items-center group"
                                                    >
                                                        <div>
                                                            <div className="font-bold text-gray-900 text-xs">{p.nombre}</div>
                                                            {p.codigo_barra && (
                                                                <div className="text-[10px] text-gray-500 font-mono mt-0.5" title="Código de Barra">
                                                                    {p.codigo_barra}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] bg-gray-100 px-2 py-1 rounded font-black text-gray-500 opacity-60 group-hover:opacity-100 transition-opacity">
                                                            {p.codigo_barra || `ID ${p.id_producto}`}
                                                        </div>
                                                    </button>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const prodId = productoSeleccionado?.id_producto;
                                                        if (prodId) {
                                                            onChange('id_producto', prodId);
                                                            setSearchTerm('');
                                                            setShowDropdown(false);
                                                            setTimeout(() => {
                                                                const cantidadInput = document.getElementById(`cantidad-prod-${index}`);
                                                                if (cantidadInput) cantidadInput.focus();
                                                            }, 50);
                                                        }
                                                    }}
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 border-t-2 border-emerald-200 transition-all text-xs font-bold text-emerald-700 sticky bottom-0"
                                                >
                                                    <Plus size={12} />
                                                    Crear nuevo producto
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <QuickAddProductForm
                                    searchTerm={searchTerm}
                                    categorias={categorias}
                                    unidadesMedida={unidadesMedida}
                                    onSuccess={handleQuickAddSuccess}
                                    onCancel={() => setShowQuickAdd(false)}
                                    onProductsRefresh={onProductsRefresh}
                                />
                            )}
                        </div>
                    )}
                </div>
            </td>
            <td className="px-4 py-3 w-28">
                <input
                    id={`cantidad-prod-${index}`}
                    type="number"
                    step="0.01"
                    min="0"
                    required={!!linea.id_producto}
                    value={linea.cantidad}
                    onChange={e => onChange('cantidad', e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            const precioInput = document.getElementById(`precio-prod-${index}`);
                            if (precioInput) precioInput.focus();
                        }
                    }}
                    placeholder="0"
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm text-right font-bold"
                />
            </td>
            <td className="px-4 py-3 w-32">
                <input
                    id={`precio-prod-${index}`}
                    type="number"
                    step="0.01"
                    min="0"
                    required={!!linea.id_producto}
                    value={linea.precio_unitario}
                    onChange={e => onChange('precio_unitario', e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            // Como pidió el usuario, si el IVA no lo eligen déjalo sin elegir 
                            // y que salte directamente a agregar una nueva línea indefinidamente.
                            if (onAddNewLine) onAddNewLine();
                        }
                    }}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm text-right font-bold"
                />
            </td>
            <td className="px-4 py-3 w-32">
                <div className="text-sm font-black text-gray-900 text-right bg-gray-50 px-3 py-2 rounded-lg">
                    ${linea.subtotal.toFixed(2)}
                </div>
            </td>
            <td className="px-4 py-3 w-24">
                <div className="flex items-center justify-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={linea.aplicar_iva}
                            onChange={e => onChange('aplicar_iva', e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
                    </label>
                </div>
            </td>
            <td className="px-4 py-3 w-12 text-center">
                {canRemove && (
                    <button
                        type="button"
                        onClick={onRemove}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                        title="Eliminar línea"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </td>
        </tr>
    );
}
