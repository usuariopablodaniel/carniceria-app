import React, { useState } from 'react'; // Importamos useState para manejar los estados del formulario
import { Container, Form, Button, Card, Row, Col, Alert } from 'react-bootstrap'; // Importamos componentes de react-bootstrap
// Importar Link de react-router-dom si lo usas para la navegación a otras páginas (ej. registro)
import { Link } from 'react-router-dom';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false); // Para mostrar un spinner de carga

  // Función para manejar el login tradicional con email y contraseña
  const handleEmailPasswordLogin = async (e) => {
    e.preventDefault(); // Previene el comportamiento por defecto del formulario (recargar la página)
    setError(null); // Limpiamos errores previos
    setLoading(true); // Indicamos que estamos cargando

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', { // Asegúrate de que esta URL sea la correcta de tu backend
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Suponiendo que el backend devuelve un token o alguna confirmación de éxito
        console.log('Login exitoso:', data);
        // Aquí podrías guardar el token en localStorage o en el contexto de la app
        // localStorage.setItem('token', data.token);
        // Redirigir al usuario al dashboard o a la página de productos
        // window.location.href = '/dashboard'; // O '/products'
        alert('Login exitoso (funcionalidad de redirección y token pendiente)'); // Mensaje temporal
      } else {
        // Manejo de errores del backend (ej. credenciales inválidas)
        setError(data.message || 'Error en el login. Verifica tus credenciales.');
      }
    } catch (err) {
      console.error("Error de red o del servidor al intentar iniciar sesión:", err);
      setError('No se pudo conectar con el servidor. Inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false); // Finalizamos la carga
    }
  };

  // Función para redirigir a la autenticación de Google
  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <Container className="my-5 d-flex justify-content-center"> {/* Centramos el contenido en la página */}
      <Card className="p-4 shadow" style={{ maxWidth: '450px', width: '100%' }}> {/* Tarjeta principal para el formulario */}
        <Card.Body>
          <h2 className="text-center mb-4">Iniciar Sesión</h2>

          {/* Mensaje de error */}
          {error && <Alert variant="danger" className="text-center">{error}</Alert>}

          {/* Formulario de inicio de sesión tradicional */}
          <Form onSubmit={handleEmailPasswordLogin}>
            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label>Correo Electrónico</Form.Label>
              <Form.Control
                type="email"
                placeholder="Ingresa tu correo"
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

            <Button variant="primary" type="submit" className="w-100" disabled={loading}>
              {loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
            </Button>
          </Form>

          <hr className="my-4" /> {/* Separador */}

          <h5 className="text-center mb-3">O inicia sesión con:</h5>
          <Button variant="outline-danger" className="w-100 d-flex align-items-center justify-content-center" onClick={handleGoogleLogin}>
            {/* Ícono de Google si lo tienes, por ejemplo de 'react-icons' */}
            {/* <img src="/path/to/google-icon.png" alt="Google" style={{ width: '20px', marginRight: '10px' }} /> */}
            <i className="bi bi-google me-2"></i> {/* Si usas Bootstrap Icons */}
            Iniciar sesión con Google
          </Button>

          {/* Opcional: Enlace a la página de registro si tienes una */}
          {
          <p className="text-center mt-3">
            ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
          </p>
          }

        </Card.Body>
      </Card>
    </Container>
  );
};

export default LoginPage;