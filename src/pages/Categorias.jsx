import { useState, useEffect, useMemo } from 'react';
import {
  getAllCategorias,
  crearCategoria,
  editarCategoria,
  eliminarCategoria,
} from '../services/categoriasService';
import './Categorias.css';

const DEFAULT_COLOR = '#C0C0C0'; // Default gray in HEX

export default function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const cats = await getAllCategorias();
        setCategorias(cats);
      } catch (error) {
        // Error handling: user will see empty state
      } finally {
        setCargando(false);
      }
    }
    load();
  }, []);

  // Función para recargar categorías
  async function loadCategorias() {
    try {
      const cats = await getAllCategorias();
      setCategorias(cats);
    } catch (error) {
      // Error handling: user will see previous state
    }
  }

  // Formulario nueva categoría
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('gasto');
  const [color, setColor] = useState('#2952cc');
  const [descripcion, setDescripcion] = useState('');
  const [errorCrear, setErrorCrear] = useState('');
  const [exitoCrear, setExitoCrear] = useState('');

  // Modal editar
  const [catAEditar, setCatAEditar] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [errorEditar, setErrorEditar] = useState('');

  // Modal eliminar
  const [catAEliminar, setCatAEliminar] = useState(null);
  const [errorEliminar, setErrorEliminar] = useState('');

  // Filtro lista
  const [filtroTipo, setFiltroTipo] = useState('todos');

  // Memoized filtered categories - creates new array on dependency changes
  const categoriasFiltradas = useMemo(() => {
    return categorias.filter(
      (c) => filtroTipo === 'todos' || c.tipo === filtroTipo
    );
  }, [categorias, filtroTipo]);

  // ── CREAR ──────────────────────────────────────────────────────────────

  async function handleCrear(e) {
    e.preventDefault();
    setErrorCrear('');
    setExitoCrear('');

    const result = await crearCategoria({ nombre, tipo, color, descripcion });

    if (!result.ok) {
      setErrorCrear(result.error);
      return;
    }

    await loadCategorias();
    setNombre('');
    setDescripcion('');
    setColor('#2952cc');
    setExitoCrear(`Categoría "${result.categoria.nombre}" creada correctamente.`);

    setTimeout(() => setExitoCrear(''), 3000);
  }

  // ── EDITAR ─────────────────────────────────────────────────────────────

  function abrirEditar(cat) {
    setCatAEditar(cat);
    setEditNombre(cat.nombre);
    setEditColor(cat.color);
    setEditDescripcion(cat.descripcion || '');
    setErrorEditar('');
  }

  async function handleGuardarEdicion() {
    setErrorEditar('');
    const result = await editarCategoria(catAEditar.id, {
      nombre: editNombre,
      color: editColor,
      descripcion: editDescripcion,
    });

    if (!result.ok) {
      setErrorEditar(result.error);
      return;
    }

    await loadCategorias();
    setCatAEditar(null);
  }

  // ── ELIMINAR ───────────────────────────────────────────────────────────

  async function handleEliminar() {
    setErrorEliminar('');
    const result = await eliminarCategoria(catAEliminar.id);

    if (!result.ok) {
      setErrorEliminar(result.error);
      return;
    }

    // Recargar la lista para actualizar la UI
    await loadCategorias();
    setCatAEliminar(null);
  }

  return (
    <div className="cat-page">
      {cargando ? (
        <div>Cargando categorías...</div>
      ) : (
        <>
          {/* TOPBAR */}
      <div className="cat-topbar">
        <div className="cat-topbar-left">
          <h1>Gestión de categorías</h1>
          <div className="cat-breadcrumb">
            Inicio / <span>Categorías</span>
          </div>
        </div>
      </div>

      <div className="cat-content">
        <div className="cat-layout">
          {/* ── PANEL IZQUIERDO: FORMULARIO CREAR ─────────────────────── */}
          <div className="cat-form-panel">
            <div className="cat-panel-title">Nueva categoría</div>

            {errorCrear && <div className="cat-error">{errorCrear}</div>}
            {exitoCrear && <div className="cat-exito">{exitoCrear}</div>}

            <form onSubmit={handleCrear} className="cat-form">
              <div className="cat-field">
                <label htmlFor="cat-nombre">Nombre *</label>
                <input
                  id="cat-nombre"
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Entretenimiento"
                  maxLength={50}
                  required
                />
              </div>

              <div className="cat-field">
                <label>Tipo *</label>
                <div className="cat-tipo-toggle">
                  <button
                    type="button"
                    className={`cat-tipo-btn ${tipo === 'gasto' ? 'active-gasto' : ''}`}
                    onClick={() => setTipo('gasto')}
                  >
                    Gasto
                  </button>
                  <button
                    type="button"
                    className={`cat-tipo-btn ${tipo === 'ingreso' ? 'active-ingreso' : ''}`}
                    onClick={() => setTipo('ingreso')}
                  >
                    Ingreso
                  </button>
                </div>
              </div>

              <div className="cat-field">
                <label>Color</label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={color || DEFAULT_COLOR}
                    onChange={(e) => setColor(e.target.value)}
                    style={{ cursor: 'pointer' }}
                  />
                  <div
                    className="cat-color-preview"
                    style={{ backgroundColor: color || DEFAULT_COLOR, marginLeft: '10px', width: '30px', height: '30px', borderRadius: '4px', border: '1px solid #ccc' }}
                  >
                    &nbsp;
                  </div>
                </div>
              </div>

              <div className="cat-field">
                <label htmlFor="cat-desc">Descripción</label>
                <input
                  id="cat-desc"
                  type="text"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Descripción opcional"
                  maxLength={100}
                />
              </div>

              <button type="submit" className="cat-btn-crear">
                + Crear categoría
              </button>
            </form>
          </div>

          {/* ── PANEL DERECHO: LISTA ────────────────────────────────────── */}
          <div className="cat-list-panel">
            <div className="cat-list-header">
              <div className="cat-panel-title">Mis categorías</div>
              <div className="cat-filtro-tipo">
                {['todos', 'ingreso', 'gasto'].map((t) => (
                  <button
                    key={t}
                    className={`cat-filtro-btn ${filtroTipo === t ? 'active' : ''}`}
                    onClick={() => setFiltroTipo(t)}
                  >
                    {t === 'todos' ? 'Todas' : t === 'ingreso' ? 'Ingresos' : 'Gastos'}
                  </button>
                ))}
              </div>
            </div>

            <div className="cat-list">
              {categoriasFiltradas.length === 0 ? (
                <div className="cat-empty">No hay categorías para mostrar.</div>
              ) : (
                categoriasFiltradas.map((cat) => (
                  <div key={cat.id} className="cat-item">
                    <div className="cat-item-color" style={{ backgroundColor: cat.color }} />
                    <div className="cat-item-info">
                      <div className="cat-item-nombre">
                        {cat.nombre}
                        {!cat.personal && (
                          <span className="cat-badge-default">Predeterminada</span>
                        )}
                      </div>
                      <div className="cat-item-meta">
                        <span className={`cat-tipo-tag cat-tipo-tag--${cat.tipo}`}>
                          {cat.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}
                        </span>
                        {cat.descripcion && (
                          <span className="cat-item-desc">{cat.descripcion}</span>
                        )}
                      </div>
                    </div>
                    {cat.personal === true && (
                      <div className="cat-item-actions">
                        {/* Edit icon - Blue pencil */}
                        <i 
                          className="bi bi-pencil-square"
                          onClick={() => abrirEditar(cat)} 
                          style={{ color: '#0000FF', cursor: 'pointer', marginRight: '10px' }}
                          title="Editar"
                        ></i>
                        {/* Delete icon - Red trash */}
                        <i 
                          onClick={() => { setCatAEliminar(cat); setErrorEliminar(''); }} 
                          className="bi bi-trash"
                          style={{ color: '#FF0000', cursor: 'pointer' }}
                          title="Eliminar"
                        ></i>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL EDITAR ──────────────────────────────────────────────────── */}
      {catAEditar && (
        <div className="cat-modal-overlay" onClick={() => setCatAEditar(null)}>
          <div className="cat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cat-modal-header">
              <div className="cat-modal-title">Editar categoría</div>
              <button className="cat-modal-close" onClick={() => setCatAEditar(null)}>✕</button>
            </div>

            {errorEditar && <div className="cat-error">{errorEditar}</div>}

            <div className="cat-field">
              <label htmlFor="edit-cat-nombre">Nombre *</label>
              <input
                id="edit-cat-nombre"
                type="text"
                value={editNombre}
                onChange={(e) => setEditNombre(e.target.value)}
                maxLength={50}
              />
            </div>

            <div className="cat-field" style={{ marginTop: '12px' }}>
              <label>Color</label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="color"
                  value={editColor || DEFAULT_COLOR}
                  onChange={(e) => setEditColor(e.target.value)}
                  style={{ cursor: 'pointer' }}
                />
                <div
                    className="cat-color-preview"
                    style={{ backgroundColor: editColor || DEFAULT_COLOR, marginLeft: '10px', width: '30px', height: '30px', borderRadius: '4px', border: '1px solid #ccc' }}
                  >
                    &nbsp;
                  </div>
                </div>
            </div>

            <div className="cat-field" style={{ marginTop: '12px' }}>
              <label htmlFor="edit-cat-desc">Descripción</label>
              <input
                id="edit-cat-desc"
                type="text"
                value={editDescripcion}
                onChange={(e) => setEditDescripcion(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="cat-modal-actions">
              <button className="cat-modal-cancel" onClick={() => setCatAEditar(null)}>
                Cancelar
              </button>
              <button className="cat-modal-save" onClick={handleGuardarEdicion}>
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL ELIMINAR ────────────────────────────────────────────────── */}
      {catAEliminar && (
        <div className="cat-modal-overlay" onClick={() => setCatAEliminar(null)}>
          <div className="cat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cat-modal-title">¿Eliminar categoría?</div>
            <p className="cat-modal-text">
              Vas a eliminar la categoría <strong>{catAEliminar.nombre}</strong>.
              Esta acción no se puede deshacer.
            </p>
            {errorEliminar && <div className="cat-error">{errorEliminar}</div>}
            <div className="cat-modal-actions">
              <button className="cat-modal-cancel" onClick={() => setCatAEliminar(null)}>
                Cancelar
              </button>
              <button className="cat-modal-confirm" onClick={handleEliminar}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
   </div>
  );
}
