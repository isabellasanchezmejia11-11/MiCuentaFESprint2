import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getPresupuestos,
  enriquecerPresupuestos,
  calcularTotalesPresupuesto,
  eliminarPresupuesto,
  getMesActual,
  formatMesLabel,
  getMesesDisponibles,
} from '../services/presupuestosService';
import { getMovimientos, formatCOP } from '../services/movimientosService';
import { getAllCategorias } from '../services/categoriasService';
import CrearPresupuesto from './CrearPresupuesto';
import './Presupuestos.css';

export default function Presupuestos() {
  const navigate = useNavigate();
  const { usuario, loading: authLoading } = useAuth();

  const [movimientos, setMovimientos] = useState([]);
  const [presupuestos, setPresupuestos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [mesFiltro, setMesFiltro] = useState(getMesActual());
  const [presAEliminar, setPresAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [presAEditar, setPresAEditar] = useState(null);

  const mesesDisponibles = getMesesDisponibles();

  // Mapa de categorías por ID (como en Dashboard.jsx)
  const categoriasMap = useMemo(() => {
    const map = {};
    (categorias || []).forEach((cat) => {
      if (cat && cat.id !== undefined) {
        map[Number(cat.id)] = cat;
      }
    });
    return map;
  }, [categorias]);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      if (!usuario) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const [movs, presupuestosResult, cats] = await Promise.all([
          getMovimientos(),
          getPresupuestos(),
          getAllCategorias(),
        ]);

        if (!mounted) return;

        setMovimientos(movs);
        if (presupuestosResult.ok) {
          setPresupuestos(presupuestosResult.data);
        } else {
          setError(presupuestosResult.error);
        }
        setCategorias(cats);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'No se pudieron cargar los datos.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (!authLoading) loadData();
    return () => { mounted = false; };
  }, [usuario, authLoading]);

  // Enriquecer y filtrar por mes seleccionado
  const presupuestosMes = useMemo(() => {
    const todos = enriquecerPresupuestos(presupuestos, movimientos);
    return todos.filter((p) => p.mes === mesFiltro);
  }, [presupuestos, movimientos, mesFiltro]);

  const totales = useMemo(
    () => calcularTotalesPresupuesto(presupuestosMes),
    [presupuestosMes]
  );

  const hayAlertas = presupuestosMes.some(
    (p) => p.estado === 'alerta' || p.estado === 'excedido'
  );

  // ── ELIMINAR ──────────────────────────────────────────────────────────────

  async function handleEliminar(id) {
    setEliminando(true);
    try {
      const result = await eliminarPresupuesto(id);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      const presupuestosResult = await getPresupuestos();
      if (presupuestosResult.ok) {
        setPresupuestos(presupuestosResult.data);
      } else {
        setError(presupuestosResult.error);
      }
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el presupuesto.');
    } finally {
      setEliminando(false);
      setPresAEliminar(null);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  if (authLoading || loading) {
    return (
      <div className="pres-page">
        <div className="pres-loading">Cargando...</div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="pres-page">
        <div className="pres-loading">No hay sesión activa.</div>
      </div>
    );
  }

  return (
    <div className="pres-page">
      {/* TOPBAR */}
      <div className="pres-topbar">
        <div className="pres-topbar-left">
          <h1>Presupuestos</h1>
          <div className="pres-breadcrumb">
            Inicio / <span>Presupuestos</span>
          </div>
        </div>
        <button className="pres-btn-nuevo" onClick={() => navigate('/presupuestos/nuevo')}>
          + Nuevo presupuesto
        </button>
      </div>

      <div className="pres-content">
        {error && <div className="pres-error-banner">{error}</div>}

        {/* FILTRO MES */}
        <div className="pres-mes-filtro">
          <span className="pres-mes-label">Ver mes:</span>
          <select
            value={mesFiltro}
            onChange={(e) => setMesFiltro(e.target.value)}
            className="pres-mes-select"
          >
            {mesesDisponibles.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* ALERTA GLOBAL */}
        {hayAlertas && (
          <div className="pres-alerta-banner">
            ⚠️ Hay presupuestos con alertas o excedidos en {formatMesLabel(mesFiltro)}.
            Revisá tu gasto.
          </div>
        )}

        {/* SUMMARY CARDS */}
        <div className="pres-stats">
          <div className="pres-stat-card">
            <div className="pres-stat-label">Total presupuestado</div>
            <div className="pres-stat-value">{formatCOP(totales.total)}</div>
            <div className="pres-stat-period">{formatMesLabel(mesFiltro)}</div>
          </div>
          <div className="pres-stat-card">
            <div className="pres-stat-label">Total ejecutado</div>
            <div className={`pres-stat-value ${totales.ejecutado > totales.total ? 'excedido' : 'ejecutado'}`}>
              {formatCOP(totales.ejecutado)}
            </div>
            <div className="pres-stat-period">Gasto registrado</div>
          </div>
          <div className="pres-stat-card">
            <div className="pres-stat-label">Disponible</div>
            <div className={`pres-stat-value ${totales.disponible < 0 ? 'excedido' : 'disponible'}`}>
              {totales.disponible < 0 ? '- ' : ''}{formatCOP(Math.abs(totales.disponible))}
            </div>
            <div className="pres-stat-period">Saldo presupuestal</div>
          </div>
        </div>

        {/* LISTA PRESUPUESTOS */}
        {presupuestosMes.length === 0 ? (
          <div className="pres-empty">
            <p>No hay presupuestos para {formatMesLabel(mesFiltro)}.</p>
            <button className="pres-btn-nuevo" onClick={() => navigate('/presupuestos/nuevo')}>
              + Crear primer presupuesto
            </button>
          </div>
        ) : (
          <div className="pres-list">
            {presupuestosMes.map((p) => (
              <div key={p.id} className={`pres-card pres-card--${p.estado}`}>
                <div className="pres-card-header">
                  <div className="pres-card-cat">
                    {p.categoria}
                    <span className={`pres-tipo-badge pres-tipo-badge--${p.tipo}`}>
                      {p.tipo === 'ingreso' ? 'INGRESO' : 'GASTO'}
                    </span>
                  </div>
                <div className="pres-card-header-right">
                  <span className={`pres-estado-badge pres-estado-badge--${p.estado}`}>
                    {p.estado === 'ok' && 'En control'}
                    {p.estado === 'alerta' && '⚠️ Alerta'}
                    {p.estado === 'excedido' && '🔴 Excedido'}
                  </span>
                  {/* Edit icon - Blue pencil */}
                  <i 
                    className="bi bi-pencil-square"
                    onClick={() => setPresAEditar(p)} 
                    style={{ color: '#0000FF', cursor: 'pointer', marginRight: '10px' }}
                    title="Editar"
                  ></i>
                  {/* Delete icon - Red trash */}
                  <i 
                    onClick={() => setPresAEliminar(p)} 
                    className="bi bi-trash"
                    style={{ color: '#FF0000', cursor: 'pointer' }}
                    title="Eliminar"
                  ></i>
                </div>
                </div>

                <div className="pres-card-montos">
                  <div className="pres-card-monto-item">
                    <span className="pres-card-monto-label">Ejecutado</span>
                    <span className={`pres-card-monto-val ${p.estado === 'excedido' ? 'excedido' : ''}`}>
                      {formatCOP(p.ejecutado)}
                    </span>
                  </div>
                  <div className="pres-card-monto-sep">/</div>
                  <div className="pres-card-monto-item">
                    <span className="pres-card-monto-label">Límite</span>
                    <span className="pres-card-monto-val">{formatCOP(p.monto)}</span>
                  </div>
                  <div className="pres-card-pct">{p.pct}%</div>
                </div>

                <div className="pres-bar-wrap">
                  <div className="pres-bar">
                    <div
                      className={`pres-bar-fill pres-bar-fill--${p.estado}`}
                      style={{ width: `${Math.min(p.pct, 100)}%` }}
                    />
                    {/* Marcador de alerta */}
                    <div
                      className="pres-bar-alert-marker"
                      style={{ left: `${p.alertaPct}%` }}
                      title={`Alerta al ${p.alertaPct}%`}
                    />
                  </div>
                </div>

                <div className="pres-card-footer">
                  <span className="pres-card-disponible">
                    {p.disponible >= 0
                      ? `Disponible: ${formatCOP(p.disponible)}`
                      : `Excedido en: ${formatCOP(Math.abs(p.disponible))}`}
                  </span>
                  <span className="pres-card-alerta-info">
                    Alerta al {p.alertaPct}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

        {/* ── MODAL ELIMINAR ────────────────────────────────────────────────── */}
        {presAEliminar && (
          <div className="pres-modal-overlay" onClick={() => setPresAEliminar(null)}>
            <div className="pres-modal" onClick={(e) => e.stopPropagation()}>
              <div className="pres-modal-title">¿Eliminar presupuesto?</div>
              <p className="pres-modal-text">
                Vas a eliminar el presupuesto de{' '}
                <strong>{presAEliminar.categoria}</strong>
                {' '}(<span className={`pres-tipo-badge pres-tipo-badge--${presAEliminar.tipo}`}>
                  {presAEliminar.tipo === 'ingreso' ? 'INGRESO' : 'GASTO'}
                </span>){' '}
                para{' '}
                <strong>{formatMesLabel(presAEliminar.mes)}</strong>.
                Esta acción no se puede deshacer.
              </p>
              <div className="pres-modal-actions">
                <button
                  className="pres-modal-cancel"
                  onClick={() => setPresAEliminar(null)}
                  disabled={eliminando}
                >
                  Cancelar
                </button>
                <button
                  className="pres-modal-confirm"
                  onClick={() => handleEliminar(presAEliminar.id)}
                  disabled={eliminando}
                >
                  {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL EDITAR ────────────────────────────────────────── */}
        {presAEditar && (
          <div className="pres-modal-overlay" onClick={() => setPresAEditar(null)}>
            <div className="pres-modal pres-modal--edit" onClick={(e) => e.stopPropagation()}>
              <div className="pres-modal-title">Editar presupuesto</div>
              <CrearPresupuesto
                editMode={true}
                budgetData={presAEditar}
                budgetId={presAEditar.id}
                onSuccess={() => {
                  setPresAEditar(null);
                  getPresupuestos().then(result => {
                    if (result.ok) setPresupuestos(result.data);
                  });
                }}
                onCancel={() => setPresAEditar(null)}
              />
            </div>
          </div>
        )}
    </div>
  );
}
