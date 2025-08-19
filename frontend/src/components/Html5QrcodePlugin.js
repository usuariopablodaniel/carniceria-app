import { Html5QrcodeScanner } from 'html5-qrcode';
import React, { useEffect, useRef } from 'react';

const qrcodeRegionId = "html5qr-code-full-region";

// Componente React para el lector QR
const Html5QrcodePlugin = (props) => {
    const { fps, qrbox, disableFlip, verbose, qrCodeSuccessCallback } = props;
    const scannerRef = useRef(null);

    useEffect(() => {
        if (scannerRef.current) {
            console.log("Html5QrcodePlugin: Escáner ya inicializado, saltando re-inicialización.");
            return;
        }

        console.log("Html5QrcodePlugin: Componente montado. Creando e inicializando escáner.");
        const html5QrcodeScanner = new Html5QrcodeScanner(
            qrcodeRegionId, {
                fps: fps,
                qrbox: qrbox,
                aspectRatio: 1.0,
                disableFlip: disableFlip,
                // Agrega esta nueva propiedad para forzar la cámara trasera
                videoConstraints: {
                    facingMode: { exact: "environment" }
                }
            },
            verbose
        );

        scannerRef.current = html5QrcodeScanner;

        const onScanSuccess = (decodedText, decodedResult) => {
            qrCodeSuccessCallback(decodedText, decodedResult);
        };

        const onScanError = (errorMessage) => {
            console.error("Html5QrcodePlugin: Error de escaneo o cámara:", errorMessage);
        };

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
        }

        return () => {
            console.log("Html5QrcodePlugin: Función de limpieza del useEffect (desmontaje).");
            if (scannerRef.current) {
                scannerRef.current.clear()
                    .then(() => console.log("Html5QrcodePlugin: Escáner limpiado correctamente al desmontar."))
                    .catch(err => console.error("Html5QrcodePlugin: Error al limpiar el escáner al desmontar:", err));
                scannerRef.current = null;
            }
        };
    }, [fps, qrbox, disableFlip, verbose, qrCodeSuccessCallback]);

    return (
        <div id={qrcodeRegionId} />
    );
};

export default Html5QrcodePlugin;