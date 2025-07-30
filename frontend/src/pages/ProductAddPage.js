import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Container, Form, Button, Alert, Spinner, Image } from 'react-bootstrap'; 
import api from '../api/axios'; // Usar la instancia 'api' de axios

const ProductAddPage = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, loadingAuth } = useAuth(); 

    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        precio: '',
        stock: '',
        unidad_de_medida: 'kg',
        imagen_url: '', 
        categoria: '', 
        disponible: true,
        puntos_canje: '', 
    });
    const [imageFile, setImageFile] = useState(null); 
    const [imagePreviewUrl, setImagePreviewUrl] = useState(''); 
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const categories = ["Ternera", "Pollo", "Cerdo", "Pescado"];

    useEffect(() => {
        if (loadingAuth) {
            return; 
        }

        if (!isAuthenticated) {
            navigate('/login', { replace: true });
            return;
        }

        if (user && user.role !== 'admin') {
            navigate('/dashboard', { replace: true });
        }

        return () => {
            // Limpiar la URL de previsualización cuando el componente se desmonte
            if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreviewUrl);
            }
        };
    }, [user, navigate, isAuthenticated, loadingAuth, imagePreviewUrl]); // imagePreviewUrl como dependencia para el cleanup

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        if (type === 'file') {
            const file = files[0];
            setImageFile(file);
            if (file) {
                // Si ya hay una URL de previsualización existente, la revocamos para liberar memoria
                if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(imagePreviewUrl);
                }
                setImagePreviewUrl(URL.createObjectURL(file)); // Crear nueva URL de previsualización
            } else {
                // Si no se selecciona ningún archivo, limpiar la previsualización
                if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(imagePreviewUrl);
                }
                setImagePreviewUrl('');
            }
        } else {
            setFormData(prevData => {
                const newData = {
                    ...prevData,
                    [name]: type === 'checkbox' ? checked : value,
                };

                // Lógica para asegurar que solo se ingrese precio O puntos de canje
                if (name === 'precio' && value !== '' && newData.puntos_canje !== '') {
                    newData.puntos_canje = '';
                } else if (name === 'puntos_canje' && value !== '' && newData.precio !== '') {
                    newData.precio = '';
                }
                return newData;
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setIsSubmitting(true);

        // Validaciones Frontend
        if (!formData.nombre || formData.stock === '') {
            setError('Nombre y Stock son obligatorios.');
            setIsSubmitting(false);
            return;
        }

        const hasPriceInput = formData.precio !== '' && formData.precio !== null;
        const hasPointsInput = formData.puntos_canje !== '' && formData.puntos_canje !== null;

        if (!hasPriceInput && !hasPointsInput) {
            setError('Debe ingresar un Precio o Puntos de Canje para el producto.');
            setIsSubmitting(false);
            return;
        }
        if (hasPriceInput && hasPointsInput) {
            setError('No puede ingresar Precio y Puntos de Canje a la vez. Elija uno.');
            setIsSubmitting(false);
            return;
        }

        if (hasPriceInput) {
            const parsedPrice = parseFloat(formData.precio);
            if (isNaN(parsedPrice) || parsedPrice <= 0) {
                setError('El precio debe ser un número positivo.');
                setIsSubmitting(false);
                return;
            }
        }

        if (hasPointsInput) {
            const parsedPoints = parseInt(formData.puntos_canje);
            if (isNaN(parsedPoints) || parsedPoints < 0) { 
                setError('Los puntos de canje deben ser un número no negativo.');
                setIsSubmitting(false);
                return;
            }
        }

        const parsedStock = parseInt(formData.stock);
        if (isNaN(parsedStock) || parsedStock < 0) {
            setError('El stock debe ser un número no negativo.');
            setIsSubmitting(false);
            return;
        }
        
        if (!formData.categoria || formData.categoria === '') {
            setError('Debe seleccionar una categoría para el producto.');
            setIsSubmitting(false);
            return;
        }

        const dataToSend = new FormData();
        for (const key in formData) {
            // Excluimos las claves que manejamos específicamente o que no son parte del FormData directo
            if (['precio', 'puntos_canje', 'stock', 'disponible', 'imagen_url'].includes(key)) {
                continue; 
            }
            dataToSend.append(key, formData[key]);
        }
        
        // Añadir valores numéricos y booleanos
        dataToSend.append('precio', hasPriceInput ? parseFloat(formData.precio) : ''); 
        dataToSend.append('puntos_canje', hasPointsInput ? parseInt(formData.puntos_canje) : '');
        dataToSend.append('stock', parsedStock);
        dataToSend.append('disponible', formData.disponible ? 'true' : 'false');
        
        // Añadir el archivo de imagen si existe
        if (imageFile) {
            dataToSend.append('imagen', imageFile);
        } 

        try {
            // La instancia 'api' ya tiene la baseURL y el interceptor de token
            const response = await api.post('/products', dataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data' // Importante para enviar archivos
                }
            }); 
            
            if (response.status === 201) { 
                setMessage('Producto añadido exitosamente!');
                // Resetear el formulario después de un envío exitoso
                setFormData({
                    nombre: '',
                    descripcion: '',
                    precio: '',
                    stock: '',
                    unidad_de_medida: 'kg',
                    categoria: '', 
                    disponible: true,
                    puntos_canje: '', 
                });
                setImageFile(null);
                setImagePreviewUrl('');
                setTimeout(() => {
                    navigate('/products'); 
                }, 1500); 
            } else {
                setError(response.data.error || 'Error desconocido al añadir el producto.');
            }
        } catch (err) {
            console.error('Error al añadir producto:', err);
            if (err.response) {
                setError(err.response.data.error || 'Error al añadir el producto (respuesta del servidor).');
            } else if (err.request) {
                setError('No se pudo conectar con el servidor. Intenta de nuevo más tarde.');
            } else {
                setError('Ocurrió un error inesperado al procesar la solicitud.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loadingAuth || !isAuthenticated || (user && user.role !== 'admin')) {
        return (
            <Container className="my-5 text-center">
                <h2 className="mb-3">Acceso Denegado</h2>
                <p className="text-muted">No tienes permiso para acceder a esta página.</p>
                {loadingAuth && <Spinner animation="border" className="mt-3" />}
            </Container>
        );
    }

    return (
        <Container className="my-5 p-4 border rounded shadow-sm" style={{ maxWidth: '700px' }}>
            <h1 className="mb-4 text-center text-primary">Añadir Nuevo Producto</h1>
            <p className="text-center text-muted mb-4">Ingresa los detalles para un nuevo producto. Un producto debe tener Precio O Puntos de Canje, pero no ambos.</p>

            {message && <Alert variant="success" onClose={() => setMessage('')} dismissible>{message}</Alert>}
            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

            <Form onSubmit={handleSubmit} encType="multipart/form-data"> 
                <Form.Group className="mb-3" controlId="nombre">
                    <Form.Label>Nombre del Producto</Form.Label>
                    <Form.Control
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        placeholder="Ej: Lomo de cerdo"
                        required
                    />
                </Form.Group>

                <Form.Group className="mb-3" controlId="descripcion">
                    <Form.Label>Descripción</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={handleChange}
                        placeholder="Breve descripción del producto..."
                    />
                </Form.Group>

                <Form.Group className="mb-3" controlId="precio">
                    <Form.Label>Precio (deja vacío si es por canje)</Form.Label>
                    <Form.Control
                        type="number"
                        name="precio"
                        value={formData.precio}
                        onChange={handleChange}
                        step="0.01"
                        placeholder="Ej: 15.75"
                    />
                </Form.Group>

                <Form.Group className="mb-3" controlId="puntos_canje">
                    <Form.Label>Puntos de Canje (deja vacío si es por venta)</Form.Label>
                    <Form.Control
                        type="number"
                        name="puntos_canje"
                        value={formData.puntos_canje}
                        onChange={handleChange}
                        min="0"
                        placeholder="Ej: 500"
                    />
                    <Form.Text className="text-muted">
                        Si este producto se canjea por puntos, ingresa el valor aquí y deja el precio vacío.
                    </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3" controlId="stock">
                    <Form.Label>Stock</Form.Label>
                    <Form.Control
                        type="number"
                        name="stock"
                        value={formData.stock}
                        onChange={handleChange}
                        placeholder="Ej: 100 (unidades o kg)"
                        required
                    />
                </Form.Group>

                <Form.Group className="mb-3" controlId="unidad_de_medida">
                    <Form.Label>Unidad de Medida</Form.Label>
                    <Form.Select
                        name="unidad_de_medida"
                        value={formData.unidad_de_medida}
                        onChange={handleChange}
                    >
                        <option value="kg">Kilogramo (kg)</option>
                        <option value="unidad">Unidad</option>
                        <option value="paquete">Paquete</option>
                        <option value="gramos">Gramos (gr)</option>
                    </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3" controlId="imagen">
                    <Form.Label>Imagen del Producto</Form.Label>
                    <Form.Control
                        type="file"
                        name="imagen"
                        onChange={handleChange}
                        accept="image/*"
                    />
                    {imagePreviewUrl && (
                        <div className="mt-2 text-center">
                            <p className="text-muted mb-1">Previsualización:</p>
                            <Image 
                                src={imagePreviewUrl} 
                                alt="Previsualización del producto" 
                                fluid 
                                style={{ width: '100%', maxWidth: '200px', height: 'auto', maxHeight: '200px', objectFit: 'contain', border: '1px solid #ddd', borderRadius: '4px' }} 
                                loading="lazy" 
                            />
                            {imageFile && <Form.Text className="text-muted d-block mt-1">Archivo seleccionado: {imageFile.name}</Form.Text>}
                        </div>
                    )}
                    {!imagePreviewUrl && (
                        <Form.Text className="text-muted d-block mt-1">
                            No hay imagen seleccionada.
                        </Form.Text>
                    )}
                </Form.Group>

                <Form.Group className="mb-3" controlId="categoria">
                    <Form.Label>Categoría</Form.Label>
                    <Form.Select
                        name="categoria"
                        value={formData.categoria}
                        onChange={handleChange}
                        required 
                    >
                        <option value="">-- Selecciona una categoría --</option> 
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </Form.Select>
                    <Form.Text className="text-muted">
                        Selecciona la categoría principal del producto.
                    </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3" controlId="disponible">
                    <Form.Check
                        type="checkbox"
                        name="disponible"
                        label="Producto Disponible para Venta"
                        checked={formData.disponible}
                        onChange={handleChange}
                    />
                </Form.Group>

                <Button variant="primary" type="submit" className="w-100 mt-3" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                            Añadiendo...
                        </>
                    ) : (
                        'Añadir Producto'
                    )}
                </Button>
            </Form>
        </Container>
    );
};

export default ProductAddPage;