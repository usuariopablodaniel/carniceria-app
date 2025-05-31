require('dotenv').config(); // Carga las variables de entorno de .env
const authRoutes = require('./routes/auth'); // Importa las rutas de autenticación
const express = require('express');
const { Pool } = require('pg'); // Cliente de PostgreSQL
const cors = require('cors'); // Para permitir que tu frontend (React) se comunique con el backend
const passport = require('passport'); // << AÑADE ESTA LÍNEA
const session = require('express-session'); // << AÑADE ESTA LÍNEA (la instalaremos después)

require('./config/passport');

const app = express();
const port = process.env.PORT || 5000; // Puerto donde correrá tu backend

// Configuración de la base de datos PostgreSQL
// NOTA: Estas credenciales deben estar en tu archivo .env
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Middleware: Son funciones que se ejecutan antes de que lleguen a tus rutas
app.use(cors()); // Permite solicitudes desde tu frontend React (dominio diferente)
app.use(express.json()); // Habilita Express para parsear (leer) el cuerpo de las solicitudes en formato JSON
// Configuración de Sesiones para Passport
app.use(session({
    secret: process.env.SESSION_SECRET, // Usa el secreto de tu .env
    resave: false, // No guardar la sesión si no ha cambiado
    saveUninitialized: false, // No crear sesión para usuarios no inicializados
    cookie: { secure: false } // Para desarrollo (HTTP) usar 'false'. En producción (HTTPS) debe ser 'true'.
}));



// Inicializar Passport y Restaurar Sesión (¡AÑADE ESTO!)
app.use(passport.initialize());
app.use(passport.session());

app.use('/api/auth', authRoutes); // Tus rutas de autenticación

// ... el resto de tus rutas de prueba ...


// --- Rutas de Prueba para Verificar el Backend ---


// Ruta de prueba básica: Verifica que el servidor está corriendo
app.get('/', (req, res) => {
    res.send('Backend de la Carnicería funcionando!');
});

// Ruta de prueba para la base de datos - AHORA MANEJARÁ EL CASO SIN DB
app.get('/db-test', async (req, res) => {
       
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        res.json({ message: 'Conexión a la base de datos exitosa!', time: result.rows[0].now });
    } catch (err) {
        console.error('Error al conectar a la base de datos:', err);
        res.status(500).json({ error: 'Error al conectar a la base de datos', details: err.message });
    }
    
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor backend corriendo en http://localhost:${port}`);
});