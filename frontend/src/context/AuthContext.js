// frontend/src/context/AuthContext.js

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true); // <-- NUEVO ESTADO DE CARGA DE AUTENTICACIÓN

  const navigate = useNavigate();
  const location = useLocation();

  // useEffect para cargar el token y usuario del localStorage al inicio
  useEffect(() => {
    console.log('--- useEffect de AuthProvider iniciado ---');
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user'); // Asegúrate de guardar el objeto user también

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        setIsAuthenticated(true);
        console.log('✅ Sesión restaurada desde localStorage.');
      } catch (e) {
        console.error("Error al parsear usuario desde localStorage:", e);
        // Limpiar si hay un error en el localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoadingAuth(false); // <-- Una vez que se ha comprobado el localStorage, la carga ha terminado
    console.log('--- useEffect de AuthProvider finalizado ---');
  }, []); // Se ejecuta solo una vez al montar

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
  };

  // Si isAuthenticated es true, y el usuario está en /login, redirigir a /dashboard
  useEffect(() => {
    if (isAuthenticated && location.pathname === '/login') {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate]);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout, loadingAuth }}> {/* <-- Añadir loadingAuth */}
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