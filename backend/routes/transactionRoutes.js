// backend/routes/transactions.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // Importa el middleware de protección

// >>>>>>>>>>>>>>> NUEVA IMPORTACIÓN DEL POOL DE LA BASE DE DATOS <<<<<<<<<<<<<<<<
const pool = require('../db'); // <-- CAMBIO AQUÍ: Importar el pool desde el nuevo archivo db.js

// @route   POST /api/transactions/purchase
// @desc    Register a purchase and assign points to a user
// @access  Private (Admin/Employee)
router.post('/purchase', protect, async (req, res) => {
    const { userId, amount } = req.body;
    const adminId = req.user.id; // ID del admin/empleado que realiza la operación

    if (!userId || !amount || amount <= 0) {
        return res.status(400).json({ error: 'ID de usuario y monto válidos son requeridos.' });
    }

    try {
        // Iniciar una transacción de base de datos
        await pool.query('BEGIN');

        // 1. Obtener el usuario
        const userResult = await pool.query('SELECT puntos_actuales FROM clientes WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }
        const currentPoints = userResult.rows[0].puntos_actuales || 0;

        // 2. Calcular puntos a añadir (ej. 1 punto por cada $10000 ARS)
        const pointsToAdd = Math.floor(amount / 10000); 
        const newPoints = currentPoints + pointsToAdd;

        // 3. Actualizar los puntos del usuario
        await pool.query(
            'UPDATE clientes SET puntos_actuales = $1 WHERE id = $2',
            [newPoints, userId]
        );

        // 4. Registrar la transacción
        await pool.query(
            'INSERT INTO transacciones_puntos (cliente_id, tipo_transaccion, monto_compra, puntos_cantidad, fecha_transaccion, realizada_por_admin_id) VALUES ($1, $2, $3, $4, NOW(), $5)',
            [userId, 'compra', amount, pointsToAdd, adminId]
        );

        // Confirmar la transacción
        await pool.query('COMMIT');

        res.status(200).json({
            message: `Compra de $${amount} registrada. Se añadieron ${pointsToAdd} puntos.`,
            newPoints: newPoints
        });

    } catch (err) {
        await pool.query('ROLLBACK'); // Revertir si hay un error
        console.error('Error al registrar compra y asignar puntos:', err.message);
        res.status(500).json({ error: 'Error interno del servidor al registrar la compra.' });
    }
});

// @route   POST /api/transactions/redeem
// @desc    Redeem points for a user
// @access  Private (Admin/Employee)
router.post('/redeem', protect, async (req, res) => {
    const { userId, pointsToRedeem, productId } = req.body;
    const adminId = req.user.id; // ID del admin/empleado que realiza la operación

    // === MODIFICACIÓN: Validar y convertir productId a número ===
    let validatedProductId = parseInt(productId, 10);

    if (isNaN(validatedProductId) || validatedProductId <= 0) {
        return res.status(400).json({ error: 'ID de producto inválido. Debe ser un número positivo.' });
    }

    // Validar parámetros requeridos
    if (!userId || !pointsToRedeem || pointsToRedeem <= 0) {
        return res.status(400).json({ error: 'ID de usuario y puntos a canjear son requeridos.' });
    }

    try {
        await pool.query('BEGIN');

        // 1. Obtener el usuario y sus puntos actuales
        const userResult = await pool.query('SELECT puntos_actuales FROM clientes WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }
        const currentPoints = userResult.rows[0].puntos_actuales || 0;

        if (currentPoints < pointsToRedeem) {
            await pool.query('ROLLBACK');
            return res.status(400).json({ error: 'Puntos insuficientes para realizar el canje.' });
        }

        // 2. Obtener el producto de canje para verificar puntos_canje
        const productResult = await pool.query('SELECT nombre, puntos_canje FROM productos WHERE id = $1', [validatedProductId]);
        
        if (productResult.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ error: 'Producto de canje no encontrado en la base de datos de productos.' });
        }
        const product = productResult.rows[0];

        if (product.puntos_canje !== pointsToRedeem) {
            await pool.query('ROLLBACK');
            return res.status(400).json({ error: `Los puntos a canjear (${pointsToRedeem}) no coinciden con los del producto (${product.puntos_canje}).` });
        }

        // 3. Actualizar los puntos del usuario
        const newPoints = currentPoints - pointsToRedeem;
        await pool.query(
            'UPDATE clientes SET puntos_actuales = $1 WHERE id = $2',
            [newPoints, userId]
        );

        // 4. Registrar la transacción de canje
        await pool.query(
            'INSERT INTO transacciones_puntos (cliente_id, tipo_transaccion, puntos_cantidad, premio_canjeado_id, fecha_transaccion, realizada_por_admin_id) VALUES ($1, $2, $3, $4, NOW(), $5)',
            [userId, 'canje', -pointsToRedeem, validatedProductId, adminId] 
        );

        await pool.query('COMMIT');

        res.status(200).json({
            message: `Canje de "${product.nombre}" por ${pointsToRedeem} puntos realizado.`,
            newPoints: newPoints
        });

    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Error al canjear puntos:', err.message);
        res.status(500).json({ error: 'Error interno del servidor al canjear puntos.' });
    }
});

