'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LayoutPrincipal from '@/components/LayoutPrincipal';
import Tabla from '@/components/Tabla';
import Boton from '@/components/Boton';
import { getCompras } from '@/services/api';
import { PlusIcon, EyeIcon } from '@heroicons/react/24/outline';

export default function ComprasPage() {
    const router = useRouter();
    const [compras, setCompras] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filtro, setFiltro] = useState('');

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
        { header: 'Orden #', accessor: 'numero_orden', render: (row) => row.numero_orden || `ID: ${row.id}` },
        { header: 'Total', accessor: 'total', className: 'text-right font-bold', render: (row) => (
            <span>{row.moneda === 'USD' ? 'USD ' : '$'}{parseFloat(row.total).toLocaleString('es-AR')}</span>
        )},
        { header: 'Pago', accessor: 'estado_pago', className: 'text-center', render: (row) => (
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                row.estado_pago === 'PAGADO' ? 'bg-green-100 text-green-700' :
                row.estado_pago === 'PARCIAL' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
            }`}>
                {row.estado_pago}
            </span>
        )},
        { header: 'Recepción', accessor: 'estado_recepcion', className: 'text-center', render: (row) => (
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                row.estado_recepcion === 'RECIBIDA' ? 'bg-emerald-100 text-emerald-700' :
                row.estado_recepcion === 'PARCIAL' ? 'bg-blue-100 text-blue-700' :
                'bg-red-100 text-red-700'
            }`}>
                {row.estado_recepcion}
            </span>
        )},
        { header: 'Acciones', accessor: 'id', className: 'text-center', render: (row) => (
            <div className="flex justify-center gap-2">
                <button 
                    onClick={() => router.push(`/compras/${row.id}`)}
                    className="p-1.5 text-[var(--text-muted)] hover:text-[var(--color-brand-primary)] transition-colors"
                    title="Ver Detalle"
                >
                    <EyeIcon className="w-5 h-5" />
                </button>
            </div>
        )}
    ];

    const comprasFiltradas = compras.filter(c => 
        c.Proveedor?.razon_social?.toLowerCase().includes(filtro.toLowerCase()) ||
        c.numero_orden?.toLowerCase().includes(filtro.toLowerCase()) ||
        c.id.toString().includes(filtro)
    );

    return (
        <LayoutPrincipal>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Compras</h1>
                        <p className="text-sm text-[var(--text-secondary)]">Gestión de ordenes de compra y proveedores</p>
                    </div>
                    <Boton onClick={() => router.push('/compras/nueva')} tipo="primary">
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Nueva Compra
                    </Boton>
                </div>

                <div className="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-light)]">
                    <input 
                        type="text"
                        placeholder="Buscar por proveedor, orden o ID..."
                        className="w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:border-transparent outline-none transition-all"
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                    />
                </div>

                <Tabla 
                    datos={comprasFiltradas} 
                    columnas={columnas} 
                />
            </div>
        </LayoutPrincipal>
    );
}
