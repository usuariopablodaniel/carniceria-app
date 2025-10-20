import { Html5Qrcode } from 'html5-qrcode'; // Importamos la clase principal
import React, { useEffect, useRef, useState } from 'react';

const qrcodeRegionId = "html5qr-code-full-region";

const Html5QrcodePlugin = (props) => {
    const { fps, qrbox, disableFlip, verbose, qrCodeSuccessCallback } = props;
    
    // Usamos una referencia para el objeto de la cámara, no para el scanner UI.
    const html5QrCodeRef = useRef(null);
    const [cameraError, setCameraError] = useState(null);
    const [isLoadingCameras, setIsLoadingCameras] = useState(true);

    useEffect(() => {
        // Esta función se ejecuta solo una vez para encontrar la cámara y empezar a escanear.
        const startScanner = async () => {
            try {
                const cameras = await Html5Qrcode.getCameras();
                if (cameras && cameras.length) {
                    // Priorizamos las cámaras traseras ("environment")
                    const backCameras = cameras.filter(camera => camera.label.toLowerCase().includes('back') || (camera.facingMode && camera.facingMode.toLowerCase() === 'environment'));
                    
                    let selectedCameraId;
                    if (backCameras.length > 0) {
                        // Si hay cámaras traseras, usamos la primera de la lista.
                        selectedCameraId = backCameras[0].id;
                        console.log(`Cámara trasera seleccionada: ${backCameras[0].label}`);
                    } else {
                        // Si no, como fallback, usamos la primera cámara que encontremos.
                        selectedCameraId = cameras[0].id;
                        console.warn(`No se encontraron cámaras traseras. Usando fallback: ${cameras[0].label}`);
                    }

                    // Creamos una nueva instancia de la clase principal
                    const html5QrCode = new Html5Qrcode(qrcodeRegionId, verbose);
                    html5QrCodeRef.current = html5QrCode;

                    // Iniciamos el escáner con el ID de la cámara seleccionada
                    await html5QrCode.start(
                        selectedCameraId,
                        {
                            fps: fps,
                            qrbox: qrbox,
                            disableFlip: disableFlip,
                        },
                        (decodedText, decodedResult) => {
                            // Envolvemos el callback para asegurar que se detiene el escáner si es necesario
                            if (qrCodeSuccessCallback) {
                                qrCodeSuccessCallback(decodedText, decodedResult);
                            }
                        },
                        (errorMessage) => {
                            // Los errores de "QR code not found" son normales, los ignoramos si son verbosos.
                            if (verbose) {
                                console.log("QR Code no encontrado.", errorMessage);
                            }
                        }
                    );
                    setCameraError(null); // Limpiamos errores previos si el inicio es exitoso
                } else {
                    setCameraError("No se encontraron cámaras en este dispositivo.");
                }
            } catch (err) {
                console.error("Error al obtener cámaras o iniciar el escáner:", err);
                setCameraError("No se pudo acceder a las cámaras. Por favor, verifica los permisos.");
            } finally {
                setIsLoadingCameras(false);
            }
        };

        startScanner();

        // Función de limpieza para detener la cámara cuando el componente se desmonte
        return () => {
            if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                html5QrCodeRef.current.stop()
                    .then(() => console.log("Escáner QR detenido exitosamente."))
                    .catch(err => console.error("Error al detener el escáner QR:", err));
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // El array vacío asegura que este efecto se ejecute solo una vez.

    return (
        <div>
            <div id={qrcodeRegionId} style={{ minHeight: '250px' }} />
            {isLoadingCameras && <p>Iniciando cámara...</p>}
            {cameraError && <p style={{ color: 'red' }}>Error: {cameraError}</p>}
        </div>
    );
};

export default Html5QrcodePlugin;