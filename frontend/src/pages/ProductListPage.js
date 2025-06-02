import React, { useEffect, useState } from 'react';

const ProductListPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/products');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
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

  // Estilos para el contenedor de la cuadrícula, común para cargando y para datos
  const gridContainerStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px',
    minHeight: '500px', // Mantén esta altura mínima para el contenedor principal
    textAlign: 'center' // Para centrar el texto "Cargando productos..."
  };

  if (error) {
    return <p style={{ color: 'red', padding: '20px' }}>{error}</p>; // Añadimos padding para que no se vea pegado
  }

  return (
    <div style={{ padding: '20px' }}> {/* Agregamos un padding general a la página */}
      <h1>Nuestros Productos</h1>
      {loading ? (
        // Muestra un esqueleto de 4 tarjetas mientras carga
        <div style={{
          ...gridContainerStyle, // Hereda las propiedades del grid
          // Alinear y centrar el mensaje de carga dentro del contenedor del esqueleto
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '20px' // Espacio para que el mensaje no esté pegado al título
        }}>
          <p style={{ gridColumn: '1 / -1', textAlign: 'center' }}>Cargando productos...</p> {/* Centrar el mensaje en todo el ancho del grid */}
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} style={{
              border: '1px dashed #eee', // Un borde tenue para el esqueleto
              borderRadius: '8px',
              padding: '15px',
              minHeight: '200px', // Altura de una tarjeta de esqueleto
              backgroundColor: '#f5f5f5',
              animation: 'pulse 1.5s infinite ease-in-out' // Opcional: animación de carga
            }}>
              {/* Puedes poner líneas grises que simulen texto si quieres un esqueleto más elaborado */}
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <p style={{ padding: '20px' }}>No hay productos disponibles en este momento.</p> // Añadimos padding
      ) : (
        // Si hay productos, los muestra en la cuadrícula
        <div style={gridContainerStyle}> {/* Usamos el estilo común aquí */}
          {products.map(product => (
            <div key={product.id} style={{
                border: '1px solid #ccc',
                borderRadius: '8px',
                padding: '15px',
                textAlign: 'center',
                fontFamily: 'Arial, sans-serif', // Forzar una fuente del sistema
                fontSize: '16px', // Forzar un tamaño de fuente base
                lineHeight: '1.4', // Forzar una altura de línea
                display: 'flex', // Añadimos flexbox para mejor control interno
                flexDirection: 'column',
                justifyContent: 'space-between', // Para distribuir el contenido
                height: '100%' // Asegurar que la tarjeta ocupa toda la altura disponible en el grid
            }}>
              {product.imagen_url && (
                <img
                  src={product.imagen_url}
                  alt={product.nombre}
                  style={{ maxWidth: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px', marginBottom: '10px' }}
                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150?text=No+Image'; }}
                />
              )}
              <h2 style={{ fontSize: '20px', lineHeight: '1.2', margin: '0 0 10px 0' }}>{product.nombre}</h2>
              <p style={{ fontSize: '14px', lineHeight: '1.5', margin: '0 0 5px 0' }}>{product.descripcion}</p>
              <p style={{ fontSize: '14px', lineHeight: '1.5', margin: '0 0 5px 0' }}>Precio: ${parseFloat(product.precio).toFixed(2)} / {product.unidad_de_medida}</p>
              <p style={{ fontSize: '14px', lineHeight: '1.5', margin: '0 0 5px 0' }}>Stock: {product.stock}</p>
              <p style={{ fontSize: '14px', lineHeight: '1.5', margin: '0 0 0 0' }}>Categoría: {product.categoria}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductListPage;