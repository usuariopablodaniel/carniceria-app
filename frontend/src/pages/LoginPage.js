import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios'; // Asegúrate de que esta importación sea correcta

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const message = params.get('message');
    if (message === 'session_expired') {
      setError('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
      navigate(location.pathname, { replace: true }); 
    } else if (message === 'google_login_failed') {
      setError('Error al iniciar sesión con Google. Por favor, inténtalo de nuevo.');
      navigate(location.pathname, { replace: true });
    } else if (message === 'google_parse_error') {
      setError('Error al procesar los datos de Google. Por favor, inténtalo de nuevo.');
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    console.log('handleSubmit se está ejecutando.');
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email || !password) {
        setError('Por favor, ingresa tu email y contraseña.');
        setLoading(false);
        return;
      }

      const response = await api.post('/auth/login', { email, password });
      
      const { token, cliente } = response.data;

      console.log("Login exitoso. Token y datos del cliente recibidos:", response.data);

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(cliente)); 

      login(token, cliente); 

      navigate('/dashboard'); 

    } catch (err) {
      console.error("Error durante el login:", err.response?.data?.error || err.message);
      setError(err.response?.data?.error || 'Ocurrió un error al intentar iniciar sesión. Por favor, inténtalo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginRedirect = () => {
    // >>>>>>>>>>>>>>> ESTE LOG ES PARA VERIFICAR SI ESTE CÓDIGO SE ESTÁ EJECUTANDO <<<<<<<<<<<<<<<<
    console.log('DEBUG: Redirigiendo a Google con la URL:', 'http://localhost:5000/api/auth/google');
    // Esta es la URL completa que el navegador debe cargar para iniciar el flujo de autenticación de Google.
    // DEBE COINCIDIR CON app.use('/api/auth', authRoutes) en server.js y router.get('/google', ...) en auth.js
    window.location.href = 'http://localhost:5000/api/auth/google'; 
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-md-center">
        <Col md={6}>
          <h1 className="text-center mb-4">Iniciar Sesión</h1>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Ingresa tu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBasicPassword">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>

            <Button
              variant="primary"
              type="submit"
              className="w-100"
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </Form>

          <div className="text-center mt-3">
            <p>- O -</p>
            <Button
              variant="outline-danger"
              className="w-100"
              onClick={handleGoogleLoginRedirect}
              disabled={loading}
            >
              Iniciar Sesión con Google
            </Button>
          </div>

          <div className="text-center mt-3">
            <p>¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>.</p>
          </div>

        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;