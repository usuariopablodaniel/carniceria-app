import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 
import axios from '../api/axios'; 

const HomePage = () => {
    const { login, isAuthenticated, loadingAuth } = useAuth();
    const navigate = useNavigate();

    const [isLogin, setIsLogin] = useState(true); // Controla si se muestra el formulario de login o registro
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        nombre: '', // Solo para registro
        telefono: '' // Solo para registro
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Redireccionar si ya está autenticado
    React.useEffect(() => {
        if (!loadingAuth && isAuthenticated) {
            navigate('/dashboard'); // Redirige al dashboard si ya inició sesión
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

            // >>> CAMBIO CLAVE AQUÍ: La ruta correcta es '/auth/login' <<<
            const response = await axios.post('/auth/login', {
                email: formData.email,
                password: formData.password
            });

            // Tu backend para login tradicional envía el objeto de usuario bajo la clave 'cliente'
            if (response.data.token && response.data.cliente) {
                // Pasamos el token y el objeto 'cliente' completo (que incluye el nombre)
                login(response.data.token, response.data.cliente); 
            } else {
                // Esto no debería ocurrir si el backend está bien, pero es una seguridad
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
            // La ruta para el registro es '/auth/register'
            const response = await axios.post('/auth/register', {
                nombre: formData.nombre,
                email: formData.email,
                password: formData.password,
                telefono: formData.telefono 
            });
            if (response.status === 201) {
                setMessage('Registro exitoso! Por favor, inicia sesión.');
                setError('');
                setIsLogin(true); // Cambiar a la vista de login después del registro
                setFormData({ ...formData, nombre: '', telefono: '' }); // Limpiar campos de registro
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

    const handleGoogleLogin = () => {
        // Asegúrate de que REACT_APP_API_URL no termine en /api
        // Si termina en /api, entonces deberías usar `${process.env.REACT_APP_API_URL}/auth/google`
        // Si no termina en /api, entonces `${process.env.REACT_APP_API_URL}/api/auth/google`
        window.location.href = `${process.env.REACT_APP_API_URL}/api/auth/google`;
    };

    // Si ya está autenticado y cargado, no mostrar el formulario, se redirigirá.
    if (!loadingAuth && isAuthenticated) {
        return null; // O un spinner si la redirección tarda
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

                            {loadingAuth && ( // Mostrar spinner mientras AuthContext está cargando
                                <div className="text-center mb-3">
                                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                    <p className="d-inline">Cargando sesión...</p>
                                </div>
                            )}

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
                                        onClick={handleGoogleLogin} 
                                        className="w-100 mb-3 d-flex align-items-center justify-content-center"
                                        disabled={isSubmitting || loadingAuth}
                                    >
                                        <i className="fab fa-google me-2"></i> {/* Asegúrate de tener Font Awesome si usas esto */}
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

export default HomePage;