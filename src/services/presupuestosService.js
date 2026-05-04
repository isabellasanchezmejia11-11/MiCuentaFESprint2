/**
 * presupuestosService.js
 *
 * Servicio para presupuestos usando el backend API.
 * Estructura de un presupuesto (frontend):
 * {
 *   id: string,
 *   categoria: string,
 *   mes: string (YYYY-MM),
 *   monto: number,
 *   alertaPct: number (0-100),
 * }
 *
 * El backend espera: categoryId, month (number), year (number), amountLimit, alertPercent
 * Las funciones de cálculo de ejecución se mantienen para enriquecer los datos.
 */

import { authFetch } from './authService';
import { getTotalesPorMesDesdeLista } from './movimientosService';

// ── Mapeo API <-> Frontend ───────────────────────────────────────────

function normalizeBudgetFromApi(item) {
  // Reconstruir "YYYY-MM" desde month/year numéricos del backend
  const mesFormateado = (item.year && item.month) 
    ? `${item.year}-${String(item.month).padStart(2, '0')}` 
    : (item.month || '');
  
  // Mapear tipo de categoría del backend (INCOME/EXPENSE) a frontend (ingreso/gasto)
  const tipoNormalizado = item.categoryType === 'INCOME' ? 'ingreso' : 'gasto';
  
  return {
    id: String(item.id),
    categoria: item.categoryName || item.categoryId || item.category || '', // Backend devuelve categoryName
    categoriaId: item.categoryId || null, // Guardar el ID de la categoría
    tipo: tipoNormalizado, // Tipo de categoría: 'ingreso' o 'gasto'
    mes: mesFormateado,                              // Convertir month/year a "YYYY-MM"
    monto: Number(item.amountLimit || item.amount || item.monto || 0), // Backend devuelve amountLimit
    alertaPct: Number(item.alertPercent ?? item.alertPct ?? item.alertaPct ?? 80),  // Backend devuelve alertPercent (camelCase)
    ejecutado: Number(item.valorEjecutado || 0), // Backend ahora devuelve el valor ejecutado
  };
}

function normalizeBudgetToApi(presupuesto) {
  // Extraer month y year del formato "YYYY-MM"
  const [yearStr, monthStr] = presupuesto.mes.split('-');
  const month = parseInt(monthStr, 10);
  const year = parseInt(yearStr, 10);
  
  return {
    categoryId: Number(presupuesto.categoria),  // El backend espera categoryId (número)
    month: month,                                // Número de mes (1-12)
    year: year,                                   // Número de año (ej: 2026)
    amountLimit: presupuesto.monto,               // Backend espera amountLimit
    alertPercent: presupuesto.alertaPct,          // Backend espera alertPercent (camelCase)
  };
}

// ── API del servicio ─────────────────────────────────────────────────

/**
 * Devuelve todos los presupuestos desde el backend.
 * GET /api/presupuestos
 */
export async function getPresupuestos() {
  try {
    const data = await authFetch('/api/presupuestos');
    return { ok: true, data: data.map(normalizeBudgetFromApi) };
  } catch (error) {
    return { ok: false, error: error.message || 'No se pudieron cargar los presupuestos.' };
  }
}

/**
 * Crea un nuevo presupuesto.
 * Valida duplicados localmente antes de enviar.
 * POST /api/presupuestos
 */
export async function crearPresupuesto({ categoria, mes, monto, alertaPct }) {
  if (!categoria || !mes || !monto) {
    return { ok: false, error: 'Categoría, mes y monto son obligatorios.' };
  }

  const montoNum = parseFloat(monto);
  if (isNaN(montoNum) || montoNum <= 0) {
    return { ok: false, error: 'El monto debe ser un número positivo.' };
  }

  const alertaNum = parseInt(alertaPct ?? 80, 10);
  if (isNaN(alertaNum) || alertaNum < 1 || alertaNum > 100) {
    return { ok: false, error: 'El porcentaje de alerta debe estar entre 1 y 100.' };
  }

  try {
    // Obtener lista actual para validar duplicados
    const listaResult = await getPresupuestos();
    const lista = listaResult.ok ? listaResult.data : [];
    
    // Convertir categoria a número para comparar con categoriaId
    const categoriaIdNum = Number(categoria);
    const duplicado = lista.find(
      (p) => p.categoriaId === categoriaIdNum && p.mes === mes
    );

    if (duplicado) {
      return {
        ok: false,
        error: `Ya existe un presupuesto para "${duplicado.categoria}" en ${formatMesLabel(mes)}.`,
      };
    }

    const nuevo = normalizeBudgetToApi({
      categoria,
      mes,
      monto: montoNum,
      alertaPct: alertaNum,
    });

    const creado = await authFetch('/api/presupuestos', {
      method: 'POST',
      body: JSON.stringify(nuevo),
    });

    return { ok: true, presupuesto: normalizeBudgetFromApi(creado) };
  } catch (error) {
    return { ok: false, error: error.message || 'No se pudo crear el presupuesto.' };
  }
}

