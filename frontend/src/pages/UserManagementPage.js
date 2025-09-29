// frontend/src/pages/UserManagementPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Table, Button, Spinner, Alert, Modal, Form } from 'react-bootstrap';

// --- INICIO: Simulación de datos y API ---
// En un entorno real, esto vendría de '../context/AuthContext'
const useAuth = () => ({
    token: 'fake-jwt-token',
    isAdmin: true,
    user: { id: 0, nombre: 'Admin' } // Usuario administrador que no aparecerá en la lista
});

// Datos de ejemplo para simular la respuesta de la API
const mockUsersData = [
    { id: 1, nombre: 'Elena Rodriguez', email: 'elena.r@example.com', role: 'user', puntos_actuales: 2350 },
    { id: 2, nombre: 'Carlos Gomez', email: 'carlos.g@example.com', role: 'user', puntos_actuales: 2100 },
    { id: 3, nombre: 'Beatriz Martin', email: 'beatriz.m@example.com', role: 'employee', puntos_actuales: 1980 },
    { id: 4, nombre: 'David Fernandez', email: 'david.f@example.com', role: 'user', puntos_actuales: 1800 },
    { id: 5, nombre: 'Laura Sanchez', email: 'laura.s@example.com', role: 'user', puntos_actuales: 1750 },
    { id: 6, nombre: 'Pablo Jimenez', email: 'pablo.j@example.com', role: 'user', puntos_actuales: 1600 },
    { id: 7, nombre: 'Sofia Moreno', email: 'sofia.m@example.com', role: 'admin', puntos_actuales: 1550 },
    { id: 8, nombre: 'Javier Alonso', email: 'javier.a@example.com', role: 'user', puntos_actuales: 1400 },
    { id: 9, nombre: 'Maria Romero', email: 'maria.r@example.com', role: 'employee', puntos_actuales: 1320 },
    { id: 10, nombre: 'Sergio Navarro', email: 'sergio.n@example.com', role: 'user', puntos_actuales: 1200 },
    { id: 11, nombre: 'Isabel Torres', email: 'isabel.t@example.com', role: 'user', puntos_actuales: 1100 },
    { id: 12, nombre: 'Adrian Ruiz', email: 'adrian.r@example.com', role: 'user', puntos_actuales: 950 },
];

const mockTransactionsData = {
    1: Array.from({ length: 10 }, (_, i) => ({ id: 100 + i, tipo: i % 2 === 0 ? 'Canje' : 'Acumulación', monto: -(i * 15), descripcion: `Producto ${i+1}`, fecha: `2023-10-${28-i}T10:00:00Z` })),
    2: Array.from({ length: 8 }, (_, i) => ({ id: 200 + i, tipo: 'Acumulación', monto: (i * 25), descripcion: `Bono ${i+1}`, fecha: `2023-10-${25-i}T11:30:00Z` })),
    3: [{ id: 301, tipo: 'Ajuste', monto: 500, descripcion: 'Corrección manual', fecha: '2023-10-20T15:00:00Z' }],
};

