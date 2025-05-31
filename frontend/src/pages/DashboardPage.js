import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        } else {
          console.error('Error al obtener datos del usuario:', response.statusText);
          localStorage.removeItem('jwtToken');
          navigate('/login');
        }
      } catch (error) {
        console.error('Error de red al obtener datos del usuario:', error);
        localStorage.removeItem('jwtToken');
        navigate('/login');
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    navigate('/login');
    alert('Sesión cerrada');
  };

  if (!userData) {
    return <p>Cargando perfil del usuario...</p>;
  }

  return (
    <div>
      <h1>Bienvenido, {userData.nombre}!</h1>
      <p>Email: {userData.email}</p>
      <p>Puntos actuales: {userData.puntos_actuales}</p>
      <button onClick={handleLogout}>Cerrar Sesión</button>
    </div>
  );
};

export default DashboardPage;