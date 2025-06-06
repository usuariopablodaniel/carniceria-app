import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Button } from 'react-bootstrap';

const ProductListPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (error) {
    return (
      <Container className="my-4">
        <Alert variant="danger" className="text-center">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="my-4">
      <h1 className="text-center mb-4">Nuestros Productos</h1>

      {/* Aquí podrías añadir una barra de búsqueda o filtros, si los descomentas: */}
      {/*
      <Row className="mb-4">
        <Col>
          <InputGroup>
            <FormControl
              placeholder="Buscar productos..."
              aria-label="Buscar productos"
            />
            <Button variant="outline-secondary">Buscar</Button>
          </InputGroup>
        </Col>
        <Col xs="auto">
          <Button variant="success">Añadir Producto</Button>
        </Col>
      </Row>
      */}

      {loading ? (
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '500px' }}>
          <Spinner animation="border" role="status" className="mb-3">
            <span className="visually-hidden">Cargando productos...</span>
          </Spinner>
          <p>Cargando productos...</p>
          <Row className="mt-4 w-100 justify-content-center">
            {Array.from({ length: 4 }).map((_, index) => (
              <Col key={index} xs={12} sm={6} md={4} lg={3} className="mb-4">
                <Card style={{ minHeight: '250px' }}>
                  <Card.Body className="d-flex flex-column justify-content-center">
                    <div className="placeholder-glow text-center">
                      <span className="placeholder col-8 mb-2" style={{ height: '100px', display: 'block' }}></span>
                      <span className="placeholder col-7 mb-2"></span>
                      <span className="placeholder col-4 mb-2"></span>
                      <span className="placeholder col-6"></span>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ) : products.length === 0 ? (
        <Alert variant="info" className="text-center my-4">
          No hay productos disponibles en este momento.
          {/* Opcional: un botón para agregar un producto si la página está vacía */}
          {/* <Button variant="primary" className="ms-2">Añadir el primer producto</Button> */}
        </Alert>
      ) : (
        <Row className="justify-content-center">
          {products.map(product => (
            <Col key={product.id} xs={12} sm={6} md={4} lg={3} className="mb-4">
              <Card className="h-100 shadow-sm">
                {product.imagen_url && (
                  <Card.Img
                    variant="top"
                    src={product.imagen_url || 'https://via.placeholder.com/180x180?text=Imagen+No+Disponible' }
                    alt={product.nombre}
                    style={{ height: '180px', objectFit: 'cover' }}
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/180x180?text=No+Image'; }}
                  />
                )}
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="text-truncate mb-2">{product.nombre}</Card.Title>
                  
                  <Card.Text className="text-muted small mb-1 product-description">
                    {product.descripcion}
                  </Card.Text>
                  
                  <Card.Text className="mt-auto">
                    <strong>Precio: ${parseFloat(product.precio).toFixed(2)}</strong> / {product.unidad_de_medida}<br/>
                    Stock: {product.stock}<br/>
                    Categoría: <span className="badge bg-secondary">{product.categoria}</span>
                  </Card.Text>

                  {/* Ejemplo de un botón en la tarjeta */}
                  {/* <Button variant="primary" className="mt-3">Ver Detalles</Button> */}
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