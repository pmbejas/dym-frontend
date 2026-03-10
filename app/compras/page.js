'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LayoutPrincipal from '@/components/LayoutPrincipal';
import Tabla from '@/components/Tabla';
import Boton from '@/components/Boton';
import { getCompras } from '@/services/api';
import { PlusIcon, EyeIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { generarListadoComprasPDF } from '@/utils/pdfGenerator';

export default function ComprasPage() {
    const router = useRouter();
    const [compras, setCompras] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filtro, setFiltro] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');
    const [filtroPago, setFiltroPago] = useState('');
    const [filtroRecepcion, setFiltroRecepcion] = useState('');

    useEffect(() => {
        cargarCompras();
    }, []);

    const cargarCompras = async () => {
        try {
            setIsLoading(true);
            const data = await getCompras();
            setCompras(data);
        } catch (error) {
            console.error('Error al cargar compras:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const columnas = [
        { header: 'Fecha', accessor: 'fecha', render: (row) => new Date(row.fecha).toLocaleDateString('es-AR') },
        { header: 'Proveedor', accessor: 'Proveedor.razon_social', render: (row) => row.Proveedor?.razon_social || '-' },
        { header: 'Orden', accessor: 'numero_orden', className: 'w-24', render: (row) => (
            <span className="text-xs text-[var(--text-muted)]">{row.numero_orden || `#${row.id}`}</span>
        )},
        { header: 'Total', accessor: 'total', className: 'text-right font-semibold', render: (row) => (
            <span className="text-sm">{row.moneda === 'USD' ? 'USD ' : '$'}{parseFloat(row.total).toLocaleString('es-AR')}</span>
        )},
        { header: 'Estado', accessor: 'estado', className: 'w-24 text-center', render: (row) => (
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                row.estado === 'CONFIRMADA' ? 'bg-blue-50 text-blue-600' :
                row.estado === 'RECIBIDA' ? 'bg-emerald-50 text-emerald-600' :
                row.estado === 'CANCELADA' ? 'bg-red-50 text-red-600' :
                'bg-gray-50 text-gray-600'
            }`}>
                {row.estado === 'PENDIENTE' ? 'BORRADOR' : row.estado}
            </span>
        )},
        { header: 'Pago', accessor: 'estado_pago', className: 'w-24 text-left', render: (row) => (
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                row.estado_pago === 'PAGADO' ? 'bg-green-50 text-green-700' :
                row.estado_pago === 'PARCIAL' ? 'bg-amber-50 text-amber-700' :
                'bg-red-50 text-red-700'
            }`}>
                {row.estado_pago}
            </span>
        )},
        { header: 'Recepción', accessor: 'estado_recepcion', className: 'w-24 text-left', render: (row) => (
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                row.estado_recepcion === 'RECIBIDA' ? 'bg-emerald-50 text-emerald-700' :
                row.estado_recepcion === 'PARCIAL' ? 'bg-blue-50 text-blue-700' :
                'bg-red-50 text-red-700'
            }`}>
                {row.estado_recepcion}
            </span>
        )},
        { header: '', accessor: 'id', className: 'text-center w-10', render: (row) => (
            <button 
                onClick={() => router.push(`/compras/${row.id}`)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--color-brand-primary)] transition-colors flex items-center justify-center"
                title="Ver Detalle"
            >
                <EyeIcon className="w-4 h-4" />
            </button>
        )}
    ];

    const comprasFiltradas = compras.filter(c => {
        const matchesText = 
            c.Proveedor?.razon_social?.toLowerCase().includes(filtro.toLowerCase()) ||
            c.numero_orden?.toLowerCase().includes(filtro.toLowerCase()) ||
            c.id.toString().includes(filtro);
        
        const matchesEstado = filtroEstado ? c.estado === filtroEstado : true;
        const matchesPago = filtroPago ? c.estado_pago === filtroPago : true;
        const matchesRecepcion = filtroRecepcion ? c.estado_recepcion === filtroRecepcion : true;

        return matchesText && matchesEstado && matchesPago && matchesRecepcion;
    });

    return (
        <LayoutPrincipal>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-lg font-bold text-[var(--text-primary)]">Compras</h1>
                        <p className="text-xs text-[var(--text-secondary)]">Gestión de ordenes de compra</p>
                    </div>
                    <div className="flex gap-2">
                        <Boton 
                            onClick={() => generarListadoComprasPDF(comprasFiltradas, { 
                                filtro, 
                                estado: filtroEstado, 
                                pago: filtroPago, 
                                recepcion: filtroRecepcion 
                            })} 
                            tipo="secondary" 
                            className="py-1.5 flex items-center"
                            title="Exportar Listado a PDF"
                        >
                            <PrinterIcon className="w-4 h-4 mr-1.5" />
                            PDF
                        </Boton>
                        <Boton onClick={() => router.push('/compras/nueva')} tipo="primary" className="py-1.5 flex items-center">
                            <PlusIcon className="w-4 h-4 mr-1.5" />
                            Nueva Compra
                        </Boton>
                    </div>
                </div>

                <div className="bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border-light)]">
                    <div className="flex flex-col md:flex-row gap-2">
                        <div className="flex-1">
                            <input 
                                type="text"
                                placeholder="Buscar por proveedor, orden o ID..."
                                className="w-full px-3 py-1.5 text-sm bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg focus:ring-1 focus:ring-[var(--color-brand-primary)] focus:border-transparent outline-none transition-all"
                                value={filtro}
                                onChange={(e) => setFiltro(e.target.value)}
                            />
                        </div>
                        <select
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value)}
                            className="w-full md:w-auto px-2 py-1.5 text-xs bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none text-[var(--text-secondary)] font-medium cursor-pointer hover:border-[var(--color-brand-primary)] transition-colors"
                        >
                            <option value="">📋 Estado: Todos</option>
                            <option value="PENDIENTE">Borrador</option>
                            <option value="CONFIRMADA">Confirmada</option>
                            <option value="RECIBIDA">Recibida</option>
                            <option value="CANCELADA">Cancelada</option>
                        </select>
                        <select
                            value={filtroPago}
                            onChange={(e) => setFiltroPago(e.target.value)}
                            className="w-full md:w-auto px-2 py-1.5 text-xs bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none text-[var(--text-secondary)] font-medium cursor-pointer hover:border-[var(--color-brand-primary)] transition-colors"
                        >
                            <option value="">💰 Pago: Todos</option>
                            <option value="PENDIENTE">Pendiente</option>
                            <option value="PARCIAL">Parcial</option>
                            <option value="PAGADO">Pagado</option>
                        </select>
                        <select
                            value={filtroRecepcion}
                            onChange={(e) => setFiltroRecepcion(e.target.value)}
                            className="w-full md:w-auto px-2 py-1.5 text-xs bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none text-[var(--text-secondary)] font-medium cursor-pointer hover:border-[var(--color-brand-primary)] transition-colors"
                        >
                            <option value="">📦 Recepción: Todos</option>
                            <option value="PENDIENTE">Pendiente</option>
                            <option value="PARCIAL">Parcial</option>
                            <option value="RECIBIDA">Recibida</option>
                        </select>
                    </div>
                </div>

                <Tabla 
                    datos={comprasFiltradas} 
                    columnas={columnas} 
                />
            </div>
        </LayoutPrincipal>
    );
}
