'use client';
import { useState, useEffect } from 'react';
import LayoutPrincipal from '@/components/LayoutPrincipal';
import Boton from '@/components/Boton';
import Tabla from '@/components/Tabla';
import Input from '@/components/Input';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { 
  UsersIcon, 
  PlusIcon, 
  PencilSquareIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  PhoneIcon,
  UserIcon
} from '@heroicons/react/24/outline'; // Updated import path for v2

export default function ProveedoresPage() {
    const { showToast } = useToast();
    const [proveedores, setProveedores] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filtro, setFiltro] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        id: null,
        razon_social: '',
        cuit: '',
        telefono: '',
        contacto_nombre: '',
        direccion: '',
        observaciones: ''
    });

    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    useEffect(() => {
        fetchProveedores();
    }, []);

    const fetchProveedores = async () => {
        setIsLoading(true);
        try {
            const { data } = await api.get('/proveedores');
            setProveedores(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            showToast('Error cargando proveedores', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/proveedores/${formData.id}`, formData);
                showToast('Proveedor actualizado correctamente', 'success');
            } else {
                await api.post('/proveedores', formData);
                showToast('Proveedor creado correctamente', 'success');
            }
            setShowModal(false);
            fetchProveedores();
        } catch (error) {
            console.error(error);
            showToast('Error al guardar proveedor', 'error');
        }
    };

    const handleEdit = (prov) => {
        setFormData({
            id: prov.id,
            razon_social: prov.razon_social || '',
            cuit: prov.cuit || '',
            telefono: prov.telefono || '',
            contacto_nombre: prov.contacto_nombre || '',
            direccion: prov.direccion || '',
            observaciones: prov.observaciones || ''
        });
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDeleteClick = (id) => {
        setSelectedId(id);
        setShowConfirmDelete(true);
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/proveedores/${selectedId}`);
            showToast('Proveedor eliminado', 'success');
            setShowConfirmDelete(false);
            fetchProveedores();
        } catch (error) {
            console.error(error);
            showToast('Error al eliminar', 'error');
        }
    };

    const columnas = [
        { header: 'Razón Social', accessor: 'razon_social', className: 'font-medium text-[var(--text-primary)]' },
        { header: 'Teléfono', accessor: 'telefono', render: (row) => (
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                {row.telefono && <PhoneIcon className="w-4 h-4" />}
                <span>{row.telefono || '-'}</span>
            </div>
        )},
        { header: 'Contacto', accessor: 'contacto_nombre', render: (row) => (
             <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                {row.contacto_nombre && <UserIcon className="w-4 h-4" />}
                <span>{row.contacto_nombre || '-'}</span>
             </div>
        )},
        { header: 'Acciones', accessor: 'id', className: 'w-24 text-center', render: (row) => (
            <div className="flex justify-center gap-2">
                <button onClick={() => handleEdit(row)} className="text-[var(--text-muted)] hover:text-[var(--color-brand-primary)] transition-colors">
                    <PencilSquareIcon className="w-5 h-5" />
                </button>
                <button onClick={() => handleDeleteClick(row.id)} className="text-[var(--text-muted)] hover:text-red-500 transition-colors">
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
        )}
    ];

    const proveedoresFiltrados = proveedores.filter(p => 
        p.razon_social?.toLowerCase().includes(filtro.toLowerCase()) ||
        p.contacto_nombre?.toLowerCase().includes(filtro.toLowerCase()) ||
        p.cuit?.includes(filtro)
    );

    return (
        <LayoutPrincipal>
             <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Proveedores</h1>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">Gestión de proveedores y contactos</p>
                </div>
                <Boton 
                    onClick={() => {
                        setFormData({ id: null, razon_social: '', cuit: '', telefono: '', contacto_nombre: '', direccion: '', observaciones: '' });
                        setIsEditing(false);
                        setShowModal(true);
                    }}
                    icon={PlusIcon}
                >
                    Nuevo Proveedor
                </Boton>
            </div>

            {/* Filtros */}
            <div className="mb-6 bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-light)] shadow-sm">
                 <div className="relative max-w-md">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                    <input 
                        type="text"
                        placeholder="Buscar por nombre, contacto o CUIT..." 
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-light)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:border-transparent outline-none transition-all"
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                    />
                 </div>
            </div>

            <Tabla 
                datos={proveedoresFiltrados} 
                columnas={columnas} 
            />

            {/* Modal Formulario */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-[var(--bg-secondary)] rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden border border-[var(--border-light)] transform transition-all animate-slideUp">
                         <div className="px-6 py-4 border-b border-[var(--border-light)] flex justify-between items-center bg-[var(--bg-primary)]">
                            <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                                <UsersIcon className="w-5 h-5 text-[var(--color-brand-primary)]" />
                                {isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-2 md:col-span-1">
                                <Input 
                                    label="Razón Social / Nombre" 
                                    value={formData.razon_social} 
                                    onChange={(e) => setFormData({...formData, razon_social: e.target.value})} 
                                    required 
                                    placeholder="Ej. Distribuidora S.A."
                                />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <Input 
                                    label="CUIT / Identificación" 
                                    value={formData.cuit} 
                                    onChange={(e) => setFormData({...formData, cuit: e.target.value})} 
                                    required 
                                    placeholder="Ej. 30-12345678-9"
                                />
                            </div>

                            <div className="col-span-2 md:col-span-1">
                                <Input 
                                    label="Teléfono" 
                                    value={formData.telefono} 
                                    onChange={(e) => setFormData({...formData, telefono: e.target.value})} 
                                    placeholder="Ej. +54 9 11 1234 5678"
                                />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <Input 
                                    label="Nombre Contacto" 
                                    value={formData.contacto_nombre} 
                                    onChange={(e) => setFormData({...formData, contacto_nombre: e.target.value})} 
                                    placeholder="Ej. Juan Pérez"
                                />
                            </div>
                            
                            <div className="col-span-2">
                                <Input 
                                    label="Domicilio" 
                                    value={formData.direccion} 
                                    onChange={(e) => setFormData({...formData, direccion: e.target.value})} 
                                    placeholder="Ej. Av. Siempre Viva 742"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Observaciones</label>
                                <textarea 
                                    className="w-full px-4 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-light)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:border-transparent outline-none transition-all resize-none h-24"
                                    value={formData.observaciones}
                                    onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                                    placeholder="Notas adicionales..."
                                />
                            </div>

                            <div className="col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-[var(--border-light)]">
                                <Boton type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Boton>
                                <Boton type="submit" variant="primary">{isEditing ? 'Guardar Cambios' : 'Crear Proveedor'}</Boton>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirm Delete Modal */}
            {showConfirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-[var(--bg-secondary)] rounded-xl w-full max-w-sm p-6 shadow-2xl border border-[var(--border-light)] animate-scaleIn">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                <TrashIcon className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Confirmar Eliminación</h3>
                            <p className="text-sm text-[var(--text-secondary)] mb-6">
                                ¿Estás seguro de que deseas eliminar este proveedor? Esta acción no se puede deshacer.
                            </p>
                            <div className="flex justify-center gap-3">
                                <Boton variant="secondary" onClick={() => setShowConfirmDelete(false)}>Cancelar</Boton>
                                <Boton variant="danger" onClick={confirmDelete}>Eliminar</Boton>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </LayoutPrincipal>
    );
}
