'use client';
import { useState, useEffect } from 'react';
import LayoutPrincipal from '@/components/LayoutPrincipal';
import Tabla from '@/components/Tabla';
import Boton from '@/components/Boton';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import api, { getClientes } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import ConfirmModal from '@/components/ConfirmModal';
import { PlusIcon, UserIcon, MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function ClientesPage() {
  const { showToast } = useToast();
  const [clientes, setClientes] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
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

  // Use effectively a debounced search to avoid fetching per keystroke
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchClientes();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [search, currentPage, itemsPerPage]);

  const fetchClientes = async () => {
    try {
      const result = await getClientes(currentPage, itemsPerPage, search);
      setClientes(Array.isArray(result.data) ? result.data : []);
      setTotalPages(result.totalPages || 1);
      setTotalRecords(result.totalItems || 0);
    } catch (error) {
       console.error("Error fetching clients", error);
       showToast('No se pudo cargar la lista de clientes.', 'error');
       setClientes([]);
       setTotalPages(1);
       setTotalRecords(0);
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

  const confirmDelete = async (password) => {
    if (!deleteId) return;
    try {
        await api.delete(`/clientes/${deleteId}`, { data: { password } });
        showToast('El cliente ha sido eliminado.', 'success');
        setDeleteId(null);
        setShowConfirm(false);
        fetchClientes();
    } catch (error) {
        console.error(error);
        if (error.response && error.response.data && error.response.data.error) {
           showToast(error.response.data.error, 'error');
        } else {
           showToast('No se pudo eliminar el cliente.', 'error');
        }
    }
  };

  const filteredData = clientes; // Data is already filtered by backend
  
  // Reset page to 1 when search or itemsPerPage changes
  useEffect(() => setCurrentPage(1), [search, itemsPerPage]);

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

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row items-center gap-3">
        <form className="flex flex-1 items-center gap-3 w-full" autoComplete="off" onSubmit={(e) => e.preventDefault()}>
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
            
            <input 
              type="text" 
              name={`buscar_${Math.random().toString(36).substring(2, 7)}`}
              placeholder="Buscar por nombre, apellido o CUIT..." 
              className="flex-1 outline-none text-gray-600 placeholder-gray-400 bg-transparent"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="new-password"
              spellCheck="false"
              autoCorrect="off"
              readOnly={search === ''}
              onFocus={(e) => e.target.removeAttribute('readonly')}
            />
        </form>
        
        {/* Results per page selector */}
        <div className="flex items-center gap-2 border-l border-gray-100 pl-4">
            <span className="text-xs text-slate-400 font-medium">Mostrar:</span>
            <select 
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none focus:border-indigo-300"
            >
                {[10, 15, 20, 25, 30, 40, 50, 100].map(n => (
                    <option key={n} value={n}>{n}</option>
                ))}
            </select>
        </div>
      </div>

      <Tabla 
        columnas={columnas} 
        datos={filteredData} 
        onEditar={handleOpenModal} 
        onEliminar={handleEliminar}
      />

      {/* Pagination Controls */}
      {totalPages > 0 && (
        <div className="flex items-center justify-between mt-4 px-2">
            <span className="text-xs text-slate-400">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalRecords)} de {totalRecords} resultados
            </span>
            <div className="flex gap-1">
                <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1 px-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1))
                        .map((p, i, arr) => (
                            <div key={p} className="flex items-center">
                                {i > 0 && arr[i-1] !== p - 1 && <span className="text-slate-300 px-1">...</span>}
                                <button
                                    onClick={() => setCurrentPage(p)}
                                    className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                                        currentPage === p 
                                        ? 'bg-indigo-600 text-white shadow-sm' 
                                        : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    {p}
                                </button>
                            </div>
                        ))
                    }
                </div>
                <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronRightIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
      )}

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
        message="¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer."
        requirePassword={true}
      />
    </LayoutPrincipal>
  );
}
