import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Package2, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    rol: 'cajero' as 'cajero' | 'bodega',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      await api.register({
        nombre: formData.nombre,
        email: formData.email,
        password: formData.password,
        rol: formData.rol,
      });
      navigate('/login', {
        state: { message: 'Usuario creado exitosamente. Inicia sesión para continuar.' },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear usuario');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="w-full lg:w-1/2 bg-gradient-to-br from-amber-900 via-amber-800 to-amber-900 text-white flex flex-col justify-center items-center p-12">
        <div className="max-w-md w-full space-y-8">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-600 to-amber-700 rounded-2xl flex items-center justify-center shadow-xl">
              <Package2 size={40} className="text-white" />
            </div>
            <h1 className="mt-6 text-3xl font-bold tracking-wide text-amber-100">
              SISTEMA DE GESTIÓN
            </h1>
          </div>

          <div className="border-t border-amber-700 pt-8">
            <p className="text-center text-amber-200 text-lg leading-relaxed">
              Control integral de inventario, compras, proveedores y cuentas por pagar.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-3 text-amber-200">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
              <span>Inventario</span>
            </div>
            <div className="flex items-center gap-3 text-amber-200">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
              <span>Compras</span>
            </div>
            <div className="flex items-center gap-3 text-amber-200">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
              <span>Proveedores</span>
            </div>
            <div className="flex items-center gap-3 text-amber-200">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
              <span>Facturación</span>
            </div>
            <div className="flex items-center gap-3 text-amber-200">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
              <span>Tasas de cambio</span>
            </div>
            <div className="flex items-center gap-3 text-amber-200">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
              <span>Usuarios</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 bg-gray-50 flex items-center justify-center p-12">
        <div className="max-w-md w-full">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Crear cuenta</h2>
            <p className="mt-2 text-gray-600">Completa los datos para registrarte</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                NOMBRE COMPLETO
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="nombre"
                  type="text"
                  required
                  maxLength={100}
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                  placeholder="Juan Pérez"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                CORREO ELECTRÓNICO
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                  placeholder="usuario@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="rol" className="block text-sm font-medium text-gray-700 mb-2">
                ROL
              </label>
              <select
                id="rol"
                value={formData.rol}
                onChange={(e) => setFormData({ ...formData, rol: e.target.value as 'cajero' | 'bodega' })}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent"
              >
                <option value="cajero">Cajero</option>
                <option value="bodega">Bodega</option>
              </select>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                CONTRASEÑA
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                CONFIRMAR CONTRASEÑA
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 px-4 rounded-lg font-medium hover:from-amber-700 hover:to-amber-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                ¿Ya tienes una cuenta?{' '}
                <Link to="/login" className="text-amber-700 hover:text-amber-800 font-medium">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500">
            Sistema de gestión © 2026 — Acceso restringido
          </div>
        </div>
      </div>
    </div>
  );
}
