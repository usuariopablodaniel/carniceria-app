import React from 'react';
import { Card, Button, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const RedeemProductList = ({ products, userPoints }) => {
    const navigate = useNavigate();

    const handleRedeem = (product) => {
        if (userPoints >= product.costo_puntos) {
            navigate('/dashboard', { 
                state: { 
                    canjeo: true,
                    productToRedeem: product, 
                    message: `Muestra el código QR al vendedor para canjear tu ${product.nombre}. Se debitarán ${product.costo_puntos} puntos.`,
                    variant: 'success'
                } 
            });
        }
    };
    
    return (
        <Row className="g-4">
            {products.length > 0 ? (
                products.map(product => (
                    <Col key={product.id} md={4} className="d-flex">
                        <Card className="w-100 shadow-sm rounded-lg d-flex flex-column">
                            <Card.Img variant="top" src={product.imagen_url} alt={product.nombre} style={{ height: '200px', objectFit: 'cover' }} />
                            <Card.Body className="d-flex flex-column">
                                <Card.Title className="text-center">{product.nombre}</Card.Title>
                                <Card.Text className="text-center text-muted mb-2 flex-grow-1">
                                    {product.descripcion}
                                </Card.Text>
                                <div className="text-center mt-auto">
                                    <h4 className="text-primary mb-3">{product.costo_puntos} puntos</h4>
                                    {userPoints !== null && userPoints < product.costo_puntos ? (
                                        <Button variant="outline-secondary" disabled>
                                            Puntos Insuficientes
                                        </Button>
                                    ) : (
                                        <Button 
                                            variant="primary" 
                                            onClick={() => handleRedeem(product)}
                                            disabled={userPoints === null}
                                        >
                                            Canjear Ahora
                                        </Button>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))
            ) : (
                <Col>
                    <Alert variant="info" className="text-center">
                        No hay productos disponibles para canjear en este momento.
                    </Alert>
                </Col>
            )}
        </Row>
    );
};

export default RedeemProductList;