import React, { useState } from 'react';
import { Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';


const LoginPage = () => {
  const { login } = useAuth();

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
      // --- Validaciones básicas (puedes añadir más) ---
      if (!email || !password) {
        setError('Por favor, ingresa tu email y contraseña.');
        setLoading(false);
        return;
      }

      // --- CAMBIO CLAVE AQUÍ: Llamada REAL a tu API de autenticación ---
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        // Si la respuesta no es 2xx OK, hay un error
        const errorData = await response.json(); // Tu backend debería enviar un JSON con el error
        throw new Error(errorData.error || 'Credenciales incorrectas o error de servidor.');
      }

      // Si la respuesta es exitosa, parsea el JSON
      const data = await response.json();
      console.log("Respuesta del backend (Login tradicional):", data);

      // Llama a la función login del AuthContext con el token y los datos de usuario REALES
      login(data.token, data.cliente); // Asegúrate de que tu backend envía 'token' y 'cliente'

    } catch (err) {
      // Manejo de errores de la API o de la red
      console.error("Error durante el login:", err.message);
      setError(err.message || 'Ocurrió un error al intentar iniciar sesión. Por favor, inténtalo más tarde.');
    } finally {
      setLoading(false); // Siempre resetea el estado de carga
    }
  };

  // --- El resto del código del componente LoginPage, incluyendo googleLogin, no cambia ---
  // ... (Tu código para googleLogin y el return JSX) ...

  const handleGoogleLoginRedirect = () => {
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