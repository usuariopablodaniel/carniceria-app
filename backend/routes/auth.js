const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const { protect } = require('../middleware/authMiddleware');
const passport = require('passport'); // Esta es la línea que añadimos para Passport

// Configuración de la base de datos (usando las variables de entorno de .env)
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Clave secreta para firmar los tokens JWT
const jwtSecret = process.env.JWT_SECRET || 'supersecretkey';

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

        const newUser = await pool.query(
            'INSERT INTO clientes (nombre, email, password_hash, telefono) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, puntos_actuales',
            [nombre, email, passwordHash, telefono]
        );

        const cliente = newUser.rows[0];

        await pool.query(
            'INSERT INTO preferencias_notificaciones (cliente_id, recibir_notificaciones, recibir_ofertas_especiales, recibir_recordatorios_puntos) VALUES ($1, $2, $3, $4)',
            [cliente.id, true, true, true]
        );

        const token = jwt.sign(
            { id: cliente.id, email: cliente.email },
            jwtSecret,
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

    console.log('Intento de login para email:', email);
    console.log('Contraseña recibida (frontend):', password); // NO HACER ESTO EN PRODUCCIÓN, solo para depuración

    try {
        // 1. Buscar al cliente por email
        const clientQuery = 'SELECT * FROM clientes WHERE email = $1';
        const result = await pool.query(clientQuery, [email]);
        const cliente = result.rows[0];

        if (!cliente) {
            console.log('Cliente no encontrado para el email:', email);
            return res.status(400).json({ error: 'Credenciales inválidas.' });
        }

        console.log('Cliente encontrado en BD:', cliente.email);
        console.log('Hash de contraseña almacenado (BD):', cliente.password_hash);

        // 2. Comparar la contraseña enviada con el hash almacenado
        const isMatch = await bcrypt.compare(password, cliente.password_hash);

        console.log('Resultado de bcrypt.compare:', isMatch); // ¡ESTO ES CLAVE!

        if (!isMatch) {
            console.log('Contraseña NO coincide para el email:', email);
            return res.status(400).json({ error: 'Credenciales inválidas.' });
        }

        // Si la contraseña coincide, generar JWT
        const token = jwt.sign(
            { id: cliente.id, email: cliente.email },
            jwtSecret,
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
            },
        });

    } catch (err) {
        console.error('Error durante el login:', err);
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
    });
});


// --- Rutas de Autenticación con Google ---

// 1. Ruta para iniciar la autenticación de Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login-failure' }),
    async (req, res) => { // Asegúrate de que esta sea una función async
        console.log('--- BACKEND: Ruta /google/callback HA SIDO ALCANZADA ---'); // Mantén este console.log de depuración

        try {
            // req.user debería contener el cliente que Passport ha autenticado/creado de la BD.
            // Asegúrate de que tu GoogleStrategy de Passport esté configurada para devolver el cliente completo de la DB.
            const cliente = req.user; // Passport.js debería poner el usuario completo de DB aquí

            if (!cliente) {
                console.error('Error: Cliente no disponible en req.user después de autenticación Google.');
                return res.redirect('http://localhost:3000/login?error=auth_failed');
            }

            console.log('Cliente obtenido de Passport.js (Google):', cliente);
            // Asegúrate de que 'cliente' tenga 'id', 'nombre', 'email', 'puntos_actuales'

            const token = jwt.sign(
                { id: cliente.id, email: cliente.email }, // Usamos datos del cliente autenticado
                jwtSecret, // Usa la variable jwtSecret que ya tienes definida
                { expiresIn: '1h' }
            );

            console.log('Token JWT generado para Google login.');

            // Preparamos el objeto cliente completo para enviar al frontend
            const clienteParaFrontend = {
                id: cliente.id,
                nombre: cliente.nombre, // ¡Asegúrate de que este campo exista en tu objeto cliente!
                email: cliente.email,
                puntos_actuales: cliente.puntos_actuales, // ¡Asegúrate de que este campo exista!
                // Si tienes otros campos como google_id, también puedes incluirlos
                google_id: cliente.google_id
            };

            console.log('Datos de cliente a enviar al frontend para Google login:', clienteParaFrontend);


            // Redirige al dashboard, enviando el token y el objeto cliente completo
            // Asegúrate de que 'http://localhost:3000/dashboard' sea la URL final de redirección
            // y que el frontend esté configurado para leer 'token' y 'cliente' de la URL.
            res.redirect(`http://localhost:3000/dashboard?token=${token}&cliente=${encodeURIComponent(JSON.stringify(clienteParaFrontend))}`);

        } catch (err) {
            console.error('Error en Google callback al procesar cliente:', err);
            res.redirect('http://localhost:3000/login?error=server_error');
        }
    }
);


module.exports = router; // Exportamos el router para usarlo en server.js