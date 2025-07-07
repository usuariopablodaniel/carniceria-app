// frontend/src/pages/ScanQRPage.js
import React, { useState, useEffect, useRef } from 'react';
import { Container, Form, Button, Alert, Spinner, Card, Row, Col } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Html5QrcodePlugin from '../components/Html5QrcodePlugin';
import axios from '../api/axios';

const ScanQRPage = () => {
    const { user, isAuthenticated, loadingAuth } = useAuth();
    const navigate = useNavigate();

    const [scannedUserId, setScannedUserId] = useState(null);
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isProcessingPurchase, setIsProcessingPurchase] = useState(false);
    const [isProcessingRedemption, setIsProcessingRedemption] = useState(false);
    const [scannedUserName, setScannedUserName] = useState('');

    const [scannerActive, setScannerActive] = useState(true); 

    const [redemptionProducts, setRedemptionProducts] = useState([]);
    const [selectedRedemptionProduct, setSelectedRedemptionProduct] = useState('');
    const [selectedRedemptionPoints, setSelectedRedemptionPoints] = useState(0);
    const [loadingRedemptionProducts, setLoadingRedemptionProducts] = useState(true);
    const [redemptionError, setRedemptionError] = useState('');

    const amountInputRef = useRef(null);

    // Redirección si no es admin (o empleado si lo añades)
    useEffect(() => {
        if (loadingAuth) return;
        if (!isAuthenticated || (user && user.role !== 'admin' && user.role !== 'employee')) {
            console.log("ScanQRPage: Redirigiendo - Usuario no autorizado o no autenticado.");
            navigate('/dashboard', { replace: true });
        } else {
            console.log("ScanQRPage: Usuario autorizado. Rol:", user.role);
        }
    }, [user, isAuthenticated, loadingAuth, navigate]);

    // useEffect para cargar productos de canje
    useEffect(() => {
        const fetchRedemptionProducts = async () => {
            setLoadingRedemptionProducts(true);
            setRedemptionError('');
            try {
                console.log("ScanQRPage: Cargando productos de canje...");
                const response = await axios.get('/products');
                const redeemable = response.data.filter(p => p.puntos_canje !== null && p.puntos_canje > 0);
                setRedemptionProducts(redeemable);
                console.log("ScanQRPage: Productos de canje cargados:", redeemable);
            } catch (err) {
                console.error('ScanQRPage: Error al cargar productos de canje:', err);
                setRedemptionError('No se pudieron cargar los productos de canje.');
            } finally {
                setLoadingRedemptionProducts(false);
            }
        };

        fetchRedemptionProducts();
    }, []);

    // Función que se llama cuando se escanea un QR
    const onNewScanResult = async (decodedText, decodedResult) => {
        console.log(`ScanQRPage: QR Code scanned = ${decodedText}`);
        // Pausar el escáner temporalmente
        setScannerActive(false); 
        console.log("ScanQRPage: Escáner pausado.");

        setMessage('');
        setError('');
        setRedemptionError('');
        setScannedUserName('');
        setAmount('');
        setSelectedRedemptionProduct('');
        setSelectedRedemptionPoints(0);

        setScannedUserId(decodedText);

        // Intentar obtener el nombre del usuario escaneado
        try {
            console.log(`ScanQRPage: Intentando obtener nombre para userId: ${decodedText}`);
            const response = await axios.get(`/auth/user/${decodedText}`); 
            console.log("ScanQRPage: Respuesta de /auth/user/:id:", response.data);
            if (response.data && response.data.user) {
                // Asegúrate de que 'nombre' sea la propiedad correcta en tu backend
                setScannedUserName(response.data.user.nombre || response.data.user.name || `ID: ${decodedText}`);
                console.log("ScanQRPage: Nombre de usuario escaneado:", response.data.user.nombre || response.data.user.name);
            } else {
                setScannedUserName(`ID: ${decodedText}`);
                console.log("ScanQRPage: No se encontró nombre en la respuesta, mostrando solo ID.");
            }
        } catch (fetchUserError) {
            console.error('ScanQRPage: Error al obtener nombre de usuario escaneado:', fetchUserError.response ? fetchUserError.response.data : fetchUserError.message);
            setScannedUserName(`ID: ${decodedText} (Error al cargar nombre)`);
        }

        if (amountInputRef.current) {
            amountInputRef.current.focus();
        }
    };

    const handleRegisterPurchase = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setIsProcessingPurchase(true);
        console.log("ScanQRPage: Iniciando registro de compra.");

        if (!scannedUserId) {
            setError('Por favor, escanea un código QR de usuario primero.');
            setIsProcessingPurchase(false);
            return;
        }
        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            setError('Por favor, ingresa un monto de compra válido y positivo.');
            setIsProcessingPurchase(false);
            return;
        }

        try {
            console.log(`ScanQRPage: Enviando compra para userId: ${scannedUserId}, monto: ${parseFloat(amount)}`);
            const response = await axios.post('/transactions/purchase', {
                userId: scannedUserId,
                amount: parseFloat(amount)
            });

            if (response.status === 200) {
                setMessage(response.data.message + ` Nuevos puntos: ${response.data.newPoints}`);
                setAmount('');
                setScannedUserId(null); // Limpiar el ID escaneado para una nueva transacción
                setScannedUserName('');
                console.log("ScanQRPage: Compra registrada con éxito. Reactivando escáner.");
            } else {
                setError(response.data.error || 'Error desconocido al registrar la compra.');
                console.error("ScanQRPage: Error al registrar compra (respuesta no 200):", response.data);
            }
        } catch (err) {
            console.error('ScanQRPage: Error en la solicitud de registro de compra:', err.response ? err.response.data : err.message);
            if (err.response) {
                setError(err.response.data.error || 'No se pudo registrar la compra.');
            } else {
                setError('Error de conexión o del servidor al registrar la compra.');
            }
        } finally {
            setIsProcessingPurchase(false);
            setScannerActive(true); // Siempre reactivar el escáner al finalizar el proceso
            console.log("ScanQRPage: Proceso de compra finalizado. Escáner reactivado.");
        }
    };

    const handleRegisterRedemption = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setRedemptionError('');
        setIsProcessingRedemption(true);
        console.log("ScanQRPage: Iniciando registro de canje.");

        if (!scannedUserId) {
            setRedemptionError('Por favor, escanea un código QR de usuario primero.');
            setIsProcessingRedemption(false);
            return;
        }
        if (!selectedRedemptionProduct || selectedRedemptionPoints <= 0) {
            setRedemptionError('Por favor, selecciona un producto de canje válido.');
            setIsProcessingRedemption(false);
            return;
        }

        try {
            console.log(`ScanQRPage: Enviando canje para userId: ${scannedUserId}, puntos: ${selectedRedemptionPoints}, productId: ${selectedRedemptionProduct}`);
            const response = await axios.post('/transactions/redeem', {
                userId: scannedUserId,
                pointsToRedeem: selectedRedemptionPoints,
                productId: selectedRedemptionProduct
            });

            if (response.status === 200) {
                setMessage(response.data.message + ` Puntos restantes: ${response.data.newPoints}`);
                setSelectedRedemptionProduct('');
                setSelectedRedemptionPoints(0);
                setScannedUserId(null); // Limpiar ID escaneado
                setScannedUserName('');
                console.log("ScanQRPage: Canje registrado con éxito. Reactivando escáner.");
            } else {
                setRedemptionError(response.data.error || 'Error desconocido al registrar el canje.');
                console.error("ScanQRPage: Error al registrar canje (respuesta no 200):", response.data);
            }
        } catch (err) {
            console.error('ScanQRPage: Error en la solicitud de registro de canje:', err.response ? err.response.data : err.message);
            if (err.response) {
                setRedemptionError(err.response.data.error || 'No se pudo registrar el canje.');
            } else {
                setRedemptionError('Error de conexión o del servidor al registrar el canje.');
            }
        } finally {
            setIsProcessingRedemption(false);
            setScannerActive(true); // Siempre reactivar el escáner al finalizar el proceso
            console.log("ScanQRPage: Proceso de canje finalizado. Escáner reactivado.");
        }
    };

    const handleProductSelectChange = (e) => {
        const productId = e.target.value;
        setSelectedRedemptionProduct(productId);
        if (productId) {
            const product = redemptionProducts.find(p => p.id.toString() === productId);
            setSelectedRedemptionPoints(product ? product.puntos_canje : 0);
        } else {
            setSelectedRedemptionPoints(0);
        }
    };

    if (loadingAuth || !isAuthenticated || (user && user.role !== 'admin' && user.role !== 'employee')) {
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
            {redemptionError && <Alert variant="danger" onClose={() => setRedemptionError('')} dismissible>{redemptionError}</Alert>}

            <Row className="mb-4">
                <Col md={6}>
                    <Card className="p-3 h-100">
                        <Card.Title className="text-center mb-3">Lector de QR</Card.Title>
                        {scannerActive ? (
                            <Html5QrcodePlugin 
                                fps={10}
                                qrbox={250}
                                disableFlip={false}
                                qrCodeSuccessCallback={onNewScanResult}
                            />
                        ) : (
                            <div className="text-center py-5">
                                <Spinner animation="border" className="mb-3" />
                                <p>QR escaneado. Procesando transacción...</p>
                                <Button variant="outline-primary" onClick={() => setScannerActive(true)}>
                                    Activar Escáner para Nueva Transacción
                                </Button>
                            </div>
                        )}
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
                                    disabled={!scannedUserId || isProcessingPurchase}
                                    ref={amountInputRef}
                                    required
                                />
                            </Form.Group>
                            <Button 
                                variant="success" 
                                type="submit" 
                                className="w-100" 
                                disabled={!scannedUserId || isProcessingPurchase}
                            >
                                {isProcessingPurchase ? (
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

            <Row className="mt-4">
                <Col>
                    <Card className="p-3">
                        <Card.Title className="text-center mb-3">Canjear Puntos</Card.Title>
                        <Form onSubmit={handleRegisterRedemption}>
                            <Form.Group className="mb-3">
                                <Form.Label>Usuario Escaneado:</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    value={scannedUserName || (scannedUserId ? `ID: ${scannedUserId}` : 'Esperando QR...')} 
                                    readOnly 
                                    disabled={!scannedUserId}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="formRedeemProduct">
                                <Form.Label>Producto a Canjear</Form.Label>
                                {loadingRedemptionProducts ? (
                                    <div className="d-flex align-items-center">
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        <span>Cargando productos...</span>
                                    </div>
                                ) : redemptionError ? (
                                    <Alert variant="danger" className="py-2">{redemptionError}</Alert>
                                ) : (
                                    <Form.Select 
                                        value={selectedRedemptionProduct} 
                                        onChange={handleProductSelectChange}
                                        disabled={!scannedUserId || isProcessingRedemption || redemptionProducts.length === 0}
                                        required
                                    >
                                        <option value="">Selecciona un producto</option>
                                        {redemptionProducts.map(product => (
                                            <option key={product.id} value={product.id}>
                                                {product.nombre} ({product.puntos_canje} puntos)
                                            </option>
                                        ))}
                                    </Form.Select>
                                )}
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Puntos Necesarios:</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    value={selectedRedemptionPoints > 0 ? selectedRedemptionPoints : 'Selecciona un producto'} 
                                    readOnly 
                                    disabled={true}
                                />
                            </Form.Group>

                            <Button 
                                variant="warning" 
                                type="submit" 
                                className="w-100" 
                                disabled={!scannedUserId || !selectedRedemptionProduct || isProcessingRedemption}
                            >
                                {isProcessingRedemption ? (
                                    <>
                                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                        Procesando Canje...
                                    </>
                                ) : (
                                    'Canjear Puntos'
                                )}
                            </Button>
                        </Form>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default ScanQRPage;