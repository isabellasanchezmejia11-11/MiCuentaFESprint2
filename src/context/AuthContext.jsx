import { createContext, useContext, useEffect, useState } from 'react';
import {
  getSesion,
  guardarSesion,
  logout as doLogout,
  login as loginRequest,
  registrar as registerRequest,
  restoreSession,
} from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => getSesion());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const sesion = await restoreSession();
        if (mounted) {
          setUsuario(sesion);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  async function login(credentials) {
    const result = await loginRequest(credentials);

    if (result.ok) {
      guardarSesion(result.usuario);
      setUsuario(result.usuario);
    }

    return result;
  }

  async function register(data) {
    const result = await registerRequest(data);

    if (result.ok) {
      guardarSesion(result.usuario);
      setUsuario(result.usuario);
    }

    return result;
  }

  function logout() {
    doLogout();
    setUsuario(null);
  }


  return <AuthContext.Provider
  value={{
    usuario,
    isAuthenticated: !!usuario,
    loading,
    login,
    register,
    logout,
  }}
>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}