import axios from 'axios';

// Crea una instancia de Axios
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Asegúrate de que esta sea la URL de tu backend
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;