import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import {
  reportesApi,
  ProductoRentabilidad,
  CategoriaRentabilidad,
} from '../services/reportesApi';
import {
  TrendingUp,
  DollarSign,
  Percent,
  Search,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from 'lucide-react';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const fmt2 = (n: number) =>
  (Number(n) || 0).toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function MargenBadge({ margen }: { margen: number }) {
  if (margen >= 40)
    return (
      <span className="inline-flex items-center justify-center min-w-[64px] px-3 py-1.5 bg-emerald-100 text-emerald-800 text-sm font-bold rounded-full">
        {margen.toFixed(1)}%
      </span>
    );
  if (margen >= 20)
    return (
      <span className="inline-flex items-center justify-center min-w-[64px] px-3 py-1.5 bg-amber-100 text-amber-800 text-sm font-bold rounded-full">
        {margen.toFixed(1)}%
      </span>
    );
  return (
    <span className="inline-flex items-center justify-center min-w-[64px] px-3 py-1.5 bg-red-100 text-red-700 text-sm font-bold rounded-full">
      {margen.toFixed(1)}%
    </span>
  );
}

/* ─── Category bar colours ─────────────────────────────────────────────────── */
const BAR_COLORS = [
  'bg-emerald-600',
  'bg-emerald-400',
  'bg-slate-400',
  'bg-amber-400',
  'bg-blue-400',
];

/* ─── Skeleton row ─────────────────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[...Array(7)].map((_, i) => (
        <td key={i} className="px-6 py-5">
          <div className="h-4 bg-gray-100 rounded-full" />
        </td>
      ))}
    </tr>
  );
}

/* ─── Main component ────────────────────────────────────────────────────────── */
export default function Rentabilidad() {
  const [productos, setProductos] = useState<ProductoRentabilidad[]>([]);
  const [categorias, setCategorias] = useState<CategoriaRentabilidad[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [kpis, setKpis] = useState({
    totalIngresos: 0,
    totalGanancia: 0,
    margenPromedio: 0,
  });

  /* debounce search */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const loadData = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const res = await reportesApi.getRentabilidad(page, 20, debouncedSearch);
        setProductos(res.data);
        setCurrentPage(res.page);
        setTotalPages(res.totalPages);
        setTotalItems(res.total);
        setKpis(res.kpis);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el reporte');
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch]
  );

  const loadCategorias = useCallback(async () => {
    try {
      const data = await reportesApi.getCategorias();
      setCategorias(data.slice(0, 5));
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    loadData(1);
  }, [debouncedSearch]);

  useEffect(() => {
    loadCategorias();
  }, []);

  const maxIngresos = Math.max(...categorias.map((c) => c.ingresos), 1);

  const paginationRange = () => {
    const pages: number[] = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  /* ── KPI trend label ── */
  const margenTrend =
    kpis.margenPromedio >= 35 ? '+Bueno' : kpis.margenPromedio > 0 ? 'Bajo meta' : '—';

  return (
    <div className="flex h-screen bg-[#f7f9fb] overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* ── Header ───────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100 px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-emerald-800 text-xl tracking-tight flex items-center gap-2">
              <BarChart3 size={20} className="text-emerald-600" />
              Análisis de Rentabilidad
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Panel de control financiero detallado</p>
          </div>
          <button
            onClick={() => loadData(currentPage)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 active:scale-95 transition-all text-sm font-medium disabled:opacity-60 shadow-sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </header>

        <div className="p-8 space-y-8">
          {/* ── KPI Cards ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Ingresos Totales */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-emerald-50 rounded-lg text-emerald-700">
                  <DollarSign size={20} />
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  USD
                </span>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500">Ingresos Totales</p>
                <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  ${fmt2(kpis.totalIngresos)}
                </h3>
              </div>
            </div>

            {/* Ganancia Total */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-blue-50 rounded-lg text-blue-700">
                  <TrendingUp size={20} />
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  Ganancia
                </span>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500">Ganancia Total (USD)</p>
                <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  ${fmt2(kpis.totalGanancia)}
                </h3>
              </div>
            </div>

            {/* Margen Promedio */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-amber-50 rounded-lg text-amber-700">
                  <Percent size={20} />
                </div>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${
                    kpis.margenPromedio >= 35
                      ? 'text-emerald-600 bg-emerald-50'
                      : 'text-amber-600 bg-amber-50'
                  }`}
                >
                  {margenTrend}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500">Margen Promedio</p>
                <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  {kpis.margenPromedio.toFixed(1)}%
                </h3>
                <p className="text-[11px] text-gray-400 mt-1">Meta: 35%</p>
              </div>
            </div>
          </div>

          {/* ── Product Table ─────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Filters */}
            <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  id="rentabilidad-search"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filtrar por nombre del producto..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                />
              </div>
              <p className="text-sm text-gray-400 ml-auto font-medium">
                {totalItems} producto{totalItems !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mx-6 my-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle size={16} className="text-red-600 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/70">
                    <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-gray-500">
                      Producto
                    </th>
                    <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-gray-500">
                      Categoría
                    </th>
                    <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-gray-500 text-right">
                      Costo Prom.
                    </th>
                    <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-gray-500 text-right">
                      Precio Venta
                    </th>
                    <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-gray-500 text-right">
                      Ingresos
                    </th>
                    <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-gray-500 text-right">
                      Ganancia
                    </th>
                    <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-gray-500 text-center">
                      Rentabilidad
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading &&
                    [...Array(6)].map((_, i) => <SkeletonRow key={i} />)}

                  {!loading && productos.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-16 text-center text-gray-400 text-sm"
                      >
                        <BarChart3
                          size={32}
                          className="mx-auto mb-3 text-gray-200"
                        />
                        No hay datos para mostrar
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    productos.map((prod) => (
                      <tr
                        key={prod.id_producto}
                        className="hover:bg-gray-50/70 transition-colors group"
                      >
                        {/* Producto */}
                        <td className="px-6 py-5">
                          <p className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors text-sm">
                            {prod.nombre}
                          </p>
                          {prod.codigo_barra && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              SKU: {prod.codigo_barra}
                            </p>
                          )}
                        </td>

                        {/* Categoría */}
                        <td className="px-6 py-5">
                          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md">
                            {prod.categoria}
                          </span>
                        </td>

                        {/* Costo Prom */}
                        <td className="px-6 py-5 text-right font-medium text-gray-600 text-sm">
                          {prod.costo_promedio > 0 ? (
                            `$${fmt2(prod.costo_promedio)}`
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>

                        {/* Precio Venta */}
                        <td className="px-6 py-5 text-right font-medium text-gray-600 text-sm">
                          {prod.precio_base > 0 ? (
                            `$${fmt2(prod.precio_base)}`
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>

                        {/* Ingresos */}
                        <td className="px-6 py-5 text-right font-semibold text-gray-800 text-sm">
                          {prod.ingresos_totales > 0 ? (
                            `$${fmt2(prod.ingresos_totales)}`
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>

                        {/* Ganancia */}
                        <td className="px-6 py-5 text-right font-bold text-sm">
                          {prod.ganancia >= 0 ? (
                            <span className="text-emerald-700">
                              ${fmt2(prod.ganancia)}
                            </span>
                          ) : (
                            <span className="text-red-500">
                              -${fmt2(Math.abs(prod.ganancia))}
                            </span>
                          )}
                        </td>

                        {/* Margen */}
                        <td className="px-6 py-5 text-center">
                          {prod.ingresos_totales > 0 ? (
                            <MargenBadge margen={prod.margen_porcentaje} />
                          ) : (
                            <span className="text-xs text-gray-300">Sin ventas</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-gray-50/40 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-400 font-medium">
                  Pág. {currentPage} de {totalPages} — {totalItems} productos
                </p>
                <div className="flex gap-1.5">
                  <button
                    id="rentabilidad-prev"
                    onClick={() => {
                      const p = currentPage - 1;
                      setCurrentPage(p);
                      loadData(p);
                    }}
                    disabled={currentPage === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-500 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  {paginationRange().map((n) => (
                    <button
                      key={n}
                      onClick={() => {
                        setCurrentPage(n);
                        loadData(n);
                      }}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                        currentPage === n
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {n}
                    </button>
                  ))}

                  <button
                    id="rentabilidad-next"
                    onClick={() => {
                      const p = currentPage + 1;
                      setCurrentPage(p);
                      loadData(p);
                    }}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-500 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Category Breakdown ──────────────────────────────────────── */}
          {categorias.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-2 text-base">
                <TrendingUp size={18} className="text-emerald-600" />
                Análisis por Categoría
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {categorias.map((cat, idx) => {
                  const pct = Math.round((cat.ingresos / maxIngresos) * 100);
                  const barColor = BAR_COLORS[idx % BAR_COLORS.length];
                  return (
                    <div key={cat.id_categoria} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 font-medium">{cat.categoria}</span>
                        <span className="font-bold text-emerald-700">${fmt2(cat.ingresos)}</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${barColor} rounded-full transition-all duration-700`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400">
                        {cat.unidades.toFixed(0)} unidades vendidas
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
