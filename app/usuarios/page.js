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
    password: '',
    confirmPassword: '',
    rol: 'GENERAL'
  });

  const validatePassword = (password) => {
    // Min 8, Max 20. Must have Uppercase, Lowercase, Number, and Special Char.
    // Allowed special chars: Any non-alphanumeric character.
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,20}$/;
    return regex.test(password);
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const { data } = await api.get('/usuarios');
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (error) {
       console.error("Error fetching users", error);
       showToast('Error cargando usuarios', 'error');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    // Validations
    if (formData.password !== formData.confirmPassword) {
      showToast('Las contraseñas no coinciden', 'error');
      return;
    }

    if (!validatePassword(formData.password)) {
      showToast('La contraseña debe tener entre 8 y 20 caracteres, incluir mayúscula, minúscula, número y carácter especial.', 'error');
      return;
    }

    try {
      // Send only necessary data
      const payload = {
        nombre: formData.nombre,
        email: formData.email,
        password: formData.password,
        rol: formData.rol
      };

      await api.post('/usuarios', payload);
      showToast('Usuario creado correctamente', 'success');
      setShowModal(false);
      setFormData({ nombre: '', email: '', password: '', confirmPassword: '', rol: 'GENERAL' });
      fetchUsuarios();
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.mensaje || 'No se pudo crear el usuario';
      showToast(msg, 'error');
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

    if (!validatePassword(newPassword)) {
        showToast('La contraseña debe cumplir con los requisitos de seguridad.', 'error');
        return;
    }

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
    { header: 'Rol', accessor: 'rol', render: (row) => (
        <span className={`px-2 py-1 rounded text-xs font-medium 
            ${row.rol === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 
              row.rol === 'VENTAS' ? 'bg-blue-100 text-blue-600' :
              row.rol === 'COMPRAS' ? 'bg-green-100 text-green-600' :
              'bg-gray-100 text-gray-600'}`}>
            {row.rol || 'GENERAL'}
        </span>
    )},
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
          
          <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Rol</label>
              <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                  value={formData.rol}
                  onChange={(e) => setFormData({...formData, rol: e.target.value})}
              >
                  <option value="GENERAL">General</option>
                  <option value="ADMIN">Administrador</option>
                  <option value="VENTAS">Ventas</option>
                  <option value="COMPRAS">Compras</option>
              </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Contraseña" 
                name="password" 
                type="password" 
                value={formData.password} 
                onChange={(e) => setFormData({...formData, password: e.target.value})} 
                required 
              />
              <Input 
                label="Confirmar Contraseña" 
                name="confirmPassword" 
                type="password" 
                value={formData.confirmPassword} 
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} 
                required 
              />
          </div>
          <p className="text-xs text-slate-500">
            La contraseña debe tener entre 8 y 20 caracteres, incluir mayúscula, minúscula, número y carácter especial.
          </p>

          <div className="pt-4 flex justify-end gap-3">
             <Boton tipo="ghost" type="button" onClick={() => setShowModal(false)}>Cancelar</Boton>
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
