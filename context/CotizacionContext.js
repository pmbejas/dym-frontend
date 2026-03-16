'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getConfiguracion, updateConfiguracion } from '@/services/api';
import { useAuth } from './AuthContext';

const CotizacionContext = createContext();

export function CotizacionProvider({ children }) {
  const { user } = useAuth();
  const [cotizacion, setCotizacion] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCotizacion = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      const data = await getConfiguracion();
      const rate = parseFloat(data.cotizacion_dolar) || 0;
      console.log('Cotizacion:', rate);
      setCotizacion(rate);
    } catch (error) {
      console.error('Error fetching cotizacion:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCotizacion = async (newRate) => {
    try {
      const data = {
        clave: 'cotizacion_dolar',
        valor: newRate.toString()
      }
      respuesta = await updateConfiguracion(data);
      setCotizacion(parseFloat(newRate));
      return true;
    } catch (error) {
      console.error('Error updating cotizacion:', error);
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchCotizacion();
    } else {
      setCotizacion(0);
      setLoading(false);
    }
  }, [user, fetchCotizacion]);

  return (
    <CotizacionContext.Provider value={{ cotizacion, updateCotizacion, refreshCotizacion: fetchCotizacion, loading }}>
      {children}
    </CotizacionContext.Provider>
  );
}

export const useCotizacion = () => useContext(CotizacionContext);
