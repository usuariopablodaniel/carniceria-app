// frontend/src/pages/ScanQRPage.js
import React, { useState, useEffect, useRef } from 'react';
// >>>>>>>>>>>>>>> CORRECCIÓN AQUÍ: Añadir Row y Col a la importación de react-bootstrap <<<<<<<<<<<<<<<<
import { Container, Form, Button, Alert, Spinner, Card, Row, Col } from 'react-bootstrap'; 
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Html5QrcodePlugin from '../components/Html5QrcodePlugin'; // Componente para el lector QR
import axios from '../api/axios';

const ScanQRPage = () => {
    const { user, isAuthenticated, loadingAuth } = useAuth();
    const navigate = useNavigate();

    const [scannedUserId, setScannedUserId] = useState(null);
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [scannedUserName, setScannedUserName] = useState(''); // Para mostrar el nombre del usuario escaneado

    // Ref para el input de monto, para enfocarlo automáticamente
    const amountInputRef = useRef(null);

    // Redirección si no es admin (similar a ProductAddPage)
    useEffect(() => {
        if (loadingAuth) return;
        if (!isAuthenticated || (user && user.role !== 'admin')) { // Asumimos solo admin por ahora, puedes añadir 'employee'
            navigate('/dashboard', { replace: true });
        }
    }, [user, isAuthenticated, loadingAuth, navigate]);

    // Función que se llama cuando se escanea un QR
    const onNewScanResult = async (decodedText, decodedResult) => {
        // Limpiar estados anteriores
        setMessage('');
        setError('');
        setScannedUserName(''); 
        setAmount(''); // Limpiar monto anterior
        
        console.log(`QR Code scanned = ${decodedText}`, decodedResult);
        setScannedUserId(decodedText); // El texto decodificado es el ID del usuario

        // Opcional: Obtener el nombre del usuario escaneado para confirmación
        try {
            // >>>>>>>>>>>>>>> NOTA: Esta ruta /auth/user/:id podría no existir en tu backend <<<<<<<<<<<<<<<<
            // Si no existe, este fetch fallará. Si solo necesitas el ID, puedes omitir este try/catch.
            // Si la necesitas, deberías crear una ruta en auth.js o transactionRoutes.js para obtener un usuario por ID.
            const response = await axios.get(`/auth/user/${decodedText}`); 
            if (response.data && response.data.user) {
                setScannedUserName(response.data.user.name || `ID: ${decodedText}`);
            } else {
                setScannedUserName(`ID: ${decodedText}`);
            }
        } catch (fetchUserError) {
            console.error('Error al obtener nombre de usuario escaneado:', fetchUserError);
            setScannedUserName(`ID: ${decodedText} (Error al cargar nombre)`);
            // No seteamos error general aquí para no bloquear el flujo de la compra
        }

        // Enfocar el campo de monto automáticamente
        if (amountInputRef.current) {
            amountInputRef.current.focus();
        }
    };

    const handleRegisterPurchase = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setIsProcessing(true);

        if (!scannedUserId) {
            setError('Por favor, escanea un código QR de usuario primero.');
            setIsProcessing(false);
            return;
        }
        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            setError('Por favor, ingresa un monto de compra válido y positivo.');
            setIsProcessing(false);
            return;
        }

        try {
            const response = await axios.post('/transactions/purchase', {
                userId: scannedUserId,
                amount: parseFloat(amount)
            });

            if (response.status === 200) {
                setMessage(response.data.message + ` Nuevos puntos: ${response.data.newPoints}`);
                setAmount(''); // Limpiar el campo de monto
                setScannedUserId(null); // Limpiar el ID escaneado para una nueva transacción
                setScannedUserName(''); // Limpiar nombre
            } else {
                setError(response.data.error || 'Error desconocido al registrar la compra.');
            }
        } catch (err) {
            console.error('Error al registrar compra:', err);
            if (err.response) {
                setError(err.response.data.error || 'No se pudo registrar la compra.');
            } else {
                setError('Error de conexión o del servidor al registrar la compra.');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    // Esto es para evitar renderizar el formulario si el usuario no es admin o si aún se está cargando la autenticación
    if (loadingAuth || !isAuthenticated || (user && user.role !== 'admin')) { // Puedes añadir 'employee' aquí
        return (
            <Container className="my-5 text-center">
                <h2 className="mb-3">Acceso Denegado</h2>
                <p className="text-muted">No tienes permiso para acceder a esta página.</p>
                {loadingAuth && <Spinner animation="border" className="mt-3" />}
            </Container>
        );
    }

    return (
        <Container className="my-5 p-4 border rounded shadow-sm" style={{ maxWidth: '800px' }}>
            <h1 className="mb-4 text-center text-primary">Gestionar Transacciones QR</h1>
            <p className="text-center text-muted mb-4">Escanea el QR del cliente para registrar compras o canjes de puntos.</p>

            {message && <Alert variant="success" onClose={() => setMessage('')} dismissible>{message}</Alert>}
            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

            <Row className="mb-4">
                <Col md={6}>
                    <Card className="p-3 h-100">
                        <Card.Title className="text-center mb-3">Lector de QR</Card.Title>
                        {/* El componente de lector QR */}
                        <Html5QrcodePlugin 
                            fps={10}
                            qrbox={250}
                            disableFlip={false}
                            qrCodeSuccessCallback={onNewScanResult}
                        />
                        <p className="text-center text-muted mt-3">Apunta la cámara al código QR del cliente.</p>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="p-3 h-100">
                        <Card.Title className="text-center mb-3">Registrar Compra</Card.Title>
                        <Form onSubmit={handleRegisterPurchase}>
                            <Form.Group className="mb-3">
                                <Form.Label>Usuario Escaneado:</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    value={scannedUserName || (scannedUserId ? `ID: ${scannedUserId}` : 'Esperando QR...')} 
                                    readOnly 
                                    disabled={!scannedUserId}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="formAmount">
                                <Form.Label>Monto de la Compra ($ARS)</Form.Label>
                                <Form.Control
                                    type="number"
                                    placeholder="Ej: 15000.50"
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    disabled={!scannedUserId || isProcessing}
                                    ref={amountInputRef} // Asignar la referencia
                                    required
                                />
                            </Form.Group>
                            <Button 
                                variant="success" 
                                type="submit" 
                                className="w-100" 
                                disabled={!scannedUserId || isProcessing}
                            >
                                {isProcessing ? (
                                    <>
                                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                        Procesando...
                                    </>
                                ) : (
                                    'Registrar Compra y Asignar Puntos'
                                )}
                            </Button>
                        </Form>
                    </Card>
                </Col>
            </Row>

            {/* Futura sección para Canjear Puntos */}
            <Row className="mt-4">
                <Col>
                    <Card className="p-3">
                        <Card.Title className="text-center">Funcionalidad de Canje (Próximamente)</Card.Title>
                        <Alert variant="info" className="text-center">
                            Aquí se implementará la lógica para escanear QR de canje y procesar la entrega de premios.
                        </Alert>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default ScanQRPage;