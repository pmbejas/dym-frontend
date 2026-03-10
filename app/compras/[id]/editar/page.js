'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import LayoutPrincipal from '@/components/LayoutPrincipal';
import Boton from '@/components/Boton';
import { getProveedores, getProductos, getCompraById, updateCompra } from '@/services/api'; // getCompraById and updateCompra must be imported
import { useToast } from '@/context/ToastContext';
import { PlusIcon, TrashIcon, ArrowLeftIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'; // Adjust import path if needed in project context. Usually heroicons/react/24/outline

export default function EditarCompraPage({ params }) {
    const router = useRouter();
    const { id } = use(params);
    const { showToast } = useToast();
    
    // Header State
    const [proveedores, setProveedores] = useState([]);
    const [idProveedor, setIdProveedor] = useState('');
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]); // Default today
    const [numeroOrden, setNumeroOrden] = useState('');
    const [moneda, setMoneda] = useState('USD');
    const [observaciones, setObservaciones] = useState('');

    // Items State
    const [productos, setProductos] = useState([]);
    const [items, setItems] = useState([]); // Array of { id_producto, cantidad, costo_unitario, nombre, sku }

    // Add Item Form State
    const [busquedaProducto, setBusquedaProducto] = useState('');
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [cantidad, setCantidad] = useState('');
    const [costo, setCosto] = useState('');

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        cargarDatosIniciales();
    }, []);

    const cargarDatosIniciales = async () => {
        try {
            setIsLoading(true);
            const [provs, prods, compra] = await Promise.all([
                getProveedores(),
                getProductos(),
                getCompraById(id)
            ]);
            setProveedores(provs);
            setProductos(prods);
            
            // Pre-fill form
            setIdProveedor(compra.id_proveedor);
            setFecha(compra.fecha.split('T')[0]);
            setNumeroOrden(compra.numero_orden || '');
            setMoneda(compra.moneda);
            setObservaciones(compra.observaciones || '');

            // Pre-fill items
            const itemsMapeados = compra.CompraDetalles.map(d => ({
                id_producto: d.id_producto,
                cantidad: d.cantidad,
                costo_unitario: d.costo_unitario,
                nombre: d.Producto.nombre,
                sku: d.Producto.sku
            }));
            setItems(itemsMapeados);

        } catch (error) {
            console.error('Error cargando datos:', error);
            showToast('Error al cargar datos', 'error');
            router.push('/compras');
        } finally {
            setIsLoading(false);
        }
    };

    // Filter Products for Search (Remote)
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            try {
                // We use dynamic import of api if needed, or api if imported.
                // In this file, api is imported as `{ getProductos }` from '@/services/api'. 
                // Let's use getProductos, but it doesn't support search yet in the import? 
                // Ah, backend GET /productos does. Let's use api from '@/services/api'.
                // Wait, this file imports `{ getProveedores, getProductos, getCompraById, updateCompra }`.
                // We will add api to imports or use getProductos directly if updated.
                // Let's import api just in case.
                const { default: api } = await import('@/services/api');
                const res = await api.get('/productos', { params: { page: 1, limit: 50, search: busquedaProducto } });
                setProductos(res.data?.data || []);
            } catch (error) {
                console.error("Error buscando productos:", error);
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [busquedaProducto]);

    const productosFiltrados = productos;

    const handleAgregarProducto = () => {
        if (!productoSeleccionado || !cantidad || !costo) {
            showToast('Complete todos los campos del producto', 'warning');
            return;
        }

        const cantidadNum = parseFloat(cantidad);
        const costoNum = parseFloat(costo);

        // Check if product already exists
        const existingItemIndex = items.findIndex(item => item.id_producto === productoSeleccionado.id);

        if (existingItemIndex >= 0) {
            // Update existing item
            const newItems = [...items];
            newItems[existingItemIndex].cantidad += cantidadNum;
            // Optionally update cost if it changed, or keep original? Usually keep original or weighted avg. 
            // User didn't specify, but let's update cost to the latest one entered if different? 
            // Or just sum quantity. Let's just sum quantity for now as requested.
            // Actually, if cost is different, it might be better to update it or warn.
            // Let's assume same cost or latest cost wins.
            newItems[existingItemIndex].costo_unitario = costoNum; 
            setItems(newItems);
            showToast('Cantidad actualizada en el producto existente', 'info');
        } else {
            // Add new item
            const nuevoItem = {
                id_producto: productoSeleccionado.id,
                cantidad: cantidadNum,
                costo_unitario: costoNum,
                nombre: productoSeleccionado.nombre,
                sku: productoSeleccionado.sku
            };
            setItems([...items, nuevoItem]);
        }
        
        // Reset form
        setProductoSeleccionado(null);
        setBusquedaProducto('');
        setCantidad('');
        setCosto('');
    };

    const handleCantidadChange = (index, nuevaCantidad) => {
        const val = parseFloat(nuevaCantidad);
        if (isNaN(val) || val < 1) return; // Prevent invalid values

        const newItems = [...items];
        newItems[index].cantidad = val;
        setItems(newItems);
    };

    const handleEliminarItem = (index) => {
        const nuevosItems = items.filter((_, i) => i !== index);
        setItems(nuevosItems);
    };

    const calcularTotal = () => {
        return items.reduce((acc, item) => acc + (item.cantidad * item.costo_unitario), 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!idProveedor) {
            showToast('Seleccione un proveedor', 'warning');
            return;
        }
        if (items.length === 0) {
            showToast('Agregue al menos un producto', 'warning');
            return;
        }

        const datosCompra = {
            id_proveedor: idProveedor,
            fecha,
            numero_orden: numeroOrden,
            moneda,
            observaciones,
            items
        };

        try {
            await updateCompra(id, datosCompra);
            showToast('Compra actualizada correctamente', 'success');
            router.push(`/compras/${id}`);
        } catch (error) {
            console.error('Error actualizando compra:', error);
            showToast(error.response?.data?.message || 'Error al actualizar compra', 'error');
        }
    };

    if (isLoading) return <LayoutPrincipal><div>Cargando...</div></LayoutPrincipal>;

    return (
        <LayoutPrincipal>
            <div className="max-w-5xl mx-auto space-y-4">
                <div>
                     <div className="flex items-center gap-3 mb-1">
                        <button 
                            onClick={() => router.back()}
                            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        >
                            <ArrowLeftIcon className="w-4 h-4" />
                        </button>
                        <h1 className="text-lg font-bold text-[var(--text-primary)]">Editar Compra {numeroOrden ? `#${numeroOrden}` : `#${id}`}</h1>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">Modifique los detalles de la orden de compra</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Header Data */}
                    <div className="bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border-light)] grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                        <div className="md:col-span-5">
                            <label className="block text-[10px] font-medium text-[var(--text-secondary)] mb-1 uppercase">Proveedor</label>
                            <select 
                                value={idProveedor}
                                onChange={(e) => setIdProveedor(e.target.value)}
                                className="w-full px-2 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none text-xs"
                                required
                            >
                                <option value="">Seleccione un proveedor</option>
                                {proveedores.map(p => (
                                    <option key={p.id} value={p.id}>{p.razon_social}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-[10px] font-medium text-[var(--text-secondary)] mb-1 uppercase">N° Orden <span className="text-[var(--text-muted)] font-normal text-[9px]">(Opcional)</span></label>
                            <input 
                                type="text"
                                value={numeroOrden}
                                onChange={(e) => setNumeroOrden(e.target.value)}
                                className="w-full px-2 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none text-xs"
                                placeholder="OC-001"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-medium text-[var(--text-secondary)] mb-1 uppercase">Moneda</label>
                            <select 
                                value={moneda}
                                onChange={(e) => setMoneda(e.target.value)}
                                className="w-full px-2 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none text-xs"
                            >
                                <option value="USD">USD</option>
                                <option value="ARS">ARS</option>
                            </select>
                        </div>
                         <div className="md:col-span-12">
                            <label className="block text-[10px] font-medium text-[var(--text-secondary)] mb-1 uppercase">Observaciones</label>
                            <input 
                                type="text"
                                value={observaciones}
                                onChange={(e) => setObservaciones(e.target.value)}
                                className="w-full px-2 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none text-xs"
                                placeholder="Notas adicionales..."
                            />
                        </div>
                    </div>

                    {/* Add Items */}
                    <div className="bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border-light)] space-y-3">
                        <h3 className="font-semibold text-[var(--text-primary)] text-xs uppercase">Productos</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end bg-[var(--bg-primary)] p-2 rounded-lg border border-[var(--border-light)]">
                            <div className="md:col-span-6 relative">
                                <label className="block text-[9px] font-medium text-[var(--text-muted)] uppercase mb-1">Buscar Producto</label>
                                <div className="relative">
                                    <MagnifyingGlassIcon className="w-3.5 h-3.5 absolute left-2 top-2 text-gray-400" />
                                    <input 
                                        type="text"
                                        value={productoSeleccionado ? productoSeleccionado.nombre : busquedaProducto}
                                        onChange={(e) => {
                                            setBusquedaProducto(e.target.value);
                                            setProductoSeleccionado(null);
                                        }}
                                        className="w-full pl-7 pr-2 py-1.5 bg-white border border-[var(--border-color)] rounded-md focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none text-xs"
                                        placeholder="Nombre o SKU..."
                                    />
                                    {busquedaProducto && !productoSeleccionado && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-[var(--border-color)] rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                            {productosFiltrados.length > 0 ? (
                                                productosFiltrados.map(p => (
                                                    <div 
                                                        key={p.id}
                                                        onClick={() => {
                                                            setProductoSeleccionado(p);
                                                            setBusquedaProducto('');
                                                            const baseCost = p.precio_base_usd || 0;
                                                            setCosto(baseCost); 
                                                        }}
                                                        className="px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-xs border-b last:border-0 border-gray-50"
                                                    >
                                                        <div className="flex justify-between">
                                                            <span className="font-medium text-[var(--text-primary)]">{p.nombre}</span>
                                                            <span className="text-[var(--text-muted)] text-[10px]">{p.sku}</span>
                                                        </div>
                                                        {p.precio_base_usd > 0 && <span className="text-[9px] text-[var(--color-brand-primary)]">Base: ${p.precio_base_usd}</span>}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-3 py-1.5 text-xs text-[var(--text-muted)]">No se encontraron productos</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[9px] font-medium text-[var(--text-muted)] uppercase mb-1">Cantidad</label>
                                <input 
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={cantidad}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '' || /^\d+$/.test(val)) {
                                            setCantidad(val);
                                        }
                                    }}
                                    className="w-full px-2 py-1.5 bg-white border border-[var(--border-color)] rounded-md focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none text-center text-xs"
                                    placeholder="0"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[9px] font-medium text-[var(--text-muted)] uppercase mb-1">Costo</label>
                                <div className="relative">
                                    <span className="absolute left-2 top-1.5 text-[10px] text-gray-400">$</span>
                                    <input 
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={costo}
                                        onChange={(e) => setCosto(e.target.value)}
                                        className="w-full pl-5 pr-2 py-1.5 bg-white border border-[var(--border-color)] rounded-md focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none text-right text-xs"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <Boton 
                                    type="button" 
                                    onClick={handleAgregarProducto}
                                    className="w-full justify-center py-1.5 text-xs"
                                    tipo="secondary"
                                >
                                    <PlusIcon className="w-3.5 h-3.5 mr-1" />
                                    Agregar
                                </Boton>
                            </div>
                        </div>

                        {/* Items List */}
                        <div className="overflow-hidden border border-[var(--border-light)] rounded-lg">
                            <table className="w-full text-xs">
                                <thead className="bg-[var(--bg-primary)]">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium text-[var(--text-secondary)]">Producto</th>
                                        <th className="px-3 py-2 text-center font-medium text-[var(--text-secondary)]">Cant.</th>
                                        <th className="px-3 py-2 text-right font-medium text-[var(--text-secondary)]">Costo</th>
                                        <th className="px-3 py-2 text-right font-medium text-[var(--text-secondary)]">Subtotal</th>
                                        <th className="px-3 py-2 text-center font-medium text-[var(--text-secondary)]"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-light)] bg-white">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-3 py-6 text-center text-xs text-[var(--text-muted)]">
                                                No hay productos agregados
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((item, index) => (
                                            <tr key={index}>
                                                <td className="px-3 py-2">
                                                    <p className="font-medium text-[var(--text-primary)]">{item.nombre}</p>
                                                    <p className="text-[10px] text-[var(--text-muted)]">{item.sku}</p>
                                                </td>
                                                <td className="px-3 py-2 text-center text-[var(--text-secondary)]">
                                                    <input 
                                                        type="number" 
                                                        min="1"
                                                        value={item.cantidad}
                                                        onChange={(e) => handleCantidadChange(index, e.target.value)}
                                                        className="w-14 px-1.5 py-1 text-xs border border-gray-300 rounded text-center focus:outline-none focus:border-[var(--color-brand-primary)]"
                                                    />
                                                </td>
                                                <td className="px-3 py-2 text-right text-[var(--text-secondary)]">${parseFloat(item.costo_unitario).toFixed(2)}</td>
                                                <td className="px-3 py-2 text-right font-semibold text-[var(--text-primary)]">
                                                    ${(item.cantidad * item.costo_unitario).toFixed(2)}
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleEliminarItem(index)}
                                                        className="text-red-400 hover:text-red-600 transition-colors"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                <tfoot className="bg-[var(--bg-primary)] border-t border-[var(--border-light)]">
                                    <tr>
                                        <td colSpan="3" className="px-3 py-2 text-right font-semibold text-[var(--text-primary)] text-xs">Total</td>
                                        <td className="px-3 py-2 text-right font-bold text-[var(--color-brand-primary)] text-sm">
                                            {moneda} {calcularTotal().toLocaleString('es-AR', {minimumFractionDigits: 2})}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3">
                        <Boton type="button" onClick={() => router.back()} tipo="secondary" className="py-1.5 text-sm">Cancelar</Boton>
                        <Boton type="submit" tipo="primary" className="py-1.5 text-sm">Guardar Cambios</Boton>
                    </div>
                </form>
            </div>
        </LayoutPrincipal>
    );
}
