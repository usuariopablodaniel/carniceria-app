import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const login = (newToken, userData) => {
    console.log("--- Función login del AuthContext iniciada ---");
    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    console.log("✅ Todos los estados de login actualizados. Preparando redirección...");
    console.log("--- Función login del AuthContext finalizada ---");
  };

  const logout = () => {
    console.log("--- Función logout del AuthContext iniciada ---");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log("--- Función logout del AuthContext finalizada ---");
  };

  // Efecto para inicializar el estado de autenticación desde localStorage o URL
  useEffect(() => {
    console.log("--- useEffect de AuthProvider iniciado ---");

    const params = new URLSearchParams(location.search);
    const urlToken = params.get('token');
    const urlCliente = params.get('cliente');

    // **PRIORIZAR SIEMPRE LOS PARÁMETROS DE LA URL SI EXISTEN (para Google OAuth)**
    if (urlToken && urlCliente) {
      try {
        const parsedUrlCliente = JSON.parse(decodeURIComponent(urlCliente));
        
        console.log("DEBUG: Procesando datos desde URL:", parsedUrlCliente); // DEBUG
        login(urlToken, parsedUrlCliente); // Llama a la función login del contexto
        console.log("✅ Sesión establecida desde parámetros de URL (Google OAuth).");
        
        // Limpiar los parámetros de la URL para que no queden visibles o se reprocesen
        navigate(location.pathname, { replace: true });
        return; // ¡Importante! Termina aquí si se procesó la URL.

      } catch (e) {
        console.error("Error al procesar parámetros de URL (Google OAuth):", e);
        // Opcional: Redirigir a login en caso de error de procesamiento
        // navigate('/login', { replace: true });
      }
    }

    // Si no hay parámetros en la URL, intentar cargar desde localStorage
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        setIsAuthenticated(true);
        console.log("✅ Sesión restaurada desde localStorage.");
      } catch (e) {
        console.error("Error al parsear usuario de localStorage:", e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    console.log("--- useEffect de AuthProvider finalizado ---");
  }, [location.search]); // Dependencia de location.search para que se re-ejecute si la URL cambia

  // Si isAuthenticated es true y la URL no es /dashboard, redirigir al dashboard.
  // Esto puede ser útil si el usuario está logueado pero intenta ir a /login o /register directamente.
  useEffect(() => {
    if (isAuthenticated && location.pathname === '/login') { // Solo si está logueado y en /login
        navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate]);


  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);