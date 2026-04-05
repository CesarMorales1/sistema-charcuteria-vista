import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Usuarios from './pages/Usuarios';
import Permisos from './pages/Permisos';
import Proveedores from './pages/Proveedores';
import Productos from './pages/Productos';
import Compras from './pages/Compras';
import Inventario from './pages/Inventario';
import Ventas from './pages/Ventas';
import Pos from './pages/Pos';
import Tasas from './pages/Tasas';
import InitialInventory from './pages/InitialInventory';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/usuarios"
            element={
              <ProtectedRoute requireAdmin>
                <Usuarios />
              </ProtectedRoute>
            }
          />
          <Route
            path="/permisos"
            element={
              <ProtectedRoute requireAdmin>
                <Permisos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/productos"
            element={
              <ProtectedRoute>
                <Productos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/proveedores"
            element={
              <ProtectedRoute>
                <Proveedores />
              </ProtectedRoute>
            }
          />
          <Route
            path="/compras"
            element={
              <ProtectedRoute>
                <Compras />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ventas"
            element={
              <ProtectedRoute>
                <Ventas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pos"
            element={
              <ProtectedRoute>
                <Pos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasas"
            element={
              <ProtectedRoute>
                <Tasas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventario"
            element={
              <ProtectedRoute>
                <Inventario />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inicializacion"
            element={
              <ProtectedRoute>
                <InitialInventory />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
