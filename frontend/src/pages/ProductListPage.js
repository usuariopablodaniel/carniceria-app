import React, { useEffect, useState, useCallback } from 'react';
import { Container, Row, Col, Spinner, Alert, Button, Card } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';

const ProductListPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/products');
      const saleProducts = response.data.filter(product =>
        product.precio !== null && product.precio !== undefined &&
        (product.puntos_canje === null || product.puntos_canje === undefined)
      );
      setProducts(saleProducts);
    } catch (err) {
      console.error("Error al obtener los productos:", err);
      if (err.response) {
        setError(err.response.data.error || "No se pudieron cargar los productos. Por favor, intenta de nuevo.");
      } else if (err.request) {
        setError("No se pudo conectar con el servidor. Verifica tu conexión.");
      } else {
        setError("Ocurrió un error inesperado al cargar los productos.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAddProductClick = () => {
    navigate('/products/add');
  };

  const handleEditProductClick = (productId) => {
    navigate(`/products/edit/${productId}`);
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        await axios.delete(`/products/${productId}`);
        console.log(`Producto con ID ${productId} eliminado.`);
        fetchProducts(); // Recargar la lista después de eliminar
      } catch (err) {
        console.error("Error al eliminar el producto:", err);
        setError("No se pudo eliminar el producto. Intenta de nuevo.");
      }
    }
  };

  if (error) {
    return (
      <Container className="my-5 d-flex justify-content-center">
        <Alert variant="danger" className="text-center w-75">
          {error}
          <Button variant="danger" onClick={fetchProducts} className="ms-3 mt-2">Reintentar</Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="text-dark">Nuestras Ofertas y Productos en Venta</h1>
        {user && user.role === 'admin' && (
          <Button variant="success" onClick={handleAddProductClick}>
            + Añadir Producto
          </Button>
        )}
      </div>

      {loading ? (
        <div className="d-flex flex-column align-items-center justify-content-center text-center py-5" style={{ minHeight: '400px' }}>
          <Spinner animation="border" role="status" className="mb-3 text-primary" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Cargando productos...</span>
          </Spinner>
          <p className="text-muted">Cargando productos, por favor espera...</p>
          <Row className="mt-4 w-100 justify-content-center">
            {Array.from({ length: 4 }).map((_, index) => (
              <Col key={index} xs={12} sm={6} md={4} lg={3} className="mb-4">
                <div className="placeholder-glow">
                  <div className="card h-100 shadow-sm rounded-lg" style={{ border: '1px solid #e0e0e0' }}>
                    <div className="card-img-top bg-light" style={{ height: '180px', width: '100%' }}></div>
                    <div className="card-body p-3">
                      <h5 className="card-title placeholder col-8 mb-2"></h5>
                      <p className="card-text placeholder col-6"></p>
                      <p className="card-text placeholder col-4"></p>
                      <span className="badge bg-secondary placeholder col-3"></span>
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      ) : products.length === 0 ? (
        <Alert variant="info" className="text-center my-5 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '300px' }}>
          <p className="mb-3 fs-5">¡Ups! Parece que no hay productos disponibles en este momento.</p>
          {user && user.role === 'admin' && (
            <Button variant="primary" onClick={handleAddProductClick}>
              Sé el primero en añadir un producto
            </Button>
          )}
        </Alert>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {products.map(product => (
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
                    {/* >>>>>>>>>>>>>>> LÍNEA CORREGIDA AQUÍ DE NUEVO <<<<<<<<<<<<<<<< */}
                    <h5 className="text-primary mb-2">
                      {/* Convertir a número con parseFloat y luego formatear */}
                      ${product.precio !== null && product.precio !== undefined
                        ? parseFloat(product.precio).toFixed(2)
                        : 'N/A'
                      }
                    </h5>
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

export default ProductListPage;