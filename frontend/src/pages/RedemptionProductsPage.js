import React, { useEffect, useState, useCallback } from 'react';
import { Container, Row, Col, Spinner, Alert, Button } from 'react-bootstrap';
import ProductCard from '../components/ProductCard'; // Importar el componente ProductCard
import api from '../api/axios';
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
            const response = await api.get(`/transactions/${user.id}/points`);
            setUserPoints(response.data.points);
        } catch (err) {
            console.error('Error al obtener los puntos del usuario:', err);
            setUserPoints(null);
        }
    }, [isAuthenticated, user]);

    const fetchRedemptionProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/products');
            const redeemable = response.data.filter(p => p.puntos_canje !== null && p.puntos_canje > 0);
            setRedemptionProducts(redeemable);
        } catch (err) {
            console.error('Error al cargar productos de canje:', err);
            setError('No se pudieron cargar los productos disponibles para canje.');
        } finally {
            setLoading(false);
        }
    }, []);

    const onProductDeleted = useCallback((deletedProductId) => {
        setRedemptionProducts(currentProducts =>
            currentProducts.filter(p => p.id !== deletedProductId)
        );
    }, []);

    useEffect(() => {
        if (!loadingAuth) {
            fetchUserPoints();
        }
    }, [isAuthenticated, user, loadingAuth, fetchUserPoints]);

    useEffect(() => {
        fetchRedemptionProducts();
    }, [fetchRedemptionProducts]);

    const handleAddProductClick = () => {
        navigate('/products/add');
    };

    if (loading) {
        return (
            <div className="d-flex flex-column align-items-center justify-content-center text-center py-5" style={{ minHeight: '400px' }}>
                <Spinner animation="border" role="status" className="mb-3 text-primary" style={{ width: '3rem', height: '3rem' }}>
                    <span className="visually-hidden">Cargando productos...</span>
                </Spinner>
                <p className="text-muted">Cargando productos disponibles para canje...</p>
            </div>
        );
    }

    if (error) {
        return (
            <Container className="my-5 d-flex justify-content-center">
                <Alert variant="danger" className="text-center w-75">
                    {error}
                    <Button variant="danger" onClick={fetchRedemptionProducts} className="ms-3 mt-2">Reintentar</Button>
                </Alert>
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
                            {/* ¡Usamos el componente ProductCard aquí! */}
                            <ProductCard
                                product={product}
                                onProductDeleted={onProductDeleted}
                            />
                        </Col>
                    ))}
                </Row>
            )}
        </Container>
    );
};

export default RedemptionProductsPage;