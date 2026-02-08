'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LayoutPrincipal from '@/components/LayoutPrincipal';
import Boton from '@/components/Boton';
import { getProveedores, getProductos, createCompra } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { PlusIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function NuevaCompraPage() {
    const router = useRouter();
    const { showToast } = useToast();
    
    // Data States
    const [proveedores, setProveedores] = useState([]);
    const [productos, setProductos] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form States
    const [idProveedor, setIdProveedor] = useState('');
    const [numeroOrden, setNumeroOrden] = useState('');
    const [moneda, setMoneda] = useState('USD');
    const [observaciones, setObservaciones] = useState('');
    const [items, setItems] = useState([]);

    // Product Search State
    const [busquedaProducto, setBusquedaProducto] = useState('');
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [cantidad, setCantidad] = useState('');
    const [costo, setCosto] = useState('');

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const [provs, prods] = await Promise.all([getProveedores(), getProductos()]);
            setProveedores(provs);
            setProductos(prods);
        } catch (error) {
            console.error('Error cargando datos:', error);
            showToast('Error al cargar proveedores o productos', 'error');
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleAgregarProducto = () => {
        if (!productoSeleccionado || !cantidad || !costo) {
            showToast('Complete todos los campos del producto', 'warning');
            return;
        }

        const nuevoItem = {
            id_producto: productoSeleccionado.id,
            nombre: productoSeleccionado.nombre,
            sku: productoSeleccionado.sku,
            cantidad: parseFloat(cantidad),
            costo_unitario: parseFloat(costo),
            subtotal: parseFloat(cantidad) * parseFloat(costo)
        };

        setItems([...items, nuevoItem]);
        
        // Reset inputs
        setProductoSeleccionado(null);
        setBusquedaProducto('');
        setCantidad('');
        setCosto('');
    };

    const handleEliminarItem = (index) => {
        const nuevosItems = [...items];
        nuevosItems.splice(index, 1);
        setItems(nuevosItems);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!idProveedor) {
            showToast('Seleccione un proveedor', 'warning');
            return;
        }
        if (items.length === 0) {
            showToast('Agregue al menos un producto a la compra', 'warning');
            return;
        }

        try {
            setIsSubmitting(true);
            const datosCompra = {
                id_proveedor: idProveedor,
                numero_orden: numeroOrden,
                moneda,
                observaciones,
                items
            };

            await createCompra(datosCompra);
            showToast('Compra registrada exitosamente', 'success');
            router.push('/compras');
        } catch (error) {
            console.error('Error al crear compra:', error);
            showToast('Error al registrar la compra', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const productosFiltrados = busquedaProducto 
        ? productos.filter(p => 
            p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) || 
            p.sku.toLowerCase().includes(busquedaProducto.toLowerCase())
          ).slice(0, 5)
        : [];

    const totalCompra = items.reduce((acc, item) => acc + item.subtotal, 0);

    return (
        <LayoutPrincipal>
            <div className="max-w-5xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Nueva Compra</h1>
                    <p className="text-sm text-[var(--text-secondary)]">Registre una nueva orden de compra a proveedor</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Header Data - Optimized Layout */}
                    <div className="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-light)] grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-5">
                            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase">Proveedor</label>
                            <select 
                                value={idProveedor}
                                onChange={(e) => setIdProveedor(e.target.value)}
                                className="w-full px-3 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none text-sm"
                                required
                            >
                                <option value="">Seleccione un proveedor</option>
                                {proveedores.map(p => (
                                    <option key={p.id} value={p.id}>{p.razon_social}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase">N° Orden <span className="text-[var(--text-muted)] font-normal text-[10px]">(Opcional)</span></label>
                            <input 
                                type="text"
                                value={numeroOrden}
                                onChange={(e) => setNumeroOrden(e.target.value)}
                                className="w-full px-3 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none text-sm"
                                placeholder="Ej: OC-001"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase">Moneda</label>
                            <select 
                                value={moneda}
                                onChange={(e) => setMoneda(e.target.value)}
                                className="w-full px-3 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none text-sm"
                            >
                                <option value="USD">Dólar (USD)</option>
                                <option value="ARS">Peso ARS</option>
                            </select>
                        </div>
                         <div className="md:col-span-12">
                            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase">Observaciones</label>
                            <input 
                                type="text"
                                value={observaciones}
                                onChange={(e) => setObservaciones(e.target.value)}
                                className="w-full px-3 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none text-sm"
                                placeholder="Notas adicionales..."
                            />
                        </div>
                    </div>

                    {/* Add Items */}
                    <div className="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-light)] space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-[var(--text-primary)] text-sm uppercase tracking-wide">Productos</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-[var(--bg-primary)] p-3 rounded-lg border border-[var(--border-light)]">
                            <div className="md:col-span-6 relative">
                                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Buscar Producto</label>
                                <div className="relative">
                                    <MagnifyingGlassIcon className="w-4 h-4 absolute left-2.5 top-2 text-gray-400" />
                                    <input 
                                        type="text"
                                        value={productoSeleccionado ? productoSeleccionado.nombre : busquedaProducto}
                                        onChange={(e) => {
                                            setBusquedaProducto(e.target.value);
                                            setProductoSeleccionado(null);
                                        }}
                                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-[var(--border-color)] rounded-md focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none text-sm"
                                        placeholder="Nombre o SKU..."
                                    />
                                    {busquedaProducto && !productoSeleccionado && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-[var(--border-color)] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            {productosFiltrados.length > 0 ? (
                                                productosFiltrados.map(p => (
                                                    <div 
                                                        key={p.id}
                                                        onClick={() => {
                                                            setProductoSeleccionado(p);
                                                            setBusquedaProducto('');
                                                            // Auto-fill cost from product base price
                                                            // The model uses 'precio_base_usd'
                                                            const baseCost = p.precio_base_usd || 0;
                                                            setCosto(baseCost); 
                                                        }}
                                                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm border-b last:border-0 border-gray-50"
                                                    >
                                                        <div className="flex justify-between">
                                                            <span className="font-medium text-[var(--text-primary)]">{p.nombre}</span>
                                                            <span className="text-[var(--text-muted)] text-xs">{p.sku}</span>
                                                        </div>
                                                        {p.precio_base_usd > 0 && <span className="text-[10px] text-[var(--color-brand-primary)]">Base: ${p.precio_base_usd}</span>}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-4 py-2 text-sm text-[var(--text-muted)]">No se encontraron productos</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Cantidad</label>
                                <input 
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={cantidad}
                                    onChange={(e) => {
                                        // Ensure integer input
                                        const val = e.target.value;
                                        if (val === '' || /^\d+$/.test(val)) {
                                            setCantidad(val);
                                        }
                                    }}
                                    className="w-full px-2 py-1.5 bg-white border border-[var(--border-color)] rounded-md focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none text-center text-sm"
                                    placeholder="0"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Costo Unit.</label>
                                <div className="relative">
                                    <span className="absolute left-2 top-1.5 text-xs text-gray-400">$</span>
                                    <input 
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={costo}
                                        onChange={(e) => setCosto(e.target.value)}
                                        className="w-full pl-6 pr-2 py-1.5 bg-white border border-[var(--border-color)] rounded-md focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none text-right text-sm"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <Boton 
                                    type="button" 
                                    onClick={handleAgregarProducto}
                                    className="w-full justify-center py-1.5"
                                    tipo="secondary"
                                >
                                    <PlusIcon className="w-4 h-4 mr-1" />
                                    Agregar
                                </Boton>
                            </div>
                        </div>

                        {/* Items Table */}
                        {items.length > 0 && (
                            <div className="overflow-hidden border border-[var(--border-light)] rounded-lg">
                                <table className="w-full text-sm">
                                    <thead className="bg-[var(--bg-primary)]">
                                        <tr className="text-left">
                                            <th className="px-4 py-3 font-medium text-[var(--text-secondary)]">Producto</th>
                                            <th className="px-4 py-3 font-medium text-[var(--text-secondary)] text-center">Cant.</th>
                                            <th className="px-4 py-3 font-medium text-[var(--text-secondary)] text-right">Costo</th>
                                            <th className="px-4 py-3 font-medium text-[var(--text-secondary)] text-right">Subtotal</th>
                                            <th className="px-4 py-3 font-medium text-[var(--text-secondary)] text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-light)] bg-white">
                                        {items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-2">
                                                    <p className="font-medium text-[var(--text-primary)]">{item.nombre}</p>
                                                    <p className="text-xs text-[var(--text-muted)]">{item.sku}</p>
                                                </td>
                                                <td className="px-4 py-2 text-center">{item.cantidad}</td>
                                                <td className="px-4 py-2 text-right">${item.costo_unitario.toFixed(2)}</td>
                                                <td className="px-4 py-2 text-right font-medium">${item.subtotal.toFixed(2)}</td>
                                                <td className="px-4 py-2 text-center">
                                                    <button onClick={() => handleEliminarItem(idx)} className="text-red-500 hover:text-red-700">
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-[var(--bg-primary)] border-t border-[var(--border-light)]">
                                        <tr>
                                            <td colSpan="3" className="px-4 py-3 text-right font-bold text-[var(--text-primary)]">Total</td>
                                            <td className="px-4 py-3 text-right font-bold text-[var(--color-brand-primary)] text-lg">
                                                {moneda === 'USD' ? 'USD' : '$'} {totalCompra.toLocaleString('es-AR', {minimumFractionDigits: 2})}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Boton type="button" onClick={() => router.back()} tipo="secondary">Cancelar</Boton>
                        <Boton type="submit" disabled={isSubmitting || items.length === 0} tipo="primary">
                            {isSubmitting ? 'Guardando...' : 'Guardar Compra'}
                        </Boton>
                    </div>
                </form>
            </div>
        </LayoutPrincipal>
    );
}
