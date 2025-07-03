// frontend/src/pages/RedemptionProductsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';
import { Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext'; // Para obtener el rol del usuario y ajustar UI si es necesario

const RedemptionProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth(); // Solo desestructuramos 'user' que es lo que realmente usamos aquí

    const fetchRedemptionProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Aquí haremos la llamada para obtener solo los productos de canje
            // Suponemos que el backend tendrá un endpoint específico o un filtro
            // Por ahora, para la demo, usaremos /products y filtraremos por puntos_canje en el frontend
            // Idealmente, el backend debería proveer este filtro.
            const response = await axios.get('/products'); 
            
            // Filtramos en el frontend los productos que tienen puntos_canje
            const redemptionItems = response.data.filter(product => 
                product.puntos_canje !== null && product.puntos_canje !== undefined
            );
            
            setProducts(redemptionItems);
        } catch (err) {
            console.error("Error al cargar productos de canje:", err);
            setError('No se pudieron cargar los productos de canje. Por favor, intenta de nuevo más tarde.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRedemptionProducts();
    }, [fetchRedemptionProducts]);

    const handleProductDeleted = (deletedProductId) => {
        // Filtra el producto eliminado de la lista actual para actualizar la UI
        setProducts(prevProducts => prevProducts.filter(p => p.id !== deletedProductId));
        // Opcional: Podríamos recargar la lista completa si fuera necesario
        // fetchRedemptionProducts();
    };

    return (
        <Container className="my-5">
            <h2 className="text-center mb-4">Canjea tus Puntos</h2>
            <p className="text-center text-muted mb-5">
                ¡Aquí puedes encontrar productos increíbles para canjear con tus puntos acumulados!
            </p>

            {loading && (
                <div className="d-flex justify-content-center my-4">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Cargando productos...</span>
                    </Spinner>
                </div>
            )}

            {error && <Alert variant="danger" className="text-center">{error}</Alert>}

            {!loading && products.length === 0 && !error && (
                <Alert variant="info" className="text-center">
                    No hay productos disponibles para canjear en este momento.
                </Alert>
            )}

            <Row xs={1} sm={2} md={3} lg={4} className="g-4">
                {products.map(product => (
                    <Col key={product.id}>
                        <ProductCard 
                            product={product} 
                            onProductDeleted={user && user.role === 'admin' ? handleProductDeleted : null} 
                        />
                    </Col>
                ))}
            </Row>
        </Container>
    );
};

export default RedemptionProductsPage;