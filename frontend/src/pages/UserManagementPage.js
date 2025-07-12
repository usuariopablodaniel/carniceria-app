// frontend/src/pages/UserManagementPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Table, Button, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

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
        if (!isAdmin || !token) {
            setLoading(false);
            return; 
        }

        try {
            setLoading(true);
            setError(null);

            const response = await axios.get(`${API_URL}/auth/users`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // Filtramos la lista para que el administrador no pueda gestionarse a sí mismo
            const filteredUsers = response.data.users.filter(u => u.id !== user.id);
            
            setUsers(filteredUsers);
            setLoading(false);

        } catch (err) {
            console.error('Error al obtener la lista de usuarios:', err.response?.data || err.message);
            setError('Error al cargar usuarios. Verifica tu conexión o permisos.');
            setLoading(false);
        }
    }, [isAdmin, token, user]); 

    // Llamada inicial para obtener usuarios
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

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
            // Llamada PUT a la API para actualizar el rol
            await axios.put(
                `${API_URL}/auth/users/${currentUserToEdit.id}`,
                { role: newRole },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            // Si la actualización es exitosa, cerramos el modal y recargamos la lista de usuarios
            handleCloseEditModal();
            fetchUsers(); 

        } catch (err) {
            console.error('Error al actualizar rol:', err.response?.data || err.message);
            setError('Error al actualizar el rol del usuario.');
        }
    };

    // --- Funciones para Eliminar Usuario ---

    const handleDeleteUser = async (userId, userName) => {
        // Confirmación para prevenir eliminaciones accidentales
        if (window.confirm(`¿Estás seguro de que deseas eliminar al usuario ${userName}? Esta acción no se puede deshacer.`)) {
            try {
                // Llamada DELETE a la API para eliminar el usuario
                await axios.delete(
                    `${API_URL}/auth/users/${userId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                // Si la eliminación es exitosa, volvemos a cargar la lista de usuarios
                fetchUsers();

            } catch (err) {
                console.error('Error al eliminar usuario:', err.response?.data || err.message);
                setError('Error al eliminar el usuario. Por favor, verifica los permisos.');
            }
        }
    };
    
    // --- Renderizado Condicional ---

    if (!isAdmin) {
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