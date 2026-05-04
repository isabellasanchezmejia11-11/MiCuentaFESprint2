import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Registro() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  }

  function getPasswordStrength() {
    const p = form.password;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^a-zA-Z0-9]/.test(p)) score++;
    return score;
  }

  const strengthLabels = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
  const strength = getPasswordStrength();
  const passwordsMatch =
    form.password && form.confirmPassword && form.password === form.confirmPassword;
  const passwordsMismatch =
    form.confirmPassword && form.password !== form.confirmPassword;

  async function handleSubmit(e) {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await register(form);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      // Guardar mensaje de éxito y redirigir a login
      localStorage.setItem('registroExito', 'Usuario registrado correctamente. Por favor iniciá sesión.');
      navigate('/login');
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
            <h1>Toma el control de tus finanzas</h1>
            <p>
              Registra tus ingresos y gastos, define presupuestos y entiende tus
              hábitos financieros en un solo lugar.
            </p>
            <div className="auth-features">
              <div className="auth-feature">
                <div className="feature-dot"></div>
                <span>Registro de ingresos y gastos</span>
              </div>
              <div className="auth-feature">
                <div className="feature-dot"></div>
                <span>Seguimiento de presupuestos mensuales</span>
              </div>
              <div className="auth-feature">
                <div className="feature-dot"></div>
                <span>Reportes de hábitos de gasto</span>
              </div>
              <div className="auth-feature">
                <div className="feature-dot"></div>
                <span>Recomendaciones financieras básicas</span>
              </div>
            </div>
          </div>

          <div className="auth-left-footer">
            Universidad de Antioquia · CodeF@ctory 2026-1
          </div>
        </div>

        <div className="auth-right">
          <div className="form-title">Crear cuenta</div>
          <div className="form-subtitle">
            Completa los datos para registrarte en MiCuenta
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="reg-row">
              <div className="field">
                <label>Nombre <span className="req">*</span></label>
                <input
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Alejandra"
                  required
                />
              </div>
              <div className="field">
                <label>Apellido <span className="req">*</span></label>
                <input
                  type="text"
                  name="apellido"
                  value={form.apellido}
                  onChange={handleChange}
                  placeholder="Ej: García"
                  required
                />
              </div>
            </div>

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
                  placeholder="Mínimo 8 caracteres"
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

              {form.password && (
                <>
                  <div className="pass-strength">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className={`pass-bar${i <= strength ? ' active' : ''}`}
                      ></div>
                    ))}
                  </div>
                  <div className="pass-label">
                    {strengthLabels[strength]} · mínimo 8 caracteres
                  </div>
                </>
              )}
            </div>

            <div className="field">
              <label>Confirmar contraseña <span className="req">*</span></label>
              <div className="password-wrap">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repite tu contraseña"
                  required
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowConfirm(v => !v)}
                >
                  {showConfirm ? '🙈' : '👁'}
                </button>
              </div>

              {passwordsMatch && (
                <div className="hint-ok">Las contraseñas coinciden ✓</div>
              )}
              {passwordsMismatch && (
                <div className="hint-error">Las contraseñas no coinciden</div>
              )}
            </div>

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear mi cuenta'}
            </button>
          </form>

          <div className="auth-divider"><span>¿Ya tienes cuenta?</span></div>
          <div className="register-link">
            <Link to="/login">Iniciar sesión</Link>
          </div>
        </div>
      </div>
    </div>
  );
}