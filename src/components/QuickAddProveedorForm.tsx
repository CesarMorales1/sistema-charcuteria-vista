import { useState, useRef, useEffect } from 'react';
import { Plus, Loader, AlertCircle, Building2 } from 'lucide-react';
import { api, Proveedor } from '../services/api';

interface QuickAddProveedorFormProps {
    searchTerm: string;
    onSuccess: (proveedor: Proveedor) => void;
    onCancel: () => void;
    onProveedoresRefresh: () => void;
}

export default function QuickAddProveedorForm({
    searchTerm,
    onSuccess,
    onCancel,
    onProveedoresRefresh,
}: QuickAddProveedorFormProps) {
    const [isCreating, setIsCreating] = useState(false);
    
    // Refs for keyboard navigation
    const nombreRef = useRef<HTMLInputElement>(null);
    const rucRef = useRef<HTMLInputElement>(null);
    const telefonoRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const submitBtnRef = useRef<HTMLButtonElement>(null);

    // Cancel on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onCancel();
            }
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
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        nombre: searchTerm,
        ruc: '',
        telefono: '',
        email: '',
        direccion: '',
        terminos_pago: '',
    });

    const handleSubmit = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!formData.nombre.trim()) {
            setError('El nombre del proveedor es obligatorio');
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            const nuevo = await api.createProveedor({
                nombre: formData.nombre.trim(),
                ...(formData.ruc && { ruc: formData.ruc.trim() }),
                ...(formData.telefono && { telefono: formData.telefono.trim() }),
                ...(formData.email && { email: formData.email.trim() }),
                ...(formData.direccion && { direccion: formData.direccion.trim() }),
                ...(formData.terminos_pago && { terminos_pago: formData.terminos_pago.trim() }),
            });

            onProveedoresRefresh();
            onSuccess(nuevo);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al crear proveedor');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="p-6 bg-gradient-to-br from-blue-50/50 to-white">
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-200">
                    <Building2 size={20} className="text-white" />
                </div>
                <div>
                    <h5 className="text-sm font-black text-blue-800 uppercase tracking-tight">Crear Proveedor Nuevo</h5>
                    <p className="text-[10px] text-blue-500 font-bold uppercase">Selección automática al guardar</p>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border-2 border-red-100 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-700 font-bold leading-tight">{error}</p>
                </div>
            )}

            <div className="space-y-4">
                {/* Nombre */}
                <div>
                    <label className="block text-[11px] font-black text-gray-500 mb-1.5 uppercase tracking-wider ml-1">
                        Nombre / Razón Social <span className="text-red-500">*</span>
                    </label>
                    <input
                        ref={nombreRef}
                        type="text"
                        value={formData.nombre}
                        onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                        onKeyDown={e => handleEnterPress(e, rucRef)}
                        placeholder="Nombre del proveedor"
                        required
                        autoFocus
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-bold transition-all bg-white/50 focus:bg-white"
                    />
                </div>

                {/* RIF / Teléfono */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[11px] font-black text-gray-500 mb-1.5 uppercase tracking-wider ml-1">RIF</label>
                        <input
                            ref={rucRef}
                            type="text"
                            value={formData.ruc}
                            onChange={e => setFormData({ ...formData, ruc: e.target.value })}
                            onKeyDown={e => handleEnterPress(e, telefonoRef)}
                            placeholder="J-000000000"
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono font-bold transition-all bg-white/50 focus:bg-white"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-black text-gray-500 mb-1.5 uppercase tracking-wider ml-1">Teléfono</label>
                        <input
                            ref={telefonoRef}
                            type="text"
                            value={formData.telefono}
                            onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                            onKeyDown={e => handleEnterPress(e, emailRef)}
                            placeholder="0414-0000000"
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-bold transition-all bg-white/50 focus:bg-white"
                        />
                    </div>
                </div>

                {/* Email */}
                <div>
                    <label className="block text-[11px] font-black text-gray-500 mb-1.5 uppercase tracking-wider ml-1">Email de Contacto</label>
                    <input
                        ref={emailRef}
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        onKeyDown={e => handleEnterPress(e, submitBtnRef)}
                        placeholder="proveedor@correo.com"
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-bold transition-all bg-white/50 focus:bg-white"
                    />
                </div>

                {/* Acciones */}
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
                        disabled={isCreating || !formData.nombre.trim()}
                        className="flex-[1.5] px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 font-black text-xs uppercase tracking-widest transition-all disabled:opacity-60 flex items-center justify-center gap-2"
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
