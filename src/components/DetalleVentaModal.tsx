import { X, FileText, XCircle, User, Calendar, ShoppingCart } from 'lucide-react';
import { Venta } from '../services/ventasApi';

interface Props {
  venta: Venta | null;
  isOpen: boolean;
  onClose: () => void;
}

const fmt2 = (n: number) => n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function DetalleVentaModal({ venta, isOpen, onClose }: Props) {
  if (!isOpen || !venta) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-gray-100 scale-in-center">
        {/* Header */}
        <div className={`px-8 py-6 flex items-center justify-between text-white ${venta.estado === 'anulada' ? 'bg-red-600' : 'bg-blue-600'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold leading-tight">Venta #{venta.id_venta.toString().padStart(6, '0')}</h3>
              <p className="text-white/80 text-xs mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">{venta.reportable_seniat ? 'Comprobante Fiscal (SENIAT)' : 'Nota de Entrega Interna'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${venta.estado === 'anulada' ? 'bg-white/10 border-white/20' : 'bg-emerald-500/20 border-emerald-500/30'}`}>
              {venta.estado}
            </span>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-6 bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-gray-400">
                <Calendar size={14} />
                <span className="text-[10px] font-black uppercase tracking-wider">Fecha y Hora</span>
              </div>
              <p className="text-sm font-bold text-gray-800">
                {new Date(venta.fecha_venta).toLocaleDateString()} - {new Date(venta.fecha_venta).toLocaleTimeString()}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-gray-400">
                <User size={14} />
                <span className="text-[10px] font-black uppercase tracking-wider">Vendedor</span>
              </div>
              <p className="text-sm font-bold text-gray-800">{venta.usuario?.nombre || 'N/A'}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-400">
              <ShoppingCart size={14} />
              <span className="text-[10px] font-black uppercase tracking-wider">Detalle de Productos</span>
            </div>
            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3 text-center">Cant.</th>
                    <th className="px-4 py-3 text-right">Precio Unit.</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {venta.detalles.map((det) => (
                    <tr key={det.id_detalle} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold text-gray-800">{det.producto?.nombre}</p>
                        <p className="text-[10px] text-gray-400 italic">{det.producto?.codigo_barra}</p>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600 font-medium">
                        {det.cantidad} {det.producto?.unidad_medida?.abreviatura}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 font-medium">
                        Bs. {fmt2(det.precio_unitario)}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-gray-900">
                        Bs. {fmt2(det.subtotal_linea)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end pt-4">
            <div className="w-64 space-y-3">
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span className="font-bold uppercase tracking-tight">Subtotal:</span>
                <span className="font-black text-gray-800">Bs. {fmt2(venta.subtotal)}</span>
              </div>
              {venta.reportable_seniat && (
                <div className="flex justify-between items-center text-sm text-amber-600">
                  <span className="font-bold uppercase tracking-tight italic">IVA ({venta.alicuota_iva}%):</span>
                  <span className="font-black">Bs. {fmt2(venta.monto_iva || 0)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <span className="text-lg font-black text-gray-900 uppercase italic">Total:</span>
                <span className="text-2xl font-black text-emerald-600 italic tracking-tight">
                  Bs. {fmt2(venta.total)}
                </span>
              </div>
              {venta.id_moneda && (
                <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest pt-1">
                  <span>Referencia {venta.moneda?.codigo}:</span>
                  <span>{fmt2(venta.total / (venta.tasa_referencia || 1))}</span>
                </div>
              )}
            </div>
          </div>

          {venta.estado === 'anulada' && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 text-red-600 animate-pulse">
              <XCircle size={18} />
              <p className="text-xs font-black uppercase tracking-widest">Esta venta ha sido anulada e inventariada de retorno</p>
            </div>
          )}

          {venta.observacion && (
            <div className="space-y-1 pt-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Observaciones</p>
              <p className="text-xs text-gray-600 italic bg-gray-50 p-3 rounded-xl border border-gray-100">{venta.observacion}</p>
            </div>
          )}
        </div>

        <div className="px-8 py-5 bg-gray-50/50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-100 transition-all active:scale-95"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
}
