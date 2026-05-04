const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const KEY_TOKEN = 'mc_token';
const KEY_USER = 'mc_user';

function buildUrl(path) {
  return `${API_URL}${path}`;
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      'Ocurrió un error inesperado.';
    throw new Error(message);
  }

  return data;
}

export function getToken() {
  return localStorage.getItem(KEY_TOKEN);
}

export function saveToken(token) {
  localStorage.setItem(KEY_TOKEN, token);
}

export function removeToken() {
  localStorage.removeItem(KEY_TOKEN);
}

export function getSesion() {
  try {
    return JSON.parse(localStorage.getItem(KEY_USER)) || null;
  } catch {
    return null;
  }
}

export function guardarSesion(usuario) {
  localStorage.setItem(KEY_USER, JSON.stringify(usuario));
}

export function logout() {
  removeToken();
  localStorage.removeItem(KEY_USER);
}

export async function registrar({ nombre, apellido, email, password }) {
  if (!nombre || !apellido || !email || !password) {
    return { ok: false, error: 'Todos los campos obligatorios deben estar completos.' };
  }


  try {
    await fetch(buildUrl('/auth/register'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name:nombre,
        lastname: apellido,
        email,
        password,
      }),
    }).then(parseResponse);

    // Registro exitoso - NO hacer auto login
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'No se pudo registrar el usuario.',
    };
  }
}

export async function login({ email, password }) {
  if (!email || !password) {
    return { ok: false, error: 'Ingresa tu correo y contraseña.' };
  }

  try {
    const authData = await fetch(buildUrl('/auth/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    }).then(parseResponse);

    const token = authData?.token;

    if (!token) {
      return { ok: false, error: 'No se recibió el token de autenticación.' };
    }

    saveToken(token);

    const usuario = await getCurrentUser();

    guardarSesion(usuario);

    return {
      ok: true,
      usuario,
      token,
    };
  } catch (error) {
    logout();
    return {
      ok: false,
      error: error.message || 'Correo o contraseña incorrectos.',
    };
  }
}

export async function getCurrentUser() {
  const token = getToken();

  if (!token) {
    throw new Error('No hay sesión activa.');
  }

  return fetch(buildUrl('/users/me'), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  }).then(parseResponse);
}

export async function restoreSession() {
  const token = getToken();

  if (!token) {
    return null;
  }

  try {
    const usuario = await getCurrentUser();
    guardarSesion(usuario);
    return usuario;
  } catch {
    logout();
    return null;
  }
}

export async function authFetch(path, options = {}) {
  const token = getToken();

  if (!token) {
    console.warn('⚠️ No hay token disponible para', path);
  } else {
    console.log('✓ Token presente para', path);
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = buildUrl(path);
  console.log('📡 Llamada a:', url, { hasToken: !!token });

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log('📡 Status:', response.status, 'para', path);

    const data = await parseResponse(response);
    console.log('📡 Datos recibidos:', data);
    return data;
  } catch (error) {
    console.error('❌ Error en authFetch:', path, error);
    throw error;
  }
}