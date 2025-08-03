// frontend/src/pages/ContactPage.js
import React from 'react';
import { Container, Card, Button, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';

const ContactPage = () => {
    // >>>>> REEMPLAZA ESTOS VALORES CON LA INFORMACIÓN REAL DE TU NEGOCIO <<<<<
    // Formato del número de WhatsApp: código de país + número, sin + ni 0.
    // Ejemplo: Si tu número es 11 3525 5272, y el código de país es 54, el valor sería "5491135255272"
    const whatsappNumber = "5493525527259";
    const instagramUsername = "piazzoniembutidos";
    const emailAddress = "embutidospiazzoni@gmail.com";

    return (
        <Container className="my-5 d-flex justify-content-center">
            <Card className="shadow-lg p-4" style={{ maxWidth: '600px', width: '100%' }}>
                <Card.Body>
                    <h2 className="text-center mb-4">Contacto</h2>
                    <p className="text-center text-muted">
                        Para cualquier consulta, sugerencia o pedido especial, no dudes en contactarnos a través de los siguientes canales:
                    </p>
                    <Row className="justify-content-center mt-4">
                        <Col xs={12} md={4} className="text-center mb-3">
                            <a
                                // Correcto: Usa la variable 'whatsappNumber'
                                href={`https://wa.me/${whatsappNumber}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-success btn-lg d-block"
                            >
                                <FontAwesomeIcon icon={faWhatsapp} className="me-2" />
                                WhatsApp
                            </a>
                        </Col>
                        <Col xs={12} md={4} className="text-center mb-3">
                            <a
                                // Correcto: Usa la variable 'instagramUsername'
                                href={`https://www.instagram.com/${instagramUsername}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-danger btn-lg d-block"
                                style={{
                                    background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
                                    border: 'none',
                                    color: 'white'
                                }}
                            >
                                <FontAwesomeIcon icon={faInstagram} className="me-2" />
                                Instagram
                            </a>
                        </Col>
                        <Col xs={12} md={4} className="text-center mb-3">
                            <a
                                // Correcto: Usa la variable 'emailAddress'
                                href={`mailto:${emailAddress}`}
                                className="btn btn-info btn-lg d-block"
                            >
                                <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                                Email
                            </a>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ContactPage;