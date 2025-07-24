// backend/server.js
require('dotenv').config();
console.log('--- INICIO DE SERVER.JS ---');
console.log('CLIENT_URL cargado en backend (server.js):', process.env.CLIENT_URL);

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const path = require('path');
const fs = require('fs/promises'); // Necesario para fs.access

console.log('Cargando configuración de Passport...');
require('./config/passport'); // Configuración de Passport

const app = express();
const port = process.env.PORT || 5000;

// Define la ruta base de la carpeta de uploads de forma absoluta
const UPLOADS_BASE_PATH = path.join('C:', 'Users', 'pablo', 'Pictures', 'uploads');
const IMAGES_UPLOAD_PATH = path.join(UPLOADS_BASE_PATH, 'imagenes');
console.log(`Ruta absoluta de imágenes de uploads: ${IMAGES_UPLOAD_PATH}`);


// *** Importaciones de Rutas ***
console.log('Importando rutas...');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/productRoutes');
const transactionRoutes = require('./routes/transactionRoutes'); 

// Configuración de la base de datos PostgreSQL
console.log('Configurando pool de PostgreSQL...');
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Middleware
console.log('Configurando middlewares generales...');
app.use(cors({
    origin: 'http://localhost:3000', // Asegúrate de que esta sea la URL de tu frontend
    credentials: true // Muy importante para las cookies de sesión de Passport
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

console.log('Configurando sesiones para Passport...');
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

console.log('Inicializando Passport...');
app.use(passport.initialize());
app.use(passport.session());

// =======================================================
// === USO DE RUTAS DE API ===
// =======================================================
console.log('Configurando rutas de API...');
app.use('/api/auth', (req, res, next) => { console.log('MIDDLEWARE: /api/auth'); next(); }, authRoutes);
app.use('/api/products', (req, res, next) => { console.log('MIDDLEWARE: /api/products'); next(); }, productRoutes); 
app.use('/api/transactions', (req, res, next) => { console.log('MIDDLEWARE: /api/transactions'); next(); }, transactionRoutes); 
// =======================================================

// =======================================================
// === CONFIGURACIÓN PARA SERVIR ARCHIVOS ESTATICOS ===
// === AÑADIDO: CABECERAS CACHE-CONTROL Y DEPURACIÓN DE RUTA ESTATICA ===
// === CORREGIDO: DECODEURIComponent para nombres de archivo ===
// =======================================================
console.log('Configurando middleware para servir imágenes estáticas en /api/images...');
app.use('/api/images', (req, res, next) => {
    console.log(`MIDDLEWARE: Solicitud a /api/images. URL original: ${req.originalUrl}`);
    
    // Extraer el nombre del archivo de la URL y DECODIFICARLO
    const fileName = req.url.startsWith('/api/images/') ? req.url.replace('/api/images/', '') : req.url;
    const decodedFileName = decodeURIComponent(fileName); // <-- ¡CORRECCIÓN CRÍTICA!

    const fullImagePath = path.join(IMAGES_UPLOAD_PATH, decodedFileName); // Usar el nombre de archivo decodificado

    fs.access(fullImagePath, fs.constants.F_OK)
        .then(() => {
            console.log(`MIDDLEWARE: Archivo de imagen encontrado: ${fullImagePath}`);
            next(); // El archivo existe, pasar a express.static
        })
        .catch((err) => {
            console.error(`ERROR: Archivo de imagen NO ENCONTRADO en el disco: ${fullImagePath}. Error: ${err.message}`);
            res.status(404).json({ error: 'Imagen no encontrada en el servidor.' });
        });
}, express.static(IMAGES_UPLOAD_PATH, {
    setHeaders: function (res, path, stat) {
        console.log(`MIDDLEWARE: express.static sirviendo: ${path}`);
        res.set('Cache-Control', 'no-store'); // Para desarrollo, no cachear
    },
    fallthrough: false // Si express.static no puede servir el archivo (ej. permisos), no pasa al siguiente middleware
}));

// Este middleware solo se ejecutará si express.static falló (por ejemplo, permisos)
// o si el archivo no existía y el middleware anterior manejó el 404.
app.use('/api/images', (req, res) => {
    console.error(`ERROR: Fallback de /api/images alcanzado. Algo salió mal al servir la imagen.`);
    res.status(500).json({ error: 'Error interno al servir la imagen.' });
});
// =======================================================

// --- Rutas de Prueba para Verificar el Backend ---
console.log('Configurando rutas de prueba...');
app.get('/', (req, res) => {
    console.log('MIDDLEWARE: / (root) alcanzado.');
    res.send('Backend de la Carnicería funcionando!');
});

app.get('/db-test', async (req, res) => {
    console.log('MIDDLEWARE: /db-test alcanzado.');
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

// Middleware de manejo de errores centralizado (al final)
console.log('Configurando middleware de manejo de errores...');
app.use((err, req, res, next) => {
    console.error('ERROR GLOBAL de Express:', err.stack);
    if (res.headersSent) {
        return next(err);
    }
    res.status(err.statusCode || 500).json({
        message: err.message || 'Error interno del servidor.',
        error: process.env.NODE_ENV === 'development' ? err.stack : {}
    });
});

// Middleware para manejar rutas no encontradas (404) para el resto de la API
console.log('Configurando middleware para rutas 404...');
app.use((req, res) => {
    if (!res.headersSent) { // Solo si la respuesta no ha sido enviada ya
        console.warn(`WARN: Ruta de API no encontrada: ${req.method} ${req.originalUrl}`);
        res.status(404).json({ error: 'Ruta de API no encontrada.' });
    }
});


// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor backend corriendo en http://localhost:${port}`);
    console.log(`Imágenes estáticas disponibles en http://localhost:${port}/api/images/`); 
    console.log('--- SERVER.JS INICIADO ---');
});