import React, { useEffect, useState, useCallback } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Button } from 'react-bootstrap';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const RedemptionProductsPage = () => {
    const { user, isAuthenticated, loadingAuth } = useAuth();
    const navigate = useNavigate();
    const [redemptionProducts, setRedemptionProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userPoints, setUserPoints] = useState(null);

    const fetchUserPoints = useCallback(async () => {
        if (!isAuthenticated || !user || !user.id) {
            setUserPoints(0);
            return;
        }
        try {
            const response = await axios.get(`/transactions/${user.id}/points`);
            setUserPoints(response.data.points);
        } catch (err) {
            console.error('Error al obtener los puntos del usuario:', err);
            setUserPoints(null);
        }
    }, [isAuthenticated, user]); // Dependencias para useCallback

    const fetchRedemptionProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('/products');
            const redeemable = response.data.filter(p => p.puntos_canje !== null && p.puntos_canje > 0);
            setRedemptionProducts(redeemable);
        } catch (err) {
            console.error('Error al cargar productos de canje:', err);
            setError('No se pudieron cargar los productos disponibles para canje.');
        } finally {
            setLoading(false);
        }
    }, []); // Dependencias para useCallback

    useEffect(() => {
        if (!loadingAuth) {
            fetchUserPoints();
        }
    }, [isAuthenticated, user, loadingAuth, fetchUserPoints]);

    useEffect(() => {
        fetchRedemptionProducts();
    }, [fetchRedemptionProducts]);

    const handleAddProductClick = () => {
        navigate('/products/add'); // Asumiendo que la ruta para añadir es la misma
    };

    const handleEditProductClick = (productId) => {
        navigate(`/products/edit/${productId}`); // Asumiendo la misma ruta para editar
    };

    const handleDeleteProduct = async (productId) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este producto de canje?')) {
            try {
                await axios.delete(`/products/${productId}`);
                console.log(`Producto de canje con ID ${productId} eliminado.`);
                fetchRedemptionProducts(); // Recargar la lista después de eliminar
            } catch (err) {
                console.error("Error al eliminar el producto de canje:", err);
                setError("No se pudo eliminar el producto de canje. Intenta de nuevo.");
            }
        }
    };

    const handleRedeemClick = (productName) => {
        if (isAuthenticated) {
            navigate('/dashboard', {
                state: {
                    message: `¡Excelente! Muestra tu código QR al vendedor para canjear "${productName}".`,
                    variant: 'success'
                }
            });
        } else {
            navigate('/login', {
                state: {
                    message: 'Inicia sesión para canjear puntos.',
                    variant: 'warning'
                }
            });
        }
    };

    if (loading) {
        return (
            <Container className="my-5 text-center">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Cargando productos...</span>
                </Spinner>
                <p className="mt-3">Cargando productos disponibles para canje...</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="my-5 text-center">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container className="my-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="text-primary">Canje por Puntos</h1>
                {user && user.role === 'admin' && (
                    <Button variant="success" onClick={handleAddProductClick}>
                        + Añadir Producto de Canje
                    </Button>
                )}
            </div>
            <p className="text-center text-muted mb-4">
                ¡Aquí puedes ver los productos que puedes canjear con tus puntos!
            </p>

            {isAuthenticated && userPoints !== null && (
                <Alert variant="info" className="text-center mb-4">
                    Tus puntos actuales: <strong className="fs-5">{userPoints}</strong>
                </Alert>
            )}
            {!isAuthenticated && (
                <Alert variant="warning" className="text-center mb-4">
                    <p className="mb-0">Inicia sesión para ver tus puntos y saber qué puedes canjear.</p>
                    <Button variant="link" href="/login">Iniciar Sesión</Button>
                </Alert>
            )}

            {redemptionProducts.length === 0 ? (
                <Alert variant="info" className="text-center">
                    No hay productos disponibles para canje en este momento. ¡Vuelve pronto!
                </Alert>
            ) : (
                <Row xs={1} md={2} lg={3} className="g-4">
                    {redemptionProducts.map(product => (
                        <Col key={product.id}>
                            <Card className="h-100 shadow-sm rounded-lg">
                                {product.imagen_url ? (
                                    <Card.Img
                                        variant="top"
                                        src={product.imagen_url}
                                        alt={product.nombre}
                                        style={{ height: '200px', objectFit: 'cover' }}
                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x200/cccccc/000000?text=Sin+Imagen'; }}
                                    />
                                ) : (
                                    <div style={{ height: '200px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                                        Sin Imagen
                                    </div>
                                )}
                                <Card.Body className="d-flex flex-column">
                                    <Card.Title className="text-truncate" title={product.nombre}>{product.nombre}</Card.Title>
                                    <Card.Text className="text-muted small mb-2">
                                        {product.descripcion || 'Sin descripción.'}
                                    </Card.Text>
                                    <div className="mt-auto">
                                        <h5 className="text-success mb-2">
                                            <i className="bi bi-star-fill me-1"></i>
                                            {product.puntos_canje} Puntos
                                        </h5>
                                        {isAuthenticated && userPoints !== null && (
                                            product.puntos_canje <= userPoints ? (
                                                <Button
                                                    variant="success"
                                                    className="w-100"
                                                    onClick={() => handleRedeemClick(product.nombre)}
                                                >
                                                    ¡Canjear Ahora!
                                                </Button>
                                            ) : (
                                                <Button variant="outline-secondary" className="w-100" disabled>
                                                    Puntos Insuficientes
                                                </Button>
                                            )
                                        )}
                                        {!isAuthenticated && (
                                            <Button variant="outline-secondary" className="w-100" disabled>
                                                Inicia Sesión para Canjear
                                            </Button>
                                        )}

                                        {user && user.role === 'admin' && (
                                            <div className="d-flex justify-content-between mt-3">
                                                <Button variant="warning" size="sm" onClick={() => handleEditProductClick(product.id)} className="me-2 flex-grow-1">
                                                    Editar
                                                </Button>
                                                <Button variant="danger" size="sm" onClick={() => handleDeleteProduct(product.id)} className="flex-grow-1">
                                                    Eliminar
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </Container>
    );
};

export default RedemptionProductsPage;