import React, { useState } from 'react';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom'; 
import api from '../api/axios'; // Importar la instancia de Axios configurada

const RegisterPage = () => {
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [telefono, setTelefono] = useState(''); 
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

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

        if (!nombre) {
            setError('Por favor, ingresa tu nombre.');
            setLoading(false);
            return;
        }

        try {
            // >>> CAMBIO CLAVE AQUÍ: Usar la instancia 'api' de Axios <<<
            // Axios ya manejará la baseURL 'http://localhost:5000/api'
            const response = await api.post('/auth/register', { // Solo necesitamos la ruta relativa '/auth/register'
                nombre, 
                email, 
                password, 
                telefono 
            });

            // Axios automáticamente parsea la respuesta JSON, no necesitas await response.json()
            const data = response.data; 

            if (response.status === 201) { // 201 Created es el status que devuelve tu backend para registro exitoso
                setSuccess(data.message || 'Registro exitoso. ¡Ahora puedes iniciar sesión!');
                
                setNombre(''); 
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setTelefono('');

                setTimeout(() => {
                    navigate('/login');
                }, 2000); 
            } else {
                // Esto es más bien un fallback, ya que Axios lanzaría un error para status no 2xx
                setError(data.error || data.message || 'Error en el registro. Inténtalo de nuevo.');
            }
        } catch (err) {
            console.error("Error de red o del servidor al intentar registrarse:", err);
            if (err.response) {
                // Capturar el error específico del backend si existe
                setError(err.response.data.error || 'Error en el registro. Inténtalo de nuevo.');
            } else if (err.request) {
                setError('No se pudo conectar con el servidor. Verifica tu conexión.');
            } else {
                setError('Ocurrió un error inesperado al procesar la solicitud.');
            }
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

                        <Form.Group className="mb-3" controlId="formRegisterTelefono">
                            <Form.Label>Teléfono (Opcional)</Form.Label>
                            <Form.Control
                                type="tel"
                                placeholder="Ingresa tu número de teléfono"
                                value={telefono}
                                onChange={(e) => setTelefono(e.target.value)}
                                maxLength={15} // Limita la longitud del teléfono
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