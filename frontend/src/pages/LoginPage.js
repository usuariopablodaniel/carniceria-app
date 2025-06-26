import React, { useState } from 'react';
import { Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom'; // Importa useNavigate para la redirección
import api from '../api/axios'; // <<<<< IMPORTANTE: Importa la instancia de Axios

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate(); // Hook para la navegación programática

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    console.log('handleSubmit se está ejecutando.');
    e.preventDefault(); // Previene el comportamiento por defecto del formulario
    setError(''); // Limpia cualquier error anterior
    setLoading(true); // Indica que la operación de login está en curso

    try {
      // --- Validaciones básicas ---
      if (!email || !password) {
        setError('Por favor, ingresa tu email y contraseña.');
        setLoading(false);
        return;
      }

      // --- CAMBIO CLAVE AQUÍ: Usa la instancia de Axios 'api' ---
      const response = await api.post('/auth/login', { email, password }); // Usa 'api' en lugar de 'fetch'
      
      // Axios automáticamente lanza un error para respuestas 4xx/5xx,
      // así que no necesitamos el if (!response.ok)
      
      const { token, cliente } = response.data; // Axios pone la respuesta en .data

      console.log("Login exitoso. Token y datos del cliente recibidos:", response.data);

      // 1. Almacenar el token en localStorage
      localStorage.setItem('token', token);

      // 2. Almacenar los datos del cliente (opcional, pero útil)
      localStorage.setItem('user', JSON.stringify(cliente)); 

      // Llama a la función login del AuthContext con el token y los datos de usuario REALES
      login(token, cliente); // Pasa el token y cliente directamente

      // Redirige al usuario al dashboard después del login exitoso
      navigate('/dashboard'); 

    } catch (err) {
      // Manejo de errores de Axios (error.response?.data contiene la respuesta del backend)
      console.error("Error durante el login:", err.response?.data?.error || err.message);
      setError(err.response?.data?.error || 'Ocurrió un error al intentar iniciar sesión. Por favor, inténtalo más tarde.');
    } finally {
      setLoading(false); // Siempre resetea el estado de carga
    }
  };

  // --- El resto del código del componente LoginPage, incluyendo googleLogin, no cambia ---

  const handleGoogleLoginRedirect = () => {
    // Para Google Login, la redirección sigue siendo directa al backend
    // y el backend se encargará de redirigir con token y datos si tiene éxito.
    // Asegúrate de que el backend envía el token y cliente en la URL de redirección
    // y que tu AuthContext maneja esos parámetros de la URL al cargar.
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