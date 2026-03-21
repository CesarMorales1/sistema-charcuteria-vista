import { useState, useEffect, useCallback } from 'react';
import {
  ventasApi,
  Venta,
} from '../services/ventasApi';
import Sidebar from '../components/Sidebar';
import NuevaVentaModal from '../components/NuevaVentaModal';
import DetalleVentaModal from '../components/DetalleVentaModal';
import { 
  ShoppingBag, 
  RefreshCw, 
  FileText, 
  AlertCircle, 
  Filter, 
  Calendar,
  CheckCircle2,
  XCircle,
  Plus,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const fmt2 = (n: number | undefined | null) => (Number(n) || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Ventas() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [filtroSeniat, setFiltroSeniat] = useState<boolean | undefined>(undefined);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [globalStats, setGlobalStats] = useState({ totalVentasHoy: 0, countAnuladas: 0, totalGeneral: 0 });

  const [showNuevaVentaModal, setShowNuevaVentaModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null);

  const loadVentas = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await ventasApi.getVentas({
        page,
        limit: 15,
        estado: filtroEstado || undefined,
        reportable_seniat: filtroSeniat,
        fecha_desde: fechaDesde || undefined,
        fecha_hasta: fechaHasta || undefined,
      });
      setVentas(res.data);
      setCurrentPage(res.page);
      setTotalPages(res.totalPages);
      setTotalItems(res.total);
      if (res.stats) {
        setGlobalStats(res.stats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar ventas');
    } finally {
      setLoading(false);
    }
  }, [fechaDesde, fechaHasta, filtroEstado, filtroSeniat]);

  useEffect(() => {
    loadVentas(1);
  }, [loadVentas]);

  const handleAnular = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas anular esta venta? Esta acción restaurará el inventario.')) return;
    try {
      await ventasApi.anularVenta(id);
      loadVentas(currentPage);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al anular venta');
    }
  };

  const getStatusBadge = (estado: string) => {
    if (estado === 'abierta') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
          <CheckCircle2 size={12} /> Abierta
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
        <XCircle size={12} /> Anulada
      </span>
    );
  };

  return (
    <div className="min-h-screen flex bg-gray-50 uppercase-none">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white/80 backdrop-blur-sm px-8 py-5 border-b border-gray-200 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-200/50">
                <ShoppingBag size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 leading-tight">Ventas / Facturación</h2>
                <p className="text-xs text-gray-500 mt-0.5">{totalItems} transacciones registradas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadVentas(1)}
                className="p-2.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all border border-transparent hover:border-emerald-100"
                title="Actualizar"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => setShowNuevaVentaModal(true)}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-all shadow-lg shadow-emerald-200/50 active:scale-95"
              >
                <Plus size={18} />
                <span>Nueva Venta</span>
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <FileText size={24} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Ventas del Día</p>
                  <p className="text-2xl font-black text-gray-900">Bs. {fmt2(globalStats.totalVentasHoy)}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <CheckCircle2 size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Facturado Total</p>
                  <p className="text-2xl font-black text-gray-900">Bs. {fmt2(globalStats.totalGeneral)}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                  <XCircle size={24} className="text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Anuladas</p>
                  <p className="text-2xl font-black text-red-600">{globalStats.countAnuladas}</p>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px] relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none"
                  >
                    <option value="">Todos los estados</option>
                    <option value="abierta">Solo Abiertas</option>
                    <option value="anulada">Solo Anuladas</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-1">
                  <Calendar size={18} className="text-gray-400" />
                  <input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    className="bg-transparent border-none text-sm outline-none py-1.5"
                    placeholder="Desde"
                  />
                  <span className="text-gray-300">|</span>
                  <input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    className="bg-transparent border-none text-sm outline-none py-1.5"
                    placeholder="Hasta"
                  />
                </div>

                <button
                  onClick={() => setFiltroSeniat(filtroSeniat === undefined ? true : filtroSeniat ? false : undefined)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                    filtroSeniat === true ? 'bg-amber-50 border-amber-200 text-amber-700' : 
                    filtroSeniat === false ? 'bg-blue-50 border-blue-200 text-blue-700' :
                    'bg-gray-50 border-gray-100 text-gray-600'
                  }`}
                >
                  {filtroSeniat === true ? 'SENIAT (Legal)' : filtroSeniat === false ? 'Solo Interno' : 'Todo (SENIAT/Interno)'}
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Fecha / Hora</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">ID Venta</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Artículos</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Estado</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Monto Total</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading && ventas.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <RefreshCw size={40} className="text-emerald-200 animate-spin" />
                            <p className="text-gray-400 font-medium">Buscando transacciones...</p>
                          </div>
                        </td>
                      </tr>
                    ) : ventas.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-20 text-center text-gray-400">
                          <div className="flex flex-col items-center gap-3 opacity-50">
                            <ShoppingBag size={48} />
                            <p className="font-medium text-lg">No se encontraron ventas</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      ventas.map((v) => (
                        <tr key={v.id_venta} className="hover:bg-gray-50/80 transition-colors group">
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-gray-900">{new Date(v.fecha_venta).toLocaleDateString()}</p>
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">{new Date(v.fecha_venta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">#{v.id_venta.toString().padStart(6, '0')}</span>
                            {v.reportable_seniat && (
                                <span className="ml-2 px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-black rounded border border-amber-100">SENIAT</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-600">{v.detalles.length} {v.detalles.length === 1 ? 'ítem' : 'ítems'}</p>
                            <p className="text-[10px] text-gray-400 truncate max-w-[150px]">
                                {v.detalles.map(d => d.producto?.nombre).join(', ')}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            {getStatusBadge(v.estado)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm font-black text-gray-900 italic">Bs. {fmt2(v.total)}</p>
                            {v.id_moneda && (
                                <p className="text-[10px] text-gray-400 font-bold uppercase">{v.moneda?.codigo} (Tasa: {v.tasa_referencia})</p>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                    setSelectedVenta(v);
                                    setShowDetalleModal(true);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Ver detalles"
                              >
                                <Eye size={18} />
                              </button>
                              {v.estado === 'abierta' && (
                                <button
                                    onClick={() => handleAnular(v.id_venta)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Anular venta"
                                >
                                    <Trash2 size={18} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Página {currentPage} de {totalPages}</p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => loadVentas(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1 || loading}
                      className="p-2 text-gray-400 hover:text-emerald-600 disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={() => loadVentas(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages || loading}
                      className="p-2 text-gray-400 hover:text-emerald-600 disabled:opacity-30 transition-colors"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modales */}
      <NuevaVentaModal isOpen={showNuevaVentaModal} onClose={() => setShowNuevaVentaModal(false)} onRefresh={() => loadVentas(1)} />
      <DetalleVentaModal venta={selectedVenta} isOpen={showDetalleModal} onClose={() => setShowDetalleModal(false)} />
    </div>
  );
}
