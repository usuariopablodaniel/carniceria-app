// frontend/src/pages/UserManagementPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Table, Button, Spinner, Alert, Modal, Form, Row, Col, Card } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const UserManagementPage = () => {
    const { token, isAdmin, user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // <<< CAMBIO: Estados para el nuevo modal de la lista completa >>>
    const [showAllUsersModal, setShowAllUsersModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Estados para el modal de edición (sin cambios)
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

    const fetchUsers = useCallback(async () => {
        if (!isAdmin || !token) {
            setLoading(false);
            if (!isAdmin) {
                setError('Acceso denegado. Esta página es solo para administradores.');
            }
            return; 
        }

        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/auth/users');
            // Filtra para no mostrar el admin actual en la lista
            const filteredUsers = response.data.users.filter(u => u.id !== user.id);
            setUsers(filteredUsers);
            setLoading(false);
        } catch (err) {
            console.error('Error al obtener la lista de usuarios:', err.response?.data || err.message);
            setError('Error al cargar usuarios. Verifica tu conexión o permisos.');
            setLoading(false);
        }
    }, [isAdmin, token, user]);

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
            await api.put(`/auth/users/${currentUserToEdit.id}`, { role: newRole });
            handleCloseEditModal();
            fetchUsers();
        } catch (err) {
            console.error('Error al actualizar rol:', err.response?.data || err.message);
            setError('Error al actualizar el rol del usuario: ' + (err.response?.data?.error || 'Error desconocido'));
        }
    };

    // --- Funciones para Eliminar Usuario ---
    const handleDeleteUser = async (userId, userName) => {
        // NOTA: Se recomienda reemplazar window.confirm con un modal de confirmación personalizado.
        if (window.confirm(`¿Estás seguro de que deseas eliminar al usuario ${userName}? Esta acción no se puede deshacer.`)) {
            try {
                await api.delete(`/auth/users/${userId}`);
                fetchUsers();
                 // Si el usuario está en el modal de edición, cerrarlo
                if(currentUserToEdit && currentUserToEdit.id === userId) {
                    handleCloseEditModal();
                }
            } catch (err) {
                console.error('Error al eliminar usuario:', err.response?.data || err.message);
                setError('Error al eliminar el usuario: ' + (err.response?.data?.error || 'Error desconocido'));
            }
        }
    };

    // --- Lógica para el buscador (se usará en el modal) ---
    const filteredUsers = users.filter(u =>
        (u.nombre && u.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.id && u.id.toString().includes(searchTerm))
    );

    // --- Renderizado Condicional ---
    if (!isAdmin && !loading) {
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

    // <<< CAMBIO: Se encapsula la tabla en una función para reutilizarla en el modal >>>
    const renderUsersTable = (userList) => (
        <Table striped bordered hover responsive>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Puntos</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                {userList.map(u => (
                    <tr key={u.id}>
                        <td>{u.id}</td>
                        <td>{u.nombre}</td>
                        <td>{u.email}</td>
                        <td>{u.role}</td>
                        <td>{u.puntos_actuales}</td>
                        <td>
                            <Button variant="warning" size="sm" className="me-2" onClick={() => handleEditClick(u)}>
                                Editar
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => handleDeleteUser(u.id, u.nombre)}>
                                Eliminar
                            </Button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </Table>
    );


    return (
        <Container className="mt-5">
            <h1 className="mb-4">Gestión de Usuarios</h1>
            
            <p>Mostrando los primeros 10 usuarios. Para ver la lista completa, haz clic en el botón.</p>
            
            {/* <<< CAMBIO: La tabla principal ahora muestra solo los primeros 10 usuarios >>> */}
            {users.length > 0 ? (
                renderUsersTable(users.slice(0, 10))
            ) : (
                <Alert variant="info">No hay usuarios para mostrar.</Alert>
            )}

            {/* <<< CAMBIO: Botón para abrir el modal con la lista completa >>> */}
            <Button variant="primary" onClick={() => setShowAllUsersModal(true)} className="mt-3">
                Ver todos los usuarios ({users.length})
            </Button>
            
            {/* ------------------------------------------------------------------ */}
            {/* <<< CAMBIO: Nuevo Modal para mostrar TODOS los usuarios y buscar >>> */}
            <Modal show={showAllUsersModal} onHide={() => setShowAllUsersModal(false)} size="xl" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Lista Completa de Usuarios</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-4">
                        <Form.Control
                            type="text"
                            placeholder="Buscar por nombre, email o ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </Form.Group>

                    {filteredUsers.length === 0 ? (
                        <Alert variant="info">No se encontraron usuarios que coincidan con la búsqueda.</Alert>
                    ) : (
                        renderUsersTable(filteredUsers)
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAllUsersModal(false)}>
                        Cerrar
                    </Button>
                </Modal.Footer>
            </Modal>
            {/* ------------------------------------------------------------------ */}

            {/* Modal para Editar Rol (código sin cambios significativos) */}
            <Modal show={showEditModal} onHide={handleCloseEditModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Detalles de {currentUserToEdit?.nombre}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p><strong>ID:</strong> {currentUserToEdit?.id}</p>
                    <p><strong>Email:</strong> {currentUserToEdit?.email}</p>
                    <p><strong>Puntos:</strong> {currentUserToEdit?.puntos_actuales}</p>
                    <hr />
                    <Form.Group>
                        <Form.Label>Selecciona Nuevo Rol:</Form.Label>
                        <Form.Control as="select" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
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
                    <Button variant="warning" onClick={handleUpdateRole}>
                        Guardar Rol
                    </Button>
                    <Button variant="danger" className="ms-auto" onClick={() => handleDeleteUser(currentUserToEdit?.id, currentUserToEdit?.nombre)}>
                        Eliminar Usuario
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default UserManagementPage;
