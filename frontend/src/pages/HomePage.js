import React, { useState, useEffect, createContext, useContext } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';

// Note: El archivo CSS de Bootstrap debe ser cargado externamente en el HTML principal
// a través de un enlace CDN o un archivo CSS, ya que la importación directa falló en la compilación.

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
                    console.error("Respuesta exitosa del servidor sin 'token' o 'cliente'.", data);
                    setError('Respuesta inesperada del servidor. Inténtalo de nuevo.');
                }
            } else {
                console.error("Error del servidor:", data);
                setError(data.error || 'Error al iniciar sesión. Verifica tus credenciales.');
            }
        } catch (err) {
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
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </Spinner>
            </div>
        );
    }

    if (isAuthenticated) {
        return (
            <Container className="my-5">
                <Row className="justify-content-center">
                    <Col md={8} lg={6}>
                        <Card className="shadow-lg p-4 text-center">
                            <Card.Body>
                                <h1 className="text-primary mb-3">Dashboard de Usuario</h1>
                                <p className="lead">Bienvenido, {user.nombre}!</p>
                                <p className="text-muted">Has iniciado sesión con éxito.</p>
                                <Button variant="danger" onClick={logout}>Cerrar Sesión</Button>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        );
    }

    return (
        <Container className="my-5">
            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <Card className="shadow-lg p-4">
                        <Card.Body>
                            <h1 className="text-center mb-4 text-primary">Bienvenido a Carnicería App</h1>
                            <p className="text-center text-muted mb-4">
                                Tu puerta de entrada a las mejores carnes y beneficios exclusivos.
                            </p>

                            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
                            {message && <Alert variant="success" onClose={() => setMessage('')} dismissible>{message}</Alert>}

                            {isLogin ? (
                                <>
                                    <h2 className="text-center mb-3">Iniciar Sesión</h2>
                                    <Form onSubmit={handleLoginSubmit}>
                                        <Form.Group className="mb-3" controlId="emailLogin">
                                            <Form.Label>Correo Electrónico</Form.Label>
                                            <Form.Control
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="tu@ejemplo.com"
                                                required
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3" controlId="passwordLogin">
                                            <Form.Label>Contraseña</Form.Label>
                                            <Form.Control
                                                type="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                placeholder="Tu contraseña"
                                                required
                                            />
                                        </Form.Group>

                                        <Button
                                            variant="primary"
                                            type="submit"
                                            className="w-100 mb-3"
                                            disabled={isSubmitting || loadingAuth}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                                    Iniciando...
                                                </>
                                            ) : (
                                                'Iniciar Sesión'
                                            )}
                                        </Button>
                                    </Form>
                                    <Button
                                        variant="outline-danger"
                                        onClick={handleGoogleLoginRedirect}
                                        className="w-100 mb-3 d-flex align-items-center justify-content-center"
                                        disabled={isSubmitting || loadingAuth}
                                    >
                                        <i className="fab fa-google me-2"></i>
                                        Iniciar Sesión con Google
                                    </Button>
                                    <p className="text-center">
                                        ¿No tienes una cuenta?{' '}
                                        <Button variant="link" onClick={() => setIsLogin(false)}>Regístrate aquí</Button>
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-center mb-3">Registrarse</h2>
                                    <Form onSubmit={handleRegisterSubmit}>
                                        <Form.Group className="mb-3" controlId="nombreRegister">
                                            <Form.Label>Nombre Completo</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="nombre"
                                                value={formData.nombre}
                                                onChange={handleChange}
                                                placeholder="Tu nombre"
                                                required
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3" controlId="emailRegister">
                                            <Form.Label>Correo Electrónico</Form.Label>
                                            <Form.Control
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="tu@ejemplo.com"
                                                required
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3" controlId="passwordRegister">
                                            <Form.Label>Contraseña</Form.Label>
                                            <Form.Control
                                                type="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                placeholder="Crea una contraseña"
                                                required
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3" controlId="telefonoRegister">
                                            <Form.Label>Teléfono (Opcional)</Form.Label>
                                            <Form.Control
                                                type="tel"
                                                name="telefono"
                                                value={formData.telefono}
                                                onChange={handleChange}
                                                placeholder="Ej: +5491112345678"
                                            />
                                        </Form.Group>

                                        <Button
                                            variant="success"
                                            type="submit"
                                            className="w-100 mb-3"
                                            disabled={isSubmitting || loadingAuth}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                                    Registrando...
                                                </>
                                            ) : (
                                                'Registrarse'
                                            )}
                                        </Button>
                                    </Form>
                                    <p className="text-center">
                                        ¿Ya tienes una cuenta?{' '}
                                        <Button variant="link" onClick={() => setIsLogin(true)}>Iniciar Sesión</Button>
                                    </p>
                                </>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

// Componente Wrapper para proporcionar el contexto de autenticación
const AppWrapper = () => (
    <AuthProvider>
        <App />
    </AuthProvider>
);

export default AppWrapper;
