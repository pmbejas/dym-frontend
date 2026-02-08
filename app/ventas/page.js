'use client';
import { useState, useEffect } from 'react';
import LayoutPrincipal from '@/components/LayoutPrincipal';
import Boton from '@/components/Boton';
import Tabla from '@/components/Tabla';
import api from '@/services/api';
import { generarPDF } from '@/utils/pdfGenerator';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';


export default function VentasPage() {
    const { showToast } = useToast();
    const [ventas, setVentas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [selectedVenta, setSelectedVenta] = useState(null);
    const [activeTab, setActiveTab] = useState('venta');

    const [showPagoModal, setShowPagoModal] = useState(false);
    const [showInteresModal, setShowInteresModal] = useState(false);
    const [selectedCuota, setSelectedCuota] = useState(null);
    const [medioPagoCuota, setMedioPagoCuota] = useState('EFECTIVO');
    const [isProcessingPago, setIsProcessingPago] = useState(false);

    // Partial delivery state
    const [cantidadesEntrega, setCantidadesEntrega] = useState({});

    // Filter state
    const [filtroCliente, setFiltroCliente] = useState('');
    const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
    const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
    const [filtroEstadoPago, setFiltroEstadoPago] = useState('TODOS');
    const [filtroEstadoEntrega, setFiltroEstadoEntrega] = useState('TODOS');

    useEffect(() => {
        fetchVentas();
    }, []);

    const fetchVentas = async () => {
        try {
            const { data } = await api.get('/ventas');
            setVentas(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            showToast('Error cargando ventas', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerDetalle = async (id) => {
        try {
            const { data } = await api.get(`/ventas/${id}`);
            setSelectedVenta(data);
            setActiveTab('venta'); // Reset tab to 'venta' on open
            setShowModal(true);
        } catch (error) {
            console.error(error);
            showToast('Error cargando detalles', 'error');
        }
    };

    const handleMarcarEntregada = async (id) => {
        if (!confirm('¿Confirmar entrega de esta venta? El stock se actualizará.')) return;
        
        try {
            await api.patch(`/ventas/${id}/entregar`);
            showToast('Venta marcada como entregada', 'success');
            fetchVentas();
        } catch (error) {
            console.error(error);
            showToast(error.response?.data?.message || 'Error al marcar como entregada', 'error');
        }
    };

    const handleEntregaParcial = async () => {
        if (!selectedVenta) return;

        // Build entregas array from cantidadesEntrega state
        const entregas = Object.entries(cantidadesEntrega)
            .filter(([_, cantidad]) => cantidad && cantidad > 0)
            .map(([id_detalle, cantidad_a_entregar]) => ({
                id_detalle: parseInt(id_detalle),
                cantidad_a_entregar: parseInt(cantidad_a_entregar)
            }));

        console.log('Entregas a enviar:', entregas);
        console.log('Estado cantidadesEntrega:', cantidadesEntrega);

        if (entregas.length === 0) {
            return showToast('Ingrese al menos una cantidad a entregar', 'error');
        }

        try {
            const response = await api.patch(`/ventas/${selectedVenta.id}/entregar`, { entregas });
            console.log('Respuesta del servidor:', response.data);
            showToast('Entrega parcial registrada con éxito', 'success');
            setCantidadesEntrega({});
            // Refresh details
            handleVerDetalle(selectedVenta.id);
            fetchVentas();
        } catch (error) {
            console.error('Error completo:', error);
            console.error('Respuesta del error:', error.response);
            showToast(error.response?.data?.message || 'Error en entrega parcial', 'error');
        }
    };




    const openPagoModal = (cuota) => {
        setSelectedCuota(cuota);
        setMedioPagoCuota('EFECTIVO');
        setShowPagoModal(true);
    };

    const closePagoModal = () => {
        setShowPagoModal(false);
        setSelectedCuota(null);
        setMedioPagoCuota('EFECTIVO');
    };

    const handlePagarCuota = async () => {
        if (!selectedCuota) return;
        setIsProcessingPago(true);
        try {
            await api.post(`/cuotas/${selectedCuota.id}/pagar`, { medio_pago: medioPagoCuota });
            showToast('Cuota pagada con éxito', 'success');
            closePagoModal();
            // Refresh details
            handleVerDetalle(selectedVenta.id);
            fetchVentas(); // Update list status
        } catch (error) {
            console.error(error);
            showToast(error.response?.data?.message || 'Error al pagar cuota', 'error');
        } finally {
            setIsProcessingPago(false);
        }
    };

    // Helper to calculate payment totals
    const calculateTotals = () => {
        if (!selectedVenta) return { totalPagado: 0, saldoFinanciar: 0 };
        
        const totalPagosCaja = selectedVenta.MovimientoCajas?.reduce((acc, mov) => acc + parseFloat(mov.monto), 0) || 0;
        const totalCheques = selectedVenta.Cheques?.reduce((acc, ch) => acc + parseFloat(ch.monto), 0) || 0;
        const totalPagado = totalPagosCaja + totalCheques;
        
        // El saldo a financiar es el total de la venta menos lo pagado.
        // Si hay cuotas, este valor debería coincidir con la suma de las cuotas (con intereses si aplica).
        // Pero el concepto de "Saldo a financiar" suele ser el remanente de la venta.
        const saldoFinanciar = parseFloat(selectedVenta.total) - totalPagado;

        return { totalPagado, saldoFinanciar };
    };

    const { totalPagado, saldoFinanciar } = calculateTotals();

    const handleImprimirComprobante = async (venta) => {
        try {
            // Check if details are loaded (e.g. products)
            if (venta.detalles && Array.isArray(venta.detalles) && venta.detalles.length > 0) {
                 generarPDF(venta);
            } else {
                showToast('Generando comprobante...', 'info');
                // Fetch full details
                const { data } = await api.get(`/ventas/${venta.id}`);
                generarPDF(data);
            }
        } catch (error) {
            console.error(error);
            showToast('Error al generar comprobante', 'error');
        }
    };


    const columnas = [
        { header: 'Fecha', accessor: 'fecha', render: (row) => new Date(row.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) },
        { header: 'Factura', accessor: 'numero_factura' },
        { header: 'Cliente', accessor: 'cliente', render: (row) => {
            const cliente = row.Cliente || row.cliente;
            return cliente ? `${cliente.apellido || ''}, ${cliente.nombre}` : 'Desconocido';
        }},
        { header: 'Medio Pago', accessor: 'medio_pago', render: (row) => (
            <span className="text-xs font-bold uppercase tracking-wider">{row.medio_pago}</span>
        )},
        { header: 'Total', accessor: 'total', className: 'text-center w-36', headerClassName: 'text-center', render: (row) => (
            <div className="flex items-center justify-end gap-2">
                <span className="font-bold text-[var(--color-success)]">${parseFloat(row.total).toLocaleString('es-AR')}</span>
                <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                    row.moneda === 'USD' ? 'bg-green-100 text-green-700' : 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                }`}>
                    {row.moneda}
                </span>
            </div>
        )},
        { header: 'Estado', accessor: 'estado', className: 'w-28', render: (row) => (
             <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                 row.estado === 'PAGADA' ? 'bg-green-100 text-green-600' :
                 row.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-600' :
                 'bg-red-100 text-red-600'
             }`}>
                 {row.estado}
             </span>
        )},
        { header: 'Entrega', accessor: 'estado_entrega', render: (row) => (
             <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                 row.estado_entrega === 'ENTREGADO' ? 'bg-emerald-100 text-emerald-600' :
                 row.estado_entrega === 'PARCIAL' ? 'bg-blue-100 text-blue-600' :
                 'bg-amber-100 text-amber-600'
             }`}>
                 {row.estado_entrega}
             </span>
        )},
        { header: 'Acciones', accessor: 'id', className: 'w-20', render: (row) => (
            <div className="flex justify-center gap-2">
                 <button onClick={() => handleImprimirComprobante(row)} className="text-[var(--text-muted)] hover:text-[var(--color-brand-primary)] transition-colors" title="Imprimir Comprobante">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
                    </svg>
                 </button>
                 <button onClick={() => handleVerDetalle(row.id)} className="text-[var(--text-muted)] hover:text-[var(--color-brand-primary)] transition-colors" title="Ver Detalle">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                       <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                     </svg>
                 </button>
            </div>
        )}
    ];

    return (
        <LayoutPrincipal>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Ventas</h1>
                    <p className="text-[var(--text-secondary)]">Historial de transacciones</p>
                </div>
                <Link href="/ventas/nueva">
                    <Boton tipo="primary" className="flex items-center gap-2">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                         </svg> Nuevo
                    </Boton>
                </Link>
            </div>

            {/* Filters Section */}
            <div className="bg-[var(--bg-secondary)] rounded-lg shadow-md border border-[var(--border-light)] p-4 mb-6 transition-all hover:shadow-lg">
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wide">Filtros</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Client Filter */}
                    <div>
                        <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase">Cliente</label>
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            value={filtroCliente}
                            onChange={(e) => setFiltroCliente(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:border-transparent bg-[var(--bg-primary)] text-[var(--text-primary)] transition-shadow"
                        />
                    </div>

                    {/* Date From Filter */}
                    <div>
                        <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase">Desde</label>
                        <input
                            type="date"
                            value={filtroFechaDesde}
                            onChange={(e) => setFiltroFechaDesde(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:border-transparent bg-[var(--bg-primary)] text-[var(--text-primary)] transition-shadow"
                        />
                    </div>

                    {/* Date To Filter */}
                    <div>
                        <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase">Hasta</label>
                        <input
                            type="date"
                            value={filtroFechaHasta}
                            onChange={(e) => setFiltroFechaHasta(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:border-transparent bg-[var(--bg-primary)] text-[var(--text-primary)] transition-shadow"
                        />
                    </div>

                    {/* Payment Status Filter */}
                    <div>
                        <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase">Estado de Pago</label>
                        <select
                            value={filtroEstadoPago}
                            onChange={(e) => setFiltroEstadoPago(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:border-transparent bg-[var(--bg-primary)] text-[var(--text-primary)] transition-shadow"
                        >
                            <option value="TODOS">Todos</option>
                            <option value="PENDIENTE">Pendiente</option>
                            <option value="PAGADA">Pagada</option>
                        </select>
                    </div>

                    {/* Delivery Status Filter */}
                    <div>
                        <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase">Estado de Entrega</label>
                        <select
                            value={filtroEstadoEntrega}
                            onChange={(e) => setFiltroEstadoEntrega(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:border-transparent bg-[var(--bg-primary)] text-[var(--text-primary)] transition-shadow"
                        >
                            <option value="TODOS">Todos</option>
                            <option value="PENDIENTE">Pendiente</option>
                            <option value="PARCIAL">Parcial</option>
                            <option value="ENTREGADO">Entregado</option>
                        </select>
                    </div>
                </div>

                {/* Clear Filters Button */}
                <div className="flex justify-end mt-4">
                    <button
                        onClick={() => {
                            setFiltroCliente('');
                            setFiltroFechaDesde('');
                            setFiltroFechaHasta('');
                            setFiltroEstadoPago('TODOS');
                            setFiltroEstadoEntrega('TODOS');
                        }}
                        className="text-sm text-[var(--text-muted)] hover:text-[var(--color-brand-primary)] font-medium transition-colors flex items-center gap-1"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                        Limpiar Filtros
                    </button>
                </div>
            </div>

            <Tabla 
                columnas={columnas} 
                datos={ventas.filter(venta => {
                    // Client filter
                    if (filtroCliente) {
                        const clienteNombre = `${venta.Cliente?.apellido || ''} ${venta.Cliente?.nombre || ''}`.toLowerCase();
                        if (!clienteNombre.includes(filtroCliente.toLowerCase())) {
                            return false;
                        }
                    }

                    // Date range filter
                    if (filtroFechaDesde) {
                        const ventaDate = new Date(venta.fecha);
                        const desdeDate = new Date(filtroFechaDesde + 'T00:00:00');
                        if (ventaDate < desdeDate) {
                            return false;
                        }
                    }
                    if (filtroFechaHasta) {
                        const ventaDate = new Date(venta.fecha);
                        const hastaDate = new Date(filtroFechaHasta + 'T23:59:59');
                        if (ventaDate > hastaDate) {
                            return false;
                        }
                    }

                    // Payment status filter
                    if (filtroEstadoPago !== 'TODOS' && venta.estado !== filtroEstadoPago) {
                        return false;
                    }

                    // Delivery status filter
                    if (filtroEstadoEntrega !== 'TODOS' && venta.estado_entrega !== filtroEstadoEntrega) {
                        return false;
                    }

                    return true;
                })} 
            />

            {/* Detalle Modal */}
            {showModal && selectedVenta && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-[var(--bg-secondary)] rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden border border-[var(--border-light)] transform transition-all">
                        <div className="p-5 border-b border-[var(--border-light)] bg-[var(--bg-primary)] flex-shrink-0">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-[var(--text-primary)]">Detalle de Venta</h3>
                                    <p className="text-sm text-[var(--text-secondary)] font-medium">{selectedVenta.numero_factura} • {new Date(selectedVenta.fecha).toLocaleDateString('es-AR')}</p>
                                </div>
                                <button 
                                    onClick={() => generarPDF(selectedVenta)}
                                    className="text-[var(--text-muted)] hover:text-[var(--color-brand-primary)] transition-colors p-1 rounded-full hover:bg-[var(--border-light)] mr-2"
                                    title="Imprimir Comprobante"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
                                    </svg>
                                </button>
                                <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-full hover:bg-[var(--border-light)]">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Tabs Navigation */}
                            <div className="flex gap-2 bg-[var(--bg-elevated)] p-1.5 rounded-lg border border-[var(--border-light)]">
                                <button 
                                    onClick={() => setActiveTab('venta')}
                                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                                        activeTab === 'venta' 
                                            ? 'bg-[var(--color-brand-primary)] text-white shadow-md' 
                                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]'
                                    }`}
                                >
                                    Venta
                                </button>
                                <button 
                                    onClick={() => setActiveTab('pagos')}
                                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                                        activeTab === 'pagos' 
                                            ? 'bg-[var(--color-brand-primary)] text-white shadow-md' 
                                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]'
                                    }`}
                                >
                                    Pagos
                                </button>
                                {selectedVenta.cuotas?.length > 0 && (
                                    <button 
                                        onClick={() => setActiveTab('cuotas')}
                                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                                            activeTab === 'cuotas' 
                                                ? 'bg-[var(--color-brand-primary)] text-white shadow-md' 
                                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]'
                                        }`}
                                    >
                                        Cuotas
                                    </button>
                                )}
                                <button 
                                    onClick={() => setActiveTab('entregas')}
                                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                                        activeTab === 'entregas' 
                                            ? 'bg-[var(--color-success)] text-white shadow-md' 
                                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]'
                                    }`}
                                >
                                    Entregas
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 bg-[var(--bg-secondary)]">
                            {/* TAB: VENTA */}
                            {activeTab === 'venta' && (
                                <div className="space-y-6 animate-fadeIn">
                                    {/* Cliente Info */}
                                    <div className="grid grid-cols-2 gap-6 p-5 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-light)]">
                                        <div>
                                            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold">Cliente</span>
                                            <p className="font-bold text-[var(--text-primary)] text-lg">
                                                {(selectedVenta.Cliente || selectedVenta.cliente)?.apellido}, {(selectedVenta.Cliente || selectedVenta.cliente)?.nombre}
                                            </p>
                                            <p className="text-sm text-[var(--text-secondary)]">{(selectedVenta.Cliente || selectedVenta.cliente)?.cuit_cuil}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold">Fecha</span>
                                            <p className="font-bold text-[var(--text-primary)] text-lg">
                                                {new Date(selectedVenta.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Items Table */}
                                    <div>
                                        <h4 className="font-bold text-[var(--text-primary)] mb-4 text-lg border-b border-[var(--border-light)] pb-2">Detalle de Productos</h4>
                                        <table className="w-full text-sm">
                                            <thead className="bg-[var(--bg-primary)] text-[var(--text-secondary)]">
                                                <tr>
                                                    <th className="px-4 py-3 text-left rounded-l-lg font-semibold uppercase text-xs tracking-wider">Producto</th>
                                                    <th className="px-4 py-3 text-center font-semibold uppercase text-xs tracking-wider">Cant.</th>
                                                    <th className="px-4 py-3 text-right font-semibold uppercase text-xs tracking-wider">Precio Unit.</th>
                                                    <th className="px-4 py-3 text-right rounded-r-lg font-semibold uppercase text-xs tracking-wider">Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[var(--border-light)]">
                                                {selectedVenta.detalles?.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-[var(--bg-primary)] transition-colors">
                                                        <td className="px-4 py-3">
                                                            <p className="font-medium text-[var(--text-primary)]">{item.Producto?.nombre || 'Producto eliminado'}</p>
                                                            <p className="text-xs text-[var(--text-muted)]">{item.Producto?.sku}</p>
                                                        </td>
                                                        <td className="px-4 py-3 text-center font-medium text-[var(--text-secondary)]">{item.cantidad}</td>
                                                        <td className="px-4 py-3 text-right text-[var(--text-secondary)]">${parseFloat(item.precio_unitario).toLocaleString('es-AR')}</td>
                                                        <td className="px-4 py-3 text-right font-bold text-[var(--text-primary)]">
                                                            ${(item.cantidad * parseFloat(item.precio_unitario)).toLocaleString('es-AR')}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="border-t-2 border-[var(--border-color)]">
                                                <tr>
                                                    <td colSpan="3" className="px-4 py-3 text-right text-[var(--text-secondary)] font-medium">Subtotal</td>
                                                    <td className="px-4 py-3 text-right font-bold text-[var(--text-primary)]">
                                                        ${selectedVenta.detalles?.reduce((acc, item) => acc + (item.cantidad * parseFloat(item.precio_unitario)), 0).toLocaleString('es-AR')}
                                                    </td>
                                                </tr>
                                                {parseFloat(selectedVenta.interes_aplicado || 0) > 0 && (
                                                    <tr>
                                                        <td colSpan="3" className="px-4 py-2 text-right text-[var(--text-secondary)] font-medium">Intereses por financiación</td>
                                                        <td className="px-4 py-2 text-right font-bold text-[var(--text-primary)]">
                                                            ${parseFloat(selectedVenta.interes_aplicado || 0).toLocaleString('es-AR')}
                                                        </td>
                                                    </tr>
                                                )}
                                                <tr>
                                                    <td colSpan="3" className="px-4 py-4 text-right font-bold text-[var(--text-primary)] text-lg">Total Venta</td>
                                                    <td className="px-4 py-4 text-right font-extrabold text-[var(--color-brand-primary)] text-2xl">
                                                        ${parseFloat(selectedVenta.total).toLocaleString('es-AR')}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* TAB: PAGOS */}
                            {activeTab === 'pagos' && (
                                <div className="space-y-6 animate-fadeIn">
                                    <div className="flex justify-between items-center bg-[var(--bg-primary)] p-4 rounded-lg border border-[var(--border-light)]">
                                        <h4 className="font-bold text-[var(--text-primary)]">Estado General</h4>
                                        <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${
                                            selectedVenta.estado === 'PAGADA' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                            {selectedVenta.estado}
                                        </span>
                                    </div>

                                    {((selectedVenta.MovimientoCajas?.length > 0) || (selectedVenta.Cheques?.length > 0)) ? (
                                        <div className="bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-light)] divide-y divide-[var(--border-light)] shadow-sm">
                                            {selectedVenta.MovimientoCajas?.map(mov => (
                                                <div key={mov.id} className="p-4 flex justify-between items-center hover:bg-[var(--bg-primary)] transition-colors">
                                                    <div>
                                                        <p className="font-bold text-[var(--text-primary)] text-sm">{mov.concepto?.replace(/Venta #\d+/, '').trim() || mov.medio_pago}</p>
                                                        <p className="text-xs text-[var(--text-muted)] font-medium mt-1 uppercase tracking-wide">{new Date(mov.fecha || mov.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} • {mov.medio_pago}</p>
                                                    </div>
                                                    <span className="font-bold text-[var(--color-brand-primary)] text-lg">${parseFloat(mov.monto).toLocaleString('es-AR')}</span>
                                                </div>
                                            ))}
                                            {selectedVenta.Cheques?.map(cheque => (
                                                <div key={cheque.id} className="p-4 flex justify-between items-center hover:bg-[var(--bg-primary)] transition-colors">
                                                    <div>
                                                        <p className="font-bold text-[var(--text-primary)] text-sm">Cheque #{cheque.numero}</p>
                                                        <p className="text-xs text-[var(--text-muted)] font-medium mt-1 uppercase tracking-wide">{cheque.banco} • Cobro: {new Date(cheque.fecha_cobro).toLocaleDateString('es-AR')}</p>
                                                    </div>
                                                    <span className="font-bold text-[var(--color-brand-primary)] text-lg">${parseFloat(cheque.monto).toLocaleString('es-AR')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 bg-[var(--bg-primary)] rounded-lg border border-dashed border-[var(--border-color)]">
                                            <p className="text-sm text-[var(--text-muted)] italic">No hay pagos registrados aún.</p>
                                        </div>
                                    )}
                                    
                                    {/* Payment Summary */}
                                    <div className="bg-[var(--color-primary-light)] border border-indigo-100 rounded-lg p-5 mt-6 shadow-inner">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-sm font-bold text-[var(--color-brand-primary)] uppercase tracking-wide">Total Venta</span>
                                            <span className="text-xl font-bold text-[var(--color-brand-primary)]">${parseFloat(selectedVenta.total).toLocaleString('es-AR')}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-[var(--color-success)] uppercase tracking-wide">Total Pagado</span>
                                            <span className="text-xl font-bold text-[var(--color-success)]">${totalPagado.toLocaleString('es-AR')}</span>
                                        </div>
                                        {saldoFinanciar > 0 && (
                                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-[var(--border-color)]">
                                                <span className="text-sm font-bold text-[var(--color-warning)] uppercase tracking-wide">Saldo Financiado</span>
                                                <span className="text-xl font-bold text-[var(--color-warning)]">${saldoFinanciar.toLocaleString('es-AR')}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* TAB: CUOTAS */}
                            {activeTab === 'cuotas' && selectedVenta.cuotas?.length > 0 && (
                                <div className="space-y-6 animate-fadeIn">
                                    <div className="flex justify-between items-end mb-4 bg-[var(--bg-primary)] p-4 rounded-lg border border-[var(--border-light)]">
                                        <div>
                                            <h4 className="font-bold text-[var(--text-primary)] mb-1">Plan de Cuotas</h4>
                                            <p className="text-xs text-[var(--text-secondary)]">Financiación y Saldos</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-2 justify-end">
                                                <span className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-wide">Total Financiado</span>
                                                {selectedVenta.interes_aplicado > 0 && (
                                                    <button 
                                                        onClick={() => setShowInteresModal(true)}
                                                        className="text-[var(--text-muted)] hover:text-[var(--color-brand-primary)] transition-colors"
                                                        title="Ver detalle del interés"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-2xl font-bold text-[var(--text-primary)]">
                                                ${selectedVenta.cuotas.reduce((acc, c) => acc + parseFloat(c.monto), 0).toLocaleString('es-AR')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto rounded-lg border border-[var(--border-light)] shadow-sm">
                                        <table className="w-full text-sm">
                                            <thead className="bg-[var(--bg-primary)]">
                                                <tr className="text-xs text-[var(--text-muted)] border-b border-[var(--border-light)]">
                                                    <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider">#</th>
                                                    <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider">Vencimiento</th>
                                                    <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider">Monto</th>
                                                    <th className="px-4 py-3 text-center font-semibold uppercase tracking-wider">Estado</th>
                                                    <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider">Acción</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[var(--border-light)] bg-[var(--bg-secondary)]">
                                                {selectedVenta.cuotas.sort((a,b) => a.numero_cuota - b.numero_cuota).map((cuota, index, arr) => {
                                                    const previousPaid = index === 0 || arr[index - 1].estado === 'PAGADA';
                                                    return (
                                                        <tr key={cuota.id} className="hover:bg-[var(--bg-primary)] transition-colors">
                                                            <td className="px-4 py-4 font-bold text-[var(--text-secondary)]">{cuota.numero_cuota}</td>
                                                            <td className="px-4 py-4 text-[var(--text-primary)]">{new Date(cuota.fecha_vencimiento).toLocaleDateString('es-AR')}</td>
                                                            <td className="px-4 py-4 text-right font-bold text-[var(--text-primary)]">${parseFloat(cuota.monto).toLocaleString('es-AR')}</td>
                                                            <td className="px-4 py-4 text-center">
                                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${
                                                                    cuota.estado === 'PAGADA' ? 'bg-green-50 text-green-700 border-green-200' : 
                                                                    new Date(cuota.fecha_vencimiento) < new Date() ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-700 border-slate-200'
                                                                }`}>
                                                                    {cuota.estado === 'PENDIENTE' && new Date(cuota.fecha_vencimiento) < new Date() ? 'VENCIDA' : cuota.estado}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-4 text-right">
                                                                {cuota.estado === 'PENDIENTE' && (
                                                                    <button 
                                                                        className={`font-bold text-xs px-3 py-1.5 rounded transition-colors shadow-sm ${previousPaid ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-[var(--bg-primary)] text-[var(--text-muted)] cursor-not-allowed'}`}
                                                                        onClick={() => previousPaid ? openPagoModal(cuota) : null}
                                                                        disabled={!previousPaid}
                                                                        title={!previousPaid ? 'Debe pagar la cuota anterior primero' : 'Pagar cuota'}
                                                                    >
                                                                        Pagar
                                                                    </button>
                                                                 )}
                                                                {cuota.estado === 'PAGADA' && (
                                                                    <span className="text-xs text-[var(--text-muted)] font-medium">
                                                                        {cuota.fecha_pago ? new Date(cuota.fecha_pago).toLocaleDateString('es-AR') : '-'}
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    <div className="mt-4 text-right">
                                        <button 
                                            className="text-xs font-bold text-[var(--color-brand-primary)] hover:text-[var(--color-brand-hover)] border-b border-transparent hover:border-[var(--color-brand-hover)] transition-all"
                                            onClick={() => showToast('Funcionalidad de Adelantar Cuotas en desarrollo', 'info')}
                                        >
                                            Adelantar Cuotas
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* TAB: ENTREGAS */}
                            {activeTab === 'entregas' && (
                                <div className="space-y-6 animate-fadeIn">
                                    {/* Delivery Status Info */}
                                    <div className={`p-5 rounded-lg border shadow-sm ${
                                        selectedVenta.estado_entrega === 'ENTREGADO' 
                                            ? 'bg-emerald-50 border-emerald-200' 
                                            : selectedVenta.estado_entrega === 'PARCIAL'
                                            ? 'bg-blue-50 border-blue-200'
                                            : 'bg-amber-50 border-amber-200'
                                    }`}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-bold text-sm mb-1 uppercase tracking-wide">Estado de Entrega</h4>
                                                <p className="text-xs opacity-80 decoration-slice">
                                                    {selectedVenta.estado_entrega === 'ENTREGADO' && 'Todos los productos han sido entregados'}
                                                    {selectedVenta.estado_entrega === 'PARCIAL' && 'Algunos productos han sido entregados parcialmente'}
                                                    {selectedVenta.estado_entrega === 'PENDIENTE' && selectedVenta.detalles?.every(d => d.cantidad_entregada === 0) && 'Entrega pendiente - ningún producto entregado aún'}
                                                    {selectedVenta.estado_entrega === 'PENDIENTE' && !selectedVenta.detalles?.every(d => d.cantidad_entregada === 0) && 'Entrega en proceso'}
                                                </p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                                                selectedVenta.estado_entrega === 'ENTREGADO' ? 'bg-white text-emerald-700' :
                                                selectedVenta.estado_entrega === 'PARCIAL' ? 'bg-white text-blue-700' :
                                                'bg-white text-amber-700'
                                            }`}>
                                                {selectedVenta.estado_entrega}
                                            </span>
                                        </div>
                                    </div>

                                    {selectedVenta.estado_entrega !== 'ENTREGADO' && (
                                        <div className="bg-[var(--color-primary-light)] border border-indigo-200 rounded-lg p-4 flex items-start gap-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-[var(--color-brand-primary)] flex-shrink-0 mt-0.5">
                                              <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                                            </svg>
                                            <p className="text-xs text-[var(--color-brand-primary)]">
                                                <strong>Gestión de Entregas:</strong> Ingrese la cantidad a entregar para cada producto. El stock se actualizará al confirmar.
                                            </p>
                                        </div>
                                    )}

                                    <div className="overflow-x-auto rounded-lg border border-[var(--border-light)] shadow-sm">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-[var(--border-light)] bg-[var(--bg-primary)]">
                                                    <th className="text-left py-3 px-4 font-semibold text-[var(--text-secondary)] uppercase text-xs tracking-wider">Producto</th>
                                                    <th className="text-center py-3 px-4 font-semibold text-[var(--text-secondary)] uppercase text-xs tracking-wider">Total</th>
                                                    <th className="text-center py-3 px-4 font-semibold text-[var(--text-secondary)] uppercase text-xs tracking-wider">Entregado</th>
                                                    <th className="text-center py-3 px-4 font-semibold text-[var(--text-secondary)] uppercase text-xs tracking-wider">Pendiente</th>
                                                    <th className="text-center py-3 px-4 font-semibold text-[var(--text-secondary)] uppercase text-xs tracking-wider">A Entregar</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[var(--border-light)] bg-[var(--bg-secondary)]">
                                                {selectedVenta.detalles?.map(detalle => {
                                                    const pendiente = detalle.cantidad - detalle.cantidad_entregada;
                                                    
                                                    return (
                                                        <tr key={detalle.id} className="hover:bg-[var(--bg-primary)] transition-colors">
                                                            <td className="py-3 px-4">
                                                                <div>
                                                                    <p className="font-bold text-[var(--text-primary)]">{detalle.Producto?.nombre}</p>
                                                                    <p className="text-xs text-[var(--text-muted)]">SKU: {detalle.Producto?.sku}</p>
                                                                </div>
                                                            </td>
                                                            <td className="text-center py-3 px-4 font-bold text-[var(--text-secondary)]">
                                                                {detalle.cantidad}
                                                            </td>
                                                            <td className="text-center py-3 px-4">
                                                                <span className="font-bold text-emerald-600">
                                                                    {detalle.cantidad_entregada}
                                                                </span>
                                                            </td>
                                                            <td className="text-center py-3 px-4">
                                                                <span className={`font-bold ${pendiente > 0 ? 'text-amber-600' : 'text-gray-300'}`}>
                                                                    {pendiente}
                                                                </span>
                                                            </td>
                                                            <td className="text-center py-3 px-4">
                                                                {pendiente > 0 ? (
                                                                    <input 
                                                                        type="number"
                                                                        min="0"
                                                                        max={pendiente}
                                                                        value={cantidadesEntrega[detalle.id] || ''}
                                                                        onChange={(e) => setCantidadesEntrega({
                                                                            ...cantidadesEntrega,
                                                                            [detalle.id]: e.target.value
                                                                        })}
                                                                        className="w-20 px-2 py-1.5 border border-[var(--border-color)] rounded text-center text-sm focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] bg-[var(--bg-primary)]"
                                                                        placeholder="0"
                                                                    />
                                                                ) : (
                                                                    <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-full">✓ Completo</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {selectedVenta.detalles?.some(d => d.cantidad - d.cantidad_entregada > 0) && (
                                        <div className="flex justify-between items-center pt-5 border-t border-[var(--border-light)]">
                                            <Boton 
                                                tipo="secondary" 
                                                onClick={() => {
                                                    const autoFill = {};
                                                    selectedVenta.detalles.forEach(detalle => {
                                                        const pendiente = detalle.cantidad - detalle.cantidad_entregada;
                                                        if (pendiente > 0) {
                                                            autoFill[detalle.id] = pendiente;
                                                        }
                                                    });
                                                    setCantidadesEntrega(autoFill);
                                                }}
                                            >
                                                📦 Entrega Total
                                            </Boton>
                                            <div className="flex gap-3">
                                                <Boton tipo="secondary" onClick={() => setCantidadesEntrega({})}>
                                                    Limpiar
                                                </Boton>
                                                <Boton tipo="accent" onClick={handleEntregaParcial}>
                                                    Confirmar Entrega
                                                </Boton>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        <div className="p-4 border-t border-[var(--border-light)] bg-[var(--bg-primary)] flex justify-end gap-2 rounded-b-xl flex-shrink-0">
                            <Boton onClick={() => setShowModal(false)} tipo="primary">Cerrar</Boton>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Pagar Cuota */}
            {showPagoModal && selectedCuota && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-[var(--bg-secondary)] rounded-xl shadow-2xl w-full max-w-sm border border-[var(--border-light)] transform transition-all">
                        <div className="p-4 border-b border-[var(--border-light)] flex justify-between items-center bg-[var(--bg-primary)] rounded-t-xl">
                            <h3 className="font-bold text-[var(--text-primary)]">Pagar Cuota #{selectedCuota.numero_cuota}</h3>
                            <button onClick={closePagoModal} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">×</button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="text-center">
                                <p className="text-sm text-[var(--text-secondary)] uppercase tracking-wide font-bold mb-2">Monto a abonar</p>
                                <p className="text-4xl font-extrabold text-[var(--color-success)]">${parseFloat(selectedCuota.monto).toLocaleString('es-AR')}</p>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 uppercase">Medio de Pago</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['EFECTIVO', 'TRANSFERENCIA', 'DEBITO', 'CHEQUE'].map(m => ( // Simple methods for now
                                        <button 
                                            key={m}
                                            onClick={() => setMedioPagoCuota(m)}
                                            className={`py-2.5 text-xs font-bold rounded-lg border transition-all ${
                                                medioPagoCuota === m 
                                                ? 'bg-[var(--color-primary-light)] border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] shadow-sm' 
                                                : 'bg-white border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)]'
                                            }`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="pt-2">
                                <Boton 
                                    tipo="accent" 
                                    onClick={handlePagarCuota}
                                    disabled={isProcessingPago}
                                    className="w-full justify-center py-3 text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                                >
                                    {isProcessingPago ? 'Procesando...' : 'Confirmar Pago'}
                                </Boton>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Interes (Info Only) */}
            {showInteresModal && selectedVenta && (
                <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
                        <h3 className="font-bold text-lg mb-4 text-slate-800">Detalle de Financiación</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Monto Original:</span>
                                <span className="font-bold">${(parseFloat(selectedVenta.total) - parseFloat(selectedVenta.interes_aplicado || 0)).toLocaleString('es-AR')}</span>
                            </div>
                            <div className="flex justify-between text-indigo-600">
                                <span>Interés Aplicado:</span>
                                <span className="font-bold">+${parseFloat(selectedVenta.interes_aplicado || 0).toLocaleString('es-AR')}</span>
                            </div>
                            <div className="border-t pt-2 mt-2 flex justify-between text-lg font-bold">
                                <span>Total Final:</span>
                                <span>${parseFloat(selectedVenta.total).toLocaleString('es-AR')}</span>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <Boton onClick={() => setShowInteresModal(false)} tipo="secondary">Cerrar</Boton>
                        </div>
                    </div>
                </div>
            )}
        </LayoutPrincipal>
    );
}
