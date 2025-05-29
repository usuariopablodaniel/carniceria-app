const express = require('express');
const router = express.Router(); // Usamos el Router de Express
const bcrypt = require('bcryptjs'); // Para encriptar contraseñas
const jwt = require('jsonwebtoken'); // Para generar tokens web
const { Pool } = require('pg'); // Cliente de PostgreSQL para la base de datos

// Configuración de la base de datos (usando las variables de entorno de .env)
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Clave secreta para firmar los tokens JWT (¡DEBE SER FUERTE Y GUARDARSE EN .env!)
const jwtSecret = process.env.JWT_SECRET || 'supersecretkey'; // Usar variable de entorno para producción

// --- Ruta de Registro de Usuario ---
router.post('/register', async (req, res) => {
    const { nombre, email, password, telefono } = req.body;

    if (!nombre || !email || !password) {
        return res.status(400).json({ error: 'Todos los campos obligatorios deben ser proporcionados.' });
    }

    try {
        // 1. Verificar si el usuario ya existe
        const existingUser = await pool.query('SELECT * FROM clientes WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'El email ya está registrado.' });
        }

        // 2. Encriptar la contraseña
        const salt = await bcrypt.genSalt(10); // Generar un "salt" (cadena aleatoria para la encriptación)
        const passwordHash = await bcrypt.hash(password, salt); // Encriptar la contraseña con el salt

        // 3. Guardar el nuevo cliente en la base de datos
        const newUser = await pool.query(
            'INSERT INTO clientes (nombre, email, password_hash, telefono) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, puntos_actuales',
            [nombre, email, passwordHash, telefono]
        );

        const cliente = newUser.rows[0];

        // 4. Inicializar preferencias de notificación para el nuevo cliente
        await pool.query(
            'INSERT INTO preferencias_notificaciones (cliente_id, recibir_notificaciones, recibir_ofertas_especiales, recibir_recordatorios_puntos) VALUES ($1, $2, $3, $4)',
            [cliente.id, true, true, true] // Por defecto, todas activadas
        );

        // 5. Generar un Token JWT
        const token = jwt.sign(
            { id: cliente.id, email: cliente.email }, // Payload del token
            jwtSecret, // Clave secreta
            { expiresIn: '1h' } // El token expira en 1 hora
        );

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            token, // Enviamos el token al cliente
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

    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son obligatorios.' });
    }

    try {
        // 1. Buscar al cliente por email
        const user = await pool.query('SELECT * FROM clientes WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(400).json({ error: 'Credenciales inválidas.' }); // Mensaje genérico por seguridad
        }

        const cliente = user.rows[0];

        // 2. Comparar la contraseña ingresada con el hash guardado
        // Si el cliente no tiene password_hash (ej. se registró con Google/Facebook), no podemos validar
        if (!cliente.password_hash) {
            return res.status(400).json({ error: 'Este usuario se registró con autenticación externa. Por favor, inicia sesión con ese método.' });
        }

        const isMatch = await bcrypt.compare(password, cliente.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Credenciales inválidas.' });
        }

        // 3. Generar un Token JWT
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
        console.error('Error al iniciar sesión:', err.message);
        res.status(500).json({ error: 'Error interno del servidor al iniciar sesión.' });
    }
});

module.exports = router; // Exportamos el router para usarlo en server.js