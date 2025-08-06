// backend/routes/notifications.js
const express = require('express');
const router = express.Router();
// Importar el pool desde el archivo db.js
const pool = require('../db'); // <-- DEBE APUNTAR A ../db

/**
 * @route GET /api/notifications/general
 * @description Obtiene el mensaje de la notificación general activa.
 * @access Public
 */
router.get('/general', async (req, res) => {
    try {
        // Consulta la base de datos para obtener el mensaje activo
        const result = await pool.query('SELECT message, is_active FROM general_announcements WHERE is_active = TRUE LIMIT 1');
        
        if (result.rows.length > 0) {
            // Si se encuentra un mensaje activo, lo devuelve
            res.json({
                message: result.rows[0].message,
                isActive: result.rows[0].is_active
            });
        } else {
            // Si no hay un mensaje activo, devuelve un estado inactivo
            res.json({ message: null, isActive: false });
        }
    } catch (error) {
        console.error('Error al obtener notificación general:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener notificación.' });
    }
});

module.exports = router;
