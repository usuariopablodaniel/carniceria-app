// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const passport = require('passport');
const pool = require('../db'); // Importar el pool centralizado

// IMPORTANTE: Importar el nuevo servicio de email
const { sendPasswordResetEmail } = require('./../services/emailService');

// CLAVE SECRETA PARA FIRMAR LOS TOKENS JWT
const JWT_SECRET_GLOBAL = process.env.JWT_SECRET || 'supersecretkey_fallback';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const GOOGLE_LOGIN_FAILED_URL = `${CLIENT_URL}/login?message=google_login_failed`;
const GOOGLE_LOGIN_SUCCESS_URL = `${CLIENT_URL}/auth/google/callback`;
const RESET_PASSWORD_URL = `${CLIENT_URL}/reset-password`;

// --- Ruta de Registro de Usuario ---
router.post('/register', async (req, res) => {
    const { nombre, email, password, telefono } = req.body;

    if (!nombre || !email || !password) {
        return res.status(400).json({ error: 'Todos los campos obligatorios deben ser proporcionados.' });
    }

    try {
        const existingUser = await pool.query('SELECT * FROM clientes WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'El email ya está registrado.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUserQuery = 'INSERT INTO clientes (nombre, email, password_hash, telefono, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, nombre, email, puntos_actuales, role';
        const newUserValues = [nombre, email, passwordHash, telefono, 'user'];

        const newUserResult = await pool.query(newUserQuery, newUserValues);
        const cliente = newUserResult.rows[0];

        await pool.query(
            'INSERT INTO preferencias_notificaciones (cliente_id, recibir_notificaciones, recibir_ofertas_especiales, recibir_recordatorios_puntos) VALUES ($1, $2, $3, $4)',
            [cliente.id, true, true, true]
        );

        const token = jwt.sign(
            { id: cliente.id, email: cliente.email, role: cliente.role },
            JWT_SECRET_GLOBAL,
            { expiresIn: '1h' }
        );

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            token,
            cliente: {
                id: cliente.id,
                nombre: cliente.nombre,
                email: cliente.email,
                puntos_actuales: cliente.puntos_actuales,
                role: cliente.role,
            },
        });

    } catch (err) {
        console.error('Error al registrar el usuario:', err.message);
        res.status(500).json({ error: 'Error interno del servidor al registrar.' });
    }
});

// --- Ruta de Inicio de Sesión (Login) ---
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const clientQuery = 'SELECT id, nombre, email, puntos_actuales, password_hash, role FROM clientes WHERE email = $1';
        const result = await pool.query(clientQuery, [email]);
        const cliente = result.rows[0];

        if (!cliente) {
            return res.status(400).json({ error: 'Credenciales inválidas.' });
        }

        const isMatch = await bcrypt.compare(password, cliente.password_hash);

        if (!isMatch) {
            return res.status(400).json({ error: 'Credenciales inválidas.' });
        }

        const token = jwt.sign(
            { id: cliente.id, email: cliente.email, role: cliente.role },
            JWT_SECRET_GLOBAL,
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Inicio de sesión exitoso',
            token,
            cliente: {
                id: cliente.id,
                nombre: cliente.nombre,
                email: cliente.email,
                puntos_actuales: cliente.puntos_actuales,
                role: cliente.role,
            },
        });

    } catch (err) {
        console.error('Error durante el login:', err);
        res.status(500).json({ error: 'Error del servidor al intentar iniciar sesión.' });
    }
});

// --- Ruta Protegida: Obtener Perfil del Usuario Autenticado ---
router.get('/me', protect, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nombre, email, puntos_actuales, role FROM clientes WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error al obtener datos del usuario autenticado:', err.message);
        res.status(500).json({ error: 'Error interno del servidor al obtener datos del usuario.' });
    }
});

// --- Rutas de Autenticación con Google ---
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: GOOGLE_LOGIN_FAILED_URL }),
    async (req, res) => {
        try {
            const cliente = req.user;
            if (!cliente) {
                return res.redirect(GOOGLE_LOGIN_FAILED_URL);
            }

            const token = jwt.sign(
                { id: cliente.id, email: cliente.email, role: cliente.role },
                JWT_SECRET_GLOBAL,
                { expiresIn: '1h' }
            );
            const clienteParaFrontend = {
                id: cliente.id,
                nombre: cliente.nombre,
                email: cliente.email,
                puntos_actuales: cliente.puntos_actuales,
                google_id: cliente.google_id,
                role: cliente.role,
            };
            res.redirect(`${GOOGLE_LOGIN_SUCCESS_URL}?token=${token}&user=${encodeURIComponent(JSON.stringify(clienteParaFrontend))}`);
        } catch (err) {
            console.error('Error en Google callback al procesar cliente:', err);
            res.redirect(GOOGLE_LOGIN_FAILED_URL);
        }
    }
);

