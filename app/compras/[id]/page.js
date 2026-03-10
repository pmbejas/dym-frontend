'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import LayoutPrincipal from '@/components/LayoutPrincipal';
import Boton from '@/components/Boton';
import { getCompraById, registrarRecepcion, registrarPagoCompra, confirmarCompra } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { ArrowLeftIcon, CheckCircleIcon, BanknotesIcon, PencilSquareIcon, LockClosedIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { generarDetalleCompraPDF } from '@/utils/pdfGenerator';

export default function DetalleCompraPage({ params }) {
    const router = useRouter();
    const { id } = use(params);
    const { showToast } = useToast();
    
    const [compra, setCompra] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('detalle'); 

    // Reception State
    const [showRecepcionModal, setShowRecepcionModal] = useState(false);
    const [recepcionItems, setRecepcionItems] = useState({}); 

    // Payment State
    const [showPagoModal, setShowPagoModal] = useState(false);
    const [montoPago, setMontoPago] = useState('');
    const [medioPago, setMedioPago] = useState('EFECTIVO');

    useEffect(() => {
        if (id) cargarCompra();
    }, [id]);

    const cargarCompra = async () => {
        try {
            setIsLoading(true);
            const data = await getCompraById(id);
            setCompra(data);
        } catch (error) {
            console.error('Error cargando compra:', error);
            showToast('Error al cargar la compra', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmarCompra = async () => {
        if (!confirm('¿Está seguro de CONFIRMAR esta compra? No podrá editarla después.')) return;
        
        try {
            await confirmarCompra(id);
            showToast('Compra confirmada correctamente', 'success');
            cargarCompra();
        } catch (error) {
            console.error('Error confirmando compra:', error);
            showToast('Error al confirmar la compra', 'error');
        }
    };

    const handleRecepcionChange = (idDetalle, valor) => {
        setRecepcionItems(prev => ({
            ...prev,
            [idDetalle]: valor
        }));
    };

    const submitRecepcion = async () => {
        const detalles = Object.entries(recepcionItems)
            .filter(([_, cant]) => parseFloat(cant) > 0)
            .map(([idDetalle, cant]) => ({
                id_detalle: idDetalle,
                cantidad: parseFloat(cant)
            }));
        
        if (detalles.length === 0) {
            showToast('Ingrese al menos una cantidad a recibir', 'warning');
            return;
        }

        try {
            await registrarRecepcion(id, { detalles });
            showToast('Recepción registrada correctamente', 'success');
            setShowRecepcionModal(false);
            setRecepcionItems({});
            cargarCompra(); 
        } catch (error) {
            console.error('Error registrando recepción:', error);
            showToast('Error al registrar recepción', 'error');
        }
    };

    const submitPago = async () => {
        if (!montoPago || parseFloat(montoPago) <= 0) {
            showToast('Ingrese un monto válido', 'warning');
            return;
        }

        try {
            await registrarPagoCompra(id, {
                monto: parseFloat(montoPago),
                medio_pago: medioPago,
                moneda: compra.moneda
            });
            showToast('Pago registrado correctamente', 'success');
            setShowPagoModal(false);
            setMontoPago('');
            cargarCompra(); 
        } catch (error) {
            console.error('Error registrando pago:', error);
            showToast('Error al registrar pago', 'error');
        }
    };

    if (isLoading) return <LayoutPrincipal><div>Cargando...</div></LayoutPrincipal>;
    if (!compra) return <LayoutPrincipal><div>Compra no encontrada</div></LayoutPrincipal>;

    const isPendiente = compra.estado === 'PENDIENTE';
    const isConfirmada = ['CONFIRMADA', 'RECIBIDA', 'PARCIAL'].includes(compra.estado); // Assuming CONFIRMADA is a key state to allow actions

    // Helper logic: Can Pay/Receive if NOT Pendiente (and not Cancelled)
    const canManage = compra.estado !== 'PENDIENTE' && compra.estado !== 'CANCELADA';

    return (
        <LayoutPrincipal>
            <div className="space-y-4">
                {/* Compact Header */}
                <div className="bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border-light)]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => router.back()}
                                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                            >
                                <ArrowLeftIcon className="w-5 h-5" />
                            </button>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-base font-bold text-[var(--text-primary)]">
                                        {compra.numero_orden || `#${compra.id}`}
                                    </h1>
                                    <button
                                        onClick={() => generarDetalleCompraPDF(compra)}
                                        className="text-[var(--text-muted)] hover:text-[var(--color-brand-primary)] transition-colors ml-2"
                                        title="Descargar Orden de Compra"
                                    >
                                        <PrinterIcon className="w-5 h-5" />
                                    </button>
                                    {isPendiente && <span className="bg-gray-50 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-medium">BORRADOR</span>}
                                    {compra.estado === 'CONFIRMADA' && <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[10px] font-medium">CONFIRMADA</span>}
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                        compra.estado_pago === 'PAGADO' ? 'bg-green-50 text-green-700' : 
                                        compra.estado_pago === 'PARCIAL' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                                    }`}>
                                        Pago: {compra.estado_pago}
                                    </span>
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                        compra.estado_recepcion === 'RECIBIDA' ? 'bg-emerald-50 text-emerald-700' : 
                                        compra.estado_recepcion === 'PARCIAL' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
                                    }`}>
                                        Recepción: {compra.estado_recepcion}
                                    </span>
                                </div>
                                <p className="text-xs text-[var(--text-secondary)] mt-0.5">{compra.Proveedor?.razon_social}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="text-right mr-3">
                                <p className="text-[10px] text-[var(--text-muted)] uppercase font-medium">Total</p>
                                <p className="text-lg font-bold text-[var(--color-brand-primary)]">
                                    {compra.moneda} {parseFloat(compra.total).toLocaleString('es-AR', {minimumFractionDigits: 2})}
                                </p>
                            </div>
                            <div className="flex gap-1.5">
                                {isPendiente && (
                                    <>
                                        <Boton onClick={() => router.push(`/compras/${id}/editar`)} tipo="secondary" className="py-1.5 text-sm flex items-center">
                                            <PencilSquareIcon className="w-4 h-4 mr-1" />
                                            Editar
                                        </Boton>
                                        <Boton onClick={handleConfirmarCompra} tipo="primary" className="py-1.5 text-sm flex items-center">
                                            <LockClosedIcon className="w-4 h-4 mr-1" />
                                            Confirmar
                                        </Boton>
                                    </>
                                )}
                                {canManage && compra.estado_pago !== 'PAGADO' && (
                                    <Boton onClick={() => setShowPagoModal(true)} tipo="secondary" className="py-1.5 text-sm flex items-center">
                                        <BanknotesIcon className="w-4 h-4 mr-1" />
                                        Pago
                                    </Boton>
                                )}
                                {canManage && compra.estado_recepcion !== 'RECIBIDA' && (
                                    <Boton onClick={() => setShowRecepcionModal(true)} tipo="primary" className="py-1.5 text-sm flex items-center">
                                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                                        Recibir
                                    </Boton>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-[var(--border-light)]">
                    <nav className="-mb-px flex space-x-6">
                        <button
                            onClick={() => setActiveTab('detalle')}
                            className={`py-2 px-1 border-b-2 font-medium text-xs ${
                                activeTab === 'detalle'
                                    ? 'border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]'
                                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            Productos
                        </button>
                        <button
                            onClick={() => setActiveTab('pagos')}
                            className={`py-2 px-1 border-b-2 font-medium text-xs ${
                                activeTab === 'pagos'
                                    ? 'border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]'
                                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            Pagos
                        </button>
                    </nav>
                </div>

                {/* Content */}
                {activeTab === 'detalle' && (
                    <div className="overflow-hidden border border-[var(--border-light)] rounded-lg">
                        <table className="w-full text-xs">
                            <thead className="bg-[var(--bg-primary)]">
                                <tr>
                                    <th className="px-3 py-2 text-left font-medium text-[var(--text-secondary)]">Producto</th>
                                    <th className="px-3 py-2 text-center font-medium text-[var(--text-secondary)]">Ordenada</th>
                                    <th className="px-3 py-2 text-center font-medium text-[var(--text-secondary)]">Recibida</th>
                                    <th className="px-3 py-2 text-center font-medium text-[var(--text-secondary)]">Pendiente</th>
                                    <th className="px-3 py-2 text-right font-medium text-[var(--text-secondary)]">Costo</th>
                                    <th className="px-3 py-2 text-right font-medium text-[var(--text-secondary)]">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-light)] bg-white">
                                {compra.CompraDetalles?.map((item) => {
                                    const pendiente = parseFloat(item.cantidad) - parseFloat(item.cantidad_recibida || 0);
                                    return (
                                        <tr key={item.id}>
                                            <td className="px-3 py-2">
                                                <p className="font-medium text-[var(--text-primary)]">{item.Producto?.nombre}</p>
                                                <p className="text-[10px] text-[var(--text-muted)]">{item.Producto?.sku}</p>
                                            </td>
                                            <td className="px-3 py-2 text-center text-[var(--text-secondary)]">{item.cantidad}</td>
                                            <td className="px-3 py-2 text-center font-semibold text-emerald-600">{item.cantidad_recibida || 0}</td>
                                            <td className="px-3 py-2 text-center font-semibold text-amber-600">{pendiente}</td>
                                            <td className="px-3 py-2 text-right text-[var(--text-secondary)]">${parseFloat(item.costo_unitario).toFixed(2)}</td>
                                            <td className="px-3 py-2 text-right font-semibold text-[var(--text-primary)]">
                                                ${(parseFloat(item.cantidad) * parseFloat(item.costo_unitario)).toFixed(2)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {activeTab === 'pagos' && (
                    <div className="space-y-4">
                        {/* Summary Card */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border-light)] text-center">
                                <p className="text-[10px] text-[var(--text-secondary)] uppercase font-bold">Total Compra</p>
                                <p className="text-base font-bold text-[var(--text-primary)]">
                                    {compra.moneda} {parseFloat(compra.total).toLocaleString('es-AR', {minimumFractionDigits: 2})}
                                </p>
                            </div>
                            <div className="bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border-light)] text-center">
                                <p className="text-[10px] text-[var(--text-secondary)] uppercase font-bold">Total Pagado</p>
                                <p className="text-base font-bold text-green-600">
                                    {compra.moneda} {compra.Pagos?.reduce((acc, p) => acc + parseFloat(p.monto), 0).toLocaleString('es-AR', {minimumFractionDigits: 2})}
                                </p>
                            </div>
                            <div className="bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border-light)] text-center">
                                <p className="text-[10px] text-[var(--text-secondary)] uppercase font-bold">Saldo Pendiente</p>
                                <p className="text-base font-bold text-red-600">
                                    {compra.moneda} {(parseFloat(compra.total) - compra.Pagos?.reduce((acc, p) => acc + parseFloat(p.monto), 0)).toLocaleString('es-AR', {minimumFractionDigits: 2})}
                                </p>
                            </div>
                        </div>

                        {/* Payments Table */}
                        <div className="overflow-hidden border border-[var(--border-light)] rounded-lg">
                            <table className="w-full text-xs">
                                <thead className="bg-[var(--bg-primary)]">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium text-[var(--text-secondary)]">Fecha</th>
                                        <th className="px-3 py-2 text-left font-medium text-[var(--text-secondary)]">Concepto / Medio</th>
                                        <th className="px-3 py-2 text-right font-medium text-[var(--text-secondary)]">Monto</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-light)] bg-white">
                                    {compra.Pagos && compra.Pagos.length > 0 ? (
                                        compra.Pagos.map((pago) => (
                                            <tr key={pago.id}>
                                                <td className="px-3 py-2 text-[var(--text-primary)]">
                                                    {new Date(pago.fecha).toLocaleDateString('es-AR')} <span className="text-[var(--text-muted)] text-[10px]">{new Date(pago.fecha).toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'})}</span>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <p className="font-medium text-[var(--text-primary)]">{pago.concepto}</p>
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                                        {pago.medio_pago}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-right font-bold text-green-600">
                                                    {compra.moneda} {parseFloat(pago.monto).toLocaleString('es-AR', {minimumFractionDigits: 2})}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="px-3 py-6 text-center text-[var(--text-muted)]">
                                                No se han registrado pagos
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Recepción */}
            {showRecepcionModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-[var(--bg-secondary)] rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
                        <div className="p-4 border-b border-[var(--border-light)] bg-[var(--bg-primary)]">
                            <h3 className="font-bold text-lg text-[var(--text-primary)]">Recibir Mercadería</h3>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            <p className="text-sm text-[var(--text-secondary)] mb-4">
                                Ingrese la cantidad que está recibiendo físicamente. El stock se actualizará automáticamente.
                            </p>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-[var(--text-muted)]">
                                        <th className="pb-2">Producto</th>
                                        <th className="pb-2 text-center">Pendiente</th>
                                        <th className="pb-2 text-right">A Recibir</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-light)]">
                                    {compra.CompraDetalles?.filter(d => parseFloat(d.cantidad) - parseFloat(d.cantidad_recibida || 0) > 0).map(item => {
                                        const pendiente = parseFloat(item.cantidad) - parseFloat(item.cantidad_recibida || 0);
                                        return (
                                            <tr key={item.id} className="group">
                                                <td className="py-3 pr-4">
                                                    <p className="font-medium text-[var(--text-primary)]">{item.Producto?.nombre}</p>
                                                </td>
                                                <td className="py-3 px-4 text-center font-medium text-[var(--text-secondary)]">{pendiente}</td>
                                                <td className="py-3 pl-4 text-right">
                                                    <input 
                                                        type="number"
                                                        min="0"
                                                        max={pendiente}
                                                        placeholder="0"
                                                        className="w-24 px-2 py-1 border border-[var(--border-color)] rounded text-right focus:border-[var(--color-brand-primary)] outline-none"
                                                        value={recepcionItems[item.id] || ''}
                                                        onChange={(e) => handleRecepcionChange(item.id, e.target.value)}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-[var(--border-light)] bg-[var(--bg-primary)] flex justify-end gap-3">
                            <Boton onClick={() => setShowRecepcionModal(false)} tipo="secondary">Cancelar</Boton>
                            <Boton onClick={submitRecepcion} tipo="primary">Confirmar Recepción</Boton>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Pago */}
            {showPagoModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-[var(--bg-secondary)] rounded-lg shadow-xl w-full max-w-sm">
                        <div className="p-4 border-b border-[var(--border-light)] bg-[var(--bg-primary)]">
                            <h3 className="font-bold text-lg text-[var(--text-primary)]">Registrar Pago</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Monto ({compra.moneda})</label>
                                <input 
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-[var(--border-color)] rounded focus:border-[var(--color-brand-primary)] outline-none"
                                    value={montoPago}
                                    onChange={(e) => setMontoPago(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Medio de Pago</label>
                                <select 
                                    className="w-full px-3 py-2 border border-[var(--border-color)] rounded focus:border-[var(--color-brand-primary)] outline-none"
                                    value={medioPago}
                                    onChange={(e) => setMedioPago(e.target.value)}
                                >
                                    <option value="EFECTIVO">Efectivo</option>
                                    <option value="TRANSFERENCIA">Transferencia</option>
                                    <option value="CHEQUE">Cheque</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-4 border-t border-[var(--border-light)] bg-[var(--bg-primary)] flex justify-end gap-3">
                            <Boton onClick={() => setShowPagoModal(false)} tipo="secondary">Cancelar</Boton>
                            <Boton onClick={submitPago} tipo="primary">Registrar Pago</Boton>
                        </div>
                    </div>
                </div>
            )}
        </LayoutPrincipal>
    );
}
