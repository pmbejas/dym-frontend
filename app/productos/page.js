'use client'

import { useState, useEffect, useMemo } from 'react';
import LayoutPrincipal from '@/components/LayoutPrincipal';
import Tabla from '@/components/Tabla';
import Boton from '@/components/Boton';
import Modal from '@/components/Modal';
import ImportModal from '@/components/ImportModal';
import Input from '@/components/Input';
import api, { getProductos } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import ConfirmModal from '@/components/ConfirmModal';
import { PlusIcon, MagnifyingGlassIcon, DocumentArrowUpIcon, ChevronLeftIcon, ChevronRightIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/outline';
import { useCotizacion } from '@/context/CotizacionContext';

export default function ProductosPage() {
  const { showToast } = useToast();
  const { cotizacion } = useCotizacion(); // Context
  const [productos, setProductos] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [categorias, setCategorias] = useState([]);
  const [listasPrecios, setListasPrecios] = useState([]); // Lists
  const [selectedListId, setSelectedListId] = useState(''); // Selected List
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // State for Modals & UI
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    sku: '',
    nombre: '',
    descripcion: '',
    stock_actual: 0,
    stock_minimo: 0,
    id_categoria: '',
    precio_base_usd: 0,
    ajuste_importacion_usd: 0,
    ajuste_flete_usd: 0
  });

  // Use effectively a debounced search to avoid fetching per keystroke
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProductos();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [search, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchCategorias();
    fetchListasPrecios();
  }, []);

  const fetchListasPrecios = async () => {
    try {
        const { data } = await api.get('/listas-precios');
        const listas = Array.isArray(data) ? data : [];
        setListasPrecios(listas);
        // Set default list
        const def = listas.find(l => l.por_defecto);
        if (def) setSelectedListId(def.id);
        else if (listas.length > 0) setSelectedListId(listas[0].id);
    } catch (error) {
        console.error("Error fetching price lists", error);
    }
  };

  const fetchProductos = async () => {
    try {
      const result = await getProductos(currentPage, itemsPerPage, search);
      setProductos(Array.isArray(result.data) ? result.data : []);
      setTotalPages(result.totalPages || 1);
      setTotalRecords(result.totalItems || 0);
    } catch (error) {
       console.error("Error fetching products", error);
       showToast('No se pudo cargar la lista de productos.', 'error');
       setProductos([]);
       setTotalPages(1);
       setTotalRecords(0);
    }
  };

  const fetchCategorias = async () => {
    try {
      const { data } = await api.get('/categorias');
      setCategorias(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching categories", error);
    }
  };

  const calculateTotalCost = (data) => {
    const base = parseFloat(data.precio_base_usd) || 0;
    const cat = categorias.find(c => c.id == data.id_categoria);
    
    // Import logic
    const catImport = cat ? (parseFloat(cat.costo_importacion_default_usd) || 0) : 0;
    const adjImport = parseFloat(data.ajuste_importacion_usd) || 0;
    const finalImport = catImport + adjImport;

    // Freight logic
    const catFreight = cat ? (parseFloat(cat.costo_flete_default_usd) || 0) : 0;
    const adjFreight = parseFloat(data.ajuste_flete_usd) || 0;
    const finalFreight = catFreight + adjFreight;
    
    return {
      total: (base + finalImport + finalFreight).toFixed(2),
      finalImport: finalImport.toFixed(2),
      finalFreight: finalFreight.toFixed(2)
    };
  };

  // Helper to calculate Sales Price
  const calculateResult = (row) => {
    const cost = parseFloat(calculateTotalCost(row).total);
    if (!selectedListId) return { usd: 0, ars: 0 };
    
    const list = listasPrecios.find(l => l.id == selectedListId);
    if (!list) return { usd: 0, ars: 0 };

    const margin = parseFloat(list.porcentaje) || 0;
    const saleUsd = cost * (1 + margin / 100);
    const saleArs = saleUsd * (cotizacion || 0);

    return { 
        usd: saleUsd.toFixed(2), 
        ars: saleArs.toFixed(2),
        marginLabel: `+${margin}%`
    };
  };

  const handleOpenModal = (producto = null) => {
    if (producto) {
      setModoEdicion(true);
      setCurrentId(producto.id);
      setFormData({ ...producto });
    } else {
      setModoEdicion(false);
      setCurrentId(null);
      setFormData({ sku: '', nombre: '', descripcion: '', stock_actual: 0, stock_minimo: 0, id_categoria: '', precio_base_usd: 0, ajuste_importacion_usd: 0, ajuste_flete_usd: 0 });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modoEdicion) {
        await api.put(`/productos/${formData.id}`, formData);
        showToast('Producto actualizado correctamente', 'success');
      } else {
        await api.post('/productos', formData);
        showToast('Producto creado correctamente', 'success');
      }
      setShowModal(false);
      fetchProductos();
    } catch (error) {
      console.error(error);
      showToast('No se pudo guardar el producto', 'error');
    }
  };

  const handleEliminar = (row) => {
    setDeleteId(row.id);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
        await api.delete(`/productos/${deleteId}`);
        showToast('El producto ha sido eliminado.', 'success');
        fetchProductos();
    } catch (error) {
        console.error(error);
        showToast('No se pudo eliminar el producto.', 'error');
    } finally {
        setDeleteId(null);
        setShowConfirm(false); // Close the confirm modal after action
    }
  };

  const columnas = [
    { header: 'SKU', accessor: 'sku' },
    { header: 'Producto', accessor: 'nombre', render: (row) => (
      <div>
        <p className="font-semibold text-gray-700">{row.nombre}</p>
        <p className="text-xs text-gray-400">{row.descripcion}</p>
      </div>
    )},
    { header: 'Precio Base (USD)', accessor: 'precio_base_usd', className: 'text-right hidden sm:table-cell', render: (row) => (
      <div className="text-slate-500 font-medium">
        ${parseFloat(row.precio_base_usd).toFixed(2)}
      </div>
    )},
    { header: 'Costo Total', accessor: 'costo_total', className: 'text-right hidden md:table-cell', render: (row) => (
      <div className="font-medium text-slate-500 text-right">
        ${calculateTotalCost(row).total}
      </div>
    )},
    { header: 'Venta (USD)', accessor: 'venta_usd', className: 'text-right', render: (row) => {
        const res = calculateResult(row);
        return (
            <div className="text-right">
                 <p className="font-bold text-emerald-600">${res.usd}</p>
                 <span className="text-[10px] text-slate-400">{res.marginLabel}</span>
            </div>
        );
    }},
    { header: 'Venta (ARS)', accessor: 'venta_ars', className: 'text-right bg-blue-50/30', render: (row) => {
        const res = calculateResult(row);
        return (
            <div className="text-right">
                 <p className="font-bold text-blue-600">$ {parseFloat(res.ars).toLocaleString('es-AR')}</p>
                 <span className="text-[10px] text-slate-400">Tipo Cambio: {cotizacion}</span>
            </div>
        );
    }},
    { header: 'Stock', accessor: 'stock_actual', render: (row) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.stock_actual <= row.stock_minimo ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-500'}`}>
        {row.stock_actual}
      </span>
    )},
  ];

  // Remotely paginated data is the unique data
  const paginatedData = productos;

  // Reset page to 1 when search or itemsPerPage changes
  // Already handled locally by state, but needs dependency trigger
  useEffect(() => setCurrentPage(1), [search, itemsPerPage]);

  return (
    <LayoutPrincipal>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Productos</h1>
          <p className="text-gray-400">Gestiona tu inventario</p>
        </div>
        <div className="flex gap-3 items-center">
             {/* List Selector */}
             <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-slate-500 uppercase">Lista:</span>
                <select 
                    value={selectedListId} 
                    onChange={(e) => setSelectedListId(e.target.value)}
                    className="text-sm font-medium text-slate-700 bg-transparent outline-none cursor-pointer min-w-[100px]"
                >
                    {listasPrecios.map(l => (
                        <option key={l.id} value={l.id}>{l.nombre}</option>
                    ))}
                    {listasPrecios.length === 0 && <option value="">Sin Listas</option>}
                </select>
             </div>

             {/* Import Button */}
             <Boton 
                onClick={() => setShowImportModal(true)} 
                tipo="secondary" 
                className="flex items-center gap-2"
             >
                <DocumentArrowUpIcon className="w-5 h-5" />
                Importar Excel
             </Boton>

             <Boton onClick={() => handleOpenModal()} tipo="primary" className="flex items-center gap-2">
                <PlusIcon className="w-5 h-5" /> Nuevo
             </Boton>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row items-center gap-3">
        <div className="flex flex-1 items-center gap-3 w-full">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
            <input 
            type="text" 
            placeholder="Buscar por nombre o SKU..." 
            className="flex-1 outline-none text-gray-600 placeholder-gray-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            />
        </div>
        
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
        datos={paginatedData} 
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
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed hidden sm:block"
                    title="Ir a primera página"
                >
                    <ChevronDoubleLeftIcon className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 5))}
                    disabled={currentPage <= 5}
                    className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xs"
                    title="Retroceder 5 páginas"
                >
                    -5
                </button>
                <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>
                {/* Simplified page numbers: just current/total logic or limit range */}
                <div className="flex items-center gap-1 px-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || (p >= currentPage - 2 && p <= currentPage + 2))
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
                <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 5))}
                    disabled={currentPage >= totalPages - 4}
                    className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xs"
                    title="Avanzar 5 páginas"
                >
                    +5
                </button>
                <button 
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed hidden sm:block"
                    title="Ir a última página"
                >
                    <ChevronDoubleRightIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
      )}
      
      {/* Modals */}

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={fetchProductos}
        categorias={categorias}
      />

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title={modoEdicion ? "Editar Producto" : "Nuevo Producto"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* ... Existing form content ... reusing form logic */}
           <div className="grid grid-cols-12 gap-4">
            {/* Identity Section */}
            <div className="col-span-12 md:col-span-4">
              <Input 
                label="SKU" 
                name="sku" 
                value={formData.sku} 
                onChange={(e) => setFormData({...formData, sku: e.target.value})} 
                placeholder="CÓDIGO"
                required 
              />
            </div>
            <div className="col-span-12 md:col-span-8">
               <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 ml-0.5">
                  Categoría <span className="text-red-500">*</span>
                </label>
                <select
                  name="id_categoria"
                  value={formData.id_categoria}
                  onChange={(e) => setFormData({...formData, id_categoria: e.target.value})}
                  required
                  className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-400 transition-colors shadow-sm text-sm text-slate-900"
                >
                  <option value="">Seleccione una categoría</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="col-span-12">
              <Input 
                label="Nombre del Producto" 
                name="nombre" 
                value={formData.nombre} 
                onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
                required 
                placeholder="Ej. Silla de Oficina Ergonómica"
              />
            </div>
            
            <div className="col-span-12">
              <Input 
                label="Descripción (Opcional)" 
                name="descripcion" 
                value={formData.descripcion} 
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})} 
                placeholder="Detalles adicionales..."
              />
            </div>

            {/* Inventory Section */}
            <div className="col-span-6">
              <Input 
                label="Stock Actual" 
                name="stock_actual" 
                type="number" 
                value={formData.stock_actual} 
                onChange={(e) => setFormData({...formData, stock_actual: Number(e.target.value)})} 
              />
            </div>
            <div className="col-span-6">
              <Input 
                label="Stock Mínimo" 
                name="stock_minimo" 
                type="number" 
                value={formData.stock_minimo} 
                onChange={(e) => setFormData({...formData, stock_minimo: Number(e.target.value)})} 
              />
            </div>

            {/* Costing Section */}
            <div className="col-span-12 bg-slate-50/50 p-4 rounded-xl border border-slate-200/60 mt-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Estructura de Costos (USD)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input 
                    label="Precio Base" 
                    name="precio_base_usd" 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={formData.precio_base_usd} 
                    onChange={(e) => setFormData({...formData, precio_base_usd: e.target.value})}
                    required 
                    className="bg-white"
                  />
                  <div>
                    <Input 
                      label="Ajuste Imp."
                      name="ajuste_importacion_usd" 
                      type="number" 
                      step="0.01"
                      value={formData.ajuste_importacion_usd} 
                      onChange={(e) => setFormData({...formData, ajuste_importacion_usd: e.target.value})} 
                      className="bg-white"
                    />
                    <div className="flex justify-between items-center mt-1 px-1">
                      <span className="text-[10px] text-slate-400">Efec. Imp.</span>
                      <span className="text-[10px] font-medium text-slate-600">${calculateTotalCost(formData).finalImport}</span>
                    </div>
                  </div>
                  <div>
                    <Input 
                      label="Ajuste Flete"
                      name="ajuste_flete_usd" 
                      type="number" 
                      step="0.01"
                      value={formData.ajuste_flete_usd} 
                      onChange={(e) => setFormData({...formData, ajuste_flete_usd: e.target.value})} 
                      required 
                      className="bg-white"
                    />
                    <div className="flex justify-between items-center mt-1 px-1">
                      <span className="text-[10px] text-slate-400">Efec. Flete</span>
                      <span className="text-[10px] font-medium text-slate-600">${calculateTotalCost(formData).finalFreight}</span>
                    </div>
                  </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                 <span className="text-sm font-medium text-slate-600">Costo Total Estimado</span>
                 <span className="text-xl font-bold text-emerald-600 tracking-tight">
                   ${calculateTotalCost(formData).total} <span className="text-xs font-normal text-slate-400">USD</span>
                 </span>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-auto flex justify-end gap-3 sticky bottom-0 bg-white/95 backdrop-blur z-10 border-t border-slate-100 py-3 -mb-2">
             <Boton tipo="ghost" onClick={() => setShowModal(false)}>Cancelar</Boton>
             <Boton type="submit" tipo="primary">{modoEdicion ? 'Guardar Cambios' : 'Crear Producto'}</Boton>
          </div>
        </form>
      </Modal>
      <ConfirmModal 
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmDelete}
        title="Eliminar Producto"
        message="¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer."
      />
    </LayoutPrincipal>
  );
}
