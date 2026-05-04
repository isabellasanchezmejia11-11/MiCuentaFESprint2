import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getMovimientos,
  getResumenDashboardMensual,
  getTotalesPorMesDesdeLista,
  formatCOP,
} from '../services/movimientosService';
import { getAllCategorias } from '../services/categoriasService';
import './Dashboard.css';

function formatFecha(fechaStr) {
  const [y, m, d] = fechaStr.split('-');
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${parseInt(d)} ${meses[parseInt(m, 10) - 1]} ${y}`;
}

function getFechaLarga() {
  return new Date().toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getMesActual() {
  return new Date().toISOString().slice(0, 7);
}

function getNombreMes() {
  const d = new Date();
  const mes = d.toLocaleString('es-CO', { month: 'long' });
  return mes.charAt(0).toUpperCase() + mes.slice(1) + ' ' + d.getFullYear();
}

function getUltimos6Meses() {
  const meses = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    meses.push(d.toISOString().slice(0, 7));
  }
  return meses;
}

function labelMes(mesStr) {
  const [y, m] = mesStr.split('-');
  const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
  const label = d.toLocaleString('es-CO', { month: 'short' });
  return label.charAt(0).toUpperCase() + label.slice(1, 3);
}

function getCategoriaTop(movimientos, categoriasMap) {
  const conteo = {};
  movimientos
    .filter((m) => m.tipo === 'gasto')
    .forEach((m) => {
      const catNombre = categoriasMap[Number(m.categoryId)]?.nombre || 'Otros';
      conteo[catNombre] = (conteo[catNombre] || 0) + Math.abs(m.monto);
    });

  return Object.entries(conteo).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

function formatSignedCOP(valor) {
  const prefix = valor < 0 ? '- ' : '';
  return `${prefix}${formatCOP(valor)}`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { usuario, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resumen, setResumen] = useState(null);
  const [todosMovimientos, setTodosMovimientos] = useState([]);
  const [categorias, setCategorias] = useState([]);

  const mesActual = getMesActual();

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      if (!usuario) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const [summaryData, movimientosData, categoriasData] = await Promise.all([
          getResumenDashboardMensual(),
          getMovimientos(),
          getAllCategorias(),
        ]);

        if (!mounted) return;

        setResumen(summaryData);
        setTodosMovimientos(movimientosData);
        setCategorias(categoriasData);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'No se pudo cargar el dashboard.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    if (!authLoading) {
      loadDashboard();
    }

    return () => {
      mounted = false;
    };
  }, [usuario, authLoading]);

  const movimientosMesActual = useMemo(() => {
    return todosMovimientos.filter((m) => m.fecha.startsWith(mesActual));
  }, [todosMovimientos, mesActual]);

  const categoriasMap = useMemo(() => {
    const map = {};
    (categorias || []).forEach((cat) => {
      if (cat && cat.id !== undefined) {
        map[Number(cat.id)] = cat;
      }
    });
    return map;
  }, [categorias]);

  const ultimosCinco = useMemo(() => {
    return todosMovimientos.slice(0, 5);
  }, [todosMovimientos]);

  const catTop = useMemo(() => {
    return getCategoriaTop(movimientosMesActual, categoriasMap);
  }, [movimientosMesActual, categoriasMap]);

  const ultimos6 = useMemo(() => {
    const meses = getUltimos6Meses();
    return meses.map((mes) => ({
      mes,
      label: labelMes(mes),
      ...getTotalesPorMesDesdeLista(todosMovimientos, mes),
      esActual: mes === mesActual,
    }));
  }, [todosMovimientos, mesActual]);

  const maxValor = useMemo(() => {
    const max = Math.max(...ultimos6.map((m) => Math.max(m.ingresos, m.gastos)), 1);
    return max;
  }, [ultimos6]);

  function altura(valor) {
    return Math.max(8, Math.round((valor / maxValor) * 120));
  }

  const nombreUsuario =
    usuario?.name ||
    usuario?.email?.split('@')[0] ||
    'Usuario';

  if (authLoading || loading) {
    return (
      <div className="dash-page">
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '50vh',
            color: '#666',
          }}
        >
          Cargando...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-page">
        <div
          style={{
            maxWidth: '700px',
            margin: '40px auto',
            padding: '16px',
            borderRadius: '12px',
            background: '#fff4f4',
            color: '#a33',
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  if (!usuario || !resumen) {
    return (
      <div className="dash-page">
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '50vh',
            color: '#666',
          }}
        >
          No hay sesión activa.
        </div>
      </div>
    );
  }

  return (
    <div className="dash-page">
      <div className="dash-topbar">
        <div className="dash-topbar-left">
          <h1>Dashboard</h1>
          <div className="dash-topbar-sub">Resumen financiero · {getNombreMes()}</div>
        </div>
        <div className="dash-topbar-right">
          <button className="dash-btn-nuevo" onClick={() => navigate('/registrar')}>
            + Nuevo movimiento
          </button>
        </div>
      </div>

      <div className="dash-content">
        <div className="dash-welcome">
          <div>
            <div className="dash-welcome-title">Buen día, {nombreUsuario}</div>
            <div className="dash-welcome-sub">
              Aquí está el resumen de tus finanzas de este mes
            </div>
          </div>
          <div className="dash-welcome-date">{getFechaLarga()}</div>
        </div>

        <div className="dash-stats">
          <div className="dash-stat-card">
            <div className="dash-stat-header">
              <div className="dash-stat-dot dot-green"></div>
              <span className="dash-stat-label">Total Ingresos</span>
            </div>
            <div className="dash-stat-value ing">{formatCOP(resumen.ingresos)}</div>
            <div className="dash-stat-period">{getNombreMes()}</div>
          </div>

          <div className="dash-stat-card">
            <div className="dash-stat-header">
              <div className="dash-stat-dot dot-red"></div>
              <span className="dash-stat-label">Total Gastos</span>
            </div>
            <div className="dash-stat-value gas">{formatCOP(resumen.gastos)}</div>
            <div className="dash-stat-period">{getNombreMes()}</div>
          </div>

          <div className="dash-stat-card">
            <div className="dash-stat-header">
              <div className="dash-stat-dot dot-blue"></div>
              <span className="dash-stat-label">Balance Neto</span>
            </div>
            <div className={`dash-stat-value bal ${resumen.balanceMensual < 0 ? 'negativo' : ''}`}>
              {formatSignedCOP(resumen.balanceMensual)}
            </div>
            <div className="dash-stat-period">Ahorro del mes</div>
            <div className={`dash-stat-trend ${resumen.balanceMensual >= 0 ? 'trend-pos' : 'trend-neg'}`}>
              {resumen.balanceMensual >= 0 ? 'Balance positivo' : 'Balance negativo'}
            </div>
          </div>

          <div className="dash-stat-card">
            <div className="dash-stat-header">
              <div className="dash-stat-dot dot-blue"></div>
              <span className="dash-stat-label">Balance Actual</span>
            </div>
            <div className={`dash-stat-value bal ${resumen.balanceActual < 0 ? 'negativo' : ''}`}>
              {formatSignedCOP(resumen.balanceActual)}
            </div>
            <div className="dash-stat-period">Saldo acumulado</div>
          </div>
        </div>

        {catTop && resumen.gastos > 0 && (
          <div className="dash-rec">
            <div className="dash-rec-icon">💡</div>
            <div>
              <div className="dash-rec-title">Recomendación financiera</div>
              <div className="dash-rec-text">
                La categoría <strong>{catTop}</strong> es donde más has gastado este mes.
                Considera revisar tus hábitos en esta área para mejorar tu ahorro.
              </div>
            </div>
          </div>
        )}

        <div className="dash-bottom-grid">
          <div className="dash-card">
            <div className="dash-card-header">
              <span className="dash-card-title">Últimos movimientos</span>
              <button className="dash-card-link" onClick={() => navigate('/movimientos')}>
                Ver todos →
              </button>
            </div>

            {ultimosCinco.length === 0 ? (
              <div className="dash-empty">
                <p>Aún no tienes movimientos.</p>
                <button className="dash-btn-nuevo" onClick={() => navigate('/registrar')}>
                  + Registrar primero
                </button>
              </div>
             ) : (
                <>
                  {ultimosCinco.map((m) => (
                      <div key={m.id} className="dash-mov-item">
                        <div className="dash-mov-left">
                          <div className={`dash-mov-badge ${m.tipo === 'ingreso' ? 'ing' : 'gas'}`}>
                            {m.tipo === 'ingreso' ? '+' : '-'}
                          </div>
                          <div>
                            <div className="dash-mov-name">
                              {categoriasMap[Number(m.categoryId)]?.nombre || 'Otros'}
                            </div>
                            <div className="dash-mov-date">{formatFecha(m.fecha)}</div>
                          </div>
                        </div>
                        <div className={`dash-mov-amount ${m.tipo === 'ingreso' ? 'ing' : 'gas'}`}>
                          {m.tipo === 'ingreso' ? '+' : '-'}{formatCOP(m.monto)}
                        </div>
                      </div>
                    ))}
                </>
              )}
          </div>

          <div className="dash-card">
            <div className="dash-card-header">
              <span className="dash-card-title">Evolución últimos 6 meses</span>
            </div>

            <div className="dash-chart-legend">
              <div className="dash-legend-item">
                <div className="dash-legend-dot ld-green"></div>
                Ingresos
              </div>
              <div className="dash-legend-item">
                <div className="dash-legend-dot ld-red"></div>
                Gastos
              </div>
            </div>

            <div className="dash-chart-area">
              {ultimos6.map((d) => (
                <div key={d.mes} className="dash-bar-group">
                  <div className="dash-bars">
                    <div
                      className={`dash-bar ${d.esActual ? 'ing-dark' : 'ing-light'}`}
                      style={{ height: `${altura(d.ingresos)}px` }}
                      title={`Ingresos: ${formatCOP(d.ingresos)}`}
                    ></div>
                    <div
                      className={`dash-bar ${d.esActual ? 'gas-dark' : 'gas-light'}`}
                      style={{ height: `${altura(d.gastos)}px` }}
                      title={`Gastos: ${formatCOP(d.gastos)}`}
                    ></div>
                  </div>
                  <div className={`dash-bar-label ${d.esActual ? 'active' : ''}`}>
                    {d.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}