/**
 * Actualiza un presupuesto existente por id.
 * PUT /api/presupuestos/{id}
 * Normaliza los datos al formato del backend.
 */
export async function actualizarPresupuesto(id, presupuesto) {
  try {
    const normalizedData = normalizeBudgetToApi(presupuesto);
    const response = await authFetch(`/api/presupuestos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(normalizedData),
    });
    return { ok: true, presupuesto: normalizeBudgetFromApi(response) };
  } catch (error) {
    return { ok: false, error: error.message || 'Error al actualizar el presupuesto' };
  }
}

/**
 * Elimina un presupuesto por id.
 * DELETE /api/presupuestos/{id}
 */
export async function eliminarPresupuesto(id) {
  if (!id) {
    return { ok: false, error: 'ID de presupuesto inválido.' };
  }

  try {
    await authFetch(`/api/presupuestos/${id}`, {
      method: 'DELETE',
    });

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message || 'No se pudo eliminar el presupuesto.' };
  }
}

// ── Cálculo de ejecución (Enriquecimiento) ─────────────────────────

/**
 * Calcula el gasto ejecutado para una categoría en un mes dado,
 * usando una lista de movimientos ya cargada.
 * categoriaId: número (ID de la categoría)
 */
export function calcularEjecucion(movimientos, categoriaId, mes) {
  return movimientos
    .filter(
      (m) =>
        m.tipo === 'gasto' &&
        m.categoryId === categoriaId &&
        m.fecha.startsWith(mes)
    )
    .reduce((acc, m) => acc + m.monto, 0);
}

/**
 * Enriquece la lista de presupuestos con datos de ejecución.
 * El backend ya devuelve ejecutado (valorEjecutado), así que solo calculamos
 * el estado, disponible y pct basándonos en ese valor.
 * estado: 'ok' | 'alerta' | 'excedido'
 */
export function enriquecerPresupuestos(presupuestos, movimientos) {
  return presupuestos.map((p) => {
    // Si el backend ya trae ejecutado, usarlo; sino calcularlo (fallback)
    const ejecutado = p.ejecutado !== undefined ? p.ejecutado : 
      calcularEjecucion(movimientos, p.categoriaId, p.mes);
    const disponible = p.monto - ejecutado;
    const pct = p.monto > 0 ? Math.round((ejecutado / p.monto) * 100) : 0;

    let estado = 'ok';
    if (pct >= 100) estado = 'excedido';
    else if (pct >= p.alertaPct) estado = 'alerta';

    return { ...p, ejecutado, disponible, pct, estado };
  });
}

/**
 * Calcula totales globales de ejecución para un mes.
 */
export function calcularTotalesPresupuesto(presupuestosEnriquecidos) {
  const total = presupuestosEnriquecidos.reduce((acc, p) => acc + p.monto, 0);
  const ejecutado = presupuestosEnriquecidos.reduce((acc, p) => acc + p.ejecutado, 0);
  const disponible = total - ejecutado;

  return { total, ejecutado, disponible };
}

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Formatea "YYYY-MM" → "Enero 2026"
 */
export function formatMesLabel(mesStr) {
  if (!mesStr) return '';
  const [y, m] = mesStr.split('-');
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  return `${meses[parseInt(m, 10) - 1]} ${y}`;
}

/**
 * Genera opciones de meses: mes actual + 5 meses hacia adelante.
 */
export function getMesesDisponibles() {
  const meses = [];
  const hoy = new Date();

  for (let i = 0; i < 12; i++) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1);
    const val = d.toISOString().slice(0, 7);
    meses.push({ value: val, label: formatMesLabel(val) });
  }

  return meses;
}

/**
 * Mes actual como "YYYY-MM"
 */
export function getMesActual() {
  return new Date().toISOString().slice(0, 7);
}
