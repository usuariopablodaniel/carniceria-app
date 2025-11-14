import React, { useState, useEffect, useCallback } from 'react';
import { Container, Table, Button, Spinner, Alert, Modal, Form, ListGroup } from 'react-bootstrap'; 
import { useAuth } from '../context/AuthContext';
import api from '../api/axios'; 

const UserManagementPage = () => {
    const { token, isAdmin, user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [showAllUsersModal, setShowAllUsersModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [showEditModal, setShowEditModal] = useState(false);
    const [currentUserToEdit, setCurrentUserToEdit] = useState(null);
    const [newRole, setNewRole] = useState('');

    // --- ESTADOS PARA TRANSACCIONES ---
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [loadingTransactions, setLoadingTransactions] = useState(false);
    const [transactionError, setTransactionError] = useState(null);
    // ----------------------------------------

    const fetchUsers = useCallback(async () => {
        if (!isAdmin || !token) {
            setLoading(false);
            if (!isAdmin) setError('Acceso denegado. Esta página es solo para administradores.');
            return; 
        }
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/auth/users');
            const filteredUsers = response.data.users.filter(u => u.id !== user.id);

            const sortedUsers = filteredUsers.sort((a, b) => b.puntos_actuales - a.puntos_actuales);
            
            setUsers(sortedUsers); 
        } catch (err) {
            console.error('Error al obtener la lista de usuarios:', err.response?.data || err.message);
            setError('Error al cargar usuarios. Verifica tu conexión o permisos.');
        } finally {
            setLoading(false);
        }
    }, [isAdmin, token, user]);

    // --- FUNCIÓN NUEVA: Cargar Transacciones ---
    const fetchTransactions = useCallback(async (userId) => {
        setLoadingTransactions(true);
        setTransactionError(null);
        try {
            // RUTA CORREGIDA: Ahora usa /transactions/:userId para una ruta RESTful más limpia.
            const response = await api.get(`/transactions/${userId}`); 
            setRecentTransactions(response.data);
        } catch (err) {
            console.error('Error al cargar transacciones:', err.response?.data || err.message);
            setTransactionError('Error al cargar las transacciones. El backend devolvió un error: ' + (err.response?.data?.error || 'Desconocido'));
            setRecentTransactions([]);
        } finally {
            setLoadingTransactions(false);
        }
    }, []);
    // ----------------------------------------

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleCloseEditModal = useCallback(() => {
        setShowEditModal(false);
        setCurrentUserToEdit(null);
        setNewRole('');
        setRecentTransactions([]);
        setTransactionError(null);
    }, []);

    const handleDeleteUser = useCallback(async (userId, userName) => {
        // NOTE: Debes reemplazar window.confirm por un modal personalizado en producción
        if (window.confirm(`¿Estás seguro de que deseas eliminar al usuario ${userName}?`)) {
            try {
                await api.delete(`/auth/users/${userId}`);
                fetchUsers();
                if(currentUserToEdit && currentUserToEdit.id === userId) {
                    handleCloseEditModal();
                }
            } catch (err) {
                console.error('Error al eliminar usuario:', err.response?.data || err.message);
                setError('Error al eliminar el usuario: ' + (err.response?.data?.error || 'Error desconocido'));
            }
        }
    }, [fetchUsers, currentUserToEdit, handleCloseEditModal]);

    const handleEditClick = useCallback((userToEdit) => {
        setCurrentUserToEdit(userToEdit);
        setNewRole(userToEdit.role); 
        setShowEditModal(true);
        
        // Cargar las transacciones inmediatamente
        fetchTransactions(userToEdit.id); 

    }, [fetchTransactions]);

    const handleUpdateRole = useCallback(async () => {
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
            setError('Error al actualizar el rol: ' + (err.response?.data?.error || 'Error desconocido'));
        }
    }, [currentUserToEdit, newRole, handleCloseEditModal, fetchUsers]);
    
    const filteredUsers = users.filter(u =>
        (u.nombre && u.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.id && u.id.toString().includes(searchTerm))
    );

    if (!isAdmin && !loading) return <Alert variant="danger" className="mt-5">Acceso denegado.</Alert>;
    if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
    if (error) return <Alert variant="danger" className="mt-5">{error}</Alert>;

    const renderUsersTable = (userList) => (
        <Table striped bordered hover responsive>
            <thead><tr><th>ID</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Puntos</th><th>Acciones</th></tr></thead>
            <tbody>
                {userList.map(u => (
                    <tr key={u.id}>
                        <td>{u.id}</td><td>{u.nombre}</td><td>{u.email}</td><td>{u.role}</td><td>{u.puntos_actuales}</td>
                        <td>
                            <Button variant="warning" size="sm" className="me-2" onClick={() => handleEditClick(u)}>Detalles/Editar</Button>
                            <Button variant="danger" size="sm" onClick={() => handleDeleteUser(u.id, u.nombre)}>Eliminar</Button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </Table>
    );

    // --- Función de ayuda para renderizar la tabla de transacciones (Mejorada) ---
    const renderTransactionsTable = () => {
        if (loadingTransactions) {
            return <div className="text-center"><Spinner animation="border" size="sm" className="me-2" /> Cargando historial...</div>;
        }
        if (transactionError) {
            return <Alert variant="danger">{transactionError}</Alert>;
        }
        if (recentTransactions.length === 0) {
            return <Alert variant="info">No se encontraron transacciones recientes.</Alert>;
        }

        return (
            <Table striped bordered hover size="sm">
                <thead>
                    <tr>
                        <th>Fecha y Hora</th>
                        <th>Tipo</th>
                        <th>Detalle</th>
                        <th>Puntos</th>
                        <th>Escaneado por</th>
                    </tr>
                </thead>
                <tbody>
                    {recentTransactions.map((tx, index) => (
                        <tr key={index}>
                            <td>{new Date(tx.transaction_date).toLocaleString()}</td>
                            <td>
                                <strong>{tx.transaction_type === 'REDEMPTION' ? 'Canje (REDEMPTION)' : 'Carga (COMPRA)'}</strong>
                            </td>
                            <td>
                                {tx.transaction_type === 'REDEMPTION' 
                                    ? `Canjeó ${tx.producto_canjeado}` 
                                    : `Compra de $${tx.monto_compra || 'N/A'}`
                                }
                            </td>
                            <td>
                                <span className={tx.puntos_cantidad > 0 ? 'text-success' : 'text-danger'}>
                                    {tx.puntos_cantidad}
                                </span>
                            </td>
                            <td>{tx.scanner_user || 'Sistema/Admin'}</td> 
                        </tr>
                    ))}
                </tbody>
            </Table>
        );
    };
    // ----------------------------------------


    return (
        <Container className="mt-5">
            <h1 className="mb-4">Gestión de Usuarios</h1>
            <p>Mostrando los 10 usuarios con más puntos. Para ver la lista completa, haz clic en el botón.</p>
            {users.length > 0 ? renderUsersTable(users.slice(0, 10)) : <Alert variant="info">No hay usuarios.</Alert>}
            <Button variant="primary" onClick={() => setShowAllUsersModal(true)} className="mt-3">Ver todos los usuarios ({users.length})</Button>

            <Modal show={showAllUsersModal} onHide={() => setShowAllUsersModal(false)} size="xl" centered>
                <Modal.Header closeButton><Modal.Title>Lista Completa de Usuarios</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-4">
                        <Form.Control type="text" placeholder="Buscar por nombre, email o ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </Form.Group>
                    {filteredUsers.length === 0 ? <Alert variant="info">No se encontraron usuarios.</Alert> : renderUsersTable(filteredUsers)}
                </Modal.Body>
                <Modal.Footer><Button variant="secondary" onClick={() => setShowAllUsersModal(false)}>Cerrar</Button></Modal.Footer>
            </Modal>

            {/* --- MODAL DE EDICIÓN MODIFICADO CON HISTORIAL --- */}
            <Modal show={showEditModal} onHide={handleCloseEditModal} size="xl">
                <Modal.Header closeButton><Modal.Title>Detalles de {currentUserToEdit?.nombre}</Modal.Title></Modal.Header>
                <Modal.Body>
                    {/* Información Básica */}
                    <ListGroup className="mb-4">
                        <ListGroup.Item><strong>ID:</strong> {currentUserToEdit?.id}</ListGroup.Item>
                        <ListGroup.Item><strong>Email:</strong> {currentUserToEdit?.email}</ListGroup.Item>
                        <ListGroup.Item><strong>Rol Actual:</strong> {currentUserToEdit?.role}</ListGroup.Item>
                        <ListGroup.Item className="bg-success text-white"><strong>Puntos Actuales:</strong> {currentUserToEdit?.puntos_actuales}</ListGroup.Item>
                    </ListGroup>
                    
                    {/* Sección de Edición de Rol */}
                    <h5 className="mb-3">Editar Rol</h5>
                    <Form.Group className="mb-4">
                        <Form.Label>Selecciona Nuevo Rol:</Form.Label>
                        <Form.Control as="select" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                            <option value="user">Usuario (user)</option><option value="admin">Administrador (admin)</option><option value="employee">Empleado (employee)</option>
                        </Form.Control>
                    </Form.Group>

                    {/* Sección de Historial de Transacciones */}
                    <h5 className="mt-4 mb-3">Últimas 10 Transacciones</h5>
                    {renderTransactionsTable()}

                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseEditModal}>Cancelar</Button>
                    <Button variant="warning" onClick={handleUpdateRole}>Guardar Rol</Button>
                    <Button variant="danger" className="ms-auto" onClick={() => handleDeleteUser(currentUserToEdit?.id, currentUserToEdit?.nombre)}>Eliminar Usuario</Button>
                </Modal.Footer>
            </Modal>
            {/* ---------------------------------------------------- */}
        </Container>
    );
};

export default UserManagementPage;