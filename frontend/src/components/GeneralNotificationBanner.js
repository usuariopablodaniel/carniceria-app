// frontend/src/components/GeneralNotificationBanner.js
import React, { useState, useEffect } from 'react';
import { Alert, Button } from 'react-bootstrap';

/**
 * Componente para mostrar una notificación general en forma de banner.
 * Permite al usuario cerrar la notificación para la sesión actual.
 *
 * @param {object} props - Las propiedades del componente.
 * @param {string} props.message - El mensaje de la notificación a mostrar.
 * @param {function} [props.onDismiss] - Función opcional a llamar cuando el usuario cierra la notificación.
 */
const GeneralNotificationBanner = ({ message, onDismiss }) => {
    // Estado para controlar la visibilidad del banner
    const [showBanner, setShowBanner] = useState(false);

    // useEffect para manejar la visibilidad del banner y el estado de "descartado" en sessionStorage
    useEffect(() => {
        // Verificar si la notificación ya fue descartada en esta sesión
        // Usamos una clave única para el mensaje para que si el mensaje cambia, se muestre de nuevo
        const dismissedKey = `generalNotificationDismissed_${btoa(message || '')}`; // Codifica el mensaje para usarlo como clave base64
        const dismissed = sessionStorage.getItem(dismissedKey);

        if (message && message.trim() !== '' && dismissed !== 'true') {
            setShowBanner(true); // Mostrar el banner si hay mensaje y no fue descartado
        } else {
            setShowBanner(false); // Ocultar el banner
        }
    }, [message]); // Se ejecuta cuando el mensaje cambia

    // Función para manejar el cierre del banner
    const handleDismiss = () => {
        setShowBanner(false); // Ocultar el banner
        const dismissedKey = `generalNotificationDismissed_${btoa(message || '')}`;
        sessionStorage.setItem(dismissedKey, 'true'); // Marcar como descartado en sessionStorage
        if (onDismiss) {
            onDismiss(); // Llamar a la función onDismiss si se proporcionó
        }
    };

    if (!showBanner) {
        return null; // No renderizar nada si el banner no debe mostrarse
    }

    return (
        <Alert 
            variant="info" // Puedes cambiar el color (primary, secondary, success, danger, warning, info, light, dark)
            onClose={handleDismiss} 
            dismissible // Permite que el usuario cierre la alerta
            className="text-center mb-0 rounded-0" // Estilos para que sea un banner completo en la parte superior
            style={{ position: 'sticky', top: 0, zIndex: 1050 }} // Para que se quede arriba al hacer scroll
        >
            {message}
        </Alert>
    );
};

export default GeneralNotificationBanner;