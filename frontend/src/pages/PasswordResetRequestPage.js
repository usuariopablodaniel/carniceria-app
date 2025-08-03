// frontend/src/pages/PasswordResetRequestPage.js
import React, { useState } from 'react';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios'; // Asume que tienes una instancia de Axios

const PasswordResetRequestPage = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handlePasswordResetRequest = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setError('');

        try {
            const response = await api.post('/auth/forgot-password', { email });
            setMessage(response.data.message);
            setError('');
        } catch (err) {
            console.error('Error al solicitar restablecimiento de contraseña:', err);
            const errorMessage = err.response?.data?.message || 'Ocurrió un error inesperado.';
            setError(errorMessage);
            setMessage('');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container className="my-5 d-flex justify-content-center">
            <Card className="shadow-lg p-4" style={{ maxWidth: '500px', width: '100%' }}>
                <Card.Body>
                    <h2 className="text-center mb-4">Restablecer Contraseña</h2>
                    <p className="text-center text-muted">Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.</p>

                    {message && <Alert variant="success">{message}</Alert>}
                    {error && <Alert variant="danger">{error}</Alert>}

                    <Form onSubmit={handlePasswordResetRequest}>
                        <Form.Group className="mb-3" controlId="formEmail">
                            <Form.Label>Correo Electrónico</Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="Ingresa tu correo electrónico"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </Form.Group>

                        <Button 
                            variant="primary" 
                            type="submit" 
                            className="w-100 mt-3"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Enviando...' : 'Enviar Enlace'}
                        </Button>
                        <Button 
                            variant="link" 
                            className="w-100 mt-2 text-decoration-none" 
                            onClick={() => navigate('/login')}
                        >
                            Volver al inicio de sesión
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default PasswordResetRequestPage;