// @route   GET /api/transactions/:userId/points
// @desc    Get current points for a specific user
// @access  Private (User itself or Admin/Employee)
router.get('/:userId/points', protect, async (req, res) => {
    const { userId } = req.params;
    const requestingUser = req.user; // Usuario autenticado del token

    // Autorización: solo el propio usuario o un admin/empleado puede ver los puntos
    if (requestingUser.role !== 'admin' && requestingUser.role !== 'employee' && requestingUser.id.toString() !== userId.toString()) {
        return res.status(403).json({ error: 'No autorizado para ver los puntos de este usuario.' });
    }

    try {
        const result = await pool.query('SELECT puntos_actuales FROM clientes WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }
        res.status(200).json({ points: result.rows[0].puntos_actuales || 0 });
    } catch (err) {
        console.error('Error al obtener puntos del usuario:', err.message);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ====================================================================
// >>>>>>>>>>>>>>>>> NUEVA RUTA DE HISTORIAL DE TRANSACCIONES <<<<<<<<<<<<<<<<<<<
// ====================================================================

// @route   GET /api/transactions/user/:userId/transactions
// @desc    Get the last 10 transactions for a specific user
// @access  Private (Admin/Employee)
router.get('/user/:userId/transactions', protect, async (req, res) => {
    const { userId } = req.params;
    const requestingUser = req.user;

    // Autorización: Solo Admin/Empleado puede ver el historial de otros usuarios.
    // El frontend de gestión de usuarios (UserManagementPage.js) solo es visible para Admin/Employee,
    // pero es buena práctica tener la validación aquí.
    if (requestingUser.role !== 'admin' && requestingUser.role !== 'employee') {
        return res.status(403).json({ error: 'No autorizado para ver el historial de transacciones.' });
    }

    try {
        const query = `
            SELECT 
                t.tipo_transaccion,
                t.monto_compra,
                t.puntos_cantidad,
                t.fecha_transaccion,
                p.nombre AS nombre_producto_canjeado,
                -- Usamos 'c' (clientes) para obtener el nombre del empleado que realizó la transacción
                c.nombre AS scanner_user
            FROM 
                transacciones_puntos t
            LEFT JOIN 
                productos p ON t.premio_canjeado_id = p.id
            LEFT JOIN
                clientes c ON t.realizada_por_admin_id = c.id
            WHERE 
                t.cliente_id = $1
            ORDER BY 
                t.fecha_transaccion DESC
            LIMIT 10;
        `;
        
        const result = await pool.query(query, [userId]);
        
        // El frontend espera un array de transacciones con los campos:
        // transaction_date (fecha_transaccion), transaction_type (tipo_transaccion), scanner_user (nombre_admin_realizo)
        // La consulta SQL ya mapea los nombres de columna necesarios.
        
        // Mapeamos los nombres de columna al formato que espera el frontend (solo por consistencia, no es estrictamente necesario si el frontend se adapta a los nombres de la DB):
        const transactions = result.rows.map(row => ({
            transaction_date: row.fecha_transaccion,
            transaction_type: row.tipo_transaccion,
            scanner_user: row.scanner_user || 'Sistema', // Si es NULL, asumimos que fue una carga inicial o por sistema
            monto_compra: row.monto_compra,
            puntos_cantidad: row.puntos_cantidad,
            producto_canjeado: row.nombre_producto_canjeado
        }));
        
        res.status(200).json(transactions);
        
    } catch (err) {
        console.error(`Error al obtener el historial de transacciones para el usuario ${userId}:`, err.message);
        res.status(500).json({ error: 'Error interno del servidor al obtener el historial de transacciones.' });
    }
});

module.exports = router;