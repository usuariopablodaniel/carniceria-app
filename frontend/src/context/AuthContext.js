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
    const [loadingAuth, setLoadingAuth] = useState(true); // Se inicia en true para indicar que estamos cargando la autenticación inicial

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
        // La redirección al dashboard se manejará en el useEffect del callback de Google o en el componente de login/homepage
    }, []);

    const logout = useCallback(() => {
        console.log('AuthContext.js: logout() iniciado.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        console.log('AuthContext.js: Sesión cerrada y localStorage limpiado.');
        navigate('/login', { replace: true }); // Redirige a login al cerrar sesión
    }, [navigate]);

    // useEffect para manejar la redirección de Google OAuth (o cualquier login basado en URL)
    useEffect(() => {
        console.log('AuthContext.js: useEffect (URL parameters) iniciado.');
        const queryParams = new URLSearchParams(location.search);
        const urlToken = queryParams.get('token');
        const urlUser = queryParams.get('user');

        // Si ya estamos autenticados y la URL contiene parámetros de token/usuario
        // significa que acabamos de volver de un OAuth exitoso. Limpiamos la URL
        // y si no estamos ya en el dashboard, redirigimos.
        if (urlToken && urlUser) {
            console.log('AuthContext.js: Detectados parámetros de token y user en la URL (Google OAuth).');
            try {
                const parsedUser = JSON.parse(decodeURIComponent(urlUser));

                login(urlToken, parsedUser); 

                console.log('AuthContext.js: Sesión iniciada desde URL de Google OAuth.');

                // Limpiar los parámetros de la URL después de usarlos para evitar re-procesamiento y URLs feas
                // y luego redirigir al dashboard
                navigate('/dashboard', { replace: true }); 
            } catch (e) {
                console.error('AuthContext.js: Error al procesar parámetros de URL de Google OAuth:', e);
                logout(); // Si hay un error, cierra sesión y redirige a login
                navigate('/login?message=google_parse_error', { replace: true });
            } finally {
                setLoadingAuth(false); // Asegurarse de que loadingAuth se desactive
            }
        } else {
            console.log('AuthContext.js: No hay parámetros de token y user relevantes en la URL.');
            // Si no hay parámetros de token/user en la URL, asumimos que la carga inicial terminó
            // o que la navegación es normal.
            setLoadingAuth(false); 
        }
        console.log('AuthContext.js: useEffect (URL parameters) finalizado.');
    }, [location.search, navigate, login, logout]); // Dependencias: location.search es suficiente para detectar cambios de URL

    // useEffect para redirigir si el usuario ya está autenticado y trata de ir a /login o /
    useEffect(() => {
        // Solo redirigimos si no estamos en medio de la carga de autenticación
        // y si el usuario está autenticado y la ruta actual es login, register o la raíz.
        if (!loadingAuth && isAuthenticated && (location.pathname === '/login' || location.pathname === '/' || location.pathname === '/register')) {
            console.log(`AuthContext.js: Usuario autenticado, redirigiendo desde ${location.pathname} a /dashboard.`);
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, loadingAuth, location.pathname, navigate]); 

    // Si loadingAuth es true, mostramos un spinner o mensaje de carga
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