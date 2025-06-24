// frontend/src/context/AuthContext.js

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  // useEffect para cargar el token y usuario del localStorage al inicio
  useEffect(() => {
    console.log('--- useEffect de AuthProvider para localStorage iniciado ---');
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        setIsAuthenticated(true);
        console.log('✅ Sesión restaurada desde localStorage.');
      } catch (e) {
        console.error("Error al parsear usuario desde localStorage:", e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoadingAuth(false);
    console.log('--- useEffect de AuthProvider para localStorage finalizado ---');
  }, []); // Se ejecuta solo una vez al montar


    // NUEVO useEffect para manejar la redirección de Google OAuth
    useEffect(() => {
        console.log('--- useEffect de AuthProvider para URL parameters iniciado ---');
        const queryParams = new URLSearchParams(location.search);
        const urlToken = queryParams.get('token');
        const urlCliente = queryParams.get('cliente');

        if (urlToken && urlCliente) {
            console.log('Detectados parámetros de token y cliente en la URL.');
            try {
                const parsedCliente = JSON.parse(decodeURIComponent(urlCliente));
                
                // Usamos la función login que ya actualiza los estados y localStorage
                login(urlToken, parsedCliente); // Usa tu función login aquí
                
                console.log('✅ Sesión iniciada desde URL de Google OAuth.');
                console.log('Datos del cliente desde URL:', parsedCliente);

                // Importante: Limpiar la URL para que el token y cliente no queden expuestos
                // y para evitar re-procesamiento al recargar.
                navigate('/dashboard', { replace: true }); // Redirige a /dashboard y reemplaza la entrada en el historial
            } catch (e) {
                console.error('Error al procesar parámetros de URL de Google OAuth:', e);
                logout(); // Si hay error al procesar, cerrar sesión
            }
        } else {
            console.log('No hay parámetros de token y cliente en la URL.');
        }
        console.log('--- useEffect de AuthProvider para URL parameters finalizado ---');
    }, [location.search, navigate]); // Dependencias: re-ejecutar cuando cambie la URL o navigate (raro)


  // Función de login (para login normal y Google OAuth)
  const login = (newToken, userData) => {
    console.log('--- Función login del AuthContext iniciada ---');
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData)); // Guardar el objeto user
    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);
    console.log('✅ Todos los estados de login actualizados. Preparando redirección...');
    console.log('--- Función login del AuthContext finalizada ---');
  };

  // Función de logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    console.log('❌ Sesión cerrada y token/usuario eliminados.');
    navigate('/login'); // Redirige al login al cerrar sesión
  };

  // Si isAuthenticated es true, y el usuario está en /login, redirigir a /dashboard
  useEffect(() => {
    if (isAuthenticated && location.pathname === '/login') {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate]);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout, loadingAuth }}>
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