// frontend/src/pages/UserManagementPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Table, Button, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios'; // <<<<< CAMBIO CLAVE: Importar la instancia 'api'

// const API_URL = process.env.REACT_APP_API_URL; // <<<<< ELIMINAR ESTA LÍNEA

const UserManagementPage = () => {
    const { token, isAdmin, user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estados para el modal de edición
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentUserToEdit, setCurrentUserToEdit] = useState(null);
    const [newRole, setNewRole] = useState('');
    
    // Función para formatear la fecha (DD/MM/YYYY)
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES');
        } catch (error) {
            console.error("Error formatting date:", error);
            return 'Invalid Date';
        }
    };

    // Usamos useCallback para memoizar fetchUsers
    const fetchUsers = useCallback(async () => {
        // Si no es admin o no hay token, no intentamos la llamada API
        if (!isAdmin || !token) {
            setLoading(false);
            // Si el usuario no es admin, establecemos un error para mostrar el mensaje de acceso denegado
            if (!isAdmin) {
                setError('Acceso denegado. Esta página es solo para administradores.');
            }
            return; 
        }

        try {
            setLoading(true);
            setError(null);

            // >>>>>>>>>>>>>>> CAMBIO CLAVE AQUÍ: Usar 'api' y la ruta relativa <<<<<<<<<<<<<<<<
            // La baseURL 'http://localhost:5000/api' ya está configurada en api/axios.js
            // El token de autorización se añade automáticamente por el interceptor de 'api'.
            const response = await api.get('/auth/users'); 

            // Filtramos la lista para que el administrador no pueda gestionarse a sí mismo
            const filteredUsers = response.data.users.filter(u => u.id !== user.id);
            
            setUsers(filteredUsers);
            setLoading(false);

        } catch (err) {
            console.error('Error al obtener la lista de usuarios:', err.response?.data || err.message);
            setError('Error al cargar usuarios. Verifica tu conexión o permisos.');
            setLoading(false);
        }
    }, [isAdmin, token, user]); // Dependencias de useCallback

    // Llamada inicial para obtener usuarios
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]); // Dependencia de useEffect para useCallback

    // --- Funciones para Editar Rol (Modal) ---

    const handleEditClick = (user) => {
        setCurrentUserToEdit(user);
        setNewRole(user.role); 
        setShowEditModal(true);
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setCurrentUserToEdit(null);
        setNewRole('');
    };

    const handleUpdateRole = async () => {
        if (!currentUserToEdit || !newRole) {
            handleCloseEditModal();
            return;
        }

        try {
            // >>>>>>>>>>>>>>> CAMBIO CLAVE AQUÍ: Usar 'api' y la ruta relativa <<<<<<<<<<<<<<<<
            await api.put(
                `/auth/users/${currentUserToEdit.id}`,
                { role: newRole }
                // El token se añade automáticamente por el interceptor de 'api'.
            );

            // Si la actualización es exitosa, cerramos el modal y recargamos la lista de usuarios
            handleCloseEditModal();
            fetchUsers(); 

        } catch (err) {
            console.error('Error al actualizar rol:', err.response?.data || err.message);
            setError('Error al actualizar el rol del usuario: ' + (err.response?.data?.error || err.message || 'Error desconocido'));
        }
    };

    // --- Funciones para Eliminar Usuario ---

    const handleDeleteUser = async (userId, userName) => {
        // Confirmación para prevenir eliminaciones accidentales
        if (window.confirm(`¿Estás seguro de que deseas eliminar al usuario ${userName}? Esta acción no se puede deshacer.`)) {
            try {
                // >>>>>>>>>>>>>>> CAMBIO CLAVE AQUÍ: Usar 'api' y la ruta relativa <<<<<<<<<<<<<<<<
                await api.delete(
                    `/auth/users/${userId}`
                    // El token se añade automáticamente por el interceptor de 'api'.
                );

                // Si la eliminación es exitosa, volvemos a cargar la lista de usuarios
                fetchUsers();

            } catch (err) {
                console.error('Error al eliminar usuario:', err.response?.data || err.message);
                setError('Error al eliminar el usuario: ' + (err.response?.data?.error || err.message || 'Error desconocido'));
            }
        }
    };
    
    // --- Renderizado Condicional ---

    // Si el usuario no es admin, mostramos el mensaje de acceso denegado inmediatamente
    if (!isAdmin && !loading) { // Añadimos !loading para que no aparezca antes de que se resuelva isAdmin
        return <Alert variant="danger" className="mt-5">Acceso denegado. Esta página es solo para administradores.</Alert>;
    }

    if (loading) {
        return (
            <Container className="text-center mt-5">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </Spinner>
            </Container>
        );
    }

    if (error) {
        return <Alert variant="danger" className="mt-5">{error}</Alert>;
    }

    return (
        <Container className="mt-5">
            <h1 className="mb-4">Gestión de Usuarios</h1>
            {users.length === 0 ? (
                <Alert variant="info">No se encontraron usuarios registrados (excluyendo al administrador actual).</Alert>
            ) : (
                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>Teléfono</th>
                            <th>Rol</th>
                            <th>Puntos</th>
                            <th>Registro</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id}>
                                <td>{u.id}</td>
                                <td>{u.nombre}</td>
                                <td>{u.email}</td>
                                <td>{u.telefono || 'N/A'}</td>
                                <td>{u.role}</td>
                                <td>{u.puntos_actuales}</td>
                                <td>{formatDate(u.fecha_registro)}</td> 
                                <td>
                                    {/* Botón Editar Rol (abre modal) */}
                                    <Button 
                                        variant="warning" 
                                        size="sm" 
                                        className="me-2"
                                        onClick={() => handleEditClick(u)} 
                                    >
                                        Editar Rol
                                    </Button>
                                    
                                    {/* Botón Eliminar (llama a la función handleDeleteUser) */}
                                    <Button 
                                        variant="danger" 
                                        size="sm"
                                        onClick={() => handleDeleteUser(u.id, u.nombre)} 
                                    >
                                        Eliminar
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}

            {/* Modal para Editar Rol */}
            <Modal show={showEditModal} onHide={handleCloseEditModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Editar Rol de {currentUserToEdit?.nombre}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Selecciona Nuevo Rol:</Form.Label>
                        <Form.Control
                            as="select"
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                        >
                            <option value="user">Usuario (user)</option>
                            <option value="admin">Administrador (admin)</option>
                            <option value="employee">Empleado (employee)</option>
                        </Form.Control>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseEditModal}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleUpdateRole}>
                        Guardar Cambios
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default UserManagementPage;