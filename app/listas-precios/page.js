'use client';
import { useState, useEffect } from 'react';
import LayoutPrincipal from '@/components/LayoutPrincipal';
import Boton from '@/components/Boton';
import Modal from '@/components/Modal';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { PlusIcon, PencilSquareIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function ListasPreciosPage() {
  const { showToast } = useToast();
  const [listas, setListas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', porcentaje: '', por_defecto: false });

  useEffect(() => {
    fetchListas();
  }, []);

  const fetchListas = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/listas-precios');
      setListas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      showToast('Error cargando listas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setEditingId(null);
    setFormData({ nombre: '', porcentaje: '', por_defecto: false });
    setModalOpen(true);
  };

  const openEdit = (lista) => {
    setEditingId(lista.id);
    setFormData({ 
        nombre: lista.nombre, 
        porcentaje: lista.porcentaje, 
        por_defecto: lista.por_defecto 
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        if (editingId) {
            await api.put(`/listas-precios/${editingId}`, formData);
            showToast('Lista actualizada', 'success');
        } else {
            await api.post('/listas-precios', formData);
            showToast('Lista creada', 'success');
        }
        setModalOpen(false);
        fetchListas();
    } catch (error) {
        console.error(error);
        showToast('Error al guardar', 'error');
    }
  };

  const handleDelete = async (id) => {
    if(!confirm('¿Seguro que deseas eliminar esta lista?')) return;
    try {
        await api.delete(`/listas-precios/${id}`);
        showToast('Lista eliminada', 'success');
        fetchListas();
    } catch (error) {
        console.error(error);
        showToast('Error al eliminar', 'error');
    }
  };

  return (
    <LayoutPrincipal>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Listas de Precios</h1>
            <Boton onClick={openNew} tipo="primary">
                <PlusIcon className="w-5 h-5 mr-2" />
                Nueva Lista
            </Boton>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Margen (%)</th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Por Defecto</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                    {listas.map((lista) => (
                        <tr key={lista.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{lista.nombre}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-600 font-mono">+{parseFloat(lista.porcentaje).toFixed(2)}%</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                {lista.por_defecto && <CheckCircleIcon className="w-5 h-5 text-green-500 mx-auto" />}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button onClick={() => openEdit(lista)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                                    <PencilSquareIcon className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleDelete(lista.id)} className="text-red-600 hover:text-red-900">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {listas.length === 0 && !loading && (
                        <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400">No hay listas de precios creadas.</td></tr>
                    )}
                </tbody>
            </table>
        </div>

        {/* Modal Form */}
        <Modal 
            isOpen={modalOpen} 
            onClose={() => setModalOpen(false)}
            title={editingId ? 'Editar Lista' : 'Nueva Lista de Precios'}
            actionLabel="Guardar"
            onAction={handleSubmit}
        >
            <div className="space-y-4">
                <div className="flex flex-col space-y-1">
                    <label className="text-sm font-medium text-slate-700">Nombre de la Lista</label>
                    <input 
                        type="text" 
                        required
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        value={formData.nombre}
                        onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
                        placeholder="Ej. Minorista, Mayorista..."
                    />
                </div>
                <div className="flex flex-col space-y-1">
                    <label className="text-sm font-medium text-slate-700">Margen de Ganancia (%)</label>
                    <input 
                        type="number" 
                        required
                        step="0.01"
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        value={formData.porcentaje}
                        onChange={(e) => setFormData({...formData, porcentaje: e.target.value})} 
                        placeholder="Ej. 50"
                    />
                    <p className="text-xs text-slate-500">Se aplicará sobre el Costo Total del producto.</p>
                </div>
                <div className="flex items-center gap-2 pt-2">
                    <input 
                        type="checkbox" 
                        id="defecto"
                        checked={formData.por_defecto}
                        onChange={(e) => setFormData({...formData, por_defecto: e.target.checked})}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="defecto" className="text-sm text-slate-700">Marcar como lista por defecto</label>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
                    <Boton type="button" tipo="ghost" onClick={() => setModalOpen(false)}>Cancelar</Boton>
                    <Boton onClick={handleSubmit} tipo="primary">{editingId ? 'Guardar Cambios' : 'Crear Lista'}</Boton>
                </div>
            </div>
        </Modal>
    </LayoutPrincipal>
  );
}
