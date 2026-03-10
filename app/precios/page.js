'use client';
import { useState, useEffect } from 'react';
import LayoutPrincipal from '@/components/LayoutPrincipal';
import Boton from '@/components/Boton';
import Input from '@/components/Input'; // Assuming simple input, might need custom for table
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { MagnifyingGlassIcon, FunnelIcon, ArrowPathIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function GestionPreciosPage() {
  const { showToast } = useToast();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Local state for edits
  // Map of id -> newPrice
  const [editedPrices, setEditedPrices] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Mass Update Tools
  const [massValue, setMassValue] = useState('');
  const [massType, setMassType] = useState('percentage_inc'); // percentage_inc, percentage_dec, fixed_inc, fixed_dec, fixed_set

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/productos', { params: { page: 1, limit: 1000, search: '' } }),
        api.get('/categorias')
      ]);
      setProductos(Array.isArray(prodRes.data?.data) ? prodRes.data.data : []);
      setCategorias(Array.isArray(catRes.data) ? catRes.data : []);
      setEditedPrices({});
      setHasChanges(false);
    } catch (error) {
      console.error(error);
      showToast('Error cargando datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredProducts = () => {
    return productos.filter(p => {
      const matchSearch = p.nombre?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter ? p.id_categoria == categoryFilter : true;
      return matchSearch && matchCat;
    });
  };

  const handlePriceChange = (id, value) => {
    setEditedPrices(prev => ({
      ...prev,
      [id]: value
    }));
    setHasChanges(true);
  };

  const applyMassUpdate = () => {
    const val = parseFloat(massValue);
    if (isNaN(val) || val < 0) return;

    const currentFiltered = getFilteredProducts();
    const newEdits = { ...editedPrices };

    currentFiltered.forEach(p => {
        let currentBase = parseFloat(p.precio_base_usd || 0);
        // If already edited, use that as base? No, usually mass update applies to base, but let's say it overrides.
        // Let's apply to the ORIGINAL base to avoid compounding errors if clicked multiple times, 
        // unless we want to chain. Let's apply to original base for simplicity in this version.
        
        let newPrice = currentBase;

        if (massType === 'percentage_inc') {
            newPrice = currentBase * (1 + val / 100);
        } else if (massType === 'percentage_dec') {
            newPrice = currentBase * (1 - val / 100);
        } else if (massType === 'fixed_inc') {
            newPrice = currentBase + val;
        } else if (massType === 'fixed_dec') {
            newPrice = Math.max(0, currentBase - val);
        } else if (massType === 'fixed_set') {
            newPrice = val;
        }

        newEdits[p.id] = newPrice.toFixed(2);
    });

    setEditedPrices(newEdits);
    setHasChanges(true);
    showToast(`Se aplicaron cambios a ${currentFiltered.length} productos. Recuerde Guardar.`, 'info');
  };

  const saveChanges = async () => {
    // Convert editedPrices map to array
    const cambios = Object.keys(editedPrices).map(id => ({
        id: parseInt(id),
        precio_base_usd: parseFloat(editedPrices[id])
    }));

    if (cambios.length === 0) return;

    try {
        await api.put('/productos/masivo/actualizar', { cambios });
        showToast('Precios actualizados exitosamente', 'success');
        fetchData(); // Reload to clear dirty state
    } catch (error) {
        console.error(error);
        showToast('Error guardando cambios', 'error');
    }
  };

  const filteredData = getFilteredProducts();

  return (
    <LayoutPrincipal>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 sticky top-0 bg-slate-50 z-20 py-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestión de Precios</h1>
          <p className="text-slate-500">Actualización masiva de precios base</p>
        </div>
        <div className="flex gap-2">
            {hasChanges && (
                <Boton onClick={saveChanges} tipo="success" className="animate-pulse shadow-green-200 shadow-lg">
                    <CheckIcon className="w-5 h-5 mr-2" />
                    Guardar Cambios
                </Boton>
            )}
            <Boton onClick={fetchData} tipo="ghost">
                <ArrowPathIcon className="w-5 h-5" />
            </Boton>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
             <div className="relative flex-1 w-full">
                <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                <input 
                    type="text" 
                    placeholder="Filtrar por nombre o SKU..." 
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
             </div>
             <div className="w-full md:w-64">
                <select 
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                >
                    <option value="">Todas las Categorías</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
             </div>
        </div>

        {/* Mass Actions */}
        <div className="flex flex-col md:flex-row gap-2 items-center justify-end border-t border-slate-100 pt-4">
            <span className="text-sm font-medium text-slate-600 mr-2">Acción Masiva:</span>
            <select 
                className="px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm"
                value={massType}
                onChange={(e) => setMassType(e.target.value)}
            >
                <option value="percentage_inc">Aumentar %</option>
                <option value="percentage_dec">Disminuir %</option>
                <option value="fixed_inc">Aumentar Monto Fijo ($)</option>
                <option value="fixed_dec">Disminuir Monto Fijo ($)</option>
                <option value="fixed_set">Fijar Precio ($)</option>
            </select>
            <input 
                type="number" 
                className="w-24 px-3 py-2 rounded-lg border border-slate-300 text-sm"
                placeholder="Valor"
                value={massValue}
                onChange={(e) => setMassValue(e.target.value)}
            />
            <Boton onClick={applyMassUpdate} tipo="primary" className="text-sm">
                Aplicar a Vista
            </Boton>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[600px]">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">SKU</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Producto</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Categoría</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Precio Actual</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-indigo-600 uppercase tracking-wider w-40">Nuevo Precio</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                    {filteredData.map(p => {
                        const isEdited = editedPrices[p.id] !== undefined;
                        const original = parseFloat(p.precio_base_usd || 0);
                        const current = isEdited ? parseFloat(editedPrices[p.id]) : original;
                        const diff = current - original;
                        const isHigher = diff > 0;
                        const isLower = diff < 0;

                        return (
                            <tr key={p.id} className="hover:bg-slate-50">
                                <td className="px-6 py-3 text-sm text-slate-600 font-mono">{p.sku}</td>
                                <td className="px-6 py-3 text-sm text-slate-800 font-medium">{p.nombre}</td>
                                <td className="px-6 py-3 text-sm text-slate-500">
                                    {categorias.find(c => c.id == p.id_categoria)?.nombre}
                                </td>
                                <td className="px-6 py-3 text-sm text-slate-500 text-right">
                                    ${original.toFixed(2)}
                                </td>
                                <td className="px-6 py-2 text-right">
                                    <div className="flex flex-col items-end">
                                        <input 
                                            type="number"
                                            className={`w-28 px-2 py-1 text-right border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500/50 
                                                ${isEdited ? 'border-indigo-300 bg-indigo-50 font-bold text-indigo-700' : 'border-slate-200 text-slate-600'}
                                            `}
                                            value={isEdited ? editedPrices[p.id] : original}
                                            onChange={(e) => handlePriceChange(p.id, e.target.value)}
                                            step="0.01"
                                        />
                                        {isEdited && Math.abs(diff) > 0.001 && (
                                            <span className={`text-[10px] font-medium mt-0.5 ${isHigher ? 'text-green-500' : 'text-red-500'}`}>
                                                {isHigher ? '+' : ''}{diff.toFixed(2)} ({((diff/original)*100).toFixed(1)}%)
                                            </span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    {filteredData.length === 0 && (
                        <tr>
                            <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                No se encontraron productos.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </LayoutPrincipal>
  );
}
