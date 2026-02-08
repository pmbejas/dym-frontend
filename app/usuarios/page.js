'use client';
import { useState, useEffect } from 'react';
import LayoutPrincipal from '@/components/LayoutPrincipal';
import Tabla from '@/components/Tabla';
import Boton from '@/components/Boton';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { PlusIcon, UserIcon, KeyIcon } from '@heroicons/react/24/outline';

export default function UsuariosPage() {
  const { showToast } = useToast();
  const [usuarios, setUsuarios] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  // Password Reset Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUserId, setResetUserId] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const { data } = await api.get('/usuarios');
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (error) {
       console.error("Error fetching users", error);
       setUsuarios([
         { id: 1, nombre: 'Admin User', email: 'admin@negocio.com', rol: 'admin' },
       ]);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/usuarios', formData);
      showToast('Usuario creado correctamente', 'success');
      setShowModal(false);
      setFormData({ nombre: '', email: '', password: '' });
      fetchUsuarios();
    } catch (error) {
      console.error(error);
      showToast('No se pudo crear el usuario', 'error');
    }
  };

  const handleResetPasswordClick = (row) => {
    setResetUserId(row.id);
    setNewPassword('');
    setShowResetModal(true);
  };

  const confirmResetPassword = async (e) => {
    e.preventDefault();
    if (!resetUserId || !newPassword) return;

    try {
      await api.post(`/usuarios/${resetUserId}/reset-password`, { password: newPassword });
      showToast('La contraseña ha sido reseteada', 'success');
      setShowResetModal(false);
    } catch (error) {
      showToast('No se pudo cambiar la contraseña', 'error');
    }
  };

  const columnas = [
    { header: 'Usuario', accessor: 'nombre', render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-pastel-primary/10 text-pastel-primary flex items-center justify-center">
          <UserIcon className="w-4 h-4" />
        </div>
        <div>
           <p className="font-medium text-gray-700">{row.nombre}</p>
           <p className="text-xs text-gray-400">ID: {row.id}</p>
        </div>
      </div>
    )},
    { header: 'Email', accessor: 'email' },
    { header: 'Rol', accessor: 'rol', render: () => <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded text-xs">Administrador</span>},
  ];

  const acciones = (row) => (
    <button 
      onClick={() => handleResetPasswordClick(row)}
      className="text-gray-400 hover:text-yellow-500 transition-colors"
      title="Resetear Contraseña"
    >
      <KeyIcon className="w-5 h-5" />
    </button>
  );

  return (
    <LayoutPrincipal>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-pastel-text">Usuarios</h1>
          <p className="text-gray-400">Gestión de acceso al sistema</p>
        </div>
        <Boton onClick={() => setShowModal(true)} tipo="primary" className="flex items-center gap-2">
          <PlusIcon className="w-5 h-5" /> Nuevo Usuario
        </Boton>
      </div>

      <Tabla 
        columnas={columnas} 
        datos={usuarios} 
        acciones={acciones}
      />

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title="Nuevo Usuario"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input 
            label="Nombre" 
            name="nombre" 
            value={formData.nombre} 
            onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
            required 
          />
          <Input 
            label="Email" 
            name="email" 
            type="email" 
            value={formData.email} 
            onChange={(e) => setFormData({...formData, email: e.target.value})} 
            required 
          />
          <Input 
            label="Contraseña" 
            name="password" 
            type="password" 
            value={formData.password} 
            onChange={(e) => setFormData({...formData, password: e.target.value})} 
            required 
          />
          <div className="pt-4 flex justify-end gap-3">
             <Boton tipo="ghost" onClick={() => setShowModal(false)}>Cancelar</Boton>
             <Boton type="submit" tipo="primary">Crear Usuario</Boton>
          </div>
        </form>
      </Modal>
      <Modal 
        isOpen={showResetModal} 
        onClose={() => setShowResetModal(false)} 
        title="Resetear Contraseña"
      >
        <form onSubmit={confirmResetPassword} className="space-y-4">
           <Input 
             label="Nueva Contraseña" 
             name="newPassword" 
             type="password" 
             value={newPassword} 
             onChange={(e) => setNewPassword(e.target.value)} 
             required 
           />
           <div className="pt-4 flex justify-end gap-3">
             <Boton tipo="ghost" onClick={() => setShowResetModal(false)}>Cancelar</Boton>
             <Boton type="submit" tipo="warning">Resetear</Boton>
           </div>
        </form>
      </Modal>
    </LayoutPrincipal>
  );
}
