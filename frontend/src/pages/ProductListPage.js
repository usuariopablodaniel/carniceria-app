import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Spinner, Alert, Button } from 'react-bootstrap';
import ProductCard from '../components/ProductCard'; // <<<<<<< IMPORTA EL NUEVO COMPONENTE
import { useAuth } from '../context/AuthContext'; // Para controlar si mostrar el botón de añadir
import { useNavigate } from 'react-router-dom'; // Para el botón de añadir producto


const ProductListPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated, user } = useAuth(); // Obtener el rol del usuario
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/products');
        if (!response.ok) {
          throw new Error(`Error en la red o servidor: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        console.error("Error al obtener los productos:", err);
        setError("No se pudieron cargar los productos. Inténtalo de nuevo más tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddProductClick = () => {
    navigate('/products/add'); // Asume que tienes una ruta para añadir productos
  };

  if (error) {
    return (
      <Container className="my-5 d-flex justify-content-center"> {/* Centra el alerta */}
        <Alert variant="danger" className="text-center w-75">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="my-5"> {/* Margen superior e inferior un poco más grandes */}
      <div className="d-flex justify-content-between align-items-center mb-4"> {/* Alinea título y botón */}
        <h1 className="text-dark">Nuestros Productos</h1> {/* Título más simple */}
        {isAuthenticated && user && user.role === 'admin' && (
          <Button variant="success" onClick={handleAddProductClick}>
            + Añadir Producto
          </Button>
        )}
      </div>

      {loading ? (
        <div className="d-flex flex-column align-items-center justify-content-center text-center py-5" style={{ minHeight: '400px' }}> {/* Estilizado para centrar Spinner */}
          <Spinner animation="border" role="status" className="mb-3 text-primary" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Cargando productos...</span>
          </Spinner>
          <p className="text-muted">Cargando productos, por favor espera...</p>
          <Row className="mt-4 w-100 justify-content-center">
            {Array.from({ length: 4 }).map((_, index) => (
              <Col key={index} xs={12} sm={6} md={4} lg={3} className="mb-4">
                <div className="placeholder-glow">
                  <div className="card h-100 shadow-sm rounded-lg" style={{ border: '1px solid #e0e0e0' }}>
                    <div className="card-img-top bg-light" style={{ height: '180px', width: '100%' }}></div> {/* Placeholder para la imagen */}
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
          {isAuthenticated && user && user.role === 'admin' && (
            <Button variant="primary" onClick={handleAddProductClick}>
              Sé el primero en añadir un producto
            </Button>
          )}
        </Alert>
      ) : (
        <Row className="justify-content-center">
          {products.map(product => (
            <Col key={product.id} xs={12} sm={6} md={4} lg={3} className="mb-4 d-flex"> {/* Usamos d-flex para que las tarjetas tengan la misma altura */}
              <ProductCard product={product} /> {/* <<<<<<< USA EL NUEVO COMPONENTE */}
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default ProductListPage;