import React, { useState } from 'react';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom'; // Importamos Link y useNavigate

const RegisterPage = () => {
  const [nombre, setNombre] = useState(''); // <--- NUEVO ESTADO PARA EL NOMBRE
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Inicializar useNavigate para redirigir

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      setLoading(false);
      return;
    }

    // Validación extra para 'nombre'
    if (!nombre) {
      setError('Por favor, ingresa tu nombre.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // --- CAMBIO AQUÍ: ENVIAR 'nombre' Y 'telefono' (si lo añades al form) ---
        body: JSON.stringify({ nombre, email, password /* , telefono: '' */ }), // Asegúrate de que el 'telefono' se envíe o quítalo del backend si no lo necesitas
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || 'Registro exitoso. ¡Ahora puedes iniciar sesión!');
        setNombre(''); // Limpiar formulario
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        // setTelefono(''); // Si añades el campo telefono

        // Opcional: Redirigir automáticamente al login después de un registro exitoso
        setTimeout(() => {
           navigate('/login'); // Usa navigate para redirigir
        }, 2000); // Espera 2 segundos antes de redirigir
      } else {
        setError(data.error || data.message || 'Error en el registro. Inténtalo de nuevo.'); // Tu backend envía 'error', no 'message' en caso de fallo
      }
    } catch (err) {
      console.error("Error de red o del servidor al intentar registrarse:", err);
      setError('No se pudo conectar con el servidor para registrarse.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="my-5 d-flex justify-content-center">
      <Card className="p-4 shadow" style={{ maxWidth: '450px', width: '100%' }}>
        <Card.Body>
          <h2 className="text-center mb-4">Registrarse</h2>

          {error && <Alert variant="danger" className="text-center">{error}</Alert>}
          {success && <Alert variant="success" className="text-center">{success}</Alert>}

          <Form onSubmit={handleRegister}>
            {/* --- NUEVO CAMPO: NOMBRE --- */}
            <Form.Group className="mb-3" controlId="formRegisterNombre">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ingresa tu nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </Form.Group>
            {/* --------------------------- */}

            <Form.Group className="mb-3" controlId="formRegisterEmail">
              <Form.Label>Correo Electrónico</Form.Label>
              <Form.Control
                type="email"
                placeholder="Ingresa tu correo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formRegisterPassword">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control
                type="password"
                placeholder="Crea una contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-4" controlId="formConfirmPassword">
              <Form.Label>Confirmar Contraseña</Form.Label>
              <Form.Control
                type="password"
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </Form.Group>

            {/* Si quieres añadir 'Teléfono' también, el código sería similar: */}
            {/*
            <Form.Group className="mb-3" controlId="formRegisterTelefono">
              <Form.Label>Teléfono (opcional)</Form.Label>
              <Form.Control
                type="tel"
                placeholder="Ingresa tu teléfono"
                value={telefono} // Necesitas un useState para telefono
                onChange={(e) => setTelefono(e.target.value)} // Necesitas un setTelefono
              />
            </Form.Group>
            */}

            <Button variant="success" type="submit" className="w-100" disabled={loading}>
              {loading ? 'Registrando...' : 'Crear Cuenta'}
            </Button>
          </Form>

          <p className="text-center mt-3">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>
          </p>

        </Card.Body>
      </Card>
    </Container>
  );
};

export default RegisterPage;