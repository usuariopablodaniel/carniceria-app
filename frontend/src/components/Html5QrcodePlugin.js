// frontend/src/components/Html5QrcodePlugin.js
import { Html5QrcodeScanner } from 'html5-qrcode';
import React, { useEffect } from 'react';

const qrcodeRegionId = "html5qr-code-full-region";

// Componente React para el lector QR
const Html5QrcodePlugin = (props) => {
    // Desestructurar las props para que useEffect pueda rastrear las dependencias correctamente
    const { fps, qrbox, disableFlip, verbose, qrCodeSuccessCallback } = props;

    useEffect(() => {
        // Cuando el componente se monta
        const html5QrcodeScanner = new Html5QrcodeScanner(
            qrcodeRegionId, {
                fps: fps, // Usar la prop desestructurada
                qrbox: qrbox, // Usar la prop desestructurada
                aspectRatio: 1.0, 
                disableFlip: disableFlip // Usar la prop desestructurada
            },
            verbose // Usar la prop desestructurada
        );

        // Callback cuando se escanea con éxito
        const onScanSuccess = (decodedText, decodedResult) => {
            qrCodeSuccessCallback(decodedText, decodedResult); // Usar la prop desestructurada
        };

        // Callback cuando hay un error en el escaneo
        const onScanError = (errorMessage) => {
            // console.warn(errorMessage); // Puedes descomentar si quieres ver errores de escaneo en consola
        };

        // Iniciar el escáner
        html5QrcodeScanner.render(onScanSuccess, onScanError);

        // Cuando el componente se desmonte, detener el escáner
        return () => {
            html5QrcodeScanner.clear().catch(error => {
                console.error("Failed to clear html5QrcodeScanner. ", error);
            });
        };
    }, [fps, qrbox, disableFlip, verbose, qrCodeSuccessCallback]); // Dependencias del useEffect

    return (
        <div id={qrcodeRegionId} />
    );
};

export default Html5QrcodePlugin;