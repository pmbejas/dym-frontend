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
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Handle unauthorized access or forbidden (invalid token)
      if (typeof window !== 'undefined') {
         // Force logout by clearing all auth data
         localStorage.removeItem('token');
         localStorage.removeItem('user');
         document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
         
         // Redirect with logout signal to ensure middleware lets us through
         if (!window.location.search.includes('logout=true')) {
             window.location.href = '/login?logout=true';
         }
      }
    }
    return Promise.reject(error);
  }
);

// Configuracion
export const getConfiguracion = async () => {
  const response = await api.get('/configuracion');
  return response.data;
};

export const updateConfiguracion = async (data) => {
  const response = await api.put('/configuracion', { 
    clave: data.clave, 
    valor: data.valor 
  });
  return response.data;
};

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

export const registrarRecepcion = (id, data) => api.post(`/compras/${id}/recepcion`, data);

export const registrarPagoCompra = (id, data) => api.post(`/compras/${id}/pago`, data);

export const getProveedores = async (page = 1, limit = 10, search = '') => {
  const response = await api.get('/proveedores', { params: { page, limit, search } });
  return response.data;
};

export const getProductos = async (page = 1, limit = 10, search = '') => {
  const response = await api.get('/productos', { params: { page, limit, search } });
  return response.data;
};

export const getClientes = async (page = 1, limit = 10, search = '') => {
  const response = await api.get('/clientes', { params: { page, limit, search } });
  return response.data;
};

// Validación de documentos
export const validatePurchase = (token) => api.post('/validacion/compra', { token });
export const validateSale = (token) => api.post('/validacion/venta', { token });

export default api;
