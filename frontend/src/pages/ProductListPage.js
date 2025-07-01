import React, { useEffect, useState, useCallback } from 'react'; // Importar useCallback
import { Container, Row, Col, Spinner, Alert, Button } from 'react-bootstrap';
import ProductCard from '../components/ProductCard'; 
import { useAuth } from '../context/AuthContext'; 
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios'; // <<<<<<< IMPORTAR AXIOS >>>>>>>>>

const ProductListPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated, user } = useAuth(); 
  const navigate = useNavigate();

  // Usamos useCallback para memoizar fetchProducts y evitar re-crearlo innecesariamente
  // Esto es crucial para el useEffect que lo usa como dependencia.
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null); // Limpiar errores previos al reintentar
    try {
      // <<<<<<< USANDO AXIOS AQUI >>>>>>>>>
      const response = await axios.get('/products'); 
      setProducts(response.data); // Axios pone la data directamente en .data
    } catch (err) {
      console.error("Error al obtener los productos:", err);
      // El interceptor de Axios ya maneja el 401/403. Aquí manejamos otros errores de la API.
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
  }, []); // Dependencias vacías porque no depende de props o estados mutables externos

  useEffect(() => {
    fetchProducts(); // Llama a fetchProducts cuando el componente se monta
  }, [fetchProducts]); // El efecto se ejecuta cuando fetchProducts cambia (solo una vez debido a useCallback)

  const handleAddProductClick = () => {
    navigate('/products/add'); 
  };

  // <<<<<<< NUEVA FUNCION PARA MANEJAR LA ELIMINACION DESDE PRODUCTCARD >>>>>>>>>
  const handleProductDeleted = (deletedProductId) => {
    console.log(`Producto con ID ${deletedProductId} eliminado. Recargando lista.`);
    fetchProducts(); // Recargar la lista de productos para reflejar el cambio
  };

  if (error) {
    return (
      <Container className="my-5 d-flex justify-content-center">
        <Alert variant="danger" className="text-center w-75">
          {error}
          {/* Botón para reintentar la carga si hubo un error */}
          <Button variant="danger" onClick={fetchProducts} className="ms-3 mt-2">Reintentar</Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="text-dark">Nuestros Productos</h1>
        {isAuthenticated && user && user.role === 'admin' && (
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
          {isAuthenticated && user && user.role === 'admin' && (
            <Button variant="primary" onClick={handleAddProductClick}>
              Sé el primero en añadir un producto
            </Button>
          )}
        </Alert>
      ) : (
        <Row className="justify-content-center">
          {products.map(product => (
            <Col key={product.id} xs={12} sm={6} md={4} lg={3} className="mb-4 d-flex">
              {/* <<<<<<< PASAMOS LA NUEVA PROP onProductDeleted >>>>>>>>> */}
              <ProductCard product={product} onProductDeleted={handleProductDeleted} /> 
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default ProductListPage;