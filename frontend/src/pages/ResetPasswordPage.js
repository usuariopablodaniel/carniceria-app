// frontend/src/pages/ResetPasswordPage.js
import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
// Usaremos useLocation en lugar de useParams
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const ResetPasswordPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [token, setToken] = useState(null); // Nuevo estado para el token

    // Leemos el token de los parámetros de consulta de la URL
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const tokenFromUrl = queryParams.get('token');
        setToken(tokenFromUrl);

        if (!tokenFromUrl) {
            setError('Token de restablecimiento no encontrado. Redirigiendo a la página de solicitud...');
            setTimeout(() => navigate('/password-reset-request'), 3000);
        }
    }, [location.search, navigate]);

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
        
        // Verificamos que el token exista antes de continuar
        if (!token) {
            setError('Token inválido o expirado. Por favor, solicita un nuevo enlace.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await api.post('/auth/reset-password', {
                token: token,
                newPassword: password
            });
            setMessage(response.data.message);
            setError('');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            console.error('Error al restablecer la contraseña:', err);
            setError(err.response?.data?.error || 'Ocurrió un error inesperado. El enlace puede haber expirado.');
            setMessage('');
        } finally {
            setIsLoading(false);
        }
    };
    
    // Si no hay token, mostramos el mensaje de error o cargando
    if (!token) {
        return (
            <Container className="my-5 d-flex justify-content-center">
                <Card className="shadow-lg p-4" style={{ maxWidth: '500px', width: '100%' }}>
                    <Card.Body>
                        <h2 className="text-center mb-4">Establecer Nueva Contraseña</h2>
                        {error && <Alert variant="danger">{error}</Alert>}
                    </Card.Body>
                </Card>
            </Container>
        );
    }

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