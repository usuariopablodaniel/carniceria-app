import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Inicialización de estado: Lee de localStorage al inicio.
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(!!(token && user));
  const [loadingAuth, setLoadingAuth] = useState(false); 

  const navigate = useNavigate();
  const location = useLocation();

  const login = useCallback((newToken, userData) => {
    console.log('AuthContext.js: login() iniciado.');
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);
    console.log('AuthContext.js: Login exitoso. Estados actualizados.');
  }, []);

  const logout = useCallback(() => {
    console.log('AuthContext.js: logout() iniciado.');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    console.log('AuthContext.js: Sesión cerrada y localStorage limpiado.');
    navigate('/login');
  }, [navigate]);

  // useEffect para manejar la redirección de Google OAuth (o cualquier login basado en URL)
  useEffect(() => {
    console.log('AuthContext.js: useEffect (URL parameters) iniciado.');
    const queryParams = new URLSearchParams(location.search);
    const urlToken = queryParams.get('token');
    const urlUser = queryParams.get('user');

    if (isAuthenticated && (urlToken || urlUser)) {
      console.log('AuthContext.js: Ya autenticado y detectados parámetros de URL. Limpiando URL.');
      navigate(location.pathname, { replace: true });
      return;
    }

    if (urlToken && urlUser) {
      console.log('AuthContext.js: Detectados parámetros de token y user en la URL (Google OAuth).');
      try {
        const parsedUser = JSON.parse(decodeURIComponent(urlUser));
        
        login(urlToken, parsedUser); 
        
        console.log('AuthContext.js: Sesión iniciada desde URL de Google OAuth.');

        navigate('/dashboard', { replace: true }); 
      } catch (e) {
        console.error('AuthContext.js: Error al procesar parámetros de URL de Google OAuth:', e);
        logout();
        navigate('/login?message=google_parse_error', { replace: true });
      }
    } else {
      console.log('AuthContext.js: No hay parámetros de token y user relevantes en la URL.');
    }
    setLoadingAuth(false);
    console.log('AuthContext.js: useEffect (URL parameters) finalizado.');
  }, [location.search, navigate, login, logout, isAuthenticated, location.pathname]); // <<<<< CORRECCIÓN AQUÍ: Agregado location.pathname

  // useEffect para redirigir si el usuario ya está autenticado y trata de ir a /login o /register
  useEffect(() => {
    if (isAuthenticated && (location.pathname === '/login' || location.pathname === '/register')) {
      console.log(`AuthContext.js: Usuario autenticado, redirigiendo desde ${location.pathname} a /dashboard.`);
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate]); 

  if (loadingAuth) {
    return <div>Cargando sesión...</div>;
  }

  const isAdmin = user && user.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isAdmin, login, logout, loadingAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};