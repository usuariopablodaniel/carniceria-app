import React, { useState, useEffect, createContext, useContext } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

// --- Contexto y API simulados para que el componente funcione de forma autónoma ---
// NOTA: En una aplicación real, estos serían archivos separados.

// Contexto de Autenticación simulado
const AuthContext = createContext();

const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};

// Proveedor de Autenticación simulado
const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loadingAuth, setLoadingAuth] = useState(true);

    // Simula una carga inicial
    useEffect(() => {
        const checkAuthStatus = setTimeout(() => {
            setIsAuthenticated(false); // Por defecto, no autenticado
            setLoadingAuth(false);
        }, 1000);
        return () => clearTimeout(checkAuthStatus);
    }, []);

    const login = (token, user) => {
        console.log('Simulando inicio de sesión:', user);
        setIsAuthenticated(true);
    };

    const handleGoogleLoginRedirect = () => {
        // En una aplicación real, esto redirigiría a la URL de Google
        console.log('Simulando redirección a Google para el inicio de sesión.');
        window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth?prompt=consent&access_type=offline&response_type=code&client_id=YOUR_GOOGLE_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=openid%20email%20profile';
    };

    const value = {
        isAuthenticated,
        loadingAuth,
        login,
        handleGoogleLoginRedirect,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Instancia de Axios simulada
const axios = {
    post: (url, data) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (url === '/auth/login' && data.email === 'test@example.com' && data.password === 'password') {
                    resolve({
                        data: {
                            token: 'mock-token-123',
                            cliente: { nombre: 'Usuario Test', email: 'test@example.com' }
                        }
                    });
                } else if (url === '/auth/register' && data.email === 'new@user.com' && data.password) {
                    resolve({ status: 201 });
                } else if (url === '/auth/login') {
                    reject({ response: { data: { error: 'Email o contraseña incorrectos.' } } });
                } else if (url === '/auth/register') {
                    reject({ response: { data: { error: 'El email ya está en uso.' } } });
                }
            }, 500);
        });
    }
};

// --- FIN de Contexto y API simulados ---

const HomePage = () => {
    const { login, isAuthenticated, loadingAuth, handleGoogleLoginRedirect } = useAuth();
    const navigate = useNavigate();

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

    // Redirigir si el usuario ya está autenticado.
    useEffect(() => {
        if (!loadingAuth && isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, loadingAuth, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setIsSubmitting(true);

        try {
            if (!formData.email || !formData.password) {
                setError('Por favor, ingresa tu email y contraseña.');
                setIsSubmitting(false);
                return;
            }

            const response = await axios.post('/auth/login', {
                email: formData.email,
                password: formData.password
            });

            if (response.data.token && response.data.cliente) {
                login(response.data.token, response.data.cliente);
            } else {
                setError('Respuesta inesperada del servidor.');
            }
            
        } catch (err) {
            console.error('Error de inicio de sesión:', err);
            if (err.response) {
                setError(err.response.data.error || 'Error al iniciar sesión.');
            } else {
                setError('No se pudo conectar con el servidor. Intenta de nuevo más tarde.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setIsSubmitting(true);

        try {
            const response = await axios.post('/auth/register', {
                nombre: formData.nombre,
                email: formData.email,
                password: formData.password,
                telefono: formData.telefono
            });
            if (response.status === 201) {
                setMessage('Registro exitoso! Por favor, inicia sesión.');
                setError('');
                setIsLogin(true);
                setFormData({ ...formData, nombre: '', telefono: '' });
            } else {
                setError(response.data.error || 'Error desconocido durante el registro.');
            }
        } catch (err) {
            console.error('Error de registro:', err);
            if (err.response) {
                setError(err.response.data.error || 'Error al registrar usuario (respuesta del servidor).');
            } else if (err.request) {
                setError('No se pudo conectar con el servidor. Intenta de nuevo más tarde.');
            } else {
                setError('Ocurrió un error inesperado al procesar la solicitud.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (loadingAuth || isAuthenticated) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </Spinner>
            </div>
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
                                        <Link to="#" onClick={() => setIsLogin(false)}>Regístrate aquí</Link>
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
                                        <Link to="#" onClick={() => setIsLogin(true)}>Iniciar Sesión</Link>
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

// En una aplicación real, esto se haría en el archivo principal (e.g., App.js)
export default function WrappedHomePage() {
    return (
        <AuthProvider>
            <HomePage />
        </AuthProvider>
    );
}
