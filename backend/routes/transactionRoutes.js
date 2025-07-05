
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Configuración de la base de datos
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Función auxiliar para calcular puntos
const calculatePoints = (amount) => {
    // 1 punto por cada $10,000 pesos de compra
    // Usamos Math.floor para redondear hacia abajo, como acordamos (ej. $19,900 = 1 punto)
    return Math.floor(amount / 10000);
};

// @route   POST /api/transactions/purchase
// @desc    Registrar una compra y asignar puntos al usuario
// @access  Private (solo admins/empleados autorizados)
router.post('/purchase', protect, authorizeRoles('admin', 'employee'), async (req, res) => {
    // Esperamos recibir el userId (del QR escaneado) y el monto de la compra
    const { userId, amount } = req.body;

    // Validación básica
    if (!userId || !amount || isNaN(amount) || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'ID de usuario y monto de compra válidos son obligatorios.' });
    }

    const parsedAmount = parseFloat(amount);
    const pointsEarned = calculatePoints(parsedAmount);

    try {
        // 1. Verificar si el usuario existe
        const userCheck = await pool.query('SELECT puntos_actuales FROM clientes WHERE id = $1', [userId]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        // 2. Actualizar los puntos del usuario
        const updateResult = await pool.query(
            'UPDATE clientes SET puntos_actuales = puntos_actuales + $1 WHERE id = $2 RETURNING puntos_actuales',
            [pointsEarned, userId]
        );

        // Opcional: Registrar la transacción en una tabla de historial de transacciones si la tuvieras
        // INSERT INTO transacciones (cliente_id, tipo, monto, puntos_ganados, fecha) VALUES ($1, 'compra', $2, $3, NOW());

        res.status(200).json({
            message: `Compra registrada. ${pointsEarned} puntos asignados.`,
            newPoints: updateResult.rows[0].puntos_actuales
        });

    } catch (err) {
        console.error('Error al registrar compra y asignar puntos:', err.message);
        res.status(500).json({ error: 'Error interno del servidor al procesar la compra.' });
    }
});

// @route   POST /api/transactions/redeem
// @desc    Registrar un canje de puntos
// @access  Private (solo admins/empleados autorizados)
router.post('/redeem', protect, authorizeRoles('admin', 'employee'), async (req, res) => {
    // Esperamos recibir el userId (del QR escaneado) y la cantidad de puntos a canjear
    const { userId, pointsToRedeem, productId } = req.body; // productId es opcional, para registrar qué se canjeó

    // Validación básica
    if (!userId || !pointsToRedeem || isNaN(pointsToRedeem) || parseInt(pointsToRedeem) <= 0) {
        return res.status(400).json({ error: 'ID de usuario y puntos a canjear válidos son obligatorios.' });
    }

    const parsedPointsToRedeem = parseInt(pointsToRedeem);

    try {
        // 1. Verificar si el usuario existe y tiene suficientes puntos
        const userCheck = await pool.query('SELECT puntos_actuales FROM clientes WHERE id = $1', [userId]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }
        const currentPoints = userCheck.rows[0].puntos_actuales;

        if (currentPoints < parsedPointsToRedeem) {
            return res.status(400).json({ error: `Puntos insuficientes. El usuario tiene ${currentPoints} puntos y necesita ${parsedPointsToRedeem}.` });
        }

        // 2. Decrementar los puntos del usuario
        const updateResult = await pool.query(
            'UPDATE clientes SET puntos_actuales = puntos_actuales - $1 WHERE id = $2 RETURNING puntos_actuales',
            [parsedPointsToRedeem, userId]
        );

        // Opcional: Registrar la transacción de canje
        // INSERT INTO transacciones (cliente_id, tipo, puntos_canjeados, producto_canjeado_id, fecha) VALUES ($1, 'canje', $2, $3, NOW());

        res.status(200).json({
            message: `Canje de ${parsedPointsToRedeem} puntos registrado.`,
            newPoints: updateResult.rows[0].puntos_actuales
        });

    } catch (err) {
        console.error('Error al registrar canje de puntos:', err.message);
        res.status(500).json({ error: 'Error interno del servidor al procesar el canje.' });
    }
});

// @route   GET /api/users/:id/points
// @desc    Obtener los puntos actuales de un usuario
// @access  Private (cualquier usuario autenticado puede ver sus propios puntos, admin puede ver los de cualquiera)
router.get('/:id/points', protect, async (req, res) => {
    const { id } = req.params;
    const requestingUser = req.user; // Usuario autenticado del token

    // Lógica de autorización: un usuario solo puede ver sus propios puntos, a menos que sea admin
    if (requestingUser.role !== 'admin' && requestingUser.id.toString() !== id.toString()) {
        return res.status(403).json({ error: 'No autorizado para ver los puntos de este usuario.' });
    }

    try {
        const result = await pool.query('SELECT puntos_actuales FROM clientes WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }
        res.status(200).json({ points: result.rows[0].puntos_actuales });
    } catch (err) {
        console.error('Error al obtener puntos del usuario:', err.message);
        res.status(500).json({ error: 'Error interno del servidor al obtener los puntos.' });
    }
});


module.exports = router;
