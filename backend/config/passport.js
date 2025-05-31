const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { Pool } = require('pg'); // Necesitamos el cliente de PostgreSQL
require('dotenv').config(); // Asegúrate de cargar las variables de entorno

// Configuración de la base de datos (usando las variables de entorno)
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// --- Serialización y Deserialización del Usuario ---
// Esto es para que Passport sepa cómo guardar (serializar) el usuario en la sesión
// y cómo recuperar (deserializar) el usuario de la sesión.
// Aunque no usaremos sesiones tradicionales para la autenticación principal (usaremos JWT),
// Passport las necesita internamente para el flujo OAuth.
passport.serializeUser((user, done) => {
    done(null, user.id); // Solo necesitamos guardar el ID del usuario en la sesión
});

passport.deserializeUser(async (id, done) => {
    try {
        const userResult = await pool.query('SELECT id, nombre, email, puntos_actuales FROM clientes WHERE id = $1', [id]);
        if (userResult.rows.length > 0) {
            done(null, userResult.rows[0]); // El usuario se recuperó correctamente
        } else {
            done(new Error('User not found'), null);
        }
    } catch (err) {
        done(err, null);
    }
});

// --- Estrategia de Google OAuth 2.0 ---
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // Asegúrate de que esta callbackURL coincida EXACTAMENTE con la que configuraste en Google Cloud Console
    callbackURL: 'http://localhost:5000/api/auth/google/callback' 
},
async (accessToken, refreshToken, profile, done) => {
    try {
        // Busca si el usuario ya existe por su ID de Google
        let user = await pool.query('SELECT * FROM clientes WHERE google_id = $1', [profile.id]);

        if (user.rows.length > 0) {
            // Usuario ya existe, lo retorna
            return done(null, user.rows[0]);
        } else {
            // El usuario no existe, crea uno nuevo
            const newUser = await pool.query(
                'INSERT INTO clientes (nombre, email, google_id) VALUES ($1, $2, $3) RETURNING id, nombre, email, puntos_actuales',
                [profile.displayName, profile.emails[0].value, profile.id]
            );
            return done(null, newUser.rows[0]);
        }
    } catch (err) {
        return done(err, null);
    }
}));

// No exportamos nada de aquí, solo se "configura" passport al requerir este archivo.