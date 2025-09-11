// src/components/Footer.js
import React from 'react';
import { Container } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="bg-light text-center text-muted py-3 mt-auto"> {/* bg-light para fondo claro, py-3 para padding, mt-auto para que se pegue al fondo si usas flex */}
      <Container>
        <p className="mb-0">Creado por P&G desarrollo web - 3535510674</p> {/* mb-0 para eliminar margen inferior */}
      </Container>
    </footer>
  );
};

export default Footer;