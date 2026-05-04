import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { guardar } from '../services/movimientosService';
import { getAllCategorias } from '../services/categoriasService';
import { useAuth } from '../context/AuthContext';
import './RegistrarMovimiento.css';

export default function RegistrarMovimiento() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const hoy = new Date().toISOString().slice(0, 10);

  const [tipo, setTipo] = useState('ingreso');
  const [form, setForm] = useState({ monto: '', fecha: hoy, categoria: '', descripcion: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [categoriasIngreso, setCategoriasIngreso] = useState([]);
  const [categoriasGasto, setCategoriasGasto] = useState([]);
  const [cargandoCats, setCargandoCats] = useState(true);

  useEffect(() => {
    async function loadCats() {
      try {
        const todas = await getAllCategorias();

        // 🔥 CORRECCIÓN AQUÍ
        setCategoriasIngreso(
          todas.filter(c => c.tipo?.toUpperCase() === 'INCOME')
        );

        setCategoriasGasto(
          todas.filter(c => c.tipo?.toUpperCase() === 'EXPENSE')
        );

      } catch (err) {
        console.error("Error cargando categorías:", err);
      } finally {
        setCargandoCats(false);
      }
    }
    loadCats();
  }, []);

  const categorias = tipo === 'ingreso' ? categoriasIngreso : categoriasGasto;

  function handleTipo(t) {
    setTipo(t);
    setForm(f => ({ ...f, categoria: '' }));
    setError('');
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  }

  function handleLimpiar() {
    setForm({ monto: '', fecha: hoy, categoria: '', descripcion: '' });
    setError('');
    setSuccess(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    try {
      const result = await guardar({
        tipo,
        monto: form.monto,
        fecha: form.fecha,
        categoria: form.categoria,
        descripcion: form.descripcion,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      Swal.fire({
        icon: 'success',
        title: '¡Movimiento Guardado!',
        text: 'El movimiento fue guardado correctamente',
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        navigate('/dashboard');
      });

    } catch (err) {
      setError('Ocurrió un error inesperado al guardar el movimiento');
      console.error('Error en handleSubmit:', err);
    }
  }

  const isIngreso = tipo === 'ingreso';

  if (cargandoCats) return <div>Cargando...</div>;

  return (
    <div className="reg-mov-page">
      <div className="rm-topbar">
        <div>
          <div className="rm-page-title">Registrar movimiento</div>
          <div className="rm-breadcrumb">Inicio / Registrar movimiento</div>
        </div>
        <div>
          <button className="rm-btn-outline" onClick={() => navigate(-1)}>
            Cancelar
          </button>
        </div>
      </div>

      <div className="rm-content">

        {success && (
          <div className="rm-alert-success">
            <span>✓</span>
            <span>
              <strong>{isIngreso ? 'Ingreso' : 'Gasto'} registrado exitosamente.</strong>{' '}
              Ya se refleja en tu dashboard.
            </span>
          </div>
        )}

        <div className="rm-alert-info">
          <span className="rm-alert-icon">ⓘ</span>
          <div className="rm-alert-text">
            <strong>Registro de {tipo} activo.</strong>{' '}
            Los campos marcados con <span style={{ color: '#2952cc', fontWeight: 600 }}>*</span> son obligatorios. La fecha no puede ser futura.
          </div>
        </div>

        <div className="rm-card">
          <div className="rm-card-header">
            <div className="rm-card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#2952cc" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v8M8 12h8"/>
              </svg>
            </div>
            <div>
              <div className="rm-card-title">Nuevo movimiento financiero</div>
              <div className="rm-card-sub">Completa la información del movimiento</div>
            </div>
            <div className="rm-card-badge">
              {isIngreso
                ? <span className="badge-ing">+ Ingreso seleccionado</span>
                : <span className="badge-gas">- Gasto seleccionado</span>
              }
            </div>
          </div>

          <form className="rm-form" onSubmit={handleSubmit}>
            <div className="rm-section-label">Tipo de movimiento</div>

            <div className="rm-tipo-toggle">
              <button
                type="button"
                className={`rm-tipo-btn${isIngreso ? ' active-ing' : ''}`}
                onClick={() => handleTipo('ingreso')}
              >
                + Ingreso
              </button>

              <button
                type="button"
                className={`rm-tipo-btn${!isIngreso ? ' active-gas' : ''}`}
                onClick={() => handleTipo('gasto')}
              >
                − Gasto
              </button>
            </div>

            <div className="rm-divider"></div>
            <div className="rm-section-label">Información del movimiento</div>

            {error && <div className="rm-error">{error}</div>}

            <div className="rm-row">
              <div className="rm-field">
                <label>Monto <span className="req">*</span></label>
                <div className="rm-input-prefix">
                  <span className="prefix">$</span>
                  <input
                    className="rm-input"
                    type="number"
                    name="monto"
                    value={form.monto}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="rm-field">
                <label>Fecha <span className="req">*</span></label>
                <input
                  className="rm-input"
                  type="date"
                  name="fecha"
                  value={form.fecha}
                  onChange={handleChange}
                  max={hoy}
                  required
                />
              </div>
            </div>

            <div className="rm-row">
              <div className="rm-field">
                <label>Categoría <span className="req">*</span></label>
                <select
                  className="rm-select"
                  name="categoria"
                  value={form.categoria}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecciona una categoría</option>
                  {categorias.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rm-field">
                <label>Descripción <span className="opt">(opcional)</span></label>
                <input
                  className="rm-input"
                  type="text"
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="rm-form-footer">
              <div className="rm-hint">
                <div className="rm-hint-dot"></div>
                El movimiento se reflejará inmediatamente en tu dashboard
              </div>

              <div className="rm-form-actions">
                <button type="button" className="rm-btn-outline" onClick={handleLimpiar}>
                  Limpiar
                </button>

                <button type="submit" className="rm-btn-primary">
                  Guardar {tipo}
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}