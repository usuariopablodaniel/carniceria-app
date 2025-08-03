// frontend/src/pages/ResetPasswordPage.js
import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const ResetPasswordPage = () => {
    // Extraemos el token de la URL
    const { token } = useParams(); 
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Verificamos que el token exista en la URL al cargar el componente
    useEffect(() => {
        if (!token) {
            setError('Token de restablecimiento no encontrado. Redirigiendo a la página de solicitud...');
            setTimeout(() => navigate('/password-reset-request'), 3000);
        }
    }, [token, navigate]);

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setError('');

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            setIsLoading(false);
            return;
        }

        try {
            // Llama al endpoint de tu backend para procesar el restablecimiento de contraseña
            // Corrección: el token se envía en el cuerpo de la petición, no en la URL.
            const response = await api.post('/auth/reset-password', {
                token: token,
                newPassword: password // El backend espera 'newPassword', no 'password'
            }); 
            setMessage(response.data.message);
            setError('');
            // Opcional: Redirigir al usuario al login después de un tiempo
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            console.error('Error al restablecer la contraseña:', err);
            setError(err.response?.data?.error || 'Ocurrió un error inesperado. El enlace puede haber expirado.');
            setMessage('');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container className="my-5 d-flex justify-content-center">
            <Card className="shadow-lg p-4" style={{ maxWidth: '500px', width: '100%' }}>
                <Card.Body>
                    <h2 className="text-center mb-4">Establecer Nueva Contraseña</h2>

                    {message && <Alert variant="success">{message}</Alert>}
                    {error && <Alert variant="danger">{error}</Alert>}

                    <Form onSubmit={handlePasswordReset}>
                        <Form.Group className="mb-3" controlId="formNewPassword">
                            <Form.Label>Nueva Contraseña</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Ingresa tu nueva contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formConfirmPassword">
                            <Form.Label>Confirmar Contraseña</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Confirma tu nueva contraseña"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Button 
                            variant="primary" 
                            type="submit" 
                            className="w-100 mt-3"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ResetPasswordPage;