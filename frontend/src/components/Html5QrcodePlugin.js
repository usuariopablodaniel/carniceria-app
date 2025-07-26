import { Html5QrcodeScanner } from 'html5-qrcode';
import React, { useEffect, useRef } from 'react'; // Eliminado useState porque no es necesario aquí

const qrcodeRegionId = "html5qr-code-full-region";

// Componente React para el lector QR
const Html5QrcodePlugin = (props) => {
    // Desestructurar las props
    const { fps, qrbox, disableFlip, verbose, qrCodeSuccessCallback } = props;

    // Usar useRef para mantener la instancia del escáner a través de los renders
    const scannerRef = useRef(null); 

    useEffect(() => {
        // Esta bandera es para evitar la doble ejecución en modo de desarrollo de React
        // que puede causar problemas con la inicialización de la cámara.
        // Solo inicializamos el escáner si no ha sido inicializado ya.
        if (scannerRef.current) {
            console.log("Html5QrcodePlugin: Escáner ya inicializado, saltando re-inicialización.");
            return; // Evitar re-inicializar si ya existe una instancia
        }

        console.log("Html5QrcodePlugin: Componente montado. Creando e inicializando escáner.");
        const html5QrcodeScanner = new Html5QrcodeScanner(
            qrcodeRegionId, {
                fps: fps,
                qrbox: qrbox,
                aspectRatio: 1.0,
                disableFlip: disableFlip
            },
            verbose
        );

        // Almacenar la instancia en la referencia
        scannerRef.current = html5QrcodeScanner;

        // Callback cuando se escanea con éxito
        const onScanSuccess = (decodedText, decodedResult) => {
            qrCodeSuccessCallback(decodedText, decodedResult);
        };

        // Callback cuando hay un error en el escaneo (ej. cámara no disponible)
        const onScanError = (errorMessage) => {
            console.error("Html5QrcodePlugin: Error de escaneo o cámara:", errorMessage);
            // Aquí podrías mostrar un mensaje al usuario si la cámara no se inicia
        };

        // Iniciar el escáner. Usamos un try-catch para manejar el caso donde .render() no devuelve una Promesa.
        try {
            const renderPromise = html5QrcodeScanner.render(onScanSuccess, onScanError);
            if (renderPromise && typeof renderPromise.then === 'function') {
                renderPromise
                    .then(() => console.log("Html5QrcodePlugin: Escáner renderizado e iniciado correctamente."))
                    .catch(err => console.error("Html5QrcodePlugin: Error al iniciar escáner después de render():", err));
            } else {
                console.error("Html5QrcodePlugin: html5QrcodeScanner.render() no devolvió una Promesa. Esto puede indicar un error de inicialización de la cámara.");
            }
        } catch (err) {
            console.error("Html5QrcodePlugin: Error capturado al intentar renderizar el escáner:", err);
            // Aquí también podrías mostrar un mensaje de error al usuario
        }

        // Función de limpieza: detener y limpiar el escáner cuando el componente se desmonte
        return () => {
            console.log("Html5QrcodePlugin: Función de limpieza del useEffect (desmontaje).");
            if (scannerRef.current) {
                scannerRef.current.clear()
                    .then(() => console.log("Html5QrcodePlugin: Escáner limpiado correctamente al desmontar."))
                    .catch(err => console.error("Html5QrcodePlugin: Error al limpiar el escáner al desmontar:", err));
                scannerRef.current = null; // Limpiar la referencia
            }
        };
    }, [fps, qrbox, disableFlip, verbose, qrCodeSuccessCallback]); // Dependencias del useEffect

    return (
        <div id={qrcodeRegionId} />
    );
};

export default Html5QrcodePlugin;