/**
 * categoriasService.js
 *
 * Maneja categorías del usuario via backend API.
 * Las categorías predeterminadas y personales ahora vienen del backend.
 *
 * Estructura de una categoría:
 * {
 *   id: string,
 *   nombre: string,
 *   tipo: 'ingreso' | 'gasto',
 *   color: string (hex),
 *   descripcion: string,
 *   personal: boolean,
 * }
 */

import { authFetch } from './authService';

// ── Mapeo API <-> Frontend ───────────────────────────────────────────────

// Mapea tipos del frontend (español) a valores del backend (enum Java MovementType)
const typeMap = {
  'INGRESO': 'INCOME',
  'GASTO': 'EXPENSE',
  'ingreso': 'INCOME',
  'gasto': 'EXPENSE'
};

function mapToBackendType(type) {
  return typeMap[type] || type; // Fallback por si ya viene en inglés
}

function normalizeCategoryFromApi(item) {
  return {
    id: Number(item.id),
    nombre: item.name || '',
    tipo: item.type === 'INCOME' || item.type === 'INGRESO' ? 'ingreso' : 'gasto',
    color: item.color || '#2952CC', // HEX format: "#RRGGBB"
    descripcion: item.description || '',
    personal: item.personal !== undefined ? item.personal : true,
  };
}

function normalizeCategoryToApi(categoria) {
  return {
    name: categoria.nombre,
    type: mapToBackendType(categoria.tipo),
    color: categoria.color,
    description: categoria.descripcion,
  };
}

// ── API del servicio ─────────────────────────────────────────────────────

/**
 * Devuelve todas las categorías desde el backend.
 * Hace GET /categories?type=INCOME y GET /categories?type=EXPENSE
 */
export async function getAllCategorias() {
  try {
    const [ingresos, gastos] = await Promise.all([
      authFetch('/categories?type=INCOME'),
      authFetch('/categories?type=EXPENSE'),
    ]);

    const allCategories = [
      ...ingresos.map(normalizeCategoryFromApi),
      ...gastos.map(normalizeCategoryFromApi),
    ];

    // Deduplicate by id to prevent duplicate records
    const uniqueMap = new Map();
    allCategories.forEach(cat => {
      if (!uniqueMap.has(cat.id)) {
        uniqueMap.set(cat.id, cat);
      }
    });
    return Array.from(uniqueMap.values());
  } catch (error) {
    return [];
  }
}

/**
 * Devuelve categorías filtradas por tipo ('ingreso' | 'gasto').
 */
export async function getCategoriasPorTipo(tipo) {
  const todas = await getAllCategorias();
  return todas.filter((c) => c.tipo === tipo);
}

/**
 * Crea una nueva categoría personal via backend.
 * POST /categories
 */
export async function crearCategoria({ nombre, tipo, color, descripcion }) {
  if (!nombre || !tipo) {
    return { ok: false, error: 'El nombre y el tipo son obligatorios.' };
  }

  const nombreNorm = nombre.trim();
  if (nombreNorm.length < 2) {
    return { ok: false, error: 'El nombre debe tener al menos 2 caracteres.' };
  }

  try {
     const categoriaToSend = normalizeCategoryToApi({
       nombre: nombreNorm,
       tipo,
       color: color || '#2952CC', // HEX format: "#RRGGBB"
       descripcion,
     });

    const nueva = await authFetch('/categories', {
      method: 'POST',
      body: JSON.stringify(categoriaToSend),
    });

    return { ok: true, categoria: normalizeCategoryFromApi(nueva) };
  } catch (error) {
    return { ok: false, error: error.message || 'No se pudo crear la categoría.' };
  }
}

/**
 * Edita una categoría existente via backend.
 * PUT /categories/{id}
 */
export async function editarCategoria(id, { nombre, color, descripcion }) {
  if (!id) {
    return { ok: false, error: 'ID de categoría inválido.' };
  }

  if (!nombre || nombre.trim().length < 2) {
    return { ok: false, error: 'El nombre debe tener al menos 2 caracteres.' };
  }

  try {
     const nombreNorm = nombre.trim();
      
     const actualizada = await authFetch(`/categories/${id}`, {
       method: 'PUT',
       body: JSON.stringify({
         name: nombreNorm,
         color: color || '#2952CC', // HEX format: "#RRGGBB"
         description: descripcion?.trim() || '',
       }),
     });

    return { ok: true, categoria: normalizeCategoryFromApi(actualizada) };
  } catch (error) {
    return { ok: false, error: error.message || 'No se pudo editar la categoría.' };
  }
}

/**
 * Elimina una categoría via backend.
 * DELETE /categories/{id}
 */
export async function eliminarCategoria(id) {
  if (!id) {
    return { ok: false, error: 'ID de categoría inválido.' };
  }

  try {
    await authFetch(`/categories/${id}`, {
      method: 'DELETE',
    });

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message || 'No se pudo eliminar la categoría.' };
  }
}
