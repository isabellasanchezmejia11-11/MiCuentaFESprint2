import { authFetch } from './authService';

// Mapeo front -> back (para movimientos)
// Si el backend deja de usar enums y pasa a IDs, actualizar estas funciones.
const CATEGORY_TO_API = {
  // ingresos
  Salario: 'SALARIO',
  Honorarios: 'HONORARIOS',
  Freelance: 'OTROS',
  Inversiones: 'OTROS',

  // gastos
  Alimentación: 'ALIMENTACION',
  Transporte: 'TRANSPORTE',
  Servicios: 'SERVICIOS',
  Salud: 'OTROS',

  // genérico
  Otros: 'OTROS',
};

// Mapeo back -> front
const CATEGORY_FROM_API = {
  SALARIO: 'Salario',
  HONORARIOS: 'Honorarios',
  ALIMENTACION: 'Alimentación',
  TRANSPORTE: 'Transporte',
  OTROS: 'Otros',
};

function toApiType(tipo) {
  if (tipo === 'ingreso') return 'incomes';
  if (tipo === 'gasto') return 'expenses';
  throw new Error('Tipo de movimiento inválido.');
}

function normalizeAmount(monto) {
  const montoNum = parseFloat(String(monto).replace(/\./g, '').replace(',', '.'));

  if (isNaN(montoNum) || montoNum <= 0) {
    throw new Error('El monto debe ser un número positivo.');
  }

  return montoNum;
}

function validateFutureDate(fecha) {
  const hoy = new Date().toISOString().slice(0, 10);
  if (fecha > hoy) {
    throw new Error('La fecha no puede ser futura.');
  }
}

function toApiCategory(categoria) {
  return CATEGORY_TO_API[categoria] || 'OTROS';
}

function fromApiCategory(categoria) {
  return CATEGORY_FROM_API[categoria] || categoria || 'Otros';
}

function normalizeMovementFromApi(item) {
  // El backend devuelve type: "INCOME" / "EXPENSE" (mayúsculas o minúsculas)
  const apiType = (item.type || item.tipo || '').toString().toUpperCase();
  const tipo =
    apiType === 'INCOME' ? 'ingreso' :
    apiType === 'EXPENSE' ? 'gasto' :
    'gasto'; // fallback por si acaso

  // Asegurar que el monto sea siempre POSITIVO
  // El signo se determina por el tipo (ingreso/gasto) en el JSX
  return {
    id: String(item.id),
    tipo,
    monto: Math.abs(Number(item.amount) || 0),
    fecha: item.date,
    categoryId: item.categoryId ? Number(item.categoryId) : null,
    descripcion: item.description || '',
  };
}

function sortMovimientos(lista) {
  return [...lista].sort((a, b) => {
    const byDate = b.fecha.localeCompare(a.fecha);
    if (byDate !== 0) return byDate;
    return Number(b.id) - Number(a.id);
  });
}

/**
 * Devuelve todos los movimientos del usuario autenticado.
 */
export async function getMovimientos() {
  const [ingresos, gastos] = await Promise.all([
    authFetch('/movements/incomes'),
    authFetch('/movements/expenses'),
  ]);

  return sortMovimientos([
    ...ingresos.map(normalizeMovementFromApi),
    ...gastos.map(normalizeMovementFromApi),
  ]);
}

/**
 * Devuelve solo ingresos.
 */
export async function getIngresos() {
  const data = await authFetch('/movements/incomes');
  return sortMovimientos(data.map(normalizeMovementFromApi));
}

/**
 * Devuelve solo gastos.
 */
export async function getGastos() {
  const data = await authFetch('/movements/expenses');
  return sortMovimientos(data.map(normalizeMovementFromApi));
}

/**
 * Guarda un nuevo movimiento.
 * tipo: 'ingreso' | 'gasto'
 */
export async function guardar({ tipo, monto, fecha, categoria, descripcion }) {
  try {
    if (!tipo || !monto || !fecha || !categoria) {
      return { ok: false, error: 'Completa todos los campos obligatorios.' };
    }

    const montoNum = normalizeAmount(monto);
    validateFutureDate(fecha);

    const endpoint = `/movements/${toApiType(tipo)}`;

    const payload = {
      amount: montoNum,
      date: fecha,
      categoryId: Number(categoria),
      description: descripcion || '',
    };

    const saved = await authFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return {
      ok: true,
      movimiento: normalizeMovementFromApi(saved),
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'No se pudo guardar el movimiento.',
    };
  }
}

/**
 * Edita un movimiento existente.
 */
export async function editar(id, { monto, fecha, categoryId, descripcion }) {
  try {
    if (!id) {
      return { ok: false, error: 'Id de movimiento inválido.' };
    }

    if (!monto || !fecha || !categoryId) {
      return { ok: false, error: 'Completa todos los campos obligatorios.' };
    }

    const montoNum = normalizeAmount(monto);
    validateFutureDate(fecha);

    const payload = {
      amount: montoNum,
      date: fecha,
      categoryId: Number(categoryId),
      description: descripcion || '',
    };
    const saved = await authFetch(`/movements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return { ok: true, movimiento: normalizeMovementFromApi(saved) };
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'No se pudo editar el movimiento.',
    };
  }
}

/**
 * Elimina un movimiento.
 * Ojo: tu backend actual todavía no tiene DELETE /movements/{id}.
 */
export async function eliminar(id) {
  try {
    if (!id) {
      return { ok: false, error: 'Id de movimiento inválido.' };
    }

    await authFetch(`/movements/${id}`, {
      method: 'DELETE',
    });

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'No se pudo eliminar el movimiento.',
    };
  }
}

/**
 * Calcula totales sobre una lista ya cargada.
 * mes: "YYYY-MM" o null
 */
export function getTotalesPorMesDesdeLista(lista, mes = null) {
  const filtrada = lista.filter((m) => (mes ? m.fecha.startsWith(mes) : true));

  const ingresos = filtrada
    .filter((m) => m.tipo === 'ingreso')
    .reduce((acc, m) => acc + Math.abs(m.monto), 0);

  const gastos = filtrada
    .filter((m) => m.tipo === 'gasto')
    .reduce((acc, m) => acc + Math.abs(m.monto), 0);

  return {
    ingresos,
    gastos,
    balance: ingresos - gastos,
  };
}

/**
 * Calcula totales consultando primero los movimientos.
 * mes: "YYYY-MM" o null
 */
export async function getTotales(mes = null) {
  const lista = await getMovimientos();
  return getTotalesPorMesDesdeLista(lista, mes);
}

/**
 * Usa el endpoint del dashboard del backend.
 */
export async function getResumenDashboardMensual() {
  const data = await authFetch('/dashboard/monthly-summary');

  return {
    mes: data.month,
    ingresos: Number(data.monthlyIncome || 0),
    gastos: Number(data.monthlyExpense || 0),
    balanceMensual: Number(data.monthlyNet || 0),
    balanceActual: Number(data.currentBalance || 0),
    movimientos: sortMovimientos(
      (data.monthlyMovements || []).map(normalizeMovementFromApi)
    ),
  };
}

/**
 * Formatea un número como moneda COP.
 * 1750000 -> "$ 1.750.000"
 */
export function formatCOP(num) {
  return '$ ' + Math.abs(Number(num || 0)).toLocaleString('es-CO');
}
