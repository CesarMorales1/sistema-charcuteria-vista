import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PackageOpen, Save, AlertCircle, CheckCircle2, X, Plus, Loader } from 'lucide-react';
import { inventarioApi, ProductoInventario } from '../services/inventarioApi';
import { api, CategoriaProducto, UnidadMedida } from '../services/api';
import Sidebar from '../components/Sidebar';

interface ProductInitState {
  cantidad: string;
  valor_unitario: string;
}

export default function InitialInventory() {
  const [productos, setProductos] = useState<ProductoInventario[]>([]);
  const [initData, setInitData] = useState<Record<number, ProductInitState>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // States for new product modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [categorias, setCategorias] = useState<CategoriaProducto[]>([]);
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [productFormData, setProductFormData] = useState({
    nombre: '',
    codigo_barra: '',
    descripcion: '',
    id_categoria: '' as number | '',
    id_unidad_medida: '' as number | '',
    peso_unitario: '',
    precio_base: '',
    cantidad_inicial: '0',
  });
  const [productFormErrors, setProductFormErrors] = useState<Record<string, string>>({});

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    loadRefs();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const isInitialized = await inventarioApi.checkInicializacion();
      if (isInitialized) {
        navigate('/');
        return;
      }
      
      const res = await inventarioApi.getProductos(1, 1000);
      setProductos(res.data);
      
      setInitData(prev => {
        const newMap = { ...prev };
        res.data.forEach(p => {
          if (!newMap[p.id_producto]) {
            newMap[p.id_producto] = { cantidad: '0', valor_unitario: '0' };
          }
        });
        return newMap;
      });
    } catch (err: any) {
      setError(err.message || 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const loadRefs = async () => {
    try {
      const [cats, units] = await Promise.all([
        api.getCategorias(),
        api.getUnidadesMedida(),
      ]);
      setCategorias(cats);
      setUnidades(units);
    } catch (err) {
      console.error('Error loading refs:', err);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const errors: Record<string, string> = {};
    if (!productFormData.nombre.trim()) errors.nombre = 'El nombre es requerido';
    if (!productFormData.id_categoria) errors.id_categoria = 'La categoría es requerida';
    if (!productFormData.id_unidad_medida) errors.id_unidad_medida = 'La unidad es requerida';
    
    if (Object.keys(errors).length > 0) {
      setProductFormErrors(errors);
      return;
    }

    try {
      setIsSubmittingProduct(true);
      const payload = {
        ...productFormData,
        id_categoria: Number(productFormData.id_categoria),
        id_unidad_medida: Number(productFormData.id_unidad_medida),
        peso_unitario: productFormData.peso_unitario ? parseFloat(productFormData.peso_unitario) : undefined,
        precio_base: productFormData.precio_base ? parseFloat(productFormData.precio_base) : undefined,
      };

      const newProduct = await api.createProducto(payload as any);
      
      // Capturar valores para el mapa de inicialización
      const initialQty = productFormData.cantidad_inicial || '0';
      const initialCost = productFormData.precio_base || '0';
      
      setShowProductModal(false);
      setProductFormData({
        nombre: '',
        codigo_barra: '',
        descripcion: '',
        id_categoria: '',
        id_unidad_medida: '',
        peso_unitario: '',
        precio_base: '',
        cantidad_inicial: '0',
      });
      
      // Actualizar mapa ANTES de refrescar productos
      setInitData(prev => ({
        ...prev,
        [newProduct.id_producto]: { 
          cantidad: initialQty, 
          valor_unitario: initialCost 
        }
      }));
      
      await loadData(); // Refresh product list
    } catch (err: any) {
      setProductFormErrors({ submit: err.message || 'Error al crear producto' });
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleInputChange = (id: number, field: keyof ProductInitState, value: string) => {
    setInitData(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const totalValue = useMemo(() => {
    return productos.reduce((acc, p) => {
      const data = initData[p.id_producto];
      if (!data) return acc;
      const cant = parseFloat(data.cantidad) || 0;
      const val = parseFloat(data.valor_unitario) || 0;
      return acc + (cant * val);
    }, 0);
  }, [productos, initData]);

  const itemsWithStock = useMemo(() => {
    return Object.values(initData).filter(d => parseFloat(d.cantidad) > 0).length;
  }, [initData]);

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);
      setShowConfirm(false);
      
      const payload = productos.map(p => {
        const data = initData[p.id_producto] || { cantidad: '0', valor_unitario: '0' };
        return {
          id_producto: p.id_producto,
          cantidad: parseFloat(data.cantidad) || 0,
          valor_unitario: parseFloat(data.valor_unitario) || null
        };
      });

      await inventarioApi.inicializarInventario(payload);
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error al guardar el inventario inicial');
    } finally {
      setSaving(false);
    }
  };

  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  const handleSkip = async () => {
    try {
      setSaving(true);
      setError(null);
      setShowSkipConfirm(false);
      
      // Enviar lista vacía para solo marcar como inicializado
      await inventarioApi.inicializarInventario([]);
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error al omitir la inicialización');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-500 font-medium">Cargando inventario...</div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4 text-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-12 border border-green-100 flex flex-col items-center animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Inventario Inicializado!</h1>
          <p className="text-gray-600 mb-0">El sistema se ha configurado correctamente. Redirigiendo al tablero principal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#FDFBF7] via-[#FDF8F0] to-[#FCF5E9]">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col">
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-6 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <PackageOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Apertura de Inventario</h1>
                  <p className="text-gray-600">Configura las cantidades iniciales de tus productos para comenzar a operar.</p>
                </div>
              </div>
              <button
                onClick={() => setShowProductModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-medium shadow-sm active:scale-95"
              >
                <Plus size={18} />
                Nuevo Producto
              </button>
            </div>
            
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-blue-800 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-blue-600" />
              <p>
                <strong>¡Importante!</strong> Este proceso solo se puede realizar una vez. 
                Fija los valores físicos actuales de tus productos. Posteriormente, los movimientos se 
                realizarán mediante compras, ventas y ajustes.
              </p>
            </div>
          </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 shrink-0 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0 bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
          <div className="flex-1 overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unidad
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                    Cantidad Inicial
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                    Costo Unitario (USD)
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-gray-900">
                {productos.map((producto) => {
                  const state = initData[producto.id_producto] || { cantidad: '0', valor_unitario: '0' };
                  const subtotal = (parseFloat(state.cantidad) || 0) * (parseFloat(state.valor_unitario) || 0);
                  
                  return (
                    <tr key={producto.id_producto} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{producto.nombre}</div>
                        <div className="text-xs text-gray-500 font-mono uppercase">{producto.codigo_barra || 'Sin código'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          {producto.unidad_medida?.nombre || 'Unidades'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          required
                          value={state.cantidad}
                          onChange={(e) => handleInputChange(producto.id_producto, 'cantidad', e.target.value)}
                          className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border transition-all"
                          placeholder="0.000"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-400 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={state.valor_unitario}
                            onChange={(e) => handleInputChange(producto.id_producto, 'valor_unitario', e.target.value)}
                            className="block w-full pl-7 border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border transition-all"
                            placeholder="0.00"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                        ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
                {productos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                          <AlertCircle className="w-10 h-10 text-gray-300" />
                        </div>
                        <div className="text-center">
                          <p className="text-gray-900 font-bold text-xl mb-2">Tu catálogo está vacío</p>
                          <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
                            Antes de inicializar tu inventario, debes registrar los productos que tienes en existencia en la sección de productos.
                          </p>
                        </div>
                        <button
                          onClick={() => setShowProductModal(true)}
                          className="mt-4 flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
                        >
                          <Plus size={20} />
                          Registrar Productos
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="bg-gray-50 px-8 py-6 border-t border-gray-200 shrink-0 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-12">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Items con Stock</span>
                <span className="text-xl font-bold text-gray-900">{itemsWithStock} de {productos.length}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Valor Total Estimado</span>
                <span className="text-3xl font-extrabold text-blue-600">
                  ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-base font-medium">USD</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setShowSkipConfirm(true)}
                disabled={saving}
                className="px-6 py-4 text-gray-500 font-bold hover:text-gray-700 transition-all active:scale-95"
              >
                Omitir apertura
              </button>
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                disabled={saving || productos.length === 0}
                className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 font-bold active:scale-95"
              >
                <Save className="w-5 h-5" />
                Finalizar Apertura
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Product Creation Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Registrar Nuevo Producto</h3>
              <button 
                onClick={() => setShowProductModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="p-6 space-y-4">
              {productFormErrors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {productFormErrors.submit}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={productFormData.nombre}
                    onChange={e => setProductFormData({...productFormData, nombre: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ej: Jamón Ahumado"
                  />
                  {productFormErrors.nombre && <p className="text-xs text-red-500 mt-1">{productFormErrors.nombre}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                  <select
                    required
                    value={productFormData.id_categoria}
                    onChange={e => setProductFormData({...productFormData, id_categoria: e.target.value ? parseInt(e.target.value) : ''})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="">Seleccionar...</option>
                    {categorias.map(c => (
                      <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidad *</label>
                  <select
                    required
                    value={productFormData.id_unidad_medida}
                    onChange={e => setProductFormData({...productFormData, id_unidad_medida: e.target.value ? parseInt(e.target.value) : ''})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="">Seleccionar...</option>
                    {unidades.map(u => (
                      <option key={u.id_unidad_medida} value={u.id_unidad_medida}>{u.nombre} ({u.abreviatura})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio base (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productFormData.precio_base}
                    onChange={e => setProductFormData({...productFormData, precio_base: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código de Barras</label>
                  <input
                    type="text"
                    value={productFormData.codigo_barra}
                    onChange={e => setProductFormData({...productFormData, codigo_barra: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Opcional"
                  />
                </div>

                <div className="md:col-span-2 border-t border-gray-50 pt-4 mt-2">
                  <h4 className="text-sm font-bold text-blue-600 mb-3 flex items-center gap-2">
                    <AlertCircle size={14} /> Inventario Inicial para esta Apertura
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-emerald-700">Existencia Inicial *</label>
                      <input
                        type="number"
                        step="0.001"
                        value={productFormData.cantidad_inicial}
                        onChange={e => setProductFormData({...productFormData, cantidad_inicial: e.target.value})}
                        className="w-full px-3 py-2 border border-emerald-200 bg-emerald-50 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="0.000"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 font-bold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProduct}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmittingProduct && <Loader className="w-4 h-4 animate-spin" />}
                  {isSubmittingProduct ? 'Guardando...' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Skip Confirmation Modal */}
      {showSkipConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <button 
                onClick={() => setShowSkipConfirm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">¿Omitir Apertura de Inventario?</h3>
            <p className="text-gray-600 mb-6">
              Si omites este proceso, el sistema se marcará como inicializado pero todos tus productos tendrán **saldo cero**. Podrás agregar existencias luego mediante Compras o Ajustes.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSkipConfirm(false)}
                className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSkip}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-100 disabled:opacity-50"
              >
                {saving ? 'Procesando...' : 'Sí, omitir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <button 
                onClick={() => setShowConfirm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">¿Confirmar Apertura de Inventario?</h3>
            <p className="text-gray-600 mb-6">
              Esta acción establecerá los saldos iniciales de los productos seleccionados. Una vez confirmada, no podrás repetir este proceso.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-8">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Productos a inicializar:</span>
                <span className="font-bold text-gray-900">{itemsWithStock}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Valor total:</span>
                <span className="font-bold text-gray-900">${totalValue.toFixed(2)} USD</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100 disabled:opacity-50"
              >
                {saving ? 'Procesando...' : 'Sí, confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
