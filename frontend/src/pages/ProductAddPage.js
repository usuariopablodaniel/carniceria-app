// frontend/src/pages/ProductAddPage.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProductAddPage = () => {
    const navigate = useNavigate();
    // Asegúrate de importar isAuthenticated y loadingAuth también
    const { user, isAuthenticated, loadingAuth } = useAuth(); 

    console.log('--- ProductAddPage: Componente renderizado ---');
    console.log('Usuario actual en ProductAddPage:', user);
    console.log('isAuthenticated:', isAuthenticated);
    console.log('loadingAuth:', loadingAuth);

    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        precio: '',
        stock: '',
        unidad_de_medida: 'kg',
        imagen_url: '',
        categoria: '',
        disponible: true,
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // useEffect para verificar el rol y redirigir
    useEffect(() => {
        console.log('ProductAddPage: useEffect de verificación de rol disparado.');

        // Esperar a que la autenticación haya terminado de cargar.
        // Si loadingAuth es true, significa que AuthContext aún está decidiendo si hay usuario o no.
        if (loadingAuth) {
            console.log('ProductAddPage: AuthContext aún está cargando.');
            return; 
        }

        // Si el usuario NO está autenticado (aunque PrivateRoute ya debería manejar esto, es una doble seguridad)
        if (!isAuthenticated) {
            console.log('ProductAddPage: Usuario NO autenticado. Redirigiendo a /login.');
            navigate('/login', { replace: true });
            return;
        }

        // Si el usuario está autenticado, pero NO tiene el rol de 'admin'
        if (user && user.role !== 'admin') {
            console.log('ProductAddPage: Usuario no tiene rol de administrador. Redirigiendo a /dashboard.');
            navigate('/dashboard', { replace: true });
        }
    }, [user, navigate, isAuthenticated, loadingAuth]); // Dependencias: re-evaluar si user, navigate, isAuthenticated o loadingAuth cambian


    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

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
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No estás autenticado. Por favor, inicia sesión.');
                navigate('/login');
                return;
            }

            console.log('ProductAddPage: Enviando datos:', formData);
            const response = await fetch('http://localhost:5000/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    precio: parseFloat(formData.precio),
                    stock: parseInt(formData.stock),
                }),
            });

            const data = await response.json();
            console.log('ProductAddPage: Respuesta del servidor:', data);

            if (response.ok) {
                setMessage('Producto añadido exitosamente!');
                setFormData({
                    nombre: '',
                    descripcion: '',
                    precio: '',
                    stock: '',
                    unidad_de_medida: 'kg',
                    imagen_url: '',
                    categoria: '',
                    disponible: true,
                });
                navigate('/products', { replace: true });
            } else {
                setError(data.error || 'Error al añadir el producto.');
            }
        } catch (err) {
            console.error('Error de red o del servidor:', err);
            setError('Error de conexión o del servidor al añadir el producto.');
        }
    };

    // Esto es para evitar renderizar el formulario si el usuario no es admin o si aún se está cargando la autenticación
    if (loadingAuth || !isAuthenticated || (user && user.role !== 'admin')) {
        console.log('ProductAddPage: No renderizando formulario: loadingAuth:', loadingAuth, 'isAuthenticated:', isAuthenticated, 'user role:', user ? user.role : 'N/A');
        return (
            <div className="container mt-5 text-center">
                <h2>Acceso Denegado</h2>
                <p>No tienes permiso para acceder a esta página.</p>
                {/* Puedes añadir un spinner aquí si loadingAuth es true */}
                {loadingAuth && <p>Cargando información de usuario...</p>}
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '2px 2px 10px rgba(0,0,0,0.1)' }}>
            <h1>Añadir Nuevo Producto</h1>
            {/* Opcional: Mostrar el rol actual del usuario para depuración */}
            {user && <p>Rol del usuario actual: <strong>{user.role}</strong></p>} 

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
                        step="0.01"
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