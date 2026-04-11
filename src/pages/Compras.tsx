import { useState, useEffect, useCallback, useRef } from 'react';
import { api, Compra, Proveedor, Producto, CreateCompraPayload } from '../services/api';
import Sidebar from '../components/Sidebar';
import ProductLineItem from '../components/ProductLineItem';
import QuickAddProveedorForm from '../components/QuickAddProveedorForm';
import {
    ShoppingCart, Plus, Search, RefreshCw, Eye, X, AlertCircle,
    Check, Loader, AlertTriangle, Package2, Calendar, Filter, XCircle, Building2,
    DollarSign
} from 'lucide-react';
import { MONEDA_BS, MONEDA_COP } from '../types';

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
    const [searchIdProveedor, setSearchIdProveedor] = useState<number | ''>('');
    const [showFilters, setShowFilters] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [tasas, setTasas] = useState({ ves: 0, cop: 0 });

    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedCompra, setSelectedCompra] = useState<Compra | null>(null);

    const proveedorInputRef = useRef<HTMLInputElement>(null);
    const facturaInputRef = useRef<HTMLInputElement>(null);
    const controlInputRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        id_proveedor: '' as number | '',
        numero_factura: '',
        numero_control: '',
        reportable_seniat: false
    });

    const [proveedorSearch, setProveedorSearch] = useState('');
    const [showProveedorDropdown, setShowProveedorDropdown] = useState(false);
    const [showQuickAddProveedor, setShowQuickAddProveedor] = useState(false);
    const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);
    const proveedorDropdownRef = useRef<HTMLDivElement>(null);

    const [lineas, setLineas] = useState<LineaDetalle[]>([emptyLinea()]);
    const [categorias, setCategorias] = useState<import('../services/api').CategoriaProducto[]>([]);
    const [unidadesMedida, setUnidadesMedida] = useState<import('../services/api').UnidadMedida[]>([]);

    const loadCompras = useCallback(async (
        page = 1,
        overrides?: { numero_factura?: string; fecha_desde?: string; fecha_hasta?: string; id_proveedor?: number | '' }
    ) => {
        setLoading(true);
        setError(null);
        try {
            const nf = overrides !== undefined ? overrides.numero_factura : searchNumeroFactura;
            const fd = overrides !== undefined ? overrides.fecha_desde : searchFechaDesde;
            const fh = overrides !== undefined ? overrides.fecha_hasta : searchFechaHasta;
            const provId = overrides !== undefined ? overrides.id_proveedor : searchIdProveedor;
            const response = await api.getCompras(
                page,
                20,
                nf || undefined,
                fd || undefined,
                fh || undefined,
                provId || undefined
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

    const refreshProveedores = useCallback(async () => {
        try {
            const provsRes = await api.getProveedores(1, 1000, '', true);
            setProveedores(provsRes.data);
        } catch (err) {
            console.error('Error refrescando proveedores:', err);
        }
    }, []);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                proveedorDropdownRef.current &&
                !proveedorDropdownRef.current.contains(e.target as Node)
            ) {
                setShowProveedorDropdown(false);
                setShowQuickAddProveedor(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowFilters(false);
                setShowModal(false);
                setShowDetailModal(false);
                setShowProveedorDropdown(false);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    useEffect(() => {
        loadCompras(1);
        loadCatalogos();
    }, [loadCompras, loadCatalogos]);

    useEffect(() => {
        const fetchTasas = async () => {
            try {
                const [ves, cop] = await Promise.all([
                    api.getTasaVigente(MONEDA_BS),
                    api.getTasaVigente(MONEDA_COP)
                ]);
                setTasas({ ves: ves || 0, cop: cop || 0 });
            } catch {
                // tasas permanecen en 0
            }
        };
        fetchTasas();
    }, []);

    const handleSearch = () => {
        setCurrentPage(1);
        loadCompras(1, {
            numero_factura: searchNumeroFactura,
            fecha_desde: searchFechaDesde,
            fecha_hasta: searchFechaHasta,
            id_proveedor: searchIdProveedor
        });
    };

    const handleClearFilters = () => {
        setSearchNumeroFactura('');
        setSearchFechaDesde('');
        setSearchFechaHasta('');
        setSearchIdProveedor('');
        setCurrentPage(1);
        loadCompras(1, {
            numero_factura: '',
            fecha_desde: '',
            fecha_hasta: '',
            id_proveedor: ''
        });
    };

    const hasActiveFilters = searchNumeroFactura || searchFechaDesde || searchFechaHasta || searchIdProveedor;

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

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey && e.key.toLowerCase() === 'n' && showModal && !showDetailModal) {
                e.preventDefault();
                agregarLinea();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showModal, showDetailModal]);

    const eliminarLinea = (tempId: string) => {
        if (lineas.length === 1) return;
        setLineas(prev => prev.filter(l => l.tempId !== tempId));
    };

    const openModal = () => {
        setFormData({ id_proveedor: '', numero_factura: '', numero_control: '', reportable_seniat: false });
        setLineas([emptyLinea()]);
        setSelectedProveedor(null);
        setProveedorSearch('');
        setShowProveedorDropdown(false);
        setShowQuickAddProveedor(false);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setFormData({ id_proveedor: '', numero_factura: '', numero_control: '', reportable_seniat: false });
        setLineas([emptyLinea()]);
        setSelectedProveedor(null);
        setProveedorSearch('');
        setShowProveedorDropdown(false);
        setShowQuickAddProveedor(false);
    };

    const handleFormKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            const target = e.target as HTMLElement;
            if (target.tagName !== 'BUTTON') {
                e.preventDefault();
            }
        }
    };

    const proveedoresFiltrados = proveedores.filter(p =>
        !proveedorSearch ||
        p.nombre.toLowerCase().includes(proveedorSearch.toLowerCase()) ||
        p.ruc?.toLowerCase().includes(proveedorSearch.toLowerCase())
    ).slice(0, 40);

    const handleProveedorSelect = (prov: Proveedor) => {
        setSelectedProveedor(prov);
        setFormData(prev => ({ ...prev, id_proveedor: prov.id_proveedor }));
        setProveedorSearch('');
        setShowProveedorDropdown(false);
        setShowQuickAddProveedor(false);
    };

    const handleProveedorClear = () => {
        setSelectedProveedor(null);
        setFormData(prev => ({ ...prev, id_proveedor: '' }));
        setProveedorSearch('');
    };

    const obtenerLineasActivas = () => {
        return lineas.filter(l =>
            l.id_producto !== '' &&
            l.cantidad !== '' &&
            parseFloat(l.cantidad) > 0
        );
    };

    const validateForm = (): string | null => {
        if (!formData.id_proveedor) return 'Debes seleccionar un proveedor';
        const lineasValidas = obtenerLineasActivas();
        if (lineasValidas.length === 0) return 'Debes agregar al menos una línea de detalle con cantidad mayor a cero';
        for (const linea of lineasValidas) {
            if (!linea.precio_unitario || parseFloat(linea.precio_unitario) <= 0) return 'Los productos ingresados deben tener precio unitario válido (mayor a 0)';
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
        const lineasValidas = obtenerLineasActivas();

        const payload: CreateCompraPayload = {
            id_proveedor: Number(formData.id_proveedor),
            numero_factura: formData.numero_factura || undefined,
            numero_control: formData.numero_control || undefined,
            base_imponible: totales.baseImponible,
            alicuota_iva: totales.alicuotaIva,
            monto_iva: totales.montoIva,
            total: totales.total,
            reportable_seniat: formData.reportable_seniat,
            detalles: lineasValidas.map(linea => ({
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
            pendiente: 'bg-amber-100 text-amber-700 ring-amber-200',
            recibida: 'bg-blue-100 text-blue-700 ring-blue-200',
            cancelada: 'bg-red-100 text-red-700 ring-red-200'
        };
        return badges[estado as keyof typeof badges] || badges.pendiente;
    };

    const productosSeleccionados = lineas.map(l => l.id_producto).filter(Boolean);

    const kpiTotalUSD = compras.reduce((sum, c) => sum + Number(c.total || 0), 0);
    const kpiTotalBSF = kpiTotalUSD * tasas.ves;
    const kpiTotalCOP = kpiTotalUSD * tasas.cop;

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white/90 backdrop-blur-md px-8 py-6 border-b border-gray-200 shadow-sm sticky top-0 z-20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                                <ShoppingCart size={24} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 leading-tight tracking-tight">Gestión de Compras</h2>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {totalItems} {totalItems === 1 ? 'compra registrada' : 'compras registradas'}
                                    {hasActiveFilters && <span className="text-blue-600 font-semibold"> · Filtros activos</span>}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => loadCompras(currentPage)}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-all duration-200 disabled:opacity-50 hover:shadow-md shadow-sm"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin text-blue-600' : 'text-gray-500'} />
                            <span className="text-sm font-medium text-gray-600">Actualizar</span>
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-7xl mx-auto space-y-5">
                        {successMessage && (
                            <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-xl flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Check size={14} className="text-white" />
                                </div>
                                <p className="text-sm font-semibold text-emerald-800">{successMessage}</p>
                            </div>
                        )}
                        {error && (
                            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl flex items-center gap-3 shadow-sm">
                                <div className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <AlertCircle size={14} className="text-white" />
                                </div>
                                <p className="text-sm font-semibold text-red-800">{error}</p>
                            </div>
                        )}

                        {/* ── KPI Cards ── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {loading ? (
                                // Skeleton Cards
                                <>
                                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 animate-pulse">
                                        <div className="w-20 h-3 bg-gray-100 rounded mb-3" />
                                        <div className="w-32 h-8 bg-gray-100 rounded" />
                                    </div>
                                    <div className="lg:col-span-3 bg-white p-5 rounded-xl shadow-sm border border-gray-100 animate-pulse">
                                        <div className="w-40 h-3 bg-gray-100 rounded mb-4" />
                                        <div className="grid grid-cols-3 gap-6">
                                            <div className="h-10 bg-gray-50 rounded" />
                                            <div className="h-10 bg-gray-50 rounded" />
                                            <div className="h-10 bg-gray-50 rounded" />
                                        </div>
                                    </div>
                                </>
                            ) : hasActiveFilters ? (
                                <div className="lg:col-span-4 bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden hover:shadow-md transition-shadow duration-200">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 rounded-l-xl" />
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Capitalización Filtrada</p>
                                        <span className="text-blue-600 text-[10px] font-semibold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">Filtros activos</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-0 divide-x divide-gray-100">
                                        <div className="pr-6">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Dólares (USD)</p>
                                            <h3 className="text-2xl font-extrabold text-gray-900">${kpiTotalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                                        </div>
                                        <div className="px-6">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Bolívares (BSF)</p>
                                            <h3 className="text-2xl font-extrabold text-gray-900">{tasas.ves > 0 ? kpiTotalBSF.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : <span className="text-gray-300 text-base font-semibold">Sin tasa</span>}</h3>
                                        </div>
                                        <div className="pl-6">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Pesos (COP)</p>
                                            <h3 className="text-2xl font-extrabold text-gray-900">{tasas.cop > 0 ? Math.round(kpiTotalCOP).toLocaleString('es-CO') : <span className="text-gray-300 text-base font-semibold">Sin tasa</span>}</h3>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden hover:shadow-md transition-shadow duration-200">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 rounded-l-xl" />
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Total Compras</p>
                                                <h3 className="text-2xl font-extrabold text-gray-900">${kpiTotalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                                                <p className="text-xs text-gray-400 mt-1 font-medium">USD</p>
                                            </div>
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                                <DollarSign size={20} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-3 bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden hover:shadow-md transition-shadow duration-200">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-slate-400 rounded-l-xl" />
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Capitalización por Moneda</p>
                                        </div>
                                        <div className="grid grid-cols-3 gap-0 divide-x divide-gray-100">
                                            <div className="pr-4">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Bolívares (BSF)</p>
                                                <h3 className="text-xl font-extrabold text-gray-900">{tasas.ves > 0 ? kpiTotalBSF.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : <span className="text-gray-300 text-sm font-semibold">Sin tasa</span>}</h3>
                                            </div>
                                            <div className="px-4">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Pesos (COP)</p>
                                                <h3 className="text-xl font-extrabold text-gray-900">{tasas.cop > 0 ? Math.round(kpiTotalCOP).toLocaleString('es-CO') : <span className="text-gray-300 text-sm font-semibold">Sin tasa</span>}</h3>
                                            </div>
                                            <div className="pl-4">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Dólares (USD)</p>
                                                <h3 className="text-xl font-extrabold text-gray-900">${kpiTotalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* ── Table Card ── */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-visible">
                            {/* Table Header with filters floating */}
                            <div className="p-5 border-b border-gray-100 relative">
                                <div className="flex items-center justify-between gap-4">
                                    <button
                                        onClick={() => setShowFilters(!showFilters)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-semibold text-sm border ${showFilters || hasActiveFilters
                                            ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
                                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                            }`}
                                    >
                                        <Filter size={16} />
                                        Filtros
                                        {hasActiveFilters && (
                                            <span className="ml-1 w-5 h-5 bg-blue-600 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                                                {[searchNumeroFactura, searchFechaDesde, searchFechaHasta].filter(Boolean).length}
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        onClick={openModal}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md"
                                    >
                                        <Plus size={18} strokeWidth={2.5} />
                                        Nueva Compra
                                    </button>
                                </div>

                                {/* Floating filter panel — does not affect table layout */}
                                {showFilters && (
                                    <div className="absolute top-full left-0 right-0 z-30 px-5 pt-2">
                                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xl ring-1 ring-black/5">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Número de Factura</label>
                                                    <div className="relative">
                                                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            placeholder="Ej: F-001"
                                                            value={searchNumeroFactura}
                                                            onChange={(e) => setSearchNumeroFactura(e.target.value)}
                                                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                                            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium bg-gray-50 focus:bg-white transition-colors"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Proveedor</label>
                                                    <select
                                                        value={searchIdProveedor}
                                                        onChange={(e) => setSearchIdProveedor(e.target.value ? Number(e.target.value) : '')}
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium bg-gray-50 focus:bg-white transition-colors cursor-pointer"
                                                    >
                                                        <option value="">Todos los proveedores</option>
                                                        {proveedores.map(p => <option key={p.id_proveedor} value={p.id_proveedor}>{p.nombre}</option>)}
                                                    </select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Fecha Desde</label>
                                                    <div className="relative">
                                                        <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                        <input
                                                            type="date"
                                                            value={searchFechaDesde}
                                                            onChange={(e) => setSearchFechaDesde(e.target.value)}
                                                            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium bg-gray-50 focus:bg-white transition-colors"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Fecha Hasta</label>
                                                    <div className="relative">
                                                        <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                        <input
                                                            type="date"
                                                            value={searchFechaHasta}
                                                            onChange={(e) => setSearchFechaHasta(e.target.value)}
                                                            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium bg-gray-50 focus:bg-white transition-colors"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between pt-4 mt-1 border-t border-gray-100">
                                                <button
                                                    onClick={() => setShowFilters(false)}
                                                    className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors"
                                                >
                                                    Cerrar
                                                </button>
                                                <div className="flex items-center gap-2">
                                                    {hasActiveFilters && (
                                                        <button
                                                            onClick={handleClearFilters}
                                                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
                                                        >
                                                            <XCircle size={14} /> Limpiar
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => { handleSearch(); setShowFilters(false); }}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm shadow-sm hover:bg-blue-700 transition-all"
                                                    >
                                                        <Search size={14} /> Aplicar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {loading ? (
                                <div className="p-0">
                                    {/* Skeleton Rows */}
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className={`flex items-center gap-4 p-5 ${i !== 5 ? 'border-b border-gray-50' : ''} animate-pulse`}>
                                            <div className="w-12 h-4 bg-gray-100 rounded-md" />
                                            <div className="w-24 h-4 bg-gray-100 rounded-md" />
                                            <div className="flex-1 flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gray-100 rounded-full" />
                                                <div className="w-40 h-4 bg-gray-100 rounded-md" />
                                            </div>
                                            <div className="w-24 h-4 bg-gray-100 rounded-md" />
                                            <div className="w-24 h-6 bg-gray-100 rounded-lg" />
                                            <div className="w-32 h-6 bg-gray-100 rounded-lg" />
                                            <div className="w-20 h-4 bg-gray-50 rounded-md" />
                                        </div>
                                    ))}
                                </div>
                            ) : compras.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24">
                                    <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border-2 border-dashed border-gray-200">
                                        <ShoppingCart size={40} className="text-gray-300" />
                                    </div>
                                    <p className="text-base font-bold text-gray-700 mb-1">No hay compras registradas</p>
                                    <p className="text-sm text-gray-400">
                                        {hasActiveFilters ? 'Intenta ajustar los filtros de búsqueda' : 'Comienza creando tu primera compra'}
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-sm">
                                        <thead>
                                            <tr className="bg-gray-50/80 text-gray-400 uppercase tracking-wider text-[11px] font-bold border-b border-gray-100">
                                                <th className="px-6 py-3.5 text-left w-12">#</th>
                                                <th className="px-6 py-3.5 text-left">Fecha</th>
                                                <th className="px-6 py-3.5 text-left">Proveedor</th>
                                                <th className="px-6 py-3.5 text-left">Factura / Control</th>
                                                <th className="px-6 py-3.5 text-right">Total</th>
                                                <th className="px-6 py-3.5 text-center">Inv. Legal</th>
                                                <th className="px-6 py-3.5 text-center">Estado</th>
                                                <th className="px-4 py-3.5 text-center w-20"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-50">
                                            {compras.map((compra, idx) => (
                                                <tr
                                                    key={compra.id_compra}
                                                    className={`group transition-colors duration-100 hover:bg-blue-50/30 ${idx % 2 === 1 ? 'bg-gray-50/30' : ''}`}
                                                >
                                                    <td className="px-6 py-4 font-bold text-gray-300 text-xs">{(currentPage - 1) * 20 + idx + 1}</td>
                                                    <td className="px-6 py-4 text-gray-600 font-medium text-sm">
                                                        {new Date(compra.fecha_compra).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-bold text-blue-600 shrink-0 border border-blue-100">
                                                                {(compra.proveedor?.nombre || 'N').charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className="font-semibold text-gray-800 capitalize text-sm">{compra.proveedor?.nombre || 'N/A'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-mono">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="font-semibold text-gray-800 text-sm">F: {compra.numero_factura || '—'}</span>
                                                            {compra.numero_control && <span className="text-xs text-gray-400">C: {compra.numero_control}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold text-blue-700 text-sm">
                                                        ${Number(compra.total || 0).toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {compra.reportable_seniat ? (
                                                            <span className="text-[11px] px-2 py-1 rounded-md bg-blue-600 text-white font-semibold">Sí</span>
                                                        ) : (
                                                            <span className="text-[11px] px-2 py-1 rounded-md bg-gray-100 text-gray-400 font-medium">No</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${getEstadoBadge(compra.estado)}`}>
                                                            {compra.estado.charAt(0).toUpperCase() + compra.estado.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <button
                                                            onClick={() => viewDetail(compra)}
                                                            title="Ver detalle"
                                                            className="p-1.5 hover:bg-blue-50 rounded-lg transition-all duration-150 border border-transparent hover:border-blue-100"
                                                        >
                                                            <Eye size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Pagination */}
                            <div className="bg-gray-50/50 px-6 py-4 flex items-center justify-between border-t border-gray-100">
                                <p className="text-xs text-gray-400 font-medium">
                                    Mostrando <span className="font-semibold text-gray-600">{compras.length}</span> de <span className="font-semibold text-gray-600">{totalItems}</span> registros
                                </p>
                                {totalPages > 1 && (
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => loadCompras(Math.max(1, currentPage - 1))}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-gray-500"
                                        >
                                            ‹
                                        </button>
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(n => (
                                            <button
                                                key={n}
                                                onClick={() => loadCompras(n)}
                                                className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${currentPage === n ? 'bg-blue-600 text-white shadow-sm' : 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-500'}`}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => loadCompras(Math.min(totalPages, currentPage + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-gray-500"
                                        >
                                            ›
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[95vh] overflow-hidden">
                        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white rounded-t-3xl shrink-0">
                            <h3 className="text-xl font-bold text-gray-900">Nueva Compra</h3>
                            <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-xl transition-colors" type="button">
                                <X size={22} className="text-gray-400" />
                            </button>
                        </div>

                        <form ref={formRef} onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="flex flex-col overflow-hidden min-h-0">
                            <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 shrink-0">
                                    {/* ── Proveedor search + quick-add ── */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
                                            Proveedor <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative" ref={proveedorDropdownRef}>
                                            <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
                                            <input
                                                ref={proveedorInputRef}
                                                type="text"
                                                placeholder="Buscar proveedor..."
                                                value={selectedProveedor ? selectedProveedor.nombre : proveedorSearch}
                                                onChange={e => {
                                                    if (!selectedProveedor) {
                                                        setProveedorSearch(e.target.value);
                                                        setShowProveedorDropdown(true);
                                                        setShowQuickAddProveedor(false);
                                                    }
                                                }}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter' && !selectedProveedor) {
                                                        e.preventDefault();
                                                        if (proveedoresFiltrados.length === 0 && proveedorSearch.trim()) {
                                                            setShowQuickAddProveedor(true);
                                                        } else if (proveedoresFiltrados.length > 0) {
                                                            handleProveedorSelect(proveedoresFiltrados[0]);
                                                            setTimeout(() => facturaInputRef.current?.focus(), 50);
                                                        }
                                                    }
                                                }}
                                                onFocus={() => {
                                                    if (!selectedProveedor) setShowProveedorDropdown(true);
                                                }}
                                                readOnly={!!selectedProveedor}
                                                className="w-full pl-9 pr-9 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-semibold bg-gray-50 focus:bg-white transition-colors"
                                            />
                                            {selectedProveedor && (
                                                <button
                                                    type="button"
                                                    onClick={handleProveedorClear}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}

                                            {showProveedorDropdown && !selectedProveedor && (
                                                <div className={`absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col transition-all duration-300 ${showQuickAddProveedor ? 'max-h-[600px] w-[400px]' : 'max-h-80 w-full'}`}>
                                                    {!showQuickAddProveedor ? (
                                                        <div className="overflow-y-auto flex-1">
                                                            {proveedoresFiltrados.length === 0 ? (
                                                                <div className="p-4 text-center">
                                                                    <p className="text-xs text-gray-500 font-semibold mb-3">
                                                                        {proveedorSearch ? 'No se encontraron proveedores' : 'No hay proveedores registrados'}
                                                                    </p>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setShowQuickAddProveedor(true)}
                                                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 border-2 border-blue-300 border-dashed rounded-lg transition-all text-xs font-bold text-blue-700"
                                                                    >
                                                                        <Plus size={14} />
                                                                        {proveedorSearch ? `Crear "${proveedorSearch}"` : 'Crear nuevo proveedor'}
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    {proveedoresFiltrados.map(prov => (
                                                                        <button
                                                                            key={prov.id_proveedor}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                handleProveedorSelect(prov);
                                                                                setTimeout(() => facturaInputRef.current?.focus(), 50);
                                                                            }}
                                                                            className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors flex items-center justify-between group"
                                                                        >
                                                                            <div>
                                                                                <div className="font-bold text-gray-900 text-xs">{prov.nombre}</div>
                                                                                {prov.ruc && <div className="text-[10px] text-gray-400 font-medium tracking-wider mt-0.5">{prov.ruc}</div>}
                                                                            </div>
                                                                            <div className="bg-emerald-100 text-emerald-700 text-[9px] font-bold uppercase px-2 py-1 rounded shadow-sm opacity-60 group-hover:opacity-100 transition-opacity">
                                                                                Registrado
                                                                            </div>
                                                                        </button>
                                                                    ))}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setShowQuickAddProveedor(true)}
                                                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 border-t border-blue-100 transition-all text-xs font-bold text-blue-700 sticky bottom-0"
                                                                    >
                                                                        <Plus size={12} />
                                                                        Crear nuevo proveedor
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <QuickAddProveedorForm
                                                            searchTerm={proveedorSearch}
                                                            onSuccess={(prov) => {
                                                                handleProveedorSelect(prov);
                                                                setShowQuickAddProveedor(false);
                                                                setTimeout(() => facturaInputRef.current?.focus(), 50);
                                                            }}
                                                            onCancel={() => setShowQuickAddProveedor(false)}
                                                            onProveedoresRefresh={refreshProveedores}
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {selectedProveedor?.ruc && (
                                            <p className="text-xs text-gray-400 mt-1 font-medium">RIF: {selectedProveedor.ruc}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">N° Factura</label>
                                            <input
                                                ref={facturaInputRef}
                                                type="text"
                                                value={formData.numero_factura}
                                                onChange={e => setFormData({ ...formData, numero_factura: e.target.value })}
                                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); controlInputRef.current?.focus(); } }}
                                                placeholder="Ej: F-001"
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-semibold uppercase bg-gray-50 focus:bg-white transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">N° Control</label>
                                            <input
                                                ref={controlInputRef}
                                                type="text"
                                                value={formData.numero_control}
                                                onChange={e => setFormData({ ...formData, numero_control: e.target.value })}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        const firstProdInput = document.getElementById('search-prod-0');
                                                        if (firstProdInput) firstProdInput.focus();
                                                    }
                                                }}
                                                placeholder="Ej: 00-001"
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-semibold uppercase bg-gray-50 focus:bg-white transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center shrink-0">
                                                <AlertTriangle size={18} className="text-white" />
                                            </div>
                                            <div>
                                                <span className="text-sm font-semibold text-gray-800">Reportar factura al inventario legal</span>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={formData.reportable_seniat}
                                                onChange={e => setFormData({ ...formData, reportable_seniat: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 shadow-inner"></div>
                                        </div>
                                    </label>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-base font-bold text-gray-800">Detalle de Productos</h4>
                                        <button
                                            type="button"
                                            onClick={agregarLinea}
                                            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-200 text-sm font-semibold shadow-sm hover:shadow-md group"
                                            title="Atajo: Alt + N"
                                        >
                                            <Plus size={16} />
                                            <span>Agregar Línea</span>
                                            <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 bg-emerald-800 text-emerald-100 rounded text-[10px] font-mono opacity-70 group-hover:opacity-100 transition-opacity">
                                                Alt+N
                                            </kbd>
                                        </button>
                                    </div>

                                    <div className="border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-gray-200">
                                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase w-12">#</th>
                                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase min-w-[280px]">Producto</th>
                                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase w-28">Cantidad</th>
                                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase w-32">Precio Unit.</th>
                                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase w-32">Subtotal</th>
                                                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase w-24">IVA 16%</th>
                                                        <th className="px-4 py-3 w-12"></th>
                                                    </tr>
                                                </thead>
                                            </table>
                                        </div>

                                        <div className="overflow-x-auto overflow-y-auto relative max-h-[40vh] min-h-[150px] custom-scrollbar">
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
                                                            onAddNewLine={() => {
                                                                agregarLinea();
                                                                setTimeout(() => {
                                                                    const nextInput = document.getElementById(`search-prod-${idx + 1}`);
                                                                    if (nextInput) nextInput.focus();
                                                                }, 50);
                                                            }}
                                                            canRemove={lineas.length > 1}
                                                            onProductsRefresh={refreshProductos}
                                                        />
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {lineas.some(l => l.aplicar_iva && l.subtotal > 0) && (
                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                                            <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">%</span>
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
                                                            <span className="font-medium text-gray-700 truncate max-w-[200px]">{nombreProd}</span>
                                                            <div className="flex items-center gap-4 text-right shrink-0">
                                                                <span className="text-gray-400 text-xs">subtotal ${l.subtotal.toFixed(2)}</span>
                                                                <span className="font-bold text-blue-700">+${ivaLinea.toFixed(2)} IVA</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-8 py-5 border-t border-gray-100 bg-gray-50/80 shrink-0 rounded-b-3xl">
                                <div className="flex items-center gap-6 bg-white px-6 py-3 rounded-2xl border border-gray-200 shadow-sm">
                                    <div className="flex items-center gap-5">
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Subtotal</p>
                                            <p className="text-sm font-bold text-gray-600">${totales.baseImponible.toFixed(2)}</p>
                                        </div>
                                        <div className="w-px h-8 bg-gray-100" />
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">IVA 16%</p>
                                            <p className={`text-sm font-bold ${totales.montoIva > 0 ? 'text-blue-600' : 'text-gray-300'}`}>${totales.montoIva.toFixed(2)}</p>
                                        </div>
                                    </div>

                                    <div className="w-px h-10 bg-gray-200" />

                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">BSF (Ves)</p>
                                            <p className="text-xs font-bold text-gray-500">
                                                {tasas.ves > 0 ? (totales.total * tasas.ves).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">COP (Pesos)</p>
                                            <p className="text-xs font-bold text-gray-500">
                                                {tasas.cop > 0 ? Math.round(totales.total * tasas.cop).toLocaleString('es-CO') : '—'}
                                            </p>
                                        </div>
                                        <div className="text-right pl-2">
                                            <p className="text-[10px] text-blue-600 font-extrabold uppercase tracking-widest mb-0.5">Total USD</p>
                                            <p className="text-2xl font-black text-emerald-600 leading-none">${totales.total.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        disabled={isSubmitting}
                                        className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-100 font-semibold transition-all text-sm disabled:opacity-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-7 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all disabled:opacity-60 flex items-center gap-2 text-sm shadow-sm hover:shadow-md"
                                    >
                                        {isSubmitting && <Loader size={15} className="animate-spin" />}
                                        {isSubmitting ? 'Registrando...' : 'Registrar Compra'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDetailModal && selectedCompra && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-8 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl z-10">
                            <h3 className="text-xl font-bold text-gray-900">Detalle de Compra <span className="text-gray-400 font-normal">#{selectedCompra.id_compra}</span></h3>
                            <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                <X size={22} className="text-gray-400" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-5 bg-gray-50 p-5 rounded-xl border border-gray-100">
                                <div>
                                    <p className="text-xs text-gray-400 mb-1 font-bold uppercase tracking-wide">Proveedor</p>
                                    <p className="text-sm font-bold text-gray-900">{selectedCompra.proveedor?.nombre}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-1 font-bold uppercase tracking-wide">Fecha</p>
                                    <p className="text-sm font-bold text-gray-900">
                                        {new Date(selectedCompra.fecha_compra).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1 font-bold uppercase tracking-wide">N° Factura</p>
                                        <p className="text-sm font-mono font-bold text-blue-700">{selectedCompra.numero_factura || 'Sin factura'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1 font-bold uppercase tracking-wide">N° Control</p>
                                        <p className="text-sm font-mono font-semibold text-gray-700">{selectedCompra.numero_control || 'Sin control'}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-1 font-bold uppercase tracking-wide">Estado</p>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ring-1 ${getEstadoBadge(selectedCompra.estado)}`}>
                                        {selectedCompra.estado.charAt(0).toUpperCase() + selectedCompra.estado.slice(1)}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Productos Comprados</h4>
                                <div className="space-y-2">
                                    {selectedCompra.detalles?.map((detalle, idx) => (
                                        <div key={detalle.id_detalle_compra || idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/20 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <Package2 size={18} className="text-blue-600" />
                                                </div>
                                                <div>
                                                    <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                                        {detalle.producto?.nombre || `Producto #${detalle.id_producto}`}
                                                        {detalle.aplicar_iva && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                                                                +IVA 16%
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6 text-sm shrink-0">
                                                <span className="text-gray-500">Cant: <span className="font-bold text-gray-800">{Number(detalle.cantidad || 0)}</span></span>
                                                <span className="text-gray-500">P.U: <span className="font-bold text-gray-800">${Number(detalle.precio_unitario || 0).toFixed(2)}</span></span>
                                                <span className="font-bold text-blue-700">${(Number(detalle.cantidad || 0) * Number(detalle.precio_unitario || 0)).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 font-medium">Base Imponible:</span>
                                        <span className="font-bold text-gray-900">${Number(selectedCompra.base_imponible || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 font-medium">IVA ({Number(selectedCompra.alicuota_iva || 0)}%):</span>
                                        <span className="font-bold text-blue-600">${Number(selectedCompra.monto_iva || 0).toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-gray-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold text-gray-800">Total USD:</span>
                                        <span className="font-extrabold text-emerald-600 text-xl">${Number(selectedCompra.total || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-dashed border-gray-200">
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total BSF</p>
                                            <p className="text-sm font-bold text-gray-600">
                                                {tasas.ves > 0 ? (Number(selectedCompra.total) * tasas.ves).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total COP</p>
                                            <p className="text-sm font-bold text-gray-600">
                                                {tasas.cop > 0 ? Math.round(Number(selectedCompra.total) * tasas.cop).toLocaleString('es-CO') : '—'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {selectedCompra.reportable_seniat && (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                                    <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center shrink-0">
                                        <AlertTriangle size={18} className="text-white" />
                                    </div>
                                    <p className="text-sm font-semibold text-amber-800">Esta compra está reportada al inventario legal</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
