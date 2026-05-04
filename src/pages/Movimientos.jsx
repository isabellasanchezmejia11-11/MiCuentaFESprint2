import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getMovimientos,
  eliminar,
  editar,
  getTotalesPorMesDesdeLista,
  formatCOP,
} from '../services/movimientosService';
import { getAllCategorias } from '../services/categoriasService';
import './Movimientos.css';

// Formatea fecha YYYY-MM-DD → "27 mar 2026"
function formatFecha(fechaStr) {
  const [y, m, d] = fechaStr.split('-');
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${parseInt(d, 10)} ${meses[parseInt(m, 10) - 1]} ${y}`;
}

// Mes actual como "YYYY-MM"
function getMesActual() {
  return new Date().toISOString().slice(0, 7);
}

// Nombre legible del mes actual
function getNombreMes() {
  const d = new Date();
  const mes = d.toLocaleString('es-CO', { month: 'long' });
  return mes.charAt(0).toUpperCase() + mes.slice(1) + ' ' + d.getFullYear();
}

// Oscurecer un color hex (factor < 1 = más oscuro)
const darkenColor = (hexColor, factor = 0.7) => {
  // Remove '#' if present
  const hex = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Darken by multiplying by factor (0.7 = 30% darker)
  const newR = Math.round(r * factor);
  const newG = Math.round(g * factor);
  const newB = Math.round(b * factor);
  
  // Convert back to hex
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

// Calcular color de texto contrastante basado en luminancia del fondo
const getContrastTextColor = (hexColor) => {
  // Valor por defecto si no hay color válido
  if (!hexColor || typeof hexColor !== 'string') return '#000000';
  
  // Remover '#' si está presente
  const hex = hexColor.replace('#', '');
  
  // Validar que sea un hex válido de 6 caracteres
  if (hex.length !== 6) return '#000000';
  
  // Convertir a RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Validar que los valores sean números válidos
  if (isNaN(r) || isNaN(g) || isNaN(b)) return '#000000';
  
  // Calcular luminancia (fórmula estándar)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // For dark backgrounds: return white
  if (luminance <= 0.5) return '#FFFFFF';
  
  // For light backgrounds: return the SAME color but darker (not black!)
  return darkenColor(hexColor, 0.7); // 30% darker than background
};

// Clase CSS para badge de categoría
const CAT_CLASS = {
  Salario: 'cat-salario',
  Honorarios: 'cat-free',
  Otros: 'cat-otros',
  Alimentación: 'cat-alim',
  Transporte: 'cat-trans',
  Servicios: 'cat-serv',
  Salud: 'cat-salud',
  Freelance: 'cat-inv',
  Inversiones: 'cat-inv',
};

export default function Movimientos() {
  const navigate = useNavigate();
  const { usuario, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [movimientosBase, setMovimientosBase] = useState([]);

  // Estados para categorías dinámicas
  const [categoriasIngreso, setCategoriasIngreso] = useState([]);
  const [categoriasGasto, setCategoriasGasto] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargandoCats, setCargandoCats] = useState(true);

  // Estado de filtros
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');
  const [filtroMontoMin, setFiltroMontoMin] = useState('');
  const [filtroMontoMax, setFiltroMontoMax] = useState('');
  const [filtrosActivos, setFiltrosActivos] = useState(false);

  // Confirmación de eliminación
  const [movAEliminar, setMovAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // Edición
  const [movAEditar, setMovAEditar] = useState(null);
  const [editMonto, setEditMonto] = useState('');
  const [editFecha, setEditFecha] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [guardandoEdit, setGuardandoEdit] = useState(false);
  const [errorEdit, setErrorEdit] = useState('');

  const mesActual = getMesActual();

  // Efecto para cargar categorías
  useEffect(() => {
    let mounted = true;

    async function loadCats() {
      try {
        const todas = await getAllCategorias();
        if (!mounted) return;
        setCategorias(todas);
        setCategoriasIngreso(todas.filter(c => c.tipo === 'ingreso'));
        setCategoriasGasto(todas.filter(c => c.tipo === 'gasto'));
      } finally {
        if (mounted) setCargandoCats(false);
      }
    }

    loadCats();
    return () => { mounted = false; };
  }, []);

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
        const lista = await getMovimientos();
        if (!mounted) return;
        setMovimientosBase(lista);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'No se pudieron cargar los movimientos.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (!authLoading) loadData();
    return () => { mounted = false; };
  }, [usuario, authLoading]);

  const totales = useMemo(
    () => getTotalesPorMesDesdeLista(movimientosBase, mesActual),
    [movimientosBase, mesActual]
  );

  // Mapa de categorías por ID para lookup rápido - DEBE estar antes de movimientos
  const categoriasMap = useMemo(() => {
    const map = {};
    categorias.forEach(cat => { map[Number(cat.id)] = cat; });
    return map;
  }, [categorias]);

  const movimientos = useMemo(() => {
    let lista = [...movimientosBase];

    if (filtrosActivos) {
      if (filtroTipo) lista = lista.filter((m) => m.tipo === filtroTipo);
      // Filtrar por categoryId comparando números
      if (filtroCategoria) {
        lista = lista.filter((m) => Number(m.categoryId) === Number(filtroCategoria));
      }
      if (filtroDesde) lista = lista.filter((m) => m.fecha >= filtroDesde);
      if (filtroHasta) lista = lista.filter((m) => m.fecha <= filtroHasta);
      if (filtroMontoMin) lista = lista.filter((m) => m.monto >= parseFloat(filtroMontoMin));
      if (filtroMontoMax) lista = lista.filter((m) => m.monto <= parseFloat(filtroMontoMax));
    }

    return lista;
  }, [movimientosBase, filtrosActivos, filtroTipo, filtroCategoria, filtroDesde, filtroHasta, filtroMontoMin, filtroMontoMax, categoriasMap]);

  function handleAplicar() {
    setFiltrosActivos(true);
  }

  function handleLimpiarFiltros() {
    setFiltroTipo('');
    setFiltroCategoria('');
    setFiltroDesde('');
    setFiltroHasta('');
    setFiltroMontoMin('');
    setFiltroMontoMax('');
    setFiltrosActivos(false);
  }

  // ── ELIMINAR ──────────────────────────────────────────────────────────────

  function abrirModalEliminar(mov) {
    setMovAEliminar(mov);
    setError('');
  }

  async function handleEliminar(id) {
    try {
      setEliminando(true);
      setError('');

      const result = await eliminar(id);

      if (!result.ok) {
        setError(result.error || 'No se pudo eliminar el movimiento.');
        setMovAEliminar(null);
        return;
      }

      setMovimientosBase((prev) => prev.filter((m) => m.id !== id));
      setMovAEliminar(null);
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el movimiento.');
    } finally {
      setEliminando(false);
    }
  }

  // ── EDITAR ────────────────────────────────────────────────────────────────

  function abrirModalEditar(mov) {
    setMovAEditar(mov);
    setEditMonto(String(mov.monto));
    setEditFecha(mov.fecha);
    setEditCategoryId(mov.categoryId ? Number(mov.categoryId) : '');
    setEditDescripcion(mov.descripcion || '');
    setErrorEdit('');
  }

  function cerrarModalEditar() {
    setMovAEditar(null);
    setEditCategoryId('');
    setErrorEdit('');
  }

  async function handleGuardarEdicion() {
    try {
      setGuardandoEdit(true);
      setErrorEdit('');

      const result = await editar(movAEditar.id, {
        monto: editMonto,
        fecha: editFecha,
        categoryId: editCategoryId,
        descripcion: editDescripcion,
      });

      if (!result.ok) {
        setErrorEdit(result.error || 'No se pudo guardar los cambios.');
        return;
      }

      // Actualizar en lista local cuando el backend esté disponible
      setMovimientosBase((prev) =>
        prev.map((m) => (m.id === movAEditar.id ? result.movimiento : m))
      );
      cerrarModalEditar();
    } catch (err) {
      setErrorEdit(err.message || 'No se pudo guardar los cambios.');
    } finally {
      setGuardandoEdit(false);
    }
  }

  // Categorías disponibles según tipo del movimiento a editar
  const categoriasEdit = movAEditar?.tipo === 'ingreso' ? categoriasIngreso : categoriasGasto;

  // Todas las categorías para el filtro (usar objetos con id y nombre)
  const todasCategorias = useMemo(() => {
    const unique = new Map();
    [...categoriasIngreso, ...categoriasGasto].forEach(c => {
      if (!unique.has(Number(c.id))) {
        unique.set(Number(c.id), c);
      }
    });
    return Array.from(unique.values());
  }, [categoriasIngreso, categoriasGasto]);

  // ─────────────────────────────────────────────────────────────────────────

  if (authLoading || loading || cargandoCats) {
    return (
      <div className="mov-page">
        <div className="mov-loading">Cargando...</div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="mov-page">
        <div className="mov-loading">No hay sesión activa.</div>
      </div>
    );
  }

  return (
    <div className="mov-page">
      {/* TOPBAR */}
      <div className="mov-topbar">
        <div className="mov-topbar-left">
          <h1>Mis movimientos</h1>
          <div className="mov-breadcrumb">
            Inicio / <span>Mis movimientos</span>
          </div>
        </div>
        <button className="mov-btn-nuevo" onClick={() => navigate('/registrar')}>
          + Nuevo movimiento
        </button>
      </div>

      <div className="mov-content">
        {error && <div className="mov-error-banner">{error}</div>}

        {/* STATS */}
        <div className="mov-stats">
          <div className="mov-stat-card">
            <div className="mov-stat-label">Total Ingresos</div>
            <div className="mov-stat-value ingreso">{formatCOP(totales.ingresos)}</div>
            <div className="mov-stat-period">{getNombreMes()}</div>
          </div>
          <div className="mov-stat-card">
            <div className="mov-stat-label">Total Gastos</div>
            <div className="mov-stat-value gasto">{formatCOP(totales.gastos)}</div>
            <div className="mov-stat-period">{getNombreMes()}</div>
          </div>
          <div className="mov-stat-card">
            <div className="mov-stat-label">Balance Neto</div>
            <div className={`mov-stat-value balance ${totales.balance < 0 ? 'negativo' : ''}`}>
              {totales.balance < 0 ? '- ' : ''}{formatCOP(Math.abs(totales.balance))}
            </div>
            <div className="mov-stat-period">Ahorro del mes</div>
          </div>
        </div>

        {/* FILTROS */}
        <div className="mov-filters">
          <span className="mov-filter-label">Filtrar por:</span>

          <select
            className="mov-filter-select"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
          >
            <option value="">Todos los tipos</option>
            <option value="ingreso">Ingreso</option>
            <option value="gasto">Gasto</option>
          </select>

          <select
            className="mov-filter-select"
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {todasCategorias.map((c) => (
              <option key={c.id} value={Number(c.id)}>{c.nombre}</option>
            ))}
          </select>

          <input
            className="mov-filter-date"
            type="date"
            value={filtroDesde}
            onChange={(e) => setFiltroDesde(e.target.value)}
          />

          <span className="mov-filter-dash">—</span>

          <input
            className="mov-filter-date"
            type="date"
            value={filtroHasta}
            onChange={(e) => setFiltroHasta(e.target.value)}
          />

          <div className="mov-filter-group">
            <label className="mov-filter-label-small">Monto mín.</label>
            <input
              className="mov-filter-number"
              type="number"
              min="0"
              placeholder="$ 0"
              value={filtroMontoMin}
              onChange={(e) => setFiltroMontoMin(e.target.value)}
            />
          </div>

          <span className="mov-filter-dash">—</span>

          <div className="mov-filter-group">
            <label className="mov-filter-label-small">Monto máx.</label>
            <input
              className="mov-filter-number"
              type="number"
              min="0"
              placeholder="$ 999.999"
              value={filtroMontoMax}
              onChange={(e) => setFiltroMontoMax(e.target.value)}
            />
          </div>

          <button className="mov-btn-aplicar" onClick={handleAplicar}>
            Aplicar
          </button>

          <button className="mov-btn-limpiar" onClick={handleLimpiarFiltros}>
            Limpiar
          </button>
        </div>

        {/* TABLA */}
        <div className="mov-table-card">
          <div className="mov-table-header">
            <span className="mov-table-title">Historial de movimientos</span>
            <span className="mov-table-count">
              {movimientos.length} {movimientos.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>

          {movimientos.length === 0 ? (
            <div className="mov-empty">
              <p>No hay movimientos que mostrar.</p>
              <button className="mov-btn-nuevo" onClick={() => navigate('/registrar')}>
                + Registrar tu primer movimiento
              </button>
            </div>
          ) : (
            <table className="mov-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Categoría</th>
                  <th>Descripción</th>
                  <th>Monto</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m) => (
                  <tr key={m.id}>
                    <td>{formatFecha(m.fecha)}</td>
                    <td>
                      {m.tipo === 'ingreso' ? (
                        <span className="mov-badge mov-badge-ing">+ Ingreso</span>
                      ) : (
                        <span className="mov-badge mov-badge-gas">− Gasto</span>
                      )}
                    </td>
                    <td>
                     {(() => {
                          const cat = categoriasMap[Number(m.categoryId)];
                          const catName = cat?.nombre || 'OTROS';
                          const catColor = cat?.color || '#C0C0C0';
                          const textColor = getContrastTextColor(catColor);
                          return (
                            <span
                              className={`mov-cat ${CAT_CLASS[catName] || 'cat-otros'}`}
                              style={{
                                backgroundColor: catColor,
                                color: textColor,
                                fontWeight: 'bold'
                              }}
                            >
                              {catName}
                            </span>
                          );
                        })()}
                    </td>
                    <td className="mov-desc">{m.descripcion || '—'}</td>
                    <td className={m.tipo === 'ingreso' ? 'monto-ing' : 'monto-gas'}>
                      {m.tipo === 'ingreso' ? '+ ' : '− '}{formatCOP(m.monto)}
                    </td>
                    <td className="mov-acciones">
                      {/* Edit icon - Blue pencil */}
                      <i 
                        className="bi bi-pencil-square"
                        onClick={() => abrirModalEditar(m)} 
                        style={{ color: '#0000FF', cursor: 'pointer', marginRight: '10px' }}
                        title="Editar"
                      ></i>
                      {/* Delete icon - Red trash */}
                      <i 
                        onClick={() => abrirModalEliminar(m)} 
                        className="bi bi-trash"
                        style={{ color: '#FF0000', cursor: 'pointer' }}
                        title="Eliminar"
                      ></i>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── MODAL ELIMINAR ─────────────────────────────────────────────────── */}
      {movAEliminar && (
        <div className="mov-modal-overlay" onClick={() => setMovAEliminar(null)}>
          <div className="mov-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mov-modal-icon mov-modal-icon--danger">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div className="mov-modal-title">¿Eliminar movimiento?</div>

            <div className="mov-modal-detail-card">
              <div className="mov-modal-detail-row">
                <span className="mov-modal-detail-label">Tipo</span>
                <span className={`mov-badge ${movAEliminar.tipo === 'ingreso' ? 'mov-badge-ing' : 'mov-badge-gas'}`}>
                  {movAEliminar.tipo === 'ingreso' ? '+ Ingreso' : '− Gasto'}
                </span>
              </div>
              <div className="mov-modal-detail-row">
                <span className="mov-modal-detail-label">Monto</span>
                <span className={movAEliminar.tipo === 'ingreso' ? 'monto-ing' : 'monto-gas'}>
                  {formatCOP(movAEliminar.monto)}
                </span>
              </div>
              <div className="mov-modal-detail-row">
                <span className="mov-modal-detail-label">Fecha</span>
                <span>{formatFecha(movAEliminar.fecha)}</span>
              </div>
              <div className="mov-modal-detail-row">
                <span className="mov-modal-detail-label">Categoría</span>
                {(() => {
                  const cat = categoriasMap[Number(movAEliminar.categoryId)];
                  const catName = cat?.nombre || movAEliminar.categoria || 'OTROS';
                  const catColor = cat?.color || '#C0C0C0';
                  const textColor = getContrastTextColor(catColor);
                  return (
                    <span
                      className={`mov-cat ${CAT_CLASS[catName] || 'cat-otros'}`}
                      style={{
                        backgroundColor: catColor,
                        color: textColor,
                        fontWeight: 'bold'
                      }}
                    >
                      {catName}
                    </span>
                  );
                })()}
              </div>
            </div>

            <div className="mov-modal-warning">
              ⚠️ Esta acción no se puede deshacer.
            </div>

            <div className="mov-modal-actions">
              <button
                className="mov-modal-cancel"
                onClick={() => setMovAEliminar(null)}
                disabled={eliminando}
              >
                Cancelar
              </button>
              <button
                className="mov-modal-confirm"
                onClick={() => handleEliminar(movAEliminar.id)}
                disabled={eliminando}
              >
                {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL EDITAR ───────────────────────────────────────────────────── */}
      {movAEditar && (
        <div className="mov-modal-overlay" onClick={cerrarModalEditar}>
          <div className="mov-modal mov-modal--edit" onClick={(e) => e.stopPropagation()}>
            <div className="mov-modal-header">
              <div className="mov-modal-title">Editar movimiento</div>
              <button className="mov-modal-close" onClick={cerrarModalEditar}>✕</button>
            </div>

            {/* Tipo: solo lectura visual */}
            <div className="mov-edit-tipo-display">
              <span className={`mov-badge ${movAEditar.tipo === 'ingreso' ? 'mov-badge-ing' : 'mov-badge-gas'}`}>
                {movAEditar.tipo === 'ingreso' ? '+ Ingreso' : '− Gasto'}
              </span>
              <span className="mov-edit-tipo-hint">El tipo no se puede modificar</span>
            </div>

            {errorEdit && <div className="mov-edit-error">{errorEdit}</div>}

            <div className="mov-edit-grid">
              <div className="mov-edit-field">
                <label htmlFor="edit-monto">Monto *</label>
                <input
                  id="edit-monto"
                  type="number"
                  min="1"
                  step="any"
                  value={editMonto}
                  onChange={(e) => setEditMonto(e.target.value)}
                  placeholder="Ej: 500000"
                />
              </div>

              <div className="mov-edit-field">
                <label htmlFor="edit-fecha">Fecha *</label>
                <input
                  id="edit-fecha"
                  type="date"
                  value={editFecha}
                  onChange={(e) => setEditFecha(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                />
              </div>

              <div className="mov-edit-field">
                <label htmlFor="edit-categoria">Categoría *</label>
                <select
                  id="edit-categoria"
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(Number(e.target.value))}
                >
                  <option value="">Selecciona una categoría</option>
                  {categoriasEdit.map((c) => (
                    <option key={c.id} value={Number(c.id)}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="mov-edit-field mov-edit-field--full">
                <label htmlFor="edit-descripcion">Descripción</label>
                <input
                  id="edit-descripcion"
                  type="text"
                  value={editDescripcion}
                  onChange={(e) => setEditDescripcion(e.target.value)}
                  placeholder="Descripción opcional"
                  maxLength={200}
                />
              </div>
            </div>

            <div className="mov-modal-actions">
              <button
                className="mov-modal-cancel"
                onClick={cerrarModalEditar}
                disabled={guardandoEdit}
              >
                Cancelar
              </button>
              <button
                className="mov-modal-save"
                onClick={handleGuardarEdicion}
                disabled={guardandoEdit}
              >
                {guardandoEdit ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
