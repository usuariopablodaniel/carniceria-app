import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Container, Table, Button, Spinner, Alert, Modal, Form, Row, Col, Card } from 'react-bootstrap';

// --- Contexto de Autenticación (simulado) ---
// En una aplicación real, este contexto estaría en un archivo separado.
// Aquí lo incluimos para que el componente sea autocontenido.
const AuthContext = createContext(null);

const useAuth = () => {
    // Simulamos un usuario administrador con un token y un ID
    const user = { id: 'admin-user-123', email: 'admin@example.com', nombre: 'Admin', role: 'admin' };
    const token = 'fake-admin-token';
    return useContext(AuthContext) || { user, token, isAdmin: true };
};

// --- Simulación de la API (Axios) ---
// En una aplicación real, este objeto haría llamadas reales a un servidor.
// Aquí simulamos las respuestas para que la aplicación funcione de forma independiente.
const api = {
    get: async (url) => {
        // Simulamos una demora de red
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Simulamos una lista de usuarios de la base de datos
        const users = [
            { id: '1', nombre: 'Juan Pérez', email: 'juan.perez@email.com', telefono: '1122334455', role: 'user', puntos_actuales: 250, fecha_registro: '2023-01-15' },
            { id: '2', nombre: 'Ana Gómez', email: 'ana.gomez@email.com', telefono: '1133445566', role: 'user', puntos_actuales: 120, fecha_registro: '2023-02-20' },
            { id: '3', nombre: 'Carlos Ruiz', email: 'carlos.ruiz@email.com', telefono: '1144556677', role: 'employee', puntos_actuales: 50, fecha_registro: '2023-03-10' },
            { id: '4', nombre: 'Laura Torres', email: 'laura.torres@email.com', telefono: '1155667788', role: 'user', puntos_actuales: 300, fecha_registro: '2023-04-05' },
            { id: '5', nombre: 'Pedro Castro', email: 'pedro.castro@email.com', telefono: '1166778899', role: 'user', puntos_actuales: 80, fecha_registro: '2023-05-22' },
            { id: '6', nombre: 'Sofía López', email: 'sofia.lopez@email.com', telefono: '1177889900', role: 'user', puntos_actuales: 450, fecha_registro: '2023-06-18' },
            { id: '7', nombre: 'Daniela Marín', email: 'daniela.marin@email.com', telefono: '1188990011', role: 'user', puntos_actuales: 95, fecha_registro: '2023-07-01' },
            { id: '8', nombre: 'Jorge Vidal', email: 'jorge.vidal@email.com', telefono: '1199001122', role: 'user', puntos_actuales: 180, fecha_registro: '2023-08-09' },
            { id: '9', nombre: 'Isabel Díaz', email: 'isabel.diaz@email.com', telefono: '1100112233', role: 'user', puntos_actuales: 210, fecha_registro: '2023-09-14' },
            { id: '10', nombre: 'Martín Romero', email: 'martin.romero@email.com', telefono: '1111223344', role: 'user', puntos_actuales: 75, fecha_registro: '2023-10-25' },
            { id: '11', nombre: 'Ana María', email: 'anamaria@email.com', telefono: '1122334455', role: 'user', puntos_actuales: 30, fecha_registro: '2023-11-01' },
            { id: 'admin-user-123', nombre: 'Admin', email: 'admin@example.com', role: 'admin', puntos_actuales: 9999, fecha_registro: '2023-01-01' },
        ];
        return { data: { users: users } };
    },
    put: async (url, data) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return { status: 200, data: { message: 'Rol actualizado' } };
    },
    delete: async (url) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return { status: 200, data: { message: 'Usuario eliminado' } };
    },
};

