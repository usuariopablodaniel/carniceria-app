// backend/config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config(); 

const pool = require('../db'); // Importar el pool centralizado

passport.serializeUser((user, done) => {
    done(null, user.id); 
});

passport.deserializeUser(async (id, done) => {
    try {
        const userResult = await pool.query('SELECT id, nombre, email, puntos_actuales, google_id, role FROM clientes WHERE id = $1', [id]);
        if (userResult.rows.length > 0) {
            done(null, userResult.rows[0]);
        } else {
            done(new Error('User not found'), null);
        }
    } catch (err) {
        done(err, null);
    }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // <<<<<<<<<<<< CAMBIO CLAVE AQUÍ: DEBE APUNTAR AL BACKEND (PUERTO 5000) >>>>>>>>>>>>
    callbackURL: `http://localhost:5000/api/auth/google/callback`, 
    // ^^^ Este es el URI que Google utilizará para redirigir después de una autenticación exitosa.
    // Debe coincidir exactamente con una de las "URI de redireccionamiento autorizados" en tu Google Cloud Console.
    passReqToCallback: true 
},
async (request, accessToken, refreshToken, profile, done) => {
    try {
        let user = await pool.query('SELECT id, nombre, email, puntos_actuales, google_id, role FROM clientes WHERE google_id = $1', [profile.id]);

        if (user.rows.length === 0) {
            const newUserQuery = `
                INSERT INTO clientes (nombre, email, google_id, puntos_actuales, es_admin, role) 
                VALUES ($1, $2, $3, $4, $5, $6) 
                RETURNING id, nombre, email, puntos_actuales, es_admin, role`;
            const newUserValues = [
                profile.displayName,
                profile.emails[0].value,
                profile.id,
                0, 
                false, 
                'user' 
            ];
            const result = await pool.query(newUserQuery, newUserValues);
            user = result.rows[0];
            await pool.query(
                'INSERT INTO preferencias_notificaciones (cliente_id) VALUES ($1)',
                [user.id]
            );
            // console.log('Nuevo usuario de Google registrado:', user.email); // Eliminado
        } else {
            user = user.rows[0];
            await pool.query('UPDATE clientes SET fecha_ultima_sesion = NOW() WHERE id = $1', [user.id]);
            // console.log('Usuario de Google existente ha iniciado sesión:', user.email); // Eliminado
        }
        
        done(null, user); // Pasamos el usuario a la siguiente etapa de Passport (el callback en auth.js)

    } catch (err) {
        console.error('Error durante la autenticación de Google:', err);
        done(err, false);
    }
}));
