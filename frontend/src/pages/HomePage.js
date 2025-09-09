import React, { useState, useEffect } from 'react'; // <<< CAMBIO: Se importa useEffect
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // <<< CAMBIO: Se importa useLocation
import { useAuth } from '../context/AuthContext'; 
import axios from '../api/axios'; 

const HomePage = () => {
    const { login, isAuthenticated, loadingAuth } = useAuth();
    const navigate = useNavigate();
    const location = useLocation(); // <<< CAMBIO: Se añade el hook useLocation

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

    // <<< CAMBIO: Se añade useEffect para manejar errores de Google Login en la URL
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const message = params.get('message');
        if (message === 'google_login_failed') {
          setError('Error al iniciar sesión con Google. Por favor, inténtalo de nuevo.');
          navigate(location.pathname, { replace: true }); // Limpia la URL
        } else if (message === 'google_parse_error') {
          setError('Error al procesar los datos de Google. Por favor, inténtalo de nuevo.');
          navigate(location.pathname, { replace: true }); // Limpia la URL
        }
    }, [location, navigate]);


    // Redireccionar si ya está autenticado
    useEffect(() => {
        if (!loadingAuth && isAuthenticated) {
            navigate('/dashboard'); 
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
                setError(err.response.data.error || 'Error al registrar usuario.');
            } else {
                setError('No se pudo conectar con el servidor.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // <<< CAMBIO CLAVE: Se usa la misma función y URL que en LoginPage.js
    const handleGoogleLoginRedirect = () => {
        window.location.href = 'https://carniceria-api-vmy1.onrender.com/api/auth/google';
    };

    if (!loadingAuth && isAuthenticated) {
        return null; 
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

                            {loadingAuth && (
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
                                            <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} placeholder="tu@ejemplo.com" required />
                                        </Form.Group>
                                        <Form.Group className="mb-3" controlId="passwordLogin">
                                            <Form.Label>Contraseña</Form.Label>
                                            <Form.Control type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Tu contraseña" required />
                                        </Form.Group>
                                        <Button variant="primary" type="submit" className="w-100 mb-3" disabled={isSubmitting || loadingAuth}>
                                            {isSubmitting ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />Iniciando...</> : 'Iniciar Sesión'}
                                        </Button>
                                    </Form>
                                    {/* <<< CAMBIO: El onClick ahora llama a la función correcta */}
                                    <Button variant="outline-danger" onClick={handleGoogleLoginRedirect} className="w-100 mb-3 d-flex align-items-center justify-content-center" disabled={isSubmitting || loadingAuth}>
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
                                            <Form.Control type="text" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Tu nombre" required />
                                        </Form.Group>
                                        <Form.Group className="mb-3" controlId="emailRegister">
                                            <Form.Label>Correo Electrónico</Form.Label>
                                            <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} placeholder="tu@ejemplo.com" required />
                                        </Form.Group>
                                        <Form.Group className="mb-3" controlId="passwordRegister">
                                            <Form.Label>Contraseña</Form.Label>
                                            <Form.Control type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Crea una contraseña" required />
                                        </Form.Group>
                                        <Form.Group className="mb-3" controlId="telefonoRegister">
                                            <Form.Label>Teléfono (Opcional)</Form.Label>
                                            <Form.Control type="tel" name="telefono" value={formData.telefono} onChange={handleChange} placeholder="Ej: +5491112345678" />
                                        </Form.Group>
                                        <Button variant="success" type="submit" className="w-100 mb-3" disabled={isSubmitting || loadingAuth}>
                                            {isSubmitting ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />Registrando...</> : 'Registrarse'}
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
