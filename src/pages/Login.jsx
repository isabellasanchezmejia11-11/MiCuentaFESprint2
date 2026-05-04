import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Verificar si hay mensaje de éxito de registro
  useEffect(() => {
    const mensaje = localStorage.getItem('registroExito');
    if (mensaje) {
      setSuccessMessage(mensaje);
      localStorage.removeItem('registroExito');
    }
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(form);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-left">
          <div>
            <span className="brand-name">MiCuenta</span>
            <span className="brand-sub">Gestión financiera personal</span>
          </div>

          <div className="auth-hero">
            <h1>Bienvenido de nuevo</h1>
            <p>Accede a tu cuenta para continuar gestionando tus finanzas personales.</p>
            <div className="auth-features">
              <div className="auth-feature">
                <div className="feature-icon">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M7 7h10M7 12h10M7 17h4" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <span>Registra tus ingresos y gastos fácilmente</span>
              </div>
              <div className="auth-feature">
                <div className="feature-icon">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle cx="12" cy="12" r="9" strokeWidth="2"/>
                    <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <span>Controla tus presupuestos mensuales</span>
              </div>
              <div className="auth-feature">
                <div className="feature-icon">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span>Visualiza tus hábitos de gasto con reportes</span>
              </div>
            </div>
          </div>

          <div className="auth-left-footer">© 2026 MiCuenta. Todos los derechos reservados</div>
        </div>

        <div className="auth-right">
          <div className="form-title">Iniciar sesión</div>
          <div className="form-subtitle">Ingresa tu correo y contraseña para acceder</div>

          {error && <div className="auth-error">{error}</div>}
          {successMessage && <div className="auth-success">{successMessage}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Correo electrónico <span className="req">*</span></label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="tu@correo.com"
                required
              />
            </div>

            <div className="field">
              <label>Contraseña <span className="req">*</span></label>
              <div className="password-wrap">
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPass(v => !v)}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>

          <div className="auth-divider"><span>¿No tienes cuenta?</span></div>
          <div className="register-link">
            <Link to="/registro">Crear una cuenta nueva</Link>
          </div>
          <div className="secure">🔒 Tu sesión usa JWT</div>
        </div>
      </div>
    </div>
  );
}