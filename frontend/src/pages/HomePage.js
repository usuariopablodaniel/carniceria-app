import React, { useState, useEffect, createContext, useContext } from 'react';

// Contexto de autenticación para toda la aplicación
const AuthContext = createContext(null);

// Proveedor de autenticación que maneja el estado de inicio de sesión
const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Simular la verificación de autenticación. En una aplicación real,
        // esto verificaría un token en localStorage o una sesión.
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const storedUser = JSON.parse(localStorage.getItem('user'));
                if (storedUser) {
                    setIsAuthenticated(true);
                    setUser(storedUser);
                }
            } catch (e) {
                console.error("Error al analizar el usuario desde localStorage", e);
                localStorage.clear();
            }
        }
        setLoadingAuth(false);
    }, []);

    const login = (token, userData) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setIsAuthenticated(true);
        setUser(userData);
    };

    const logout = () => {
        localStorage.clear();
        setIsAuthenticated(false);
        setUser(null);
    };

    const value = { isAuthenticated, loadingAuth, user, login, logout };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado para usar el contexto de autenticación
const useAuth = () => {
    return useContext(AuthContext);
};

// Componente principal de la aplicación, ahora contiene toda la lógica.
const App = () => {
    const { login, isAuthenticated, loadingAuth, user, logout } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        nombre: '',
        telefono: ''
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Función de inicio de sesión con correo y contraseña
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setIsSubmitting(true);

        const API_URL = 'https://carniceria-api-vmy1.onrender.com/api/auth/login';

        try {
            if (!formData.email || !formData.password) {
                setError('Por favor, ingresa tu email y contraseña.');
                setIsSubmitting(false);
                return;
            }

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, password: formData.password })
            });

            const data = await response.json();

            if (response.ok) {
                if (data.token && data.cliente) {
                    login(data.token, data.cliente);
                } else {
                    // Manejar una respuesta exitosa sin los datos esperados
                    console.error("Respuesta exitosa del servidor sin 'token' o 'cliente'.", data);
                    setError('Respuesta inesperada del servidor. Inténtalo de nuevo.');
                }
            } else {
                // El servidor respondió con un error (4xx, 5xx)
                console.error("Error del servidor:", data);
                setError(data.error || 'Error al iniciar sesión. Verifica tus credenciales.');
            }
        } catch (err) {
            // Error de red, CORS, etc.
            console.error('Error de inicio de sesión:', err);
            setError('No se pudo conectar con el servidor. Intenta de nuevo más tarde.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Función de registro de usuario
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setIsSubmitting(true);

        const API_URL = 'https://carniceria-api-vmy1.onrender.com/api/auth/register';

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: formData.nombre,
                    email: formData.email,
                    password: formData.password,
                    telefono: formData.telefono
                })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Registro exitoso! Por favor, inicia sesión.');
                setError('');
                setIsLogin(true);
                setFormData({ ...formData, nombre: '', telefono: '' });
            } else {
                setError(data.error || 'Error desconocido durante el registro.');
            }
        } catch (err) {
            console.error('Error de registro:', err);
            setError('No se pudo conectar con el servidor. Intenta de nuevo más tarde.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Redirigir para el inicio de sesión de Google
    const handleGoogleLoginRedirect = () => {
        window.location.href = 'https://carniceria-api-vmy1.onrender.com/api/auth/google';
    };

    if (loadingAuth) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-xl font-medium text-gray-700">Cargando...</div>
            </div>
        );
    }

    if (isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
                <div className="w-full max-w-xl p-8 bg-white rounded-xl shadow-2xl text-center">
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">Dashboard</h1>
                    <p className="text-lg text-gray-600 mb-6">Bienvenido, {user.nombre}!</p>
                    <p className="text-sm text-gray-500 mb-6">Has iniciado sesión con éxito.</p>
                    <button
                        onClick={logout}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition-colors duration-200"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="w-full max-w-xl p-8 bg-white rounded-xl shadow-2xl">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Bienvenido a Carnicería App</h1>
                    <p className="mt-2 text-sm text-gray-500">
                        Tu puerta de entrada a las mejores carnes y beneficios exclusivos.
                    </p>
                </div>

                {error && <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}
                {message && <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">{message}</div>}

                {isLogin ? (
                    <form onSubmit={handleLoginSubmit}>
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">Iniciar Sesión</h2>
                        <div className="mb-4">
                            <label className="block text-gray-600 text-sm font-medium mb-1" htmlFor="emailLogin">Correo Electrónico</label>
                            <input
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                id="emailLogin"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="tu@ejemplo.com"
                                required
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-gray-600 text-sm font-medium mb-1" htmlFor="passwordLogin">Contraseña</label>
                            <input
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                id="passwordLogin"
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Tu contraseña"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Iniciando...' : 'Iniciar Sesión'}
                        </button>
                        <p className="text-center mt-4 text-sm text-gray-500">
                            ¿No tienes una cuenta? <span className="text-blue-600 cursor-pointer hover:underline" onClick={() => setIsLogin(false)}>Regístrate aquí</span>
                        </p>
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-white px-2 text-gray-500">O</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleGoogleLoginRedirect}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 flex items-center justify-center space-x-2"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M21.57 12.24c0-.77-.07-1.5-.2-2.2H12v4.18h5.6c-.24 1.25-.97 2.3-2.13 3.03v2.7h3.48c2.04-1.89 3.23-4.66 3.23-8.1z"/>
                                <path fill="#34A853" d="M12 21.6c2.95 0 5.43-.97 7.24-2.62L15.76 16.2c-1.02.66-2.31 1.05-3.76 1.05-2.88 0-5.32-1.92-6.22-4.5h-3.5v2.72c1.84 3.63 5.56 6.13 9.72 6.13z"/>
                                <path fill="#FBBC05" d="M5.78 14.1c-.24-.66-.38-1.38-.38-2.1c0-.72.14-1.44.38-2.1v-2.72H2.2c-.88 1.8-1.35 3.8-1.35 5.86s.47 4.06 1.35 5.86L5.78 14.1z"/>
                                <path fill="#EA4335" d="M12 5.58c1.6 0 3.06.56 4.18 1.6L19.57 4c-1.74-1.63-4.14-2.63-6.57-2.63-4.16 0-7.88 2.5-9.72 6.13L5.78 9.6c.9-2.58 3.34-4.5 6.22-4.5z"/>
                            </svg>
                            <span>Iniciar Sesión con Google</span>
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleRegisterSubmit}>
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">Registrarse</h2>
                        <div className="mb-4">
                            <label className="block text-gray-600 text-sm font-medium mb-1" htmlFor="nombreRegister">Nombre Completo</label>
                            <input
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                id="nombreRegister"
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                placeholder="Tu nombre"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-600 text-sm font-medium mb-1" htmlFor="emailRegister">Correo Electrónico</label>
                            <input
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                id="emailRegister"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="tu@ejemplo.com"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-600 text-sm font-medium mb-1" htmlFor="passwordRegister">Contraseña</label>
                            <input
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                id="passwordRegister"
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Crea una contraseña"
                                required
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-gray-600 text-sm font-medium mb-1" htmlFor="telefonoRegister">Teléfono (Opcional)</label>
                            <input
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                id="telefonoRegister"
                                type="tel"
                                name="telefono"
                                value={formData.telefono}
                                onChange={handleChange}
                                placeholder="Ej: +5491112345678"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full px-4 py-2 text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Registrando...' : 'Registrarse'}
                        </button>
                        <p className="text-center mt-4 text-sm text-gray-500">
                            ¿Ya tienes una cuenta? <span className="text-green-600 cursor-pointer hover:underline" onClick={() => setIsLogin(true)}>Iniciar Sesión</span>
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
};

// Componente Wrapper para proporcionar el contexto de autenticación
const AppWrapper = () => (
    <AuthProvider>
        <App />
    </AuthProvider>
);

export default AppWrapper;