// En un entorno real, esto vendría de '../api/axios'
const api = {
    get: (url) => new Promise(resolve => {
        setTimeout(() => {
            if (url === '/auth/users') {
                resolve({ data: { users: mockUsersData } });
            } else if (url.startsWith('/transactions/user/')) {
                const userId = parseInt(url.split('/')[3].split('?')[0]);
                resolve({ data: { transactions: mockTransactionsData[userId] || [] } });
            }
        }, 500);
    }),
    put: (url, data) => new Promise(resolve => setTimeout(() => resolve({ status: 200, data }), 500)),
    delete: (url) => new Promise(resolve => setTimeout(() => resolve({ status: 204 }), 500)),
};
// --- FIN: Simulación de datos y API ---


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

    const [showTransactionsModal, setShowTransactionsModal] = useState(false);
    const [selectedUserForTx, setSelectedUserForTx] = useState(null);
    const [userTransactions, setUserTransactions] = useState([]);
    const [transactionsLoading, setTransactionsLoading] = useState(false);
    const [transactionsError, setTransactionsError] = useState(null);

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

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);
    
    const fetchUserTransactions = useCallback(async (userId) => {
        setTransactionsLoading(true);
        setTransactionsError(null);
        setUserTransactions([]);
        try {
            const response = await api.get(`/transactions/user/${userId}?limit=10`);
            setUserTransactions(response.data.transactions || []);
        } catch (err) {
            console.error('Error al obtener transacciones del usuario:', err.response?.data || err.message);
            setTransactionsError('No se pudieron cargar las transacciones. Inténtalo de nuevo.');
        } finally {
            setTransactionsLoading(false);
        }
    }, []);

    const handleViewTransactionsClick = useCallback((userToShowTx) => {
        setSelectedUserForTx(userToShowTx);
        setShowTransactionsModal(true);
        fetchUserTransactions(userToShowTx.id);
    }, [fetchUserTransactions]);

    const handleCloseTransactionsModal = useCallback(() => {
        setShowTransactionsModal(false);
        setSelectedUserForTx(null);
        setUserTransactions([]);
        setTransactionsError(null);
    }, []);

    const handleCloseEditModal = useCallback(() => {
        setShowEditModal(false);
        setCurrentUserToEdit(null);
        setNewRole('');
    }, []);

    const handleDeleteUser = useCallback(async (userId, userName) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar al usuario ${userName}?`)) {
            try {
                await api.delete(`/auth/users/${userId}`);
                // En la simulación, actualizamos el estado local directamente
                setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
                if(currentUserToEdit && currentUserToEdit.id === userId) {
                    handleCloseEditModal();
                }
            } catch (err) {
                console.error('Error al eliminar usuario:', err.response?.data || err.message);
                setError('Error al eliminar el usuario: ' + (err.response?.data?.error || 'Error desconocido'));
            }
        }
    }, [currentUserToEdit, handleCloseEditModal]);

    const handleEditClick = useCallback((userToEdit) => {
        setCurrentUserToEdit(userToEdit);
        setNewRole(userToEdit.role); 
        setShowEditModal(true);
    }, []);

    const handleUpdateRole = useCallback(async () => {
        if (!currentUserToEdit || !newRole) {
            handleCloseEditModal();
            return;
        }
        try {
            await api.put(`/auth/users/${currentUserToEdit.id}`, { role: newRole });
            // En la simulación, actualizamos el estado local directamente
            setUsers(prevUsers => prevUsers.map(u => u.id === currentUserToEdit.id ? { ...u, role: newRole } : u));
            handleCloseEditModal();
        } catch (err) {
            console.error('Error al actualizar rol:', err.response?.data || err.message);
            setError('Error al actualizar el rol: ' + (err.response?.data?.error || 'Error desconocido'));
        }
    }, [currentUserToEdit, newRole, handleCloseEditModal]);
    
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
                        <td>{u.id}</td>
                        <td onClick={() => handleViewTransactionsClick(u)} style={{ cursor: 'pointer', color: '#0d6efd', textDecoration: 'underline' }}>
                            {u.nombre}
                        </td>
                        <td>{u.email}</td>
                        <td>{u.role}</td>
                        <td>{u.puntos_actuales}</td>
                        <td>
                            <Button variant="warning" size="sm" className="me-2" onClick={() => handleEditClick(u)}>Editar</Button>
                            <Button variant="danger" size="sm" onClick={() => handleDeleteUser(u.id, u.nombre)}>Eliminar</Button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </Table>
    );

    return (
        <Container className="mt-5">
            <h1 className="mb-4">Gestión de Usuarios</h1>
            <p>Mostrando los 10 usuarios con más puntos. Haz clic en el nombre de un usuario para ver sus últimas transacciones o en el botón de abajo para ver la lista completa.</p>
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

            <Modal show={showEditModal} onHide={handleCloseEditModal}>
                <Modal.Header closeButton><Modal.Title>Detalles de {currentUserToEdit?.nombre}</Modal.Title></Modal.Header>
                <Modal.Body>
                    <p><strong>ID:</strong> {currentUserToEdit?.id}</p><p><strong>Email:</strong> {currentUserToEdit?.email}</p><p><strong>Puntos:</strong> {currentUserToEdit?.puntos_actuales}</p><hr />
                    <Form.Group>
                        <Form.Label>Selecciona Nuevo Rol:</Form.Label>
                        <Form.Control as="select" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                            <option value="user">Usuario (user)</option><option value="admin">Administrador (admin)</option><option value="employee">Empleado (employee)</option>
                        </Form.Control>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseEditModal}>Cancelar</Button>
                    <Button variant="warning" onClick={handleUpdateRole}>Guardar Rol</Button>
                    <Button variant="danger" className="ms-auto" onClick={() => handleDeleteUser(currentUserToEdit?.id, currentUserToEdit?.nombre)}>Eliminar Usuario</Button>
                </Modal.Footer>
            </Modal>
            
            {selectedUserForTx && (
                <Modal show={showTransactionsModal} onHide={handleCloseTransactionsModal} size="lg" centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Últimas 10 Transacciones de {selectedUserForTx.nombre}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {transactionsLoading && <div className="text-center"><Spinner animation="border" /></div>}
                        {transactionsError && <Alert variant="danger">{transactionsError}</Alert>}
                        {!transactionsLoading && !transactionsError && userTransactions.length === 0 && (
                            <Alert variant="info">Este usuario no tiene transacciones registradas.</Alert>
                        )}
                        {!transactionsLoading && !transactionsError && userTransactions.length > 0 && (
                            <Table striped bordered hover responsive>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Tipo</th>
                                        <th>Monto</th>
                                        <th>Descripción</th>
                                        <th>Fecha</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userTransactions.map(tx => (
                                        <tr key={tx.id}>
                                            <td>{tx.id}</td>
                                            <td>{tx.tipo}</td>
                                            <td>{tx.monto}</td>
                                            <td>{tx.descripcion}</td>
                                            <td>{new Date(tx.fecha).toLocaleString('es-AR')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseTransactionsModal}>Cerrar</Button>
                    </Modal.Footer>
                </Modal>
            )}
        </Container>
    );
};

export default UserManagementPage;

