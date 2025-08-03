// backend/services/emailService.js
const nodemailer = require('nodemailer');

// Cargar variables de entorno para las credenciales del email
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;
const GMAIL_HOST = process.env.GMAIL_HOST || 'smtp.gmail.com';
const GMAIL_PORT = process.env.GMAIL_PORT || 587;

// Validar que las variables de entorno están cargadas
if (!GMAIL_USER || !GMAIL_PASS) {
    console.error("ERROR: Las credenciales de GMAIL no están configuradas en las variables de entorno.");
    process.exit(1); // Detiene la aplicación si no hay credenciales
}

// Configurar el transportador de Nodemailer.
// Esto es lo que se conecta al servidor de correo (en este caso, Gmail).
const transporter = nodemailer.createTransport({
    host: GMAIL_HOST,
    port: GMAIL_PORT,
    secure: false, // Usa 'false' para STARTTLS, que es común en el puerto 587
    auth: {
        user: GMAIL_USER, // Tu dirección de correo electrónico
        pass: GMAIL_PASS, // Tu contraseña o contraseña de aplicación
    },
});

// Función para enviar el correo de restablecimiento de contraseña
const sendPasswordResetEmail = async (toEmail, resetUrl) => {
    // Definir los detalles del correo
    const mailOptions = {
        from: GMAIL_USER,
        to: toEmail,
        subject: 'Restablecer tu contraseña',
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Hola,</h2>
                <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:</p>
                <p>
                    <a href="${resetUrl}" style="background-color: #007BFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                        Restablecer Contraseña
                    </a>
                </p>
                <p>Si no solicitaste este cambio, por favor ignora este correo. El enlace expirará en 1 hora.</p>
                <p>Saludos cordiales,<br/>El equipo de la Carnicería</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email de restablecimiento de contraseña enviado a ${toEmail}`);
    } catch (error) {
        console.error('Error al enviar el email:', error);
        throw new Error('No se pudo enviar el correo de restablecimiento.');
    }
};

module.exports = { sendPasswordResetEmail };