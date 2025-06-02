import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ProductAddPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    unidad_de_medida: 'kg', // Valor predeterminado
    imagen_url: '',
    categoria: '',
    disponible: true, // Valor predeterminado
  });
  const [message, setMessage] = useState(''); // Para mensajes de éxito o error
  const [error, setError] = useState(''); // Para errores específicos

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); // Limpiar mensajes anteriores
    setError('');   // Limpiar errores anteriores

    // Validación básica
    if (!formData.nombre || !formData.precio || !formData.stock) {
      setError('Nombre, Precio y Stock son obligatorios.');
      return;
    }
    if (isNaN(parseFloat(formData.precio)) || parseFloat(formData.precio) <= 0) {
      setError('El precio debe ser un número positivo.');
      return;
    }
    if (isNaN(parseInt(formData.stock)) || parseInt(formData.stock) < 0) {
      setError('El stock debe ser un número no negativo.');
      return;
    }

    try {
      const token = localStorage.getItem('jwtToken'); // Obtener el token del localStorage
      if (!token) {
        setError('No estás autenticado. Por favor, inicia sesión.');
        navigate('/login'); // Redirigir al login si no hay token
        return;
      }

      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Incluir el token JWT
        },
        body: JSON.stringify({
          ...formData,
          precio: parseFloat(formData.precio), // Asegurar que precio sea un número
          stock: parseInt(formData.stock),     // Asegurar que stock sea un número entero
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Producto añadido exitosamente!');
        setFormData({ // Opcional: Limpiar el formulario después del éxito
          nombre: '',
          descripcion: '',
          precio: '',
          stock: '',
          unidad_de_medida: 'kg',
          imagen_url: '',
          categoria: '',
          disponible: true,
        });
        // Opcional: Redirigir a la lista de productos
        navigate('/products');
      } else {
        setError(data.error || 'Error al añadir el producto.');
      }
    } catch (err) {
      console.error('Error de red o del servidor:', err);
      setError('Error de conexión o del servidor al añadir el producto.');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '2px 2px 10px rgba(0,0,0,0.1)' }}>
      <h1>Añadir Nuevo Producto</h1>

      {message && <p style={{ color: 'green', fontWeight: 'bold' }}>{message}</p>}
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px' }}>
        <div>
          <label htmlFor="nombre">Nombre:</label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label htmlFor="descripcion">Descripción:</label>
          <textarea
            id="descripcion"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows="4"
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          ></textarea>
        </div>
        <div>
          <label htmlFor="precio">Precio:</label>
          <input
            type="number"
            id="precio"
            name="precio"
            value={formData.precio}
            onChange={handleChange}
            step="0.01" // Permite decimales
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label htmlFor="stock">Stock:</label>
          <input
            type="number"
            id="stock"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label htmlFor="unidad_de_medida">Unidad de Medida:</label>
          <select
            id="unidad_de_medida"
            name="unidad_de_medida"
            value={formData.unidad_de_medida}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          >
            <option value="kg">Kilogramo (kg)</option>
            <option value="unidad">Unidad</option>
            <option value="paquete">Paquete</option>
            <option value="gramos">Gramos (gr)</option>
          </select>
        </div>
        <div>
          <label htmlFor="imagen_url">URL de la Imagen:</label>
          <input
            type="text"
            id="imagen_url"
            name="imagen_url"
            value={formData.imagen_url}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label htmlFor="categoria">Categoría:</label>
          <input
            type="text"
            id="categoria"
            name="categoria"
            value={formData.categoria}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label htmlFor="disponible">
            <input
              type="checkbox"
              id="disponible"
              name="disponible"
              checked={formData.disponible}
              onChange={handleChange}
            />
            Producto Disponible para Venta
          </label>
        </div>
        <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Añadir Producto
        </button>
      </form>
    </div>
  );
};

export default ProductAddPage;