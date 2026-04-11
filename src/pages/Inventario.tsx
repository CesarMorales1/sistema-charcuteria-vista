import { useState, useEffect, useCallback } from 'react';
import {
  inventarioApi,
  ProductoInventario,
  Categoria,
  Movimiento,
} from '../services/inventarioApi';
import { api } from '../services/api';
import { MONEDA_BS, MONEDA_COP } from '../types';
import Sidebar from '../components/Sidebar';
import ProductoModal from '../components/ProductoModal';
import AjusteInventarioModal from '../components/AjusteInventarioModal';
import { Package, Search, RefreshCw, History, X, AlertCircle, Loader, AlertTriangle, ArrowUpDown, Plus, CreditCard as Edit2 } from 'lucide-react';

const fmt3 = (n: number | undefined | null) => (Number(n) || 0).toFixed(3);
const fmtUSD = (n: number | undefined | null) => '$' + (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtBSF = (n: number | undefined | null) => (Number(n) || 0).toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtCOP = (n: number | undefined | null) => (Number(n) || 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const STOCK_BAJO = 5;

type FiltroInventario = 'todos' | 'general' | 'legal';

export default function Inventario() {
  const [productos, setProductos] = useState<ProductoInventario[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<number | ''>('');
  const [filtroStockBajo, setFiltroStockBajo] = useState(false);
  const [filtroDiferencias, setFiltroDiferencias] = useState(false);
  const [filtroInventario, setFiltroInventario] = useState<FiltroInventario>('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [globalStats, setGlobalStats] = useState({ totalStockBajo: 0, totalDiferencias: 0 });
  const [tasas, setTasas] = useState({ ves: 0, cop: 0 });

  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [historialProducto, setHistorialProducto] = useState<ProductoInventario | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loadingMovimientos, setLoadingMovimientos] = useState(false);

  const [showProductoModal, setShowProductoModal] = useState(false);
  const [editingProducto, setEditingProducto] = useState<ProductoInventario | null>(null);

  const [showAjusteModal, setShowAjusteModal] = useState(false);
  const [ajusteProducto, setAjusteProducto] = useState<ProductoInventario | null>(null);

  const loadProductos = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await inventarioApi.getProductos(
        page,
        20,
        searchTerm,
        filtroCategoria || undefined,
        filtroStockBajo,
        filtroDiferencias
      );
      setProductos(res.data);
      setCurrentPage(res.meta.page);
      setTotalPages(res.meta.totalPages);
      setTotalItems(res.meta.total);
      if (res.meta.stats) {
        setGlobalStats(res.meta.stats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filtroCategoria, filtroStockBajo, filtroDiferencias]);

  const loadCatalogos = useCallback(async () => {
    try {
      const cats = await inventarioApi.getCategorias();
      setCategorias(cats);
    } catch { }
  }, []);

  const loadTasas = useCallback(async () => {
    try {
      const [ves, cop] = await Promise.all([
        api.getTasaVigente(MONEDA_BS),
        api.getTasaVigente(MONEDA_COP)
      ]);
      setTasas({ ves: ves || 0, cop: cop || 0 });
    } catch { }
  }, []);

  useEffect(() => { loadCatalogos(); }, [loadCatalogos]);
  useEffect(() => { loadTasas(); }, [loadTasas]);
  useEffect(() => { loadProductos(1); }, [loadProductos]);

  const openHistorialModal = async (prod: ProductoInventario) => {
    setHistorialProducto(prod);
    setShowHistorialModal(true);
    setLoadingMovimientos(true);
    try {
      const movs = await inventarioApi.getMovimientos(prod.id_producto);
      setMovimientos(movs);
    } catch {
      setMovimientos([]);
    } finally {
      setLoadingMovimientos(false);
    }
  };

  const openProductoModal = (prod?: ProductoInventario) => {
    setEditingProducto(prod || null);
    setShowProductoModal(true);
  };

  const openAjusteModal = (prod: ProductoInventario) => {
    setAjusteProducto(prod);
    setShowAjusteModal(true);
  };

  const handleProductoSaved = () => {
    setShowProductoModal(false);
    setEditingProducto(null);
    loadProductos(currentPage);
  };

  const handleAjusteCompleted = () => {
    setShowAjusteModal(false);
    setAjusteProducto(null);
    loadProductos(currentPage);
  };

  const getStockClass = (val: number) =>
    val <= 0 ? 'text-red-600 font-bold' : val < STOCK_BAJO ? 'text-amber-600 font-semibold' : 'text-gray-900 font-mono';

  const getMovBadge = (tipo: string) => {
    const m: Record<string, string> = {
      entrada: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      salida: 'bg-red-50 text-red-700 border-red-200',
      ajuste: 'bg-amber-50 text-amber-700 border-amber-200',
    };
    return m[tipo] || m.ajuste;
  };

  const getInvBadge = (tipo: string) => {
    const m: Record<string, string> = {
      general: 'bg-blue-50 text-blue-700 border-blue-200',
      legal: 'bg-amber-50 text-amber-700 border-amber-200',
      ambos: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return m[tipo] || m.general;
  };

  const showGeneral = filtroInventario === 'todos' || filtroInventario === 'general';
  const showLegal = filtroInventario === 'todos' || filtroInventario === 'legal';

  const calcularValorInventario = (stock: number, precioDolares: number) => {
    const valorUSD = stock * precioDolares;
    return {
      usd: valorUSD,
      bsf: tasas.ves > 0 ? valorUSD * tasas.ves : 0,
      cop: tasas.cop > 0 ? valorUSD * tasas.cop : 0
    };
  };



  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-gradient-to-r from-white via-blue-50/30 to-white/80 backdrop-blur-sm px-8 py-6 border-b-2 border-gray-200 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 ring-4 ring-blue-500/10">
                <Package size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 leading-tight tracking-tight">Inventario</h2>
                <p className="text-xs text-gray-600 mt-1 font-medium">{totalItems} productos activos</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => openProductoModal()}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg hover:shadow-blue-500/30 text-white rounded-lg transition-all text-sm font-semibold shadow-md"
              >
                <Plus size={18} strokeWidth={2.5} />
                Nuevo Producto
              </button>
              <button
                onClick={() => loadProductos(currentPage)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50 text-sm font-semibold text-gray-700 shadow-sm"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Recargar
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => {
                  setFiltroStockBajo(false);
                  setFiltroDiferencias(false);
                }}
                className={`bg-gradient-to-br rounded-xl border p-5 flex items-center gap-4 shadow-sm transition-all text-left ${!filtroStockBajo && !filtroDiferencias ? 'from-blue-50 to-blue-100/50 border-blue-300 ring-2 ring-blue-400/50 shadow-md' : 'from-white to-gray-50/50 border-gray-200 hover:border-blue-300'}`}
              >
                <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Package size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">Total Productos</p>
                  <p className="text-3xl font-extrabold text-gray-900 mt-0.5">{totalItems}</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setFiltroStockBajo(!filtroStockBajo);
                  setFiltroDiferencias(false);
                }}
                className={`bg-gradient-to-br rounded-xl border p-5 flex items-center gap-4 shadow-sm transition-all text-left ${filtroStockBajo ? 'from-red-50 to-red-100/50 border-red-300 ring-2 ring-red-400/50 shadow-md' : 'from-white to-gray-50/50 border-gray-200 hover:border-red-300'}`}
              >
                <div className="w-12 h-12 rounded-lg bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                  <AlertTriangle size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">Stock Bajo (&lt;{STOCK_BAJO})</p>
                  <p className="text-3xl font-extrabold text-red-600 mt-0.5">{globalStats.totalStockBajo}</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setFiltroDiferencias(!filtroDiferencias);
                  setFiltroStockBajo(false);
                }}
                className={`bg-gradient-to-br rounded-xl border p-5 flex items-center gap-4 shadow-sm transition-all text-left ${filtroDiferencias ? 'from-amber-50 to-amber-100/50 border-amber-300 ring-2 ring-amber-400/50 shadow-md' : 'from-white to-gray-50/50 border-gray-200 hover:border-amber-300'}`}
              >
                <div className="w-12 h-12 rounded-lg bg-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <ArrowUpDown size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">Diferencias Gen/Legal</p>
                  <p className="text-3xl font-extrabold text-amber-600 mt-0.5">{globalStats.totalDiferencias}</p>
                </div>
              </button>
            </div>

            <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b-2 border-gray-200 bg-gradient-to-r from-gray-50/50 to-white flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="relative flex-1 max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre o código..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm bg-white text-gray-900 font-medium"
                    />
                  </div>
                  <select
                    value={filtroCategoria}
                    onChange={e => setFiltroCategoria(e.target.value ? Number(e.target.value) : '')}
                    className="px-4 py-2.5 border-2 border-gray-300 rounded-lg text-sm bg-white text-gray-900 font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="">Todas las categorías</option>
                    {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg p-1.5 shadow-sm">
                  {([
                    { key: 'todos' as const, label: 'Todos' },
                    { key: 'general' as const, label: 'General' },
                    { key: 'legal' as const, label: 'Legal (SENIAT)' },
                  ]).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setFiltroInventario(key)}
                      className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${filtroInventario === key
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-white/60'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-32">
                  <div className="text-center">
                    <Loader size={40} className="text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-sm font-semibold text-gray-600">Cargando productos...</p>
                  </div>
                </div>
              ) : productos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <Package size={40} className="text-blue-300" />
                  </div>
                  <p className="text-gray-900 font-bold text-lg mb-1">No hay productos que coincidan</p>
                  <p className="text-gray-500 text-sm mb-6">Intenta ajustar los filtros de búsqueda</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Producto</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Categoría</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Precios (USD/BSF/COP)</th>
                        {showGeneral && (
                          <>
                            <th className="px-4 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider bg-blue-50/50">Stock Gral</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-blue-700 uppercase tracking-wider bg-blue-50/50">Valor USD</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-blue-700 uppercase tracking-wider bg-blue-50/50">Valor BSF</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-blue-700 uppercase tracking-wider bg-blue-50/50">Valor COP</th>
                          </>
                        )}
                        {showLegal && (
                          <>
                            <th className="px-4 py-3 text-left text-xs font-bold text-amber-700 uppercase tracking-wider bg-amber-50/50">Stock Legal</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-amber-700 uppercase tracking-wider bg-amber-50/50">Valor USD</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-amber-700 uppercase tracking-wider bg-amber-50/50">Valor BSF</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-amber-700 uppercase tracking-wider bg-amber-50/50">Valor COP</th>
                          </>
                        )}
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {productos.map(prod => {
                        const valorGeneral = calcularValorInventario(prod.stock_general, prod.precio_base || 0);
                        const valorLegal = calcularValorInventario(prod.stock_legal, prod.precio_base || 0);
                        return (
                          <tr key={prod.id_producto} className="hover:bg-blue-50/50 transition-colors">
                            <td className="px-4 py-4">
                              <p className="text-sm font-semibold text-gray-900">{prod.nombre}</p>
                              {prod.codigo_barra && <p className="text-xs text-gray-500 font-mono">{prod.codigo_barra}</p>}
                            </td>
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                {prod.categoria?.nombre || '—'}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm">
                              <div className="font-semibold text-gray-900 mb-1">{fmtUSD(prod.precio_base)}</div>
                              <div className="text-[10px] sm:text-xs text-gray-500 font-medium">
                                <span className="mr-2">BSF: {tasas.ves > 0 ? fmtBSF((prod.precio_base || 0) * tasas.ves) : '—'}</span>
                                <span className="hidden sm:inline-block">COP: {tasas.cop > 0 ? fmtCOP((prod.precio_base || 0) * tasas.cop) : '—'}</span>
                                <div className="sm:hidden mt-0.5">COP: {tasas.cop > 0 ? fmtCOP((prod.precio_base || 0) * tasas.cop) : '—'}</div>
                              </div>
                            </td>
                            {showGeneral && (
                              <>
                                <td className="px-4 py-4 bg-blue-50/30">
                                  <span className={`font-semibold text-sm ${getStockClass(prod.stock_general)}`}>
                                    {fmt3(prod.stock_general)}
                                  </span>
                                  {prod.stock_general < STOCK_BAJO && (
                                    <span className="ml-1.5 inline-flex"><AlertTriangle size={12} className="text-red-600" /></span>
                                  )}
                                </td>
                                <td className="px-4 py-4 text-right bg-blue-50/30 font-semibold text-gray-900">
                                  {fmtUSD(valorGeneral.usd)}
                                </td>
                                <td className="px-4 py-4 text-right bg-blue-50/30 font-semibold text-gray-900">
                                  {tasas.ves > 0 ? fmtBSF(valorGeneral.bsf) : <span className="text-gray-400">—</span>}
                                </td>
                                <td className="px-4 py-4 text-right bg-blue-50/30 font-semibold text-gray-900">
                                  {tasas.cop > 0 ? fmtCOP(valorGeneral.cop) : <span className="text-gray-400">—</span>}
                                </td>
                              </>
                            )}
                            {showLegal && (
                              <>
                                <td className="px-4 py-4 bg-amber-50/30">
                                  <span className={`font-semibold text-sm ${getStockClass(prod.stock_legal)}`}>
                                    {fmt3(prod.stock_legal)}
                                  </span>
                                </td>
                                <td className="px-4 py-4 text-right bg-amber-50/30 font-semibold text-gray-900">
                                  {fmtUSD(valorLegal.usd)}
                                </td>
                                <td className="px-4 py-4 text-right bg-amber-50/30 font-semibold text-gray-900">
                                  {tasas.ves > 0 ? fmtBSF(valorLegal.bsf) : <span className="text-gray-400">—</span>}
                                </td>
                                <td className="px-4 py-4 text-right bg-amber-50/30 font-semibold text-gray-900">
                                  {tasas.cop > 0 ? fmtCOP(valorLegal.cop) : <span className="text-gray-400">—</span>}
                                </td>
                              </>
                            )}
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => openAjusteModal(prod)}
                                  title="Ajuste Rápido"
                                  className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors text-gray-600 hover:text-blue-600"
                                >
                                  <ArrowUpDown size={16} />
                                </button>
                                <button
                                  onClick={() => openProductoModal(prod)}
                                  title="Editar Producto"
                                  className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors text-gray-600 hover:text-blue-600"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => openHistorialModal(prod)}
                                  title="Ver Historial"
                                  className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors text-gray-600 hover:text-blue-600"
                                >
                                  <History size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {totalPages > 1 && (
                <div className="px-6 py-4 border-t-2 border-gray-200 bg-gradient-to-r from-gray-50/50 to-white flex items-center justify-between">
                  <p className="text-gray-600 text-sm font-medium">Mostrando <span className="font-bold text-gray-900">{productos.length}</span> de <span className="font-bold text-gray-900">{totalItems}</span> productos</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => loadProductos(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-300 disabled:opacity-30 text-sm font-semibold text-gray-700 transition-all"
                    >
                      ← Anterior
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(n => (
                      <button
                        key={n}
                        onClick={() => loadProductos(n)}
                        className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${currentPage === n
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                          : 'border-2 border-gray-300 hover:border-blue-300 hover:bg-blue-50 text-gray-700'
                          }`}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      onClick={() => loadProductos(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-300 disabled:opacity-30 text-sm font-semibold text-gray-700 transition-all"
                    >
                      Siguiente →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {showHistorialModal && historialProducto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-50 pt-8 pb-8 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 flex flex-col max-h-[calc(100vh-4rem)]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Ficha & Historial</h3>
                <p className="text-xs text-gray-500 mt-0.5">{historialProducto.nombre}</p>
              </div>
              <button
                onClick={() => setShowHistorialModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X size={18} className="text-gray-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs text-gray-500 font-medium">Categoría</p>
                  <p className="text-sm font-semibold text-gray-900">{historialProducto.categoria?.nombre}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs text-gray-500 font-medium">Unidad</p>
                  <p className="text-sm font-semibold text-gray-900">{historialProducto.unidad_medida?.nombre}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs text-gray-500 font-medium">Stock General</p>
                  <p className={`text-sm ${getStockClass(historialProducto.stock_general)} font-mono`}>
                    {fmt3(historialProducto.stock_general)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs text-gray-500 font-medium">Stock Legal</p>
                  <p className={`text-sm ${getStockClass(historialProducto.stock_legal)} font-mono`}>
                    {fmt3(historialProducto.stock_legal)}
                  </p>
                </div>
              </div>
              {historialProducto.codigo_barra && (
                <p className="text-xs text-gray-500">
                  Código: <span className="font-mono text-gray-900">{historialProducto.codigo_barra}</span>
                </p>
              )}
              {historialProducto.peso_unitario && (
                <p className="text-xs text-gray-500">
                  Peso unitario: <span className="font-mono text-gray-900">{historialProducto.peso_unitario} {historialProducto.unidad_medida?.abreviatura}</span>
                </p>
              )}

              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Últimos Movimientos</h4>
                {loadingMovimientos ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader size={20} className="text-blue-600 animate-spin" />
                  </div>
                ) : movimientos.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">Sin movimientos registrados</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          {['Fecha', 'Tipo', 'Inventario', 'Cantidad', 'Stock Ant.', 'Stock Post.', 'Usuario', 'Observación'].map(h => (
                            <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {movimientos.map(mov => (
                          <tr key={mov.id_movimiento} className="hover:bg-gray-50 transition-colors">
                            <td className="px-3 py-2 text-xs text-gray-900 whitespace-nowrap">
                              {new Date(mov.fecha).toLocaleDateString('es-ES')}
                              <br />
                              <span className="text-gray-500">{new Date(mov.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                            </td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${getMovBadge(mov.tipo_movimiento)}`}>
                                {mov.tipo_movimiento}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${getInvBadge(mov.tipo_inventario)}`}>
                                {mov.tipo_inventario}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-sm font-mono text-gray-900">{fmt3(mov.cantidad)}</td>
                            <td className="px-3 py-2 text-xs font-mono text-gray-500">{fmt3(mov.stock_anterior)}</td>
                            <td className="px-3 py-2 text-xs font-mono text-gray-900">{fmt3(mov.stock_posterior)}</td>
                            <td className="px-3 py-2 text-xs text-gray-500">{mov.usuario}</td>
                            <td className="px-3 py-2 text-xs text-gray-500 max-w-[200px] truncate">{mov.observacion}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showProductoModal && (
        <ProductoModal
          producto={editingProducto}
          onClose={() => setShowProductoModal(false)}
          onSaved={handleProductoSaved}
        />
      )}

      {showAjusteModal && ajusteProducto && (
        <AjusteInventarioModal
          producto={ajusteProducto}
          onClose={() => setShowAjusteModal(false)}
          onCompleted={handleAjusteCompleted}
        />
      )}
    </div>
  );
}
