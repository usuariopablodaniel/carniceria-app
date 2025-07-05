// backend/server.js
require('dotenv').config();
console.log('CLIENT_URL cargado en backend (server.js):', process.env.CLIENT_URL);

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');

require('./config/passport'); // Configuración de Passport

const app = express();
const port = process.env.PORT || 5000;

// *** Importaciones de Rutas ***
// Asumiendo que tu archivo de rutas de autenticación es 'auth.js'
const authRoutes = require('./routes/auth');
// Y tu archivo de rutas de productos es 'productRoutes.js'
const productRoutes = require('./routes/productRoutes');
// >>>>>>>>>>>>>>> NUEVA IMPORTACIÓN PARA RUTAS DE TRANSACCIONES <<<<<<<<<<<<<<<<
const transactionRoutes = require('./routes/transactionRoutes'); 

// Configuración de la base de datos PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Middleware
app.use(cors({
    origin: 'http://localhost:3000', // Asegúrate de que esta sea la URL de tu frontend
    credentials: true // Muy importante para las cookies de sesión de Passport
}));
app.use(express.json());

// Configuración de Sesiones para Passport
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Inicializar Passport y Restaurar Sesión
app.use(passport.initialize());
app.use(passport.session());

// *** Uso de Rutas ***
app.use('/api/auth', authRoutes); // Tus rutas de autenticación
app.use('/api/products', productRoutes); // Tus rutas de productos
// >>>>>>>>>>>>>>> NUEVA LÍNEA PARA USAR LAS RUTAS DE TRANSACCIONES <<<<<<<<<<<<<<<<
app.use('/api/transactions', transactionRoutes); 

// --- Rutas de Prueba para Verificar el Backend ---
app.get('/', (req, res) => {
    res.send('Backend de la Carnicería funcionando!');
});

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