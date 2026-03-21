import { useState, useEffect, useCallback } from 'react';
import { api, Compra, Proveedor, Producto, CreateCompraPayload } from '../services/api';
import Sidebar from '../components/Sidebar';
import ProductLineItem from '../components/ProductLineItem';
import {
    ShoppingCart, Plus, Search, RefreshCw, Eye, X, AlertCircle,
    Check, Loader, AlertTriangle, Package2, Calendar, Filter, XCircle
} from 'lucide-react';

interface LineaDetalle {
    tempId: string;
    id_producto: number | '';
    cantidad: string;
    precio_unitario: string;
    subtotal: number;
    aplicar_iva: boolean;
    producto?: Producto;
}

const emptyLinea = (): LineaDetalle => ({
    tempId: Math.random().toString(36).substring(7),
    id_producto: '',
    cantidad: '',
    precio_unitario: '',
    subtotal: 0,
    aplicar_iva: false
});

export default function Compras() {
    const [compras, setCompras] = useState<Compra[]>([]);
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [searchNumeroFactura, setSearchNumeroFactura] = useState('');
    const [searchFechaDesde, setSearchFechaDesde] = useState('');
    const [searchFechaHasta, setSearchFechaHasta] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedCompra, setSelectedCompra] = useState<Compra | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        id_proveedor: '' as number | '',
        numero_factura: '',
        reportable_seniat: false
    });

    const [lineas, setLineas] = useState<LineaDetalle[]>([emptyLinea()]);
    const [categorias, setCategorias] = useState<import('../services/api').CategoriaProducto[]>([]);
    const [unidadesMedida, setUnidadesMedida] = useState<import('../services/api').UnidadMedida[]>([]);

    const loadCompras = useCallback(async (
        page = 1,
        overrides?: { numero_factura?: string; fecha_desde?: string; fecha_hasta?: string }
    ) => {
        setLoading(true);
        setError(null);
        try {
            const nf = overrides !== undefined ? overrides.numero_factura : searchNumeroFactura;
            const fd = overrides !== undefined ? overrides.fecha_desde : searchFechaDesde;
            const fh = overrides !== undefined ? overrides.fecha_hasta : searchFechaHasta;
            const response = await api.getCompras(
                page,
                20,
                nf || undefined,
                fd || undefined,
                fh || undefined
            );
            setCompras(response.data);
            setCurrentPage(response.meta.page);
            setTotalPages(response.meta.totalPages);
            setTotalItems(response.meta.total);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar compras');
        } finally {
            setLoading(false);
        }
    }, [searchNumeroFactura, searchFechaDesde, searchFechaHasta]);

    const loadCatalogos = useCallback(async () => {
        try {
            const [provsRes, prodsRes, catsRes, umsRes] = await Promise.all([
                api.getProveedores(1, 1000, '', true),
                api.getProductos(1, 1000, '', true),
                api.getCategorias(),
                api.getUnidadesMedida()
            ]);
            setProveedores(provsRes.data);
            setProductos(prodsRes.data);
            setCategorias(catsRes);
            setUnidadesMedida(umsRes);
        } catch (err) {
            console.error('Error cargando catálogos:', err);
        }
    }, []);

    const refreshProductos = useCallback(async () => {
        try {
            const prodsRes = await api.getProductos(1, 1000, '', true);
            setProductos(prodsRes.data);
        } catch (err) {
            console.error('Error refrescando productos:', err);
        }
    }, []);

    useEffect(() => {
        loadCompras(1);
        loadCatalogos();
    }, [loadCompras, loadCatalogos]);

    const handleSearch = () => {
        setCurrentPage(1);
        loadCompras(1);
    };

    const handleClearFilters = () => {
        setSearchNumeroFactura('');
        setSearchFechaDesde('');
        setSearchFechaHasta('');
        setCurrentPage(1);
        loadCompras(1, { numero_factura: '', fecha_desde: '', fecha_hasta: '' });
    };

    const hasActiveFilters = searchNumeroFactura || searchFechaDesde || searchFechaHasta;

    const calcularSubtotalLinea = (cantidad: string, precio: string): number => {
        const cant = parseFloat(cantidad) || 0;
        const prec = parseFloat(precio) || 0;
        return cant * prec;
    };

    const calcularTotales = () => {
        let baseImponible = 0;
        let montoIva = 0;

        lineas.forEach(linea => {
            const subtotalLinea = linea.subtotal;
            baseImponible += subtotalLinea;

            if (linea.aplicar_iva) {
                montoIva += subtotalLinea * 0.16;
            }
        });

        const total = baseImponible + montoIva;

        return {
            baseImponible: Number(baseImponible.toFixed(2)),
            montoIva: Number(montoIva.toFixed(2)),
            total: Number(total.toFixed(2)),
            alicuotaIva: montoIva > 0 ? 16.00 : 0.00
        };
    };

    const handleLineaChange = (tempId: string, field: keyof LineaDetalle, value: any) => {
        setLineas(prev => prev.map(linea => {
            if (linea.tempId !== tempId) return linea;

            const updated = { ...linea, [field]: value };

            if (field === 'id_producto' && value) {
                const prod = productos.find(p => p.id_producto === value);
                updated.producto = prod;
            }

            if (field === 'cantidad' || field === 'precio_unitario') {
                updated.subtotal = calcularSubtotalLinea(
                    field === 'cantidad' ? value : updated.cantidad,
                    field === 'precio_unitario' ? value : updated.precio_unitario
                );
            }

            return updated;
        }));
    };

    const agregarLinea = () => {
        setLineas(prev => [...prev, emptyLinea()]);
    };

    const eliminarLinea = (tempId: string) => {
        if (lineas.length === 1) return;
        setLineas(prev => prev.filter(l => l.tempId !== tempId));
    };

    const openModal = () => {
        setFormData({
            id_proveedor: '',
            numero_factura: '',
            reportable_seniat: false
        });
        setLineas([emptyLinea()]);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setFormData({
            id_proveedor: '',
            numero_factura: '',
            reportable_seniat: false
        });
        setLineas([emptyLinea()]);
    };

    const validateForm = (): string | null => {
        if (!formData.id_proveedor) return 'Debes seleccionar un proveedor';
        if (lineas.length === 0) return 'Debes agregar al menos una línea de detalle';

        for (const linea of lineas) {
            if (!linea.id_producto) return 'Todas las líneas deben tener un producto seleccionado';
            if (!linea.cantidad || parseFloat(linea.cantidad) <= 0) return 'Todas las líneas deben tener cantidad válida';
            if (!linea.precio_unitario || parseFloat(linea.precio_unitario) <= 0) return 'Todas las líneas deben tener precio unitario válido';
        }

        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            setTimeout(() => setError(null), 4000);
            return;
        }

        const totales = calcularTotales();

        const payload: CreateCompraPayload = {
            id_proveedor: Number(formData.id_proveedor),
            numero_factura: formData.numero_factura || undefined,
            base_imponible: totales.baseImponible,
            alicuota_iva: totales.alicuotaIva,
            monto_iva: totales.montoIva,
            total: totales.total,
            reportable_seniat: formData.reportable_seniat,
            detalles: lineas.map(linea => ({
                id_producto: Number(linea.id_producto),
                cantidad: parseFloat(linea.cantidad),
                precio_unitario: parseFloat(linea.precio_unitario),
                aplicar_iva: linea.aplicar_iva
            }))
        };

        setIsSubmitting(true);
        try {
            await api.createCompra(payload);
            setSuccessMessage('Compra registrada exitosamente');
            setTimeout(() => setSuccessMessage(null), 3000);
            closeModal();
            loadCompras(currentPage);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al crear compra');
            setTimeout(() => setError(null), 4000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const viewDetail = async (compra: Compra) => {
        try {
            const detalle = await api.getCompra(compra.id_compra);
            setSelectedCompra(detalle);
            setShowDetailModal(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar detalle');
            setTimeout(() => setError(null), 3000);
        }
    };

    const totales = calcularTotales();

    const getEstadoBadge = (estado: string) => {
        const badges = {
            pendiente: 'bg-yellow-50 text-yellow-700 border-yellow-200',
            recibida: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            cancelada: 'bg-red-50 text-red-700 border-red-200'
        };
        return badges[estado as keyof typeof badges] || badges.pendiente;
    };

    const productosSeleccionados = lineas.map(l => l.id_producto).filter(Boolean);

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white/90 backdrop-blur-md px-8 py-6 border-b border-gray-200 shadow-sm sticky top-0 z-20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                                <ShoppingCart size={28} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900 leading-tight tracking-tight">Gestión de Compras</h2>
                                <p className="text-sm text-gray-600 mt-1 font-medium">{totalItems} {totalItems === 1 ? 'compra registrada' : 'compras registradas'}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => loadCompras(currentPage)}
                            disabled={loading}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-xl transition-all duration-200 disabled:opacity-50 hover:shadow-md"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                            <span className="text-sm font-semibold text-gray-700">Actualizar</span>
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {successMessage && (
                            <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-xl flex items-center gap-3 shadow-sm">
                                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Check size={20} className="text-white" />
                                </div>
                                <p className="text-sm font-semibold text-emerald-800">{successMessage}</p>
                            </div>
                        )}
                        {error && (
                            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl flex items-center gap-3 shadow-sm">
                                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <AlertCircle size={20} className="text-white" />
                                </div>
                                <p className="text-sm font-semibold text-red-800">{error}</p>
                            </div>
                        )}

                        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                                <div className="flex items-center justify-between gap-4 mb-4">
                                    <button
                                        onClick={() => setShowFilters(!showFilters)}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 font-semibold text-sm ${showFilters || hasActiveFilters
                                            ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                                            : 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-gray-200'
                                            }`}
                                    >
                                        <Filter size={18} />
                                        Filtros {hasActiveFilters && `(${[searchNumeroFactura, searchFechaDesde, searchFechaHasta].filter(Boolean).length})`}
                                    </button>
                                    <button
                                        onClick={openModal}
                                        className="flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 font-bold text-sm"
                                    >
                                        <Plus size={20} strokeWidth={3} />
                                        Nueva Compra
                                    </button>
                                </div>

                                {showFilters && (
                                    <div className="bg-white border-2 border-gray-200 rounded-xl p-5 space-y-4 shadow-inner">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                                                    Número de Factura
                                                </label>
                                                <div className="relative">
                                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        placeholder="Ej: F-001"
                                                        value={searchNumeroFactura}
                                                        onChange={(e) => setSearchNumeroFactura(e.target.value)}
                                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                                        className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-medium"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                                                    Fecha Desde
                                                </label>
                                                <div className="relative">
                                                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="date"
                                                        value={searchFechaDesde}
                                                        onChange={(e) => setSearchFechaDesde(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-medium"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                                                    Fecha Hasta
                                                </label>
                                                <div className="relative">
                                                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="date"
                                                        value={searchFechaHasta}
                                                        onChange={(e) => setSearchFechaHasta(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-medium"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 pt-2">
                                            <button
                                                onClick={handleSearch}
                                                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-bold text-sm shadow-md hover:shadow-lg"
                                            >
                                                <Search size={16} />
                                                Buscar
                                            </button>
                                            {hasActiveFilters && (
                                                <button
                                                    onClick={handleClearFilters}
                                                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-bold text-sm border-2 border-gray-300"
                                                >
                                                    <XCircle size={16} />
                                                    Limpiar Filtros
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-24">
                                    <div className="text-center">
                                        <Loader size={40} className="text-blue-600 animate-spin mx-auto mb-4" />
                                        <p className="text-sm font-semibold text-gray-600">Cargando compras...</p>
                                    </div>
                                </div>
                            ) : compras.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24">
                                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        <ShoppingCart size={48} className="text-gray-300" />
                                    </div>
                                    <p className="text-lg font-bold text-gray-900 mb-2">No hay compras registradas</p>
                                    <p className="text-sm text-gray-500">
                                        {hasActiveFilters ? 'Intenta ajustar los filtros de búsqueda' : 'Comienza creando tu primera compra'}
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">#</th>
                                                <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Fecha</th>
                                                <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Proveedor</th>
                                                <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">N° Factura</th>
                                                <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Total</th>
                                                <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">SENIAT</th>
                                                <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Estado</th>
                                                <th className="px-6 py-4 text-center text-xs font-black text-gray-700 uppercase tracking-wider">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                            {compras.map((compra, idx) => (
                                                <tr key={compra.id_compra} className="hover:bg-blue-50/50 transition-colors duration-150">
                                                    <td className="px-6 py-4 text-sm font-bold text-gray-500">
                                                        {(currentPage - 1) * 20 + idx + 1}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                                                        {new Date(compra.fecha_compra).toLocaleDateString('es-ES', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm font-bold text-gray-900">
                                                            {compra.proveedor?.nombre || 'N/A'}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-mono font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-md">
                                                            {compra.numero_factura || 'Sin factura'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-base font-black text-gray-900">
                                                            ${Number(compra.total || 0).toFixed(2)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {compra.reportable_seniat ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black bg-amber-100 text-amber-800 border-2 border-amber-300 shadow-sm">
                                                                <AlertTriangle size={14} />
                                                                Reportable
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black bg-gray-100 text-gray-600 border-2 border-gray-200">
                                                                No reporta
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-black border-2 shadow-sm ${getEstadoBadge(compra.estado)}`}>
                                                            {compra.estado.charAt(0).toUpperCase() + compra.estado.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => viewDetail(compra)}
                                                                title="Ver detalle"
                                                                className="p-2.5 hover:bg-blue-100 rounded-lg transition-all duration-200 group border-2 border-transparent hover:border-blue-300"
                                                            >
                                                                <Eye size={18} className="text-blue-600 group-hover:scale-110 transition-transform" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {totalPages > 1 && (
                                <div className="px-6 py-5 border-t-2 border-gray-200 flex items-center justify-between text-sm bg-gray-50">
                                    <p className="text-gray-600 font-semibold">
                                        Mostrando <span className="text-gray-900 font-bold">{compras.length}</span> de <span className="text-gray-900 font-bold">{totalItems}</span>
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => loadCompras(Math.max(1, currentPage - 1))}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold text-gray-700"
                                        >Anterior</button>
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(n => (
                                            <button
                                                key={n}
                                                onClick={() => loadCompras(n)}
                                                className={`px-4 py-2 rounded-lg font-bold transition-all ${currentPage === n
                                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                                    : 'border-2 border-gray-300 hover:bg-gray-100 text-gray-700'
                                                    }`}
                                            >{n}</button>
                                        ))}
                                        <button
                                            onClick={() => loadCompras(Math.min(totalPages, currentPage + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold text-gray-700"
                                        >Siguiente</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl my-8">
                        <div className="flex items-center justify-between px-8 py-5 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-white rounded-t-3xl sticky top-0 z-10">
                            <h3 className="text-2xl font-black text-gray-900">Nueva Compra</h3>
                            <button
                                onClick={closeModal}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                type="button"
                            >
                                <X size={24} className="text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">
                                        Proveedor <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.id_proveedor}
                                        onChange={e => setFormData({ ...formData, id_proveedor: e.target.value ? parseInt(e.target.value) : '' })}
                                        required
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-semibold bg-white"
                                    >
                                        <option value="">Seleccionar proveedor</option>
                                        {proveedores.map(prov => (
                                            <option key={prov.id_proveedor} value={prov.id_proveedor}>
                                                {prov.nombre} {prov.ruc ? `(${prov.ruc})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">
                                        N° Factura
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.numero_factura}
                                        onChange={e => setFormData({ ...formData, numero_factura: e.target.value })}
                                        placeholder="Ej: F-001"
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-semibold"
                                    />
                                </div>
                            </div>

                            <div className="p-5 bg-gradient-to-r from-amber-50 to-amber-100/50 border-2 border-amber-300 rounded-xl">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                                            <AlertTriangle size={20} className="text-white" />
                                        </div>
                                        <div>
                                            <span className="text-sm font-black text-gray-900">Reportar al SENIAT</span>
                                            <span className="text-xs text-gray-600 ml-2 font-semibold">(inventario legal)</span>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={formData.reportable_seniat}
                                            onChange={e => setFormData({ ...formData, reportable_seniat: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-600 shadow-inner"></div>
                                    </div>
                                </label>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-lg font-black text-gray-900">Detalle de Productos</h4>
                                    <button
                                        type="button"
                                        onClick={agregarLinea}
                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all duration-200 text-sm font-bold shadow-md hover:shadow-lg"
                                    >
                                        <Plus size={18} />
                                        Agregar Línea
                                    </button>
                                </div>

                                <div className="border-2 border-gray-200 rounded-xl shadow-sm">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-200">
                                                    <th className="px-4 py-3 text-left text-xs font-black text-gray-700 uppercase w-12">#</th>
                                                    <th className="px-4 py-3 text-left text-xs font-black text-gray-700 uppercase min-w-[280px]">Producto</th>
                                                    <th className="px-4 py-3 text-left text-xs font-black text-gray-700 uppercase w-28">Cantidad</th>
                                                    <th className="px-4 py-3 text-left text-xs font-black text-gray-700 uppercase w-32">Precio Unit.</th>
                                                    <th className="px-4 py-3 text-left text-xs font-black text-gray-700 uppercase w-32">Subtotal</th>
                                                    <th className="px-4 py-3 text-center text-xs font-black text-gray-700 uppercase w-24">IVA 16%</th>
                                                    <th className="px-4 py-3 w-12"></th>
                                                </tr>
                                            </thead>
                                        </table>
                                    </div>

                                    <div className="overflow-x-auto relative">
                                        <table className="w-full text-sm">
                                            <tbody className="divide-y divide-gray-100 bg-white">
                                                {lineas.map((linea, idx) => (
                                                    <ProductLineItem
                                                        key={linea.tempId}
                                                        linea={linea}
                                                        index={idx}
                                                        productos={productos}
                                                        productosSeleccionados={productosSeleccionados}
                                                        categorias={categorias}
                                                        unidadesMedida={unidadesMedida}
                                                        onChange={(field, value) => handleLineaChange(linea.tempId, field, value)}
                                                        onRemove={() => eliminarLinea(linea.tempId)}
                                                        canRemove={lineas.length > 1}
                                                        onProductsRefresh={refreshProductos}
                                                    />
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t-2 border-gray-200 pt-6">
                                <div className="flex flex-col gap-4">
                                    {lineas.some(l => l.aplicar_iva && l.subtotal > 0) && (
                                        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                                            <p className="text-xs font-black text-blue-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                                                <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">%</span>
                                                Productos con IVA 16%
                                            </p>
                                            <div className="space-y-2">
                                                {lineas
                                                    .filter(l => l.aplicar_iva && l.subtotal > 0)
                                                    .map((l, idx) => {
                                                        const ivaLinea = l.subtotal * 0.16;
                                                        const nombreProd = l.id_producto
                                                            ? (productos.find(p => p.id_producto === l.id_producto)?.nombre || `Producto #${l.id_producto}`)
                                                            : `Línea ${idx + 1}`;
                                                        return (
                                                            <div key={l.tempId} className="flex items-center justify-between text-sm">
                                                                <span className="font-semibold text-gray-700 truncate max-w-[200px]">{nombreProd}</span>
                                                                <div className="flex items-center gap-4 text-right shrink-0">
                                                                    <span className="text-gray-500 font-medium">subtotal ${l.subtotal.toFixed(2)}</span>
                                                                    <span className="font-black text-blue-700">+${ivaLinea.toFixed(2)} IVA</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-end">
                                        <div className="space-y-3 min-w-[300px] bg-gray-50 p-5 rounded-xl border-2 border-gray-200">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-700 font-bold">Subtotal</span>
                                                <span className="font-black text-gray-900 text-lg">${totales.baseImponible.toFixed(2)}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-700 font-bold">
                                                    IVA 16%
                                                    {totales.montoIva === 0 && (
                                                        <span className="ml-2 text-xs font-semibold text-gray-400">(ningún producto aplica)</span>
                                                    )}
                                                </span>
                                                <span className={`font-black text-lg ${totales.montoIva > 0 ? 'text-blue-700' : 'text-gray-400'}`}>
                                                    ${totales.montoIva.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-base pt-3 border-t-2 border-gray-300">
                                                <span className="font-black text-gray-900 text-lg">Total</span>
                                                <span className="font-black text-emerald-600 text-2xl">${totales.total.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-4 pt-6 border-t-2 border-gray-200">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={isSubmitting}
                                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-bold transition-all text-sm disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-xl hover:shadow-blue-500/40 font-bold transition-all disabled:opacity-60 flex items-center gap-2 text-sm"
                                >
                                    {isSubmitting && <Loader size={16} className="animate-spin" />}
                                    {isSubmitting ? 'Registrando...' : 'Registrar Compra'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDetailModal && selectedCompra && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-8 border-b-2 border-gray-200 sticky top-0 bg-gradient-to-r from-blue-50 to-white rounded-t-3xl">
                            <h3 className="text-2xl font-black text-gray-900">Detalle de Compra #{selectedCompra.id_compra}</h3>
                            <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                <X size={24} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-5 bg-gray-50 p-5 rounded-xl border-2 border-gray-200">
                                <div>
                                    <p className="text-xs text-gray-600 mb-1.5 font-black uppercase tracking-wide">Proveedor</p>
                                    <p className="text-sm font-black text-gray-900">{selectedCompra.proveedor?.nombre}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 mb-1.5 font-black uppercase tracking-wide">Fecha</p>
                                    <p className="text-sm font-black text-gray-900">
                                        {new Date(selectedCompra.fecha_compra).toLocaleDateString('es-ES', {
                                            day: '2-digit',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 mb-1.5 font-black uppercase tracking-wide">N° Factura</p>
                                    <p className="text-sm font-mono font-black text-blue-700">{selectedCompra.numero_factura || 'Sin factura'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 mb-1.5 font-black uppercase tracking-wide">Estado</p>
                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-black border-2 shadow-sm ${getEstadoBadge(selectedCompra.estado)}`}>
                                        {selectedCompra.estado.charAt(0).toUpperCase() + selectedCompra.estado.slice(1)}
                                    </span>
                                </div>
                            </div>

                            <div className="border-t-2 border-gray-200 pt-6">
                                <h4 className="text-base font-black text-gray-900 mb-4 uppercase tracking-wide">Productos Comprados</h4>
                                <div className="space-y-3">
                                    {selectedCompra.detalles?.map((detalle, idx) => (
                                        <div key={detalle.id_detalle_compra || idx} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-xl border-2 border-gray-200">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <Package2 size={20} className="text-blue-600" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                        {detalle.producto?.nombre || `Producto #${detalle.id_producto}`}
                                                        {detalle.aplicar_iva && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-700 tracking-wider">
                                                                +IVA 16%
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-8 text-sm">
                                                <span className="text-gray-700 font-semibold">Cant: <span className="font-black text-gray-900">{Number(detalle.cantidad || 0)}</span></span>
                                                <span className="text-gray-700 font-semibold">P.U: <span className="font-black text-gray-900">${Number(detalle.precio_unitario || 0).toFixed(2)}</span></span>
                                                <span className="text-blue-700 font-black text-lg">${(Number(detalle.cantidad || 0) * Number(detalle.precio_unitario || 0)).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t-2 border-gray-200 pt-6">
                                <div className="space-y-3 bg-gray-50 p-6 rounded-xl border-2 border-gray-200">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-700 font-bold">Base Imponible:</span>
                                        <span className="font-black text-gray-900 text-lg">${Number(selectedCompra.base_imponible || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-700 font-bold">IVA ({Number(selectedCompra.alicuota_iva || 0)}%):</span>
                                        <span className="font-black text-blue-700 text-lg">${Number(selectedCompra.monto_iva || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg pt-3 border-t-2 border-gray-300">
                                        <span className="font-black text-gray-900">Total:</span>
                                        <span className="font-black text-emerald-600 text-2xl">${Number(selectedCompra.total || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {selectedCompra.reportable_seniat && (
                                <div className="p-5 bg-gradient-to-r from-amber-50 to-amber-100/50 border-2 border-amber-300 rounded-xl flex items-center gap-3">
                                    <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                                        <AlertTriangle size={20} className="text-white" />
                                    </div>
                                    <p className="text-sm font-black text-amber-900">Esta compra está reportada al SENIAT</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
