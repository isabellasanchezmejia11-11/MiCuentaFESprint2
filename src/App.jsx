import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Dashboard from './pages/Dashboard';
import RegistrarMovimiento from './pages/RegistrarMovimiento';
import Movimientos from './pages/Movimientos';
import Categorias from './pages/Categorias';
import Presupuestos from './pages/Presupuestos';
import CrearPresupuesto from './pages/CrearPresupuesto';
import Reportes from './pages/Reportes';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login"    element={<Login />} />
          <Route path="/registro" element={<Registro />} />

          {/* Rutas privadas — envueltas en Layout (sidebar + main area) */}
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard"  element={<Dashboard />} />
              <Route path="/registrar"  element={<RegistrarMovimiento />} />
              <Route path="/movimientos" element={<Movimientos />} />
              <Route path="/categorias"  element={<Categorias />} />
              <Route path="/presupuestos" element={<Presupuestos />} />
              <Route path="/presupuestos/nuevo" element={<CrearPresupuesto />} />
              <Route path="/reportes" element={<Reportes />} />
            </Route>
          </Route>

          {/* Redirect raíz → dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 → dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
