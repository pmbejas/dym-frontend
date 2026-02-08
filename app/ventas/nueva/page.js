'use client';
import { useState, useEffect, useMemo } from 'react';
import LayoutPrincipal from '@/components/LayoutPrincipal';
import Boton from '@/components/Boton';
import Input from '@/components/Input';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { useCotizacion } from '@/context/CotizacionContext';
import { MagnifyingGlassIcon, TrashIcon, PlusIcon, MinusIcon, ShoppingCartIcon, XMarkIcon, CreditCardIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

export default function NuevaVentaPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const { cotizacion } = useCotizacion();
    
    // Data States
    const [productos, setProductos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [listasPrecios, setListasPrecios] = useState([]);
    const [categorias, setCategorias] = useState([]);
    
    // UI States
    const [isLoading, setIsLoading] = useState(true);
    const [terminoBusqueda, setTerminoBusqueda] = useState('');
    const [activeTab, setActiveTab] = useState('detalle'); // 'detalle' | 'pagos'

    // Sale State
    const [carrito, setCarrito] = useState([]);
    const [clienteSeleccionado, setClienteSeleccionado] = useState('');
    const [listaSeleccionada, setListaSeleccionada] = useState('');
    const [medioPago, setMedioPago] = useState('EFECTIVO'); 
    const [pagos, setPagos] = useState([]); 
    const [cuotas, setCuotas] = useState(1);
    const [interes, setInteres] = useState(0); 
    const [fechaPrimeraCuota, setFechaPrimeraCuota] = useState('');
    const [monedaVenta, setMonedaVenta] = useState('ARS');
    const [entregaInmediata, setEntregaInmediata] = useState(true);

    // Payment Form State
    const [montoPagoInput, setMontoPagoInput] = useState('');
    const [chequeDetalle, setChequeDetalle] = useState({ banco: '', numero: '', fecha_emision: '', fecha_cobro: '' });

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const [prodRes, cliRes, listRes, catRes] = await Promise.all([
                api.get('/productos'),
                api.get('/clientes'),
                api.get('/listas-precios'),
                api.get('/categorias')
            ]);
            setProductos(prodRes.data || []);
            setClientes(cliRes.data || []);
            setListasPrecios(listRes.data || []);
            setCategorias(catRes.data || []);
            
            const defString = listRes.data.find(l => l.por_defecto);
            if (defString) setListaSeleccionada(defString.id);
            else if (listRes.data.length > 0) setListaSeleccionada(listRes.data[0].id);

        } catch (error) {
            console.error(error);
            showToast('Error cargando datos', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const margenLista = useMemo(() => {
        if (!listaSeleccionada) return 0;
        const lista = listasPrecios.find(l => l.id == listaSeleccionada);
        return lista ? parseFloat(lista.porcentaje) : 0;
    }, [listaSeleccionada, listasPrecios]);

    const calcularPrecio = (producto) => {
        const base = parseFloat(producto.precio_base_usd || 0);
        const cat = categorias.find(c => c.id == producto.id_categoria);
        const catImport = cat ? (parseFloat(cat.costo_importacion_default_usd) || 0) : 0;
        const adjImport = parseFloat(producto.ajuste_importacion_usd || 0);
        const catFreight = cat ? (parseFloat(cat.costo_flete_default_usd) || 0) : 0;
        const adjFreight = parseFloat(producto.ajuste_flete_usd || 0);
        const costo = base + (catImport + adjImport) + (catFreight + adjFreight);
        const conMargen = costo * (1 + (margenLista || 0) / 100);
        if (monedaVenta === 'USD') return conMargen;
        return conMargen * (cotizacion || 0); 
    };
    
    useEffect(() => {
        setCarrito(prev => prev.map(item => {
            const nuevoPrecio = calcularPrecio(item.original_product);
            return {
                ...item,
                precio_unitario: nuevoPrecio,
                subtotal: nuevoPrecio * item.cantidad
            };
        }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [monedaVenta, cotizacion, margenLista, categorias]);

    const agregarAlCarrito = (producto) => {
        const precioUnitario = calcularPrecio(producto);
        
        setCarrito(prev => {
            const exists = prev.find(item => item.id_producto === producto.id);
            if (exists) {
                return prev.map(item => 
                    item.id_producto === producto.id 
                    ? { ...item, cantidad: item.cantidad + 1, subtotal: (item.cantidad + 1) * precioUnitario } 
                    : item
                );
            }
            return [...prev, {
                id_producto: producto.id,
                nombre: producto.nombre,
                sku: producto.sku,
                precio_unitario: precioUnitario,
                cantidad: 1,
                subtotal: precioUnitario,
                original_product: producto 
            }];
        });
    };

    const actualizarCantidad = (id, delta) => {
        setCarrito(prev => prev.map(item => {
            if (item.id_producto === id) {
                const newCant = Math.max(1, item.cantidad + delta);
                return { ...item, cantidad: newCant, subtotal: newCant * item.precio_unitario };
            }
            return item;
        }));
    };

    const eliminarDelCarrito = (id) => {
        setCarrito(prev => prev.filter(item => item.id_producto !== id));
    };

    const subtotalVenta = carrito.reduce((acc, item) => acc + item.subtotal, 0);
    
    // 1. Calculate Locked Interest (from added payments)
    const interesAcumulado = pagos.reduce((acc, p) => acc + (p.interes || 0), 0);

    // 2. Calculate Capital Paid (Total Amount - Interest Component)
    const totalPagado = pagos.reduce((a, b) => a + parseFloat(b.monto), 0);
    const capitalPagado = Math.max(0, totalPagado - interesAcumulado);

    // 3. Calculate Remaining Capital
    const saldoCapital = Math.max(0, subtotalVenta - capitalPagado); 
    
    // 4. Calculate Projected Interest (Current Interaction)
    const isProyectandoCredito = medioPago === 'CREDITO' && !pagos.some(p => p.metodo === 'CREDITO');
    // Only calculate projected interest if there is capital to finance
    const montoInteresProyectado = (isProyectandoCredito && saldoCapital > 0) ? (saldoCapital * interes) / 100 : 0;

    // 5. Total Venta Final
    // Subtotal + Interest already in payments + Interest currently being previewed
    const totalVenta = subtotalVenta + interesAcumulado + montoInteresProyectado;

    // 6. Values for Credit Input
    // What user sees as "Total a Financiar"
    const totalA_Financiar = saldoCapital + montoInteresProyectado;
    const valorCuota = (medioPago === 'CREDITO' && cuotas > 0) ? totalA_Financiar / cuotas : 0;

    const procesarVenta = async () => {
        if (!clienteSeleccionado) return showToast('Seleccione un cliente', 'error');
        if (carrito.length === 0) return showToast('El carrito está vacío', 'error');
        if (pagos.length === 0) return showToast('Debe agregar al menos un pago', 'error');

        const payload = {
            id_cliente: clienteSeleccionado,
            items: carrito.map(item => ({
                id_producto: item.id_producto,
                cantidad: item.cantidad,
                precio_final: item.precio_unitario
            })),
            pagos: pagos,
            plan_cuotas: cuotas,
            interes_aplicado: interesAcumulado + montoInteresProyectado, // Send total interest
            total: totalVenta,
            moneda: monedaVenta,
            fecha_primera_cuota: fechaPrimeraCuota || null,
            entrega_inmediata: entregaInmediata
        };

        try {
            await api.post('/ventas', payload);
            showToast('Venta registrada con éxito', 'success');
            router.push('/ventas'); 
        } catch (error) {
            console.error(error);
            showToast(error.response?.data?.message || 'Error al procesar venta', 'error');
        }
    };

    const productosFiltrados = productos.filter(p => 
        p.nombre.toLowerCase().includes(terminoBusqueda.toLowerCase()) || 
        p.sku.toLowerCase().includes(terminoBusqueda.toLowerCase())
    );

    const agregarPago = () => {
        let monto;
        let interesMonto = 0;
        
        if (medioPago === 'CREDITO') {
            // For credit, use the projected total (Capital + Projected Interest)
            monto = totalA_Financiar;
            interesMonto = montoInteresProyectado;
            
            if (pagos.some(p => p.metodo === 'CREDITO')) return showToast("Solo un pago a crédito permitido", 'error');
            if (saldoCapital <= 0) return showToast('No hay saldo pendiente para financiar', 'error');
        } else {
            monto = parseFloat(montoPagoInput);
            if (!monto || monto <= 0) return showToast('Ingrese un monto válido', 'error');
        }
        
        let pagoData = { metodo: medioPago, monto, interes: interesMonto };
        if (medioPago === 'CHEQUE') {
            if (!chequeDetalle.banco || !chequeDetalle.numero) return showToast('Complete los datos del cheque', 'error');
            pagoData = { ...pagoData, ...chequeDetalle };
        }

        setPagos([...pagos, pagoData]);
        setMontoPagoInput('');
        setChequeDetalle({ banco: '', numero: '', fecha_emision: '', fecha_cobro: '' });
    };

    return (
        <LayoutPrincipal>
            <div className="space-y-3">
                {/* Header Bar - Client & Config */}
                <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Cliente</label>
                            <select 
                                value={clienteSeleccionado}
                                onChange={e => setClienteSeleccionado(e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                            >
                                <option value="">Seleccionar Cliente...</option>
                                {clientes.map(c => (
                                    <option key={c.id} value={c.id}>{c.apellido}, {c.nombre} - {c.cuit_cuil}</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-48">
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Lista de Precios</label>
                            <select 
                                value={listaSeleccionada}
                                onChange={e => setListaSeleccionada(e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                            >
                                {listasPrecios.map(l => (
                                    <option key={l.id} value={l.id}>{l.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-24">
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Moneda</label>
                            <div className="flex bg-gray-100 rounded p-0.5 border border-gray-200">
                                <button 
                                    onClick={() => setMonedaVenta('ARS')}
                                    className={`flex-1 px-2 py-1 text-xs font-semibold rounded transition-colors ${monedaVenta === 'ARS' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
                                >ARS</button>
                                <button 
                                    onClick={() => setMonedaVenta('USD')}
                                    className={`flex-1 px-2 py-1 text-xs font-semibold rounded transition-colors ${monedaVenta === 'USD' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
                                >USD</button>
                            </div>
                        </div>
                        <div className="w-40">
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Entrega</label>
                            <label className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded px-3 py-1.5 cursor-pointer hover:bg-gray-100 transition-colors">
                                <input 
                                    type="checkbox" 
                                    checked={entregaInmediata}
                                    onChange={(e) => setEntregaInmediata(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-xs font-medium text-gray-700">Inmediata</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Main Content - 2 Columns */}
                <div className="grid grid-cols-3 gap-3">
                    {/* LEFT: Products (2/3) - Compact List View */}
                    <div className="col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col" style={{height: 'calc(100vh - 220px)'}}>
                        {/* Search Bar */}
                        <div className="p-3 border-b border-gray-200 bg-gray-50">
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text"
                                    placeholder="Buscar productos (Nombre, SKU)..." 
                                    className="w-full pl-9 pr-3 py-2 rounded border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 text-sm"
                                    value={terminoBusqueda}
                                    onChange={e => setTerminoBusqueda(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Product List */}
                        <div className="flex-1 overflow-y-auto">
                            {productosFiltrados.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
                                    <MagnifyingGlassIcon className="w-12 h-12 opacity-20 mb-2" />
                                    <p className="text-sm">No se encontraron productos</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-100 sticky top-0 md:bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        <tr>
                                            <th className="px-4 py-2 w-2/3">Producto</th>
                                            <th className="px-4 py-2 text-right">Precio</th>
                                            <th className="px-4 py-2 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {productosFiltrados.map(producto => {
                                            const precio = calcularPrecio(producto);
                                            const hasStock = producto.stock_actual > 0;
                                            const enCarrito = carrito.find(item => item.id_producto === producto.id);
                                            
                                            return (
                                                <tr 
                                                    key={producto.id}
                                                    onClick={() => agregarAlCarrito(producto)}
                                                    className={`hover:bg-blue-50 cursor-pointer transition-colors group ${enCarrito ? 'bg-blue-50/50' : 'bg-white'}`}
                                                >
                                                    <td className="px-4 py-2.5 align-top">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-sm text-gray-900 leading-tight">
                                                                {producto.nombre}
                                                            </span>
                                                            <span className="text-[11px] text-gray-500 mt-0.5 font-mono">
                                                                {producto.sku} | <span className={`${hasStock ? 'text-emerald-600' : 'text-red-500'} font-semibold`}>
                                                                    Stock: {producto.stock_actual}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right align-middle">
                                                        <span className="font-bold text-gray-900 group-hover:text-blue-700">
                                                            ${precio.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                        {enCarrito && (
                                                            <div className="text-[10px] font-bold text-blue-600 mt-0.5">
                                                                En carrito: {enCarrito.cantidad}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2.5 align-middle text-right">
                                                        <button className={`p-1.5 rounded-full transition-colors ${enCarrito ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-blue-600 group-hover:text-white'}`}>
                                                            <PlusIcon className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Cart & Payment (1/3) - Tabbed Interface */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col overflow-hidden" style={{height: 'calc(100vh - 220px)'}}>
                        
                        {/* Tabs Header */}
                        <div className="flex border-b border-gray-200">
                            <button
                                onClick={() => setActiveTab('detalle')}
                                className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors
                                    ${activeTab === 'detalle' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-gray-50 text-gray-500 hover:text-gray-700'}`}
                            >
                                <ShoppingCartIcon className="w-4 h-4" />
                                Detalle ({carrito.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('pagos')}
                                className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors
                                    ${activeTab === 'pagos' ? 'bg-white text-emerald-600 border-b-2 border-emerald-600' : 'bg-gray-50 text-gray-500 hover:text-gray-700'}`}
                            >
                                <CreditCardIcon className="w-4 h-4" />
                                Pagos
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-hidden flex flex-col relative">
                            
                            {/* TAB: DETALLE */}
                            {activeTab === 'detalle' && (
                                <>
                                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                        {carrito.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                                <ShoppingCartIcon className="w-16 h-16 opacity-10 mb-3" />
                                                <p className="text-sm">El carrito está vacío</p>
                                                <p className="text-xs mt-1">Seleccione productos del listado</p>
                                            </div>
                                        ) : (
                                            carrito.map(item => (
                                                <div key={item.id_producto} className="flex flex-col bg-white border border-gray-200 rounded p-2.5 shadow-sm">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h5 className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">{item.nombre}</h5>
                                                        <button onClick={() => eliminarDelCarrito(item.id_producto)} className="text-gray-400 hover:text-red-600 p-0.5 -mr-1">
                                                            <XMarkIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="flex items-end justify-between">
                                                        <div className="flex items-center gap-2 bg-gray-50 rounded border border-gray-200 p-0.5">
                                                            <button onClick={() => actualizarCantidad(item.id_producto, -1)} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-gray-500 hover:text-blue-600">
                                                                <MinusIcon className="w-3 h-3" />
                                                            </button>
                                                            <span className="text-xs font-semibold w-6 text-center">{item.cantidad}</span>
                                                            <button onClick={() => actualizarCantidad(item.id_producto, 1)} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-gray-500 hover:text-blue-600">
                                                                <PlusIcon className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] text-gray-500">${item.precio_unitario.toLocaleString('es-AR')} un.</p>
                                                            <p className="font-bold text-sm text-gray-900">${item.subtotal.toLocaleString('es-AR')}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="p-3 border-t border-gray-200 bg-gray-50">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-gray-600 text-sm">Subtotal Estimado</span>
                                            <span className="text-lg font-bold text-gray-900">${subtotalVenta.toLocaleString('es-AR')}</span>
                                        </div>
                                        <button 
                                            onClick={() => setActiveTab('pagos')}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                                            disabled={carrito.length === 0}
                                        >
                                            Ir a Pagar <CreditCardIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* TAB: PAGOS */}
                            {activeTab === 'pagos' && (
                                <>
                                    <div className="flex-1 overflow-y-auto p-3 space-y-4">
                                        {/* Payment Method Selector */}
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Medio de Pago</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['EFECTIVO', 'TARJETA', 'CREDITO', 'CHEQUE'].map(method => (
                                                    <button
                                                        key={method}
                                                        onClick={() => setMedioPago(method)}
                                                        className={`text-xs font-medium py-2 px-3 rounded border transition-all text-center
                                                            ${medioPago === method 
                                                                ? 'bg-blue-50 border-blue-600 text-blue-700 ring-1 ring-blue-600' 
                                                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                                                    >
                                                        {method}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Input Form */}
                                        <div className="space-y-3 bg-gray-50 p-3 rounded border border-gray-200">
                                            {medioPago === 'CHEQUE' && (
                                                <div className="space-y-2">
                                                    <input placeholder="Banco" className="w-full bg-white border border-gray-300 px-3 py-1.5 text-xs rounded" 
                                                        value={chequeDetalle.banco} onChange={e => setChequeDetalle({...chequeDetalle, banco: e.target.value})} />
                                                    <input placeholder="Número" className="w-full bg-white border border-gray-300 px-3 py-1.5 text-xs rounded" 
                                                        value={chequeDetalle.numero} onChange={e => setChequeDetalle({...chequeDetalle, numero: e.target.value})} />
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <input type="date" className="w-full bg-white border border-gray-300 px-3 py-1.5 text-xs rounded" 
                                                            value={chequeDetalle.fecha_emision} onChange={e => setChequeDetalle({...chequeDetalle, fecha_emision: e.target.value})} />
                                                        <input type="date" className="w-full bg-white border border-gray-300 px-3 py-1.5 text-xs rounded" 
                                                            value={chequeDetalle.fecha_cobro} onChange={e => setChequeDetalle({...chequeDetalle, fecha_cobro: e.target.value})} />
                                                    </div>
                                                </div>
                                            )}

                                            {medioPago === 'CREDITO' && (
                                                <div className="space-y-3">
                                                    <div className="flex justify-between text-xs pb-2 border-b border-gray-200">
                                                        <span className="text-gray-600">Saldo a Financiar:</span>
                                                        <span className="font-semibold">${saldoCapital.toLocaleString('es-AR')}</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <select value={cuotas} onChange={e => setCuotas(Number(e.target.value))} className="bg-white border border-gray-300 rounded px-2 py-1.5 text-xs">
                                                            {[1,2,3,4,5,6,9,12].map(n => <option key={n} value={n}>{n} Cuotas</option>)}
                                                        </select>
                                                        <input placeholder="Interés %" type="number" className="bg-white border border-gray-300 rounded px-2 py-1.5 text-xs"
                                                            value={interes} onChange={e => setInteres(Number(e.target.value))} />
                                                    </div>
                                                    <input type="date" className="w-full bg-white border border-gray-300 px-2 py-1.5 text-xs rounded"
                                                        value={fechaPrimeraCuota} onChange={e => setFechaPrimeraCuota(e.target.value)} />
                                                    
                                                    {interes > 0 && (
                                                        <div className="text-xs flex justify-between text-amber-600 font-medium">
                                                            <span>Interés Calculado:</span>
                                                            <span>+${montoInteresProyectado.toLocaleString('es-AR')}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                <input 
                                                    type="number" 
                                                    placeholder="Monto a agregar"
                                                    className="flex-1 bg-white border border-gray-300 px-3 py-2 text-sm rounded font-semibold text-right"
                                                    value={medioPago === 'CREDITO' ? totalA_Financiar.toFixed(2) : montoPagoInput}
                                                    onChange={e => medioPago !== 'CREDITO' && setMontoPagoInput(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && agregarPago()}
                                                    readOnly={medioPago === 'CREDITO'}
                                                />
                                                <button onClick={agregarPago} className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700 transition-colors">
                                                    <PlusIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Payments List */}
                                        {pagos.length > 0 && (
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Pagos Registrados</label>
                                                <div className="bg-white border border-gray-200 rounded divide-y divide-gray-100">
                                                    {pagos.map((p, idx) => (
                                                        <div key={idx} className="flex justify-between items-center p-2 text-xs">
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold text-gray-900">{p.metodo}</span>
                                                                {p.metodo === 'CHEQUE' && <span className="text-gray-400">#{p.numero} - {p.banco}</span>}
                                                                {p.metodo === 'CREDITO' && <span className="text-gray-400">{cuotas} cuotas (Int: ${p.interes?.toLocaleString('es-AR')})</span>}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-gray-700">${parseFloat(p.monto).toLocaleString('es-AR')}</span>
                                                                <button onClick={() => setPagos(pagos.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 p-1">
                                                                    <XMarkIcon className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer Summary */}
                                    <div className="p-3 border-t border-gray-200 bg-white">
                                        <div className="space-y-1 text-sm mb-3">
                                            <div className="flex justify-between text-gray-600 text-xs">
                                                <span>Subtotal Productos</span>
                                                <span>${subtotalVenta.toLocaleString('es-AR')}</span>
                                            </div>
                                            {(interesAcumulado > 0 || montoInteresProyectado > 0) && (
                                                <div className="flex justify-between text-amber-600 text-xs">
                                                    <span>Interés Financiero</span>
                                                    <span>+${(interesAcumulado + montoInteresProyectado).toLocaleString('es-AR')}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between font-bold text-lg text-gray-900 pt-1 border-t border-gray-100 mt-1">
                                                <span>Total Final</span>
                                                <span>${totalVenta.toLocaleString('es-AR')}</span>
                                            </div>
                                            <div className="flex justify-between text-emerald-600 text-xs font-medium">
                                                <span>Pagado</span>
                                                <span>${totalPagado.toLocaleString('es-AR')}</span>
                                            </div>
                                            <div className="flex justify-between text-red-600 text-xs font-medium">
                                                <span>Restante</span>
                                                <span>${Math.max(0, totalVenta - totalPagado).toLocaleString('es-AR')}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <button 
                                                onClick={() => setActiveTab('detalle')}
                                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 font-medium"
                                            >
                                                Volver
                                            </button>
                                            <button 
                                                onClick={procesarVenta}
                                                disabled={carrito.length === 0 || pagos.length === 0 || Math.abs(totalVenta - totalPagado) > 2}
                                                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                                            >
                                                Confirmar Venta
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </LayoutPrincipal>
    );
}