const UserManagementPage = () => {
    const { token, isAdmin, user } = useAuth();
    const [users, setUsers] = useState([]); // Almacena TODOS los usuarios
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estados para la funcionalidad de visualización y búsqueda
    const [searchTerm, setSearchTerm] = useState('');
    const [showAllUsersModal, setShowAllUsersModal] = useState(false);

    // Estados para el modal de edición
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentUserToEdit, setCurrentUserToEdit] = useState(null);
    const [newRole, setNewRole] = useState('');
    
    // Estados para el modal de confirmación de eliminación
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

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

    // --- Funciones para el Modal de Edición ---
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
            await api.put(
                `/auth/users/${currentUserToEdit.id}`,
                { role: newRole }
            );
            handleCloseEditModal();
            fetchUsers();
        } catch (err) {
            console.error('Error al actualizar rol:', err.response?.data || err.message);
            setError('Error al actualizar el rol del usuario: ' + (err.response?.data?.error || err.message || 'Error desconocido'));
        }
    };

    // --- Funciones para el Modal de Confirmación de Eliminación ---
    const handleDeleteClick = useCallback((user) => {
        setUserToDelete(user);
        setShowDeleteModal(true);
    }, []);
    
    const handleConfirmDelete = async () => {
        if (!userToDelete) return;
        
        try {
            await api.delete(
                `/auth/users/${userToDelete.id}`
            );
            fetchUsers();
            setShowDeleteModal(false);
            setUserToDelete(null);
        } catch (err) {
            console.error('Error al eliminar usuario:', err.response?.data || err.message);
            setError('Error al eliminar el usuario: ' + (err.response?.data?.error || err.message || 'Error desconocido'));
        }
    };
    
    const handleCancelDelete = () => {
        setShowDeleteModal(false);
        setUserToDelete(null);
    };

    // --- Lógica para el buscador ---
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

    // Funcionalidad para renderizar los usuarios en la tabla
    const renderUserTable = (userList) => (
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
                {userList.map(u => (
                    <tr key={u.id}>
                        <td>{u.id}</td>
                        <td>{u.nombre}</td>
                        <td>{u.email}</td>
                        <td>{u.telefono || 'N/A'}</td>
                        <td>{u.role}</td>
                        <td>{u.puntos_actuales}</td>
                        <td>{formatDate(u.fecha_registro)}</td> 
                        <td>
                            <Button 
                                variant="warning" 
                                size="sm" 
                                className="me-2"
                                onClick={() => handleEditClick(u)} 
                            >
                                Editar Rol
                            </Button>
                            <Button 
                                variant="danger" 
                                size="sm"
                                onClick={() => handleDeleteClick(u)} 
                            >
                                Eliminar
                            </Button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </Table>
    );

    // Funcionalidad para renderizar los usuarios en tarjetas para móviles
    const renderUserCards = (userList) => (
        <Row xs={1} className="g-4">
            {userList.map(u => (
                <Col key={u.id}>
                    <Card>
                        <Card.Body>
                            <Card.Title>{u.nombre}</Card.Title>
                            <Card.Subtitle className="mb-2 text-muted">ID: {u.id}</Card.Subtitle>
                            <Card.Text>
                                <strong>Email:</strong> {u.email}<br />
                                <strong>Rol:</strong> {u.role}<br />
                                <strong>Puntos:</strong> {u.puntos_actuales}<br />
                                <strong>Registro:</strong> {formatDate(u.fecha_registro)}
                            </Card.Text>
                            <div className="d-flex justify-content-end">
                                <Button 
                                    variant="warning" 
                                    size="sm" 
                                    className="me-2"
                                    onClick={() => handleEditClick(u)} 
                                >
                                    Editar Rol
                                </Button>
                                <Button 
                                    variant="danger" 
                                    size="sm"
                                    onClick={() => handleDeleteClick(u)} 
                                >
                                    Eliminar
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            ))}
        </Row>
    );

    return (
        <Container className="mt-5">
            <h1 className="mb-4">Gestión de Usuarios</h1>

            {/* Muestra los primeros 10 usuarios filtrados en la vista principal */}
            <div className="d-none d-md-block">
                {filteredUsers.slice(0, 10).length === 0 ? (
                    <Alert variant="info">No se encontraron usuarios para mostrar. {filteredUsers.length > 0 && "Usa el botón para ver todos los resultados."}</Alert>
                ) : (
                    <>
                        <p className="text-muted">Mostrando los primeros 10 usuarios...</p>
                        {renderUserTable(filteredUsers.slice(0, 10))}
                    </>
                )}
            </div>

            {/* Muestra los primeros 10 usuarios filtrados en vista de tarjetas para móviles */}
            <div className="d-md-none">
                {filteredUsers.slice(0, 10).length === 0 ? (
                    <Alert variant="info">No se encontraron usuarios para mostrar. {filteredUsers.length > 0 && "Usa el botón para ver todos los resultados."}</Alert>
                ) : (
                    <>
                        <p className="text-muted">Mostrando los primeros 10 usuarios...</p>
                        {renderUserCards(filteredUsers.slice(0, 10))}
                    </>
                )}
            </div>

            {/* Botón para abrir el modal de "Ver todos los usuarios" */}
            <div className="text-center my-4">
                <Button variant="primary" onClick={() => setShowAllUsersModal(true)}>
                    Ver todos los usuarios ({filteredUsers.length})
                </Button>
            </div>

            {/* Modal para ver y buscar todos los usuarios */}
            <Modal show={showAllUsersModal} onHide={() => setShowAllUsersModal(false)} size="xl">
                <Modal.Header closeButton>
                    <Modal.Title>Todos los Usuarios</Modal.Title>
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
                        <div className="overflow-auto" style={{ maxHeight: '70vh' }}>
                            <div className="d-none d-md-block">
                                {renderUserTable(filteredUsers)}
                            </div>
                            <div className="d-md-none">
                                {renderUserCards(filteredUsers)}
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAllUsersModal(false)}>
                        Cerrar
                    </Button>
                </Modal.Footer>
            </Modal>
            
            {/* Modal para Editar Rol */}
            <Modal show={showEditModal} onHide={handleCloseEditModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Detalles y Acciones para {currentUserToEdit?.nombre}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p><strong>ID:</strong> {currentUserToEdit?.id}</p>
                    <p><strong>Email:</strong> {currentUserToEdit?.email}</p>
                    <p><strong>Puntos:</strong> {currentUserToEdit?.puntos_actuales}</p>
                    <hr />
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
                    <Button variant="warning" onClick={handleUpdateRole}>
                        Guardar Rol
                    </Button>
                </Modal.Footer>
            </Modal>
            
            {/* Modal de Confirmación para Eliminar Usuario */}
            <Modal show={showDeleteModal} onHide={handleCancelDelete}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirmar Eliminación</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    ¿Estás seguro de que deseas eliminar a <strong>{userToDelete?.nombre}</strong>?
                    Esta acción no se puede deshacer.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCancelDelete}>
                        Cancelar
                    </Button>
                    <Button variant="danger" onClick={handleConfirmDelete}>
                        Eliminar
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default UserManagementPage;
