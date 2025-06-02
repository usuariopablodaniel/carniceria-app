import React from 'react'; // Asegúrate de importar React
import './App.css'; // Si quieres mantener tu CSS

// Importaciones de React Router DOM
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// ... otras importaciones
import ProductListPage from './pages/ProductListPage'; // <-- Añade esta línea

// Importa tus componentes de página. Si no los tienes creados, no te preocupes,
// los haremos más adelante, pero necesitamos los imports para las rutas.
// Por ahora, asumiremos que tienes (o crearás):
import HomePage from './pages/HomePage'; // Para la ruta principal '/'
import LoginPage from './pages/LoginPage'; // Para la ruta de login '/login'
import DashboardPage from './pages/DashboardPage'; // Para la ruta '/dashboard' (donde redirigiremos después del login de Google)
import ProductAddPage from './pages/ProductAddPage';
// *** NUEVA IMPORTACIÓN: El componente para manejar el éxito de Google ***
import AuthSuccessHandler from './components/AuthSuccessHandler';

function App() {
  return (
    // Envuelve toda tu aplicación con Router
    <Router>
      <div className="App">
        {/* Aquí podrías tener un Navbar o componentes comunes a todas las páginas */}

        {/* Aquí defines tus rutas usando Routes y Route */}
        <Routes>
          {/* Ruta para la página de inicio */}
          <Route path="/" element={<HomePage />} />

          {/* Ruta para la página de login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Ruta para el Dashboard (donde el usuario va después de iniciar sesión) */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* *** LA RUTA CRÍTICA PARA MANEJAR EL TOKEN DE GOOGLE *** */}
          <Route path="/auth-success" element={<AuthSuccessHandler />} />
          <Route path="/products" element={<ProductListPage />} /> {/* <-- Añade esta línea */}
          <Route path="/products/add" element={<ProductAddPage />} /> {/* <-- ¡Asegúrate que esta línea esté! */}

          {/* Puedes añadir una ruta para un 404 Not Found si lo deseas */}
          {/* <Route path="*" element={<h1>404 - Página no encontrada</h1>} /> */}
        </Routes>

        {/* Aquí podrías tener un Footer o componentes comunes al final de las páginas */}
      </div>
    </Router>
  );
}

export default App;