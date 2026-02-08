import axios from 'axios';

// Get API URL from env or default to localhost
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token to requests
api.interceptors.request.use(
  (config) => {
    // Check client-side before accessing localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle responses and potential auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized access (e.g., redirect to login)
      // We avoid direct redirection here to prevent loops, but can emit event
      if (typeof window !== 'undefined') {
         // optionally remove token
         // localStorage.removeItem('token');
         // window.location.href = '/login'; 
      }
    }
    return Promise.reject(error);
  }
);

// Compras
export const getCompras = async () => {
  const response = await api.get('/compras');
  return response.data;
};

export const getCompraById = async (id) => {
  const response = await api.get(`/compras/${id}`);
  return response.data;
};

export const createCompra = async (data) => {
  const response = await api.post('/compras', data);
  return response.data;
};

export const confirmarCompra = async (id) => {
  const response = await api.post(`/compras/${id}/confirmar`);
  return response.data;
};

export const updateCompra = async (id, data) => {
  const response = await api.put(`/compras/${id}`, data);
  return response.data;
};

export const registrarRecepcion = async (id, data) => {
  const response = await api.post(`/compras/${id}/recepcion`, data);
  return response.data;
};

export const registrarPagoCompra = async (id, data) => {
  const response = await api.post(`/compras/${id}/pago`, data);
  return response.data;
};

export const getProveedores = async () => {
  const response = await api.get('/proveedores');
  return response.data;
};

export const getProductos = async () => {
  const response = await api.get('/productos');
  return response.data;
};

export default api;