// --- Rutas de Recuperación de Contraseña ---
// @route   POST /api/auth/forgot-password
// @desc    Solicita un token de restablecimiento de contraseña y envía el email
// @access  Public
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const userQuery = 'SELECT id FROM clientes WHERE email = $1';
        const userResult = await pool.query(userQuery, [email]);
        const user = userResult.rows[0];

        if (!user) {
            return res.status(200).json({ message: 'Si el email está registrado, recibirás un enlace para restablecer la contraseña.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiresAt = new Date(Date.now() + 3600000); // 1 hora

        const salt = await bcrypt.genSalt(10);
        const hashedToken = await bcrypt.hash(resetToken, salt);

        const updateResult = await pool.query(
            'UPDATE clientes SET reset_token = $1, reset_token_expires_at = $2 WHERE id = $3',
            [hashedToken, resetTokenExpiresAt, user.id]
        );
        
        if (updateResult.rowCount === 0) {
            console.error('Error: No se pudo actualizar el usuario con el token de restablecimiento.');
            return res.status(500).json({ error: 'Error interno del servidor al guardar el token.' });
        }

        const resetUrl = `${RESET_PASSWORD_URL}?token=${resetToken}`;
        await sendPasswordResetEmail(email, resetUrl);

        res.status(200).json({ message: 'Si el email está registrado, recibirás un enlace para restablecer la contraseña.' });

    } catch (err) {
        console.error('Error en la solicitud de restablecimiento de contraseña:', err.message);
        res.status(500).json({ error: 'Error del servidor al procesar la solicitud.' });
    }
});

// @route   POST /api/auth/reset-password
// @desc    Restablece la contraseña del usuario
// @access  Public
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token y nueva contraseña son obligatorios.' });
    }

    try {
        const usersResult = await pool.query('SELECT id, reset_token FROM clientes WHERE reset_token IS NOT NULL AND reset_token_expires_at > NOW()');
        const users = usersResult.rows;

        let userToReset = null;

        for (const user of users) {
            const isMatch = await bcrypt.compare(token, user.reset_token);
            if (isMatch) {
                userToReset = user;
                break;
            }
        }

        if (!userToReset) {
            return res.status(400).json({ error: 'Token inválido o expirado.' });
        }
        
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);
        
        await pool.query(
            'UPDATE clientes SET password_hash = $1, reset_token = NULL, reset_token_expires_at = NULL WHERE id = $2',
            [passwordHash, userToReset.id]
        );

        res.status(200).json({ message: 'Contraseña actualizada exitosamente.' });

    } catch (err) {
        console.error('Error al restablecer la contraseña:', err.message);
        res.status(500).json({ error: 'Error del servidor al intentar restablecer la contraseña.' });
    }
});


// --- Rutas de Gestión de Usuarios (SOLO ADMINISTRADORES) ---

// >>>>>>>>>>>>>>> RUTA PARA OBTENER USUARIO POR ID <<<<<<<<<<<<<<<<
router.get('/user/:id', protect, async (req, res) => {
    const { id } = req.params;
    const requestingUser = req.user;
    if (requestingUser.role !== 'admin' && requestingUser.role !== 'employee' && requestingUser.id.toString() !== id.toString()) {
        return res.status(403).json({ error: 'No autorizado para ver los datos de este usuario.' });
    }

    try {
        const result = await pool.query('SELECT id, nombre, email, role, puntos_actuales FROM clientes WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }
        res.status(200).json({ user: result.rows[0] });
    } catch (err) {
        console.error('Error al obtener usuario por ID:', err.message);
        res.status(500).json({ error: 'Error interno del servidor al obtener el usuario.' });
    }
});

// >>>>>>>>>>>>>>> RUTA PARA OBTENER LISTA DE USUARIOS <<<<<<<<<<<<<<<<
router.get('/users', protect, authorizeRoles('admin'), async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nombre, email, role, puntos_actuales, telefono, fecha_registro FROM clientes ORDER BY fecha_registro DESC');
        res.status(200).json({ users: result.rows });
    } catch (err) {
        console.error('Error al listar usuarios:', err.message);
        res.status(500).json({ error: 'Error interno del servidor al obtener la lista de usuarios.' });
    }
});

// >>>>>>>>>>>>>>> RUTA PARA ACTUALIZAR USUARIO (CAMBIAR ROL) <<<<<<<<<<<<<<<<
router.put('/users/:id', protect, authorizeRoles('admin'), async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    try {
        const existingUser = await pool.query('SELECT id FROM clientes WHERE id = $1', [id]);
        if (existingUser.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        if (role) {
            const updateQuery = 'UPDATE clientes SET role = $1 WHERE id = $2 RETURNING id, nombre, email, role';
            const updatedUser = await pool.query(updateQuery, [role, id]);

            return res.status(200).json({
                message: `Rol del usuario ${id} actualizado a ${role}`,
                user: updatedUser.rows[0]
            });
        }

        res.status(400).json({ error: 'No se proporcionaron datos válidos para la actualización.' });
    } catch (err) {
        console.error('Error al actualizar usuario:', err.message);
        res.status(500).json({ error: 'Error interno del servidor al actualizar el usuario.' });
    }
});

// >>>>>>>>>>>>>>> RUTA PARA ELIMINAR USUARIO <<<<<<<<<<<<<<<<
router.delete('/users/:id', protect, authorizeRoles('admin'), async (req, res) => {
    const { id } = req.params;
    try {
        const deleteQuery = 'DELETE FROM clientes WHERE id = $1 RETURNING *';
        const result = await pool.query(deleteQuery, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado para eliminar.' });
        }
        res.status(200).json({ message: 'Usuario eliminado exitosamente', user_id: id });
    } catch (err) {
        console.error('Error al eliminar usuario:', err.message);
        res.status(500).json({ error: 'Error interno del servidor al eliminar el usuario.' });
    }
});

module.exports = router;
