// frontend/src/pages/ScanQRPage.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
// ¡CORRECCIÓN AQUÍ! Se añadió 'ListGroup'
import { Container, Form, Button, Alert, Spinner, Card, Row, Col, Modal, ListGroup } from 'react-bootstrap';
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

    // Estado para el modal de confirmación de compra
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    // Estado para guardar los puntos calculados para el modal
    const [pointsToAward, setPointsToAward] = useState(0);

    const amountInputRef = useRef(null);

    useEffect(() => {
        if (loadingAuth) return;
        if (!isAuthenticated || (user && user.role !== 'admin' && user.role !== 'employee')) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, isAuthenticated, loadingAuth, navigate]);

    useEffect(() => {
        const fetchRedemptionProducts = async () => {
            setLoadingRedemptionProducts(true);
            setRedemptionError('');
            try {
                const response = await axios.get('/products');
                const redeemable = response.data.filter(p => p.puntos_canje !== null && p.puntos_canje > 0);
                setRedemptionProducts(redeemable);
            } catch (err) {
                console.error('ScanQRPage: Error al cargar productos de canje:', err);
                setRedemptionError('No se pudieron cargar los productos de canje.');
            } finally {
                setLoadingRedemptionProducts(false);
            }
        };

        fetchRedemptionProducts();
    }, []);

    const onNewScanResult = useCallback(async (decodedText, decodedResult) => {
        setScannerActive(false); 
        setMessage('');
        setError('');
        setRedemptionError('');
        setScannedUserName('');
        setAmount('');
        
        let userId = null;
        let redemptionProductId = null;

        try {
            // Intenta analizar el QR como JSON
            const data = JSON.parse(decodedText);
            if (data.userId && data.productId) {
                userId = data.userId;
                redemptionProductId = data.productId;
                setSelectedRedemptionProduct(redemptionProductId); // Establece el producto de canje automáticamente
            } else {
                // Si no tiene el formato esperado, asume que es un simple ID
                userId = decodedText;
                setSelectedRedemptionProduct('');
            }
        } catch (e) {
            // Si el análisis falla, asume que es un simple ID
            userId = decodedText;
            setSelectedRedemptionProduct('');
        }

        setScannedUserId(userId);

        try {
            const response = await axios.get(`/auth/user/${userId}`); 
            if (response.data && response.data.user) {
                setScannedUserName(response.data.user.nombre || response.data.user.name || `ID: ${userId}`);
            } else {
                setScannedUserName(`ID: ${userId}`);
            }
        } catch (fetchUserError) {
            console.error('ScanQRPage: Error al obtener nombre de usuario escaneado:', fetchUserError.response ? fetchUserError.response.data : fetchUserError.message);
            setScannedUserName(`ID: ${userId} (Error al cargar nombre)`);
        }
        
        // La lógica para establecer los puntos del producto seleccionado (si existe)
        if (redemptionProductId) {
            const product = redemptionProducts.find(p => p.id.toString() === redemptionProductId.toString());
            setSelectedRedemptionPoints(product ? product.puntos_canje : 0);
        } else {
            setSelectedRedemptionPoints(0);
        }

        if (amountInputRef.current) {
            amountInputRef.current.focus();
        }
    }, [setScannerActive, setScannedUserId, setScannedUserName, setMessage, setError, setRedemptionError, setAmount, setSelectedRedemptionProduct, setSelectedRedemptionPoints, amountInputRef, redemptionProducts]);

    // Modificamos handleRegisterPurchase. Ahora solo valida y abre el modal.
    const handleRegisterPurchase = (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (!scannedUserId) {
            setError('Por favor, escanea un código QR de usuario primero.');
            return;
        }
        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            setError('Por favor, ingresa un monto de compra válido y positivo.');
            return;
        }

        // Calcula los puntos. (Ajusta esta lógica si es diferente)
        // Ejemplo: 1 punto cada $10000
        const calculatedPoints = Math.floor(parseFloat(amount) / 10000);
        setPointsToAward(calculatedPoints);

        // Abre el modal de confirmación
        setShowPurchaseModal(true);
    };

    // Esta función se llama DESDE el modal y es la que realmente envía la solicitud.
    const confirmActualPurchase = async () => {
        setIsProcessingPurchase(true);
        setError(''); // Limpia el error del formulario principal

        try {
            const response = await axios.post('/transactions/purchase', {
                userId: scannedUserId,
                amount: parseFloat(amount)
            });
            if (response.status === 200) {
                setMessage(response.data.message + ` Nuevos puntos: ${response.data.newPoints}`);
                setAmount('');
                setScannedUserId(null); 
                setScannedUserName('');
            } else {
                setError(response.data.error || 'Error desconocido al registrar la compra.');
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
            setShowPurchaseModal(false); // Cierra el modal
            setTimeout(() => {
                setScannerActive(true); // Reactiva el escáner
            }, 500);
        }
    };

    // Función para cerrar el modal de compra
    const cancelPurchase = () => {
        setShowPurchaseModal(false);
    };

    const handleRegisterRedemption = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setRedemptionError('');
        setIsProcessingRedemption(true);

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
            const response = await axios.post('/transactions/redeem', {
                userId: scannedUserId,
                pointsToRedeem: selectedRedemptionPoints,
                productId: selectedRedemptionProduct
            });
            if (response.status === 200) {
                setMessage(response.data.message + ` Puntos restantes: ${response.data.newPoints}`);
                setSelectedRedemptionProduct('');
                setSelectedRedemptionPoints(0);
                setScannedUserId(null); 
                setScannedUserName('');
            } else {
                setRedemptionError(response.data.error || 'Error desconocido al registrar el canje.');
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
            setTimeout(() => {
                setScannerActive(true); 
            }, 500);
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

    const activateScanner = () => {
        setScannerActive(true);
        setScannedUserId(null); 
        setScannedUserName('');
        setAmount('');
        setSelectedRedemptionProduct('');
        setSelectedRedemptionPoints(0);
        setMessage('');
        setError('');
        setRedemptionError('');
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
                                verbose={false}
                            />
                        ) : (
                            <div className="text-center py-5">
                                <Spinner as="span" animation="border" className="mb-3" />
                                <p>QR escaneado. Procesando transacción...</p>
                                <Button variant="outline-primary" onClick={activateScanner} className="mt-3">
                                    Activar Escáner para Nueva Transacción
                                </Button>
                            </div>
                        )}
                        {scannerActive && (
                            <p className="text-center text-muted mt-3">Apunta la cámara al código QR del cliente.</p>
                        )}
                        {!scannerActive && (
                            <p className="text-center text-muted mt-3">El escáner está pausado. Haz clic en el botón para activarlo.</p>
                        )}
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
                                disabled={!scannedUserId || isProcessingPurchase || !amount} // Deshabilitado si no hay monto
                            >
                                {/* Texto cambiado para reflejar que abre el modal */}
                                Registrar Compra y Asignar Puntos
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

            {/* ---------- MODAL DE CONFIRMACIÓN DE COMPRA (CORREGIDO) ---------- */}
            <Modal show={showPurchaseModal} onHide={cancelPurchase} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirmar Transacción de Compra</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Por favor, confirma los siguientes datos antes de procesar la compra:</p>
                    {/* AHORA 'ListGroup' ESTÁ IMPORTADO Y DEBERÍA FUNCIONAR */}
                    <ListGroup variant="flush">
                        <ListGroup.Item>
                            <strong>Cliente:</strong> {scannedUserName}
                        </ListGroup.Item>
                        <ListGroup.Item>
                            <strong>Monto de la Compra:</strong> ${parseFloat(amount).toFixed(2)} ARS
                        </ListGroup.Item>
                        <ListGroup.Item>
                            <strong>Puntos a Otorgar (Aprox):</strong> {pointsToAward}
                        </ListGroup.Item>
                    </ListGroup>
                    <Alert variant="warning" className="mt-3">
                        ¿Son correctos estos datos? Esta acción no se puede deshacer fácilmente.
                    </Alert>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={cancelPurchase} disabled={isProcessingPurchase}>
                        Cancelar
                    </Button>
                    <Button variant="success" onClick={confirmActualPurchase} disabled={isProcessingPurchase}>
                        {isProcessingPurchase ? (
                            <>
                                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                Confirmando...
                            </>
                        ) : (
                            'Confirmar y Registrar Compra'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
            {/* ---------- FIN DEL MODAL ---------- */}

        </Container>
    );
};

export default ScanQRPage;