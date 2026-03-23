import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { inventarioApi } from '../services/inventarioApi';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isLoading: authLoading } = useAuth();
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    if (user) {
      inventarioApi.checkInicializacion()
        .then(res => {
          if (isMounted) setIsInitialized(res);
        })
        .catch(() => {
          if (isMounted) setIsInitialized(true); // fallback so we don't break the app
        });
    } else {
      if (isMounted) setIsInitialized(null);
    }
    return () => { isMounted = false; };
  }, [user]);

  if (authLoading || (user && isInitialized === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.rol !== 'admin' && user.rol !== 'administrador') {
    return <Navigate to="/dashboard" replace />;
  }

  // Redirect to initialization if not done, and we aren't already there
  // Allow access to /productos so the user can create their initial catalog
  const isAllowedPath = ['/inicializacion', '/productos'].includes(location.pathname);
  if (isInitialized === false && !isAllowedPath) {
    return <Navigate to="/inicializacion" replace />;
  }

  // Prevent accessing initialization if already done
  if (isInitialized === true && location.pathname === '/inicializacion') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
