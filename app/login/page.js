'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import Input from '@/components/Input';
import Boton from '@/components/Boton';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { showToast } = useToast();
  const { login } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Adjust endpoint based on actual backend route
      const response = await api.post('/auth/login', formData); 
      
      const { token, usuario } = response.data;
      
      // Use auth context login
      login(token, usuario);
      // logic handled in context (storage, cookie, redirect)
      
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.mensaje || 'Credenciales inválidas. Verifique sus datos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg border border-slate-200 p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4">
             <span className="text-white font-bold text-xl">E</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            Iniciar Sesión
          </h1>
          <p className="text-slate-500 mt-2 text-sm">Ingrese sus credenciales para acceder</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input 
            label="Email" 
            name="email" 
            placeholder="admin@ejemplo.com"
            value={formData.email} 
            onChange={handleChange} 
            required
          />
          
          <Input 
            label="Contraseña" 
            name="password" 
            type="password" 
            placeholder="••••••••"
            value={formData.password} 
            onChange={handleChange} 
            required
          />

          <Boton 
            type="submit" 
            tipo="primary" 
            className="w-full justify-center py-2.5 shadow-md"
            disabled={loading}
          >
            {loading ? 'Verificando...' : 'Ingresar'}
          </Boton>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
             © 2026 MiNegocio ERP. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
