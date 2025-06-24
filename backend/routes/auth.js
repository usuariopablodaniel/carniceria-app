// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const { protect } = require('../middleware/authMiddleware');
const passport = require('passport');

// Configuración de la base de datos (usando las variables de entorno de .env)
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// CLAVE SECRETA PARA FIRMAR LOS TOKENS JWT
// Esto DEBE ser process.env.JWT_SECRET. El fallback 'supersecretkey_fallback'
// solo es una medida de seguridad en caso de que .env no cargue (raro).
const JWT_SECRET_GLOBAL = process.env.JWT_SECRET || 'supersecretkey_fallback'; 

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

        // QUITAR ESTA LÍNEA DE DEPURACIÓN (o comentarla)
        // console.log('JWT_SECRET usado para FIRMAR (auth.js - register):', JWT_SECRET_GLOBAL); 
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

    console.log('Intento de login para email:', email); // Mantener esto, es útil para el log de actividad
    // console.log('Contraseña recibida (frontend):', password); // NO HACER ESTO EN PRODUCCIÓN

    try {
        const clientQuery = 'SELECT id, nombre, email, puntos_actuales, password_hash, role FROM clientes WHERE email = $1';
        const result = await pool.query(clientQuery, [email]);
        const cliente = result.rows[0];

        if (!cliente) {
            console.log('Cliente no encontrado para el email:', email); // Mantener
            return res.status(400).json({ error: 'Credenciales inválidas.' });
        }

        console.log('Cliente encontrado en BD:', cliente.email); // Mantener
        // console.log('Hash de contraseña almacenado (BD):', cliente.password_hash); // Para depuración

        const isMatch = await bcrypt.compare(password, cliente.password_hash);

        console.log('Resultado de bcrypt.compare:', isMatch); // Mantener

        if (!isMatch) {
            console.log('Contraseña NO coincide para el email:', email); // Mantener
            return res.status(400).json({ error: 'Credenciales inválidas.' });
        }

        // QUITAR ESTA LÍNEA DE DEPURACIÓN (o comentarla)
        // console.log('JWT_SECRET usado para FIRMAR (auth.js - login):', JWT_SECRET_GLOBAL); 
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
        console.error('Error durante el login:', err); // Mantener este error
        res.status(500).json({ error: 'Error del servidor al intentar iniciar sesión.' });
    }
});

// --- Ruta Protegida: Obtener Perfil del Usuario Autenticado ---
router.get('/me', protect, async (req, res) => {
    res.status(200).json({
        id: req.user.id,
        nombre: req.user.nombre,
        email: req.user.email,
        puntos_actuales: req.user.puntos_actuales,
        role: req.user.role, 
    });
});


// --- Rutas de Autenticación con Google ---

// 1. Ruta para iniciar la autenticación de Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login-failure' }),
    async (req, res) => {
        console.log('--- BACKEND: Ruta /google/callback HA SIDO ALCANZADA ---'); // Mantener

        try {
            const cliente = req.user;

            if (!cliente) {
                console.error('Error: Cliente no disponible en req.user después de autenticación Google.'); // Mantener
                return res.redirect('http://localhost:3000/login?error=auth_failed');
            }

            console.log('Cliente obtenido de Passport.js (Google):', cliente); // Mantener
            
            // QUITAR ESTA LÍNEA DE DEPURACIÓN (o comentarla)
            // console.log('JWT_SECRET usado para FIRMAR (auth.js - google callback):', JWT_SECRET_GLOBAL); 
            const token = jwt.sign(
                { id: cliente.id, email: cliente.email, role: cliente.role },
                JWT_SECRET_GLOBAL,
                { expiresIn: '1h' }
            );

            console.log('Token JWT generado para Google login.'); // Mantener

            const clienteParaFrontend = {
                id: cliente.id,
                nombre: cliente.nombre,
                email: cliente.email,
                puntos_actuales: cliente.puntos_actuales,
                google_id: cliente.google_id,
                role: cliente.role, 
            };

            console.log('Datos de cliente a enviar al frontend para Google login:', clienteParaFrontend); // Mantener

            res.redirect(`http://localhost:3000/dashboard?token=${token}&cliente=${encodeURIComponent(JSON.stringify(clienteParaFrontend))}`);

        } catch (err) {
            console.error('Error en Google callback al procesar cliente:', err); // Mantener
            res.redirect('http://localhost:3000/login?error=server_error');
        }
    }
);

module.exports = router;