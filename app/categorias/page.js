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
import { PlusIcon, FolderIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function CategoriasPage() {
  const { showToast } = useToast();
  const [categorias, setCategorias] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  // Confirm Modal
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [modoEdicion, setModoEdicion] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    nombre: '',
    costo_importacion_default_usd: 0,
    costo_flete_default_usd: 0
  });

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    try {
      const { data } = await api.get('/categorias');
      setCategorias(Array.isArray(data) ? data : []);
    } catch (error) {
       console.error("Error fetching categories", error);
       showToast('No se pudo cargar la lista de categorías.', 'error');
       setCategorias([]);
    }
  };

  const handleOpenModal = (categoria = null) => {
    if (categoria) {
      setModoEdicion(true);
      setCurrentId(categoria.id);
      setFormData({ ...categoria });
    } else {
      setModoEdicion(false);
      setCurrentId(null);
      setFormData({ nombre: '', costo_importacion_default_usd: 0, costo_flete_default_usd: 0 });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modoEdicion) {
        await api.put(`/categorias/${formData.id}`, formData);
        showToast('Categoría actualizada correctamente', 'success');
      } else {
        await api.post('/categorias', formData);
        showToast('Categoría creada correctamente', 'success');
      }
      setShowModal(false);
      fetchCategorias();
    } catch (error) {
      console.error(error);
      showToast('No se pudo guardar la categoría', 'error');
    }
  };

  const handleEliminar = (row) => {
    setDeleteId(row.id);
    setShowConfirm(true);
  };

  const confirmDelete = async (password) => {
    if (!deleteId) return;
    try {
        await api.post(`/categorias/${deleteId}/eliminar`, { password });
        showToast('La categoría ha sido eliminada.', 'success');
        fetchCategorias();
    } catch (error) {
        console.error(error);
        if (error.response && error.response.status === 401) {
            showToast('Contraseña incorrecta', 'error');
        } else {
            showToast('No se pudo eliminar la categoría.', 'error');
        }
    } finally {
        setDeleteId(null);
        setShowConfirm(false);
    }
  };

  const filteredData = categorias.filter(c => 
    c.nombre?.toLowerCase().includes(search.toLowerCase())
  );

  const columnas = [
    { header: 'ID', accessor: 'id', className: 'w-16' },
    { header: 'Nombre', accessor: 'nombre', className: 'w-full', render: (row) => (
      <div className="flex items-center gap-2">
        <FolderIcon className="w-5 h-5 text-indigo-400" />
        <span className="font-medium text-slate-700">{row.nombre}</span>
      </div>
    )},
    { header: 'Importación (USD)', accessor: 'costo_importacion_default_usd', className: 'w-32 text-right', render: (row) => <div className="text-right">${row.costo_importacion_default_usd || 0}</div> },
    { header: 'Flete (USD)', accessor: 'costo_flete_default_usd', className: 'w-32 text-right', render: (row) => <div className="text-right">${row.costo_flete_default_usd || 0}</div> },
  ];

  return (
    <LayoutPrincipal>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Categorías</h1>
          <p className="text-slate-500">Gestiona las categorías de tus productos</p>
        </div>
        <Boton onClick={() => handleOpenModal()} tipo="primary" className="flex items-center gap-2">
          <PlusIcon className="w-5 h-5" /> Nueva Categoría
        </Boton>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex items-center gap-3">
        <MagnifyingGlassIcon className="w-5 h-5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Buscar categoría..." 
          className="flex-1 outline-none text-slate-600 placeholder-slate-400"
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
        title={modoEdicion ? "Editar Categoría" : "Nueva Categoría"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Nombre" 
            name="nombre" 
            value={formData.nombre} 
            onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
            required 
            placeholder="Ej. Electrónica, Muebles..."
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Costo Importación Default (USD)" 
              name="costo_importacion_default_usd" 
              type="number"
              step="0.01"
              min="0"
              value={formData.costo_importacion_default_usd} 
              onChange={(e) => setFormData({...formData, costo_importacion_default_usd: e.target.value})} 
              required 
              placeholder="0.00"
            />
            <Input 
              label="Costo Flete Default (USD)" 
              name="costo_flete_default_usd" 
              type="number"
              step="0.01"
              min="0"
              value={formData.costo_flete_default_usd} 
              onChange={(e) => setFormData({...formData, costo_flete_default_usd: e.target.value})} 
              required 
              placeholder="0.00"
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
             <Boton tipo="ghost" onClick={() => setShowModal(false)}>Cancelar</Boton>
             <Boton type="submit" tipo="primary">{modoEdicion ? 'Guardar Cambios' : 'Crear Categoría'}</Boton>
          </div>
        </form>
      </Modal>
      <ConfirmModal 
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmDelete}
        title="Eliminar Categoría con Seguridad"
        message="ADVERTENCIA: Al eliminar esta categoría, se eliminarán permanentemente TODOS los productos asociados a ella. Esta acción no se puede deshacer. Ingrese su contraseña para confirmar."
        requirePassword={true}
      />
    </LayoutPrincipal>
  );
}
