import React, { useState } from 'react'; // Necesitamos useState para el estado del formulario
import { Form, Button, Container, Row, Col, Alert } from 'react-bootstrap'; // Importa componentes de Bootstrap
import { useAuth } from '../context/AuthContext'; // Importa el hook useAuth

const LoginPage = () => {
  // Usamos el hook useAuth para acceder a la función login
  const { login } = useAuth();

  // Estados para los campos del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Estado para manejar mensajes de error (opcional)
  const [error, setError] = useState('');
  // Estado para simular la carga (opcional)
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    console.log('handleSubmit se está ejecutando.');
    e.preventDefault(); // Previene el comportamiento por defecto del formulario (recargar la página)
    setError(''); // Limpia cualquier error anterior
    setLoading(true); // Indica que la operación de login está en curso

    try {
      // --- Validaciones básicas (puedes añadir más) ---
      if (!email || !password) {
        setError('Por favor, ingresa tu email y contraseña.');
        setLoading(false);
        return;
      }

      // --- Simulación de llamada a una API de autenticación ---
      // En una aplicación real, aquí harías una llamada HTTP a tu backend
      // Por ejemplo: const response = await api.post('/auth/login', { email, password });
      // const token = response.data.token;
      // const userData = response.data.user;

      // Por ahora, simulamos un delay y un token fijo
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simula un delay de 1 segundo

      // Si las credenciales son "correctas" para nuestra simulación
      if (email === 'test@example.com' && password === 'password123') {
        const simulatedToken = 'simulated-jwt-token-for-test-user';
        const simulatedUserData = { email: 'test@example.com', name: 'Usuario de Prueba' };
        login(simulatedToken, simulatedUserData); // Llama a la función login del AuthContext
        // El AuthContext ya se encargará de redirigir a /dashboard
      } else {
        setError('Credenciales incorrectas. Inténtalo de nuevo con test@example.com / password123');
      }

    } catch (err) {
      // Manejo de errores en caso de que la llamada a la API falle
      console.error("Error durante el login simulado:", err);
      setError('Ocurrió un error al intentar iniciar sesión. Por favor, inténtalo más tarde.');
    } finally {
      setLoading(false); // Siempre resetea el estado de carga
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-md-center">
        <Col md={6}>
          <h1 className="text-center mb-4">Iniciar Sesión</h1>
          {error && <Alert variant="danger">{error}</Alert>} {/* Muestra el mensaje de error */}
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
              disabled={loading} // Deshabilita el botón mientras se está cargando
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </Form>

          {/* Botón de Google (lo conectaremos en el siguiente paso) */}
          <div className="text-center mt-3">
            <p>- O -</p>
            {/* Por ahora, esto es solo un botón sin funcionalidad */}
            <Button variant="outline-danger" className="w-100">
              Iniciar Sesión con Google
            </Button>
          </div>

        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;