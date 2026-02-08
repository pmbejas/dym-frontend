'use client';
import { useState, useEffect } from 'react';
import LayoutPrincipal from '@/components/LayoutPrincipal';
import Tabla from '@/components/Tabla';
import Boton from '@/components/Boton';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import ConfirmModal from '@/components/ConfirmModal';
import { PlusIcon, UserIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function ClientesPage() {
  const { showToast } = useToast();
  const [clientes, setClientes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  // Confirm Modal
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [modoEdicion, setModoEdicion] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    cuit_cuil: '',
    direccion: '',
    telefono: '',
    email: ''
  });

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      const { data } = await api.get('/clientes');
      setClientes(Array.isArray(data) ? data : []);
    } catch (error) {
       console.error("Error fetching clients", error);
       showToast('No se pudo cargar la lista de clientes.', 'error');
       setClientes([]);
    }
  };

  const handleOpenModal = (cliente = null) => {
    if (cliente) {
      setModoEdicion(true);
      setCurrentId(cliente.id);
      setFormData({ ...cliente });
    } else {
      setModoEdicion(false);
      setCurrentId(null);
      setFormData({ nombre: '', apellido: '', cuit_cuil: '', direccion: '', telefono: '', email: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modoEdicion) {
        await api.put(`/clientes/${formData.id}`, formData);
        showToast('Cliente actualizado correctamente', 'success');
      } else {
        await api.post('/clientes', formData);
        showToast('Cliente creado correctamente', 'success');
      }
      setShowModal(false);
      fetchClientes();
    } catch (error) {
      console.error(error);
      showToast('No se pudo guardar el cliente', 'error');
    }
  };

  const handleEliminar = (row) => {
    setDeleteId(row.id);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
        await api.delete(`/clientes/${deleteId}`);
        showToast('El cliente ha sido eliminado.', 'success');
        fetchClientes();
    } catch (error) {
        console.error(error);
        showToast('No se pudo eliminar el cliente.', 'error');
    } finally {
        setDeleteId(null);
        setShowConfirm(false);
    }
  };

  const filteredData = clientes.filter(c => 
    c.nombre.toLowerCase().includes(search.toLowerCase()) || 
    c.apellido.toLowerCase().includes(search.toLowerCase()) ||
    c.cuit_cuil.includes(search)
  );

  const columnas = [
    { header: 'Cliente', accessor: 'apellido', render: (row) => (
      <div>
        <p className="font-semibold text-gray-700">{row.apellido}, {row.nombre}</p>
        <p className="text-xs text-gray-400">{row.email}</p>
      </div>
    )},
    { header: 'CUIT/CUIL', accessor: 'cuit_cuil' },
    { header: 'Teléfono', accessor: 'telefono' },
    { header: 'Dirección', accessor: 'direccion' },
    { header: 'Saldo', accessor: 'saldo_actual', render: (row) => (
      <span className={`font-medium ${row.saldo_actual > 0 ? 'text-red-500' : 'text-green-500'}`}>
        $ {row.saldo_actual}
      </span>
    )},
  ];

  return (
    <LayoutPrincipal>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-pastel-text">Clientes</h1>
          <p className="text-gray-400">Administra tu cartera de clientes</p>
        </div>
        <Boton onClick={() => handleOpenModal()} tipo="primary" className="flex items-center gap-2">
          <PlusIcon className="w-5 h-5" /> Nuevo Cliente
        </Boton>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex items-center gap-3">
        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
        <input 
          type="text" 
          placeholder="Buscar por nombre o CUIT..." 
          className="flex-1 outline-none text-gray-600 placeholder-gray-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Tabla 
        columnas={columnas} 
        datos={filteredData} 
        onEditar={handleOpenModal} 
        onEliminar={handleEliminar}
      />

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title={modoEdicion ? "Editar Cliente" : "Nuevo Cliente"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input 
              label="Apellido" 
              name="apellido" 
              value={formData.apellido} 
              onChange={(e) => setFormData({...formData, apellido: e.target.value})} 
              required 
            />
            <Input 
              label="Nombre" 
              name="nombre" 
              value={formData.nombre} 
              onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
              required 
            />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="CUIT / CUIL" 
              name="cuit_cuil" 
              value={formData.cuit_cuil} 
              onChange={(e) => setFormData({...formData, cuit_cuil: e.target.value})} 
            />
             <Input 
              label="Teléfono" 
              name="telefono" 
              value={formData.telefono} 
              onChange={(e) => setFormData({...formData, telefono: e.target.value})} 
            />
          </div>
          <Input 
            label="Email" 
            name="email" 
            type="email" 
            value={formData.email} 
            onChange={(e) => setFormData({...formData, email: e.target.value})} 
          />
          <Input 
            label="Dirección" 
            name="direccion" 
            value={formData.direccion} 
            onChange={(e) => setFormData({...formData, direccion: e.target.value})} 
          />
          <div className="pt-4 flex justify-end gap-3">
             <Boton tipo="ghost" onClick={() => setShowModal(false)}>Cancelar</Boton>
             <Boton type="submit" tipo="primary">{modoEdicion ? 'Guardar Cambios' : 'Crear Cliente'}</Boton>
          </div>
        </form>
      </Modal>
      <ConfirmModal 
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmDelete}
        title="Eliminar Cliente"
        message="¿Estás seguro de que deseas eliminar este cliente?"
      />
    </LayoutPrincipal>
  );
}
