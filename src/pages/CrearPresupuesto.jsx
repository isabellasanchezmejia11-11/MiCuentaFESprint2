import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  crearPresupuesto,
  actualizarPresupuesto,
  getMesesDisponibles,
  getMesActual,
  formatMesLabel,
} from '../services/presupuestosService';
import { getAllCategorias } from '../services/categoriasService';
import './CrearPresupuesto.css';

export default function CrearPresupuesto({
  editMode = false,
  budgetData = {},
  budgetId = null,
  onSuccess,
  onCancel,
}) {
  const navigate = useNavigate();

  const [categoria, setCategoria] = useState(editMode && budgetData.categoriaId ? String(budgetData.categoriaId) : '');
  const [mes, setMes] = useState(editMode && budgetData.mes ? budgetData.mes : getMesActual());
  const [monto, setMonto] = useState(editMode && budgetData.monto ? String(budgetData.monto) : '');
  const [alertaPct, setAlertaPct] = useState(editMode && budgetData.alertaPct ? budgetData.alertaPct : 80);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Estados para categorías dinámicas
  const [categoriasGasto, setCategoriasGasto] = useState([]);
  const [cargandoCats, setCargandoCats] = useState(true);

  // Pre-fill form when editing
  useEffect(() => {
    if (editMode && budgetData) {
      if (budgetData.categoriaId) setCategoria(String(budgetData.categoriaId));
      if (budgetData.mes) setMes(budgetData.mes);
      if (budgetData.monto) setMonto(String(budgetData.monto));
      if (budgetData.alertaPct) setAlertaPct(budgetData.alertaPct);
    }
  }, [editMode, budgetData]);

  // Efecto para cargar categorías
  useEffect(() => {
    async function loadCats() {
      try {
        const todas = await getAllCategorias();
        setCategoriasGasto(todas.filter(c => c.tipo === 'gasto'));
      } finally {
        setCargandoCats(false);
      }
    }
    loadCats();
  }, []);

  const mesesDisponibles = getMesesDisponibles();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMensaje('');
    setGuardando(true);

    const formData = { categoria, mes, monto, alertaPct };

    try {
      const result = editMode
        ? await actualizarPresupuesto(budgetId, formData)
        : await crearPresupuesto(formData);

      setGuardando(false);

      if (!result.ok) {
        setError(result.error || `Error al ${editMode ? 'actualizar' : 'crear'} el presupuesto`);
        setTimeout(() => setError(''), 5000);
        return;
      }

      const exitoMsg = editMode ? 'Presupuesto actualizado correctamente' : 'Presupuesto creado correctamente';
      setMensaje(exitoMsg);

      setTimeout(() => {
        setMensaje('');
        if (editMode && onSuccess) {
          onSuccess();
        } else {
          navigate('/presupuestos');
        }
      }, 1500);
    } catch (err) {
      setGuardando(false);
      setError(err.message || `Error al ${editMode ? 'actualizar' : 'crear'} el presupuesto`);
      setTimeout(() => setError(''), 5000);
    }
  }

  function handleCancel() {
    if (editMode && onCancel) {
      onCancel();
    } else {
      navigate('/presupuestos');
    }
  }

  const montoNum = parseFloat(monto) || 0;

  if (cargandoCats) return <div>Cargando...</div>;

  return (
    <div className="cp-page">
      {/* TOPBAR */}
      <div className="cp-topbar">
        <div className="cp-topbar-left">
          <button className="cp-btn-back" onClick={handleCancel}>
            ← Volver
          </button>
          <h1>{editMode ? 'Editar presupuesto' : 'Nuevo presupuesto'}</h1>
          <div className="cp-breadcrumb">
            Inicio / Presupuestos / <span>{editMode ? 'Editar' : 'Nuevo'}</span>
          </div>
        </div>
      </div>

      <div className="cp-content">
        <div className="cp-layout">
          {/* ── FORMULARIO ─────────────────────────────────────── */}
          <div className="cp-form-card">
            <div className="cp-card-title">Configurar presupuesto</div>

            {mensaje && <div className="cp-success">{mensaje}</div>}
            {error && <div className="cp-error">{error}</div>}

            <form onSubmit={handleSubmit} className="cp-form">
              <div className="cp-field">
                <label htmlFor="cp-categoria">Categoría de gasto *</label>
                <select
                  id="cp-categoria"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  required
                >
                  <option value="">Selecciona una categoría</option>
                  {categoriasGasto.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
                <span className="cp-field-hint">
                  Los presupuestos aplican solo a categorías de gastos.
                </span>
              </div>

              <div className="cp-field">
                <label htmlFor="cp-mes">Mes *</label>
                <select
                  id="cp-mes"
                  value={mes}
                  onChange={(e) => setMes(e.target.value)}
                  required
                >
                  {mesesDisponibles.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="cp-field">
                <label htmlFor="cp-monto">Monto límite (COP) *</label>
                <input
                  id="cp-monto"
                  type="number"
                  min="1"
                  step="any"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="Ej: 500000"
                  required
                />
              </div>

              <div className="cp-field">
                <label htmlFor="cp-alerta">
                  Alerta al alcanzar el{' '}
                  <span className="cp-alerta-pct">{alertaPct}%</span>
                </label>
                <input
                  id="cp-alerta"
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={alertaPct}
                  onChange={(e) => setAlertaPct(Number(e.target.value))}
                />
                <div className="cp-range-labels">
                  <span>10%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="cp-form-actions">
                <button
                  type="button"
                  className="cp-btn-cancelar"
                  onClick={handleCancel}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="cp-btn-guardar"
                  disabled={guardando}
                >
                  {guardando ? 'Guardando...' : (editMode ? 'Actualizar presupuesto' : 'Crear presupuesto')}
                </button>
              </div>
            </form>
          </div>

          {/* ── PREVIEW CARD ───────────────────────────────────── */}
          <div className="cp-preview-card">
            <div className="cp-card-title">Vista previa</div>

            {!categoria || !monto ? (
              <div className="cp-preview-empty">
                Completa el formulario para ver la vista previa.
              </div>
            ) : (
              <div className="cp-preview-content">
              <div className="cp-preview-header">
                <div className="cp-preview-cat">
                  {categoriasGasto.find(c => String(c.id) === String(categoria))?.nombre || categoria}
                </div>
                <div className="cp-preview-mes">{formatMesLabel(mes)}</div>
              </div>

                <div className="cp-preview-monto">
                  <span className="cp-preview-label">Límite mensual</span>
                  <span className="cp-preview-value">
                    $ {montoNum.toLocaleString('es-CO')}
                  </span>
                </div>

                <div className="cp-preview-bar-wrap">
                  <div className="cp-preview-bar">
                    <div className="cp-preview-bar-fill" style={{ width: '0%' }} />
                  </div>
                  <div className="cp-preview-bar-labels">
                    <span>$ 0 ejecutado</span>
                    <span>0%</span>
                  </div>
                </div>

                <div className="cp-preview-alerta">
                  <span className="cp-preview-alerta-icon">🔔</span>
                  Te alertaremos cuando el gasto supere el{' '}
                  <strong>{alertaPct}%</strong> del límite
                  ($ {Math.round(montoNum * alertaPct / 100).toLocaleString('es-CO')}).
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
