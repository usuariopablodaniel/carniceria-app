import React from 'react';
import { Link } from 'react-router-dom'; // Importa Link para la navegación

const HomePage = () => {
  return (
    <div>
      <h1>Bienvenido a Carnicería App</h1>
      <p>Esta es la página principal.</p>
      <p>
        <Link to="/login">Ir a la página de inicio de sesión</Link>
      </p>
      {/* Puedes añadir más contenido aquí */}
    </div>
  );
};

export default HomePage;