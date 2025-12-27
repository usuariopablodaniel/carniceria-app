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

    // --- ESTADOS PARA HISTORIAL DE TRANSACCIONES ---
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [loadingTransactions, setLoadingTransactions] = useState(false);
    const [transactionError, setTransactionError] = useState(null);

    const fetchUsers = useCallback(async () => {
        if (!isAdmin || !token) {
            setLoading(false);
            if (!isAdmin) setError('Acceso denegado.');
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/auth/users');
            // Filtramos para no mostrarse a sí mismo si se desea, o mostrar todos
            const filteredUsers = response.data.users.filter(u => u.id !== user.id);
            const sortedUsers = filteredUsers.sort((a, b) => b.puntos_actuales - a.puntos_actuales);
            setUsers(sortedUsers);
        } catch (err) {
            console.error(err);
            setError('Error al cargar usuarios.');
        } finally {
            setLoading(false);
        }
    }, [isAdmin, token, user]);

    // --- CARGAR HISTORIAL DE TRANSACCIONES ---
    const fetchTransactions = useCallback(async (userId) => {
        if (!userId) return;
        setLoadingTransactions(true);
        setTransactionError(null);
        setRecentTransactions([]); // Limpiar estado anterior

        try {
            // Esta ruta debe coincidir con la definida en TransactionRoutes.js
            const response = await api.get(`/transactions/user/${userId}`);
            setRecentTransactions(response.data);
        } catch (err) {
            console.error('Error fetching transactions:', err);
            setTransactionError('No se pudo cargar el historial.');
        } finally {
            setLoadingTransactions(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setCurrentUserToEdit(null);
        setNewRole('');
        // Limpiamos transacciones al cerrar para evitar flashes de datos viejos la próxima vez
        setRecentTransactions([]); 
        setTransactionError(null);
    };

    const handleEditClick = (userToEdit) => {
        setCurrentUserToEdit(userToEdit);
        setNewRole(userToEdit.role);
        setShowEditModal(true);
        
        // Iniciar carga de transacciones inmediatamente al abrir el modal
        fetchTransactions(userToEdit.id);
    };

    const handleDeleteUser = async (userId, userName) => {
        if (window.confirm(`¿Eliminar al usuario ${userName}?`)) {
            try {
                await api.delete(`/auth/users/${userId}`);
                fetchUsers();
                if(currentUserToEdit && currentUserToEdit.id === userId) {
                    handleCloseEditModal();
                }
            } catch (err) {
                alert('Error al eliminar usuario.');
            }
        }
    };

    const handleUpdateRole = async () => {
        if (!currentUserToEdit || !newRole) return;
        try {
            await api.put(`/auth/users/${currentUserToEdit.id}`, { role: newRole });
            handleCloseEditModal();
            fetchUsers();
        } catch (err) {
            alert('Error al actualizar rol.');
        }
    };

    const filteredUsers = users.filter(u => 
        (u.nombre?.toLowerCase().includes(searchTerm.toLowerCase())) || 
        (u.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Renderizado de tabla de transacciones dentro del modal
    const renderTransactionsTable = () => {
        if (loadingTransactions) return <div className="text-center my-3"><Spinner animation="border" size="sm" /> Cargando historial...</div>;
        if (transactionError) return <Alert variant="warning" className="mt-2">{transactionError}</Alert>;
        if (!recentTransactions || recentTransactions.length === 0) return <Alert variant="info" className="mt-2">No hay transacciones registradas.</Alert>;

        return (
            <Table striped bordered hover size="sm" className="mt-2">
                <thead className="table-light">
                    <tr>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Detalle</th>
                        <th>Puntos</th>
                        <th>Resp.</th>
                    </tr>
                </thead>
                <tbody>
                    {recentTransactions.map((tx, idx) => (
                        <tr key={idx}>
                            <td style={{fontSize: '0.9em'}}>{new Date(tx.transaction_date).toLocaleDateString()} {new Date(tx.transaction_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                            <td>
                                <span className={tx.transaction_type === 'REDEMPTION' ? 'badge bg-warning text-dark' : 'badge bg-success'}>
                                    {tx.transaction_type === 'REDEMPTION' ? 'Canje' : 'Carga'}
                                </span>
                            </td>
                            <td style={{fontSize: '0.9em'}}>
                                {tx.transaction_type === 'REDEMPTION' 
                                    ? `Canjeó: ${tx.producto_canjeado}` 
                                    : `Compra: $${tx.monto_compra}`}
                            </td>
                            <td className={tx.puntos_cantidad > 0 ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                                {tx.puntos_cantidad > 0 ? `+${tx.puntos_cantidad}` : tx.puntos_cantidad}
                            </td>
                            <td style={{fontSize: '0.85em'}}>{tx.scanner_user}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        );
    };

    if (loading) return <Container className="mt-5 text-center"><Spinner animation="grow" /></Container>;
    if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;

    // Helper para tabla principal
    const MainUserTable = ({ data }) => (
        <Table striped bordered hover responsive>
            <thead><tr><th>ID</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Puntos</th><th>Acciones</th></tr></thead>
            <tbody>
                {data.map(u => (
                    <tr key={u.id}>
                        <td>{u.id}</td><td>{u.nombre}</td><td>{u.email}</td><td>{u.role}</td><td>{u.puntos_actuales}</td>
                        <td>
                            <Button variant="info" size="sm" className="me-2" onClick={() => handleEditClick(u)}>Ver/Editar</Button>
                            <Button variant="danger" size="sm" onClick={() => handleDeleteUser(u.id, u.nombre)}>X</Button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </Table>
    );

    return (
        <Container className="mt-4">
            <h2 className="mb-4">Gestión de Usuarios</h2>
            
            {users.length > 0 ? <MainUserTable data={users.slice(0, 10)} /> : <Alert variant="info">No hay usuarios.</Alert>}
            
            <div className="d-grid gap-2 d-md-block mt-3">
                <Button variant="primary" onClick={() => setShowAllUsersModal(true)}>Ver Lista Completa ({users.length})</Button>
            </div>

            {/* Modal Lista Completa */}
            <Modal show={showAllUsersModal} onHide={() => setShowAllUsersModal(false)} size="xl">
                <Modal.Header closeButton><Modal.Title>Todos los Usuarios</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form.Control className="mb-3" placeholder="Buscar usuario..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    <MainUserTable data={filteredUsers} />
                </Modal.Body>
                <Modal.Footer><Button variant="secondary" onClick={() => setShowAllUsersModal(false)}>Cerrar</Button></Modal.Footer>
            </Modal>

            {/* Modal Editar / Historial */}
            <Modal show={showEditModal} onHide={handleCloseEditModal} size="xl">
                <Modal.Header closeButton><Modal.Title>Usuario: {currentUserToEdit?.nombre}</Modal.Title></Modal.Header>
                <Modal.Body>
                    {/* AGREGADO: align-items-start para que funcione el sticky */}
                    <div className="row align-items-start">
                        <div className="col-md-4">
                            {/* AGREGADO: Contenedor sticky para la información del usuario */}
                            <div style={{ position: 'sticky', top: '0' }}>
                                <div className="p-3 border rounded bg-light">
                                    <h5 className="mb-3">Información del Usuario</h5>
                                    <ListGroup variant="flush" className="mb-3">
                                        <ListGroup.Item className="bg-transparent px-0"><strong>Email:</strong><br/> {currentUserToEdit?.email}</ListGroup.Item>
                                        <ListGroup.Item className="bg-transparent px-0"><strong>Puntos Actuales:</strong><br/> <span className="fs-4 text-primary fw-bold">{currentUserToEdit?.puntos_actuales}</span></ListGroup.Item>
                                    </ListGroup>
                                    
                                    <Form.Group className="mt-3">
                                        <Form.Label><strong>Rol Asignado:</strong></Form.Label>
                                        <Form.Select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                                            <option value="user">Usuario</option>
                                            <option value="employee">Empleado</option>
                                            <option value="admin">Administrador</option>
                                        </Form.Select>
                                    </Form.Group>
                                    
                                    <div className="d-grid gap-2 mt-4">
                                        <Button variant="primary" onClick={handleUpdateRole}>Guardar Rol</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="col-md-8">
                            <h5 className="mb-3">Historial Completo de Transacciones</h5>
                            {renderTransactionsTable()}
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseEditModal}>Cerrar</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default UserManagementPage;