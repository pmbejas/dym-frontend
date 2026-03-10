'use client';
import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import Boton from '@/components/Boton';
import Tabla from '@/components/Tabla';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { PrinterIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { generarReportePendientesPDF } from '@/utils/pdfGenerator';

export default function ModalEntregasPendientes({ onClose }) {
  const [pendientes, setPendientes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchPendientes();
  }, []);

  const fetchPendientes = async () => {
    try {
      const { data } = await api.get('/dashboard/pendientes');
      setPendientes(data);
    } catch (error) {
      console.error(error);
      showToast('Error cargando entregas pendientes', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    if (pendientes.length === 0) return;
    try {
        console.log("Generando PDF con:", pendientes);
      generarReportePendientesPDF(pendientes);
      showToast('Generando reporte PDF...', 'info');
    } catch (error) {
      console.error(error);
      showToast('Error generando PDF', 'error');
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Entregas Pendientes de Despacho" maxWidth="max-w-5xl">
      <div className="space-y-4">
        {/* Actions Bar */}
        <div className="flex justify-end gap-2">
            <Boton onClick={handlePrint} disabled={isLoading || pendientes.length === 0} className="bg-pastel-primary text-white flex items-center gap-2">
                <PrinterIcon className="w-4 h-4" />
                Imprimir Listado
            </Boton>
            <Boton onClick={onClose} className="bg-gray-100 text-gray-600 hover:bg-gray-200">
                Cerrar
            </Boton>
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-h-[60vh] border rounded-lg">
          <Tabla
            columnas={[
                { header: 'Fecha', accessor: 'fecha', className: 'w-24 text-center', render: (item) => new Date(item.VentaCabecera?.fecha).toLocaleDateString('es-AR') },
                { header: 'Cliente', accessor: 'cliente', className: 'min-w-[150px]', render: (item) => (
                    <div className="truncate max-w-[200px]" title={item.VentaCabecera?.Cliente ? `${item.VentaCabecera.Cliente.apellido}, ${item.VentaCabecera.Cliente.nombre}` : 'Consumidor Final'}>
                        {item.VentaCabecera?.Cliente ? `${item.VentaCabecera.Cliente.apellido}, ${item.VentaCabecera.Cliente.nombre}` : 'Consumidor Final'}
                    </div>
                )},
                { header: 'Producto', accessor: 'producto', className: 'min-w-[200px]', render: (item) => (
                    <div className="truncate max-w-[250px]" title={item.Producto?.nombre}>
                        {item.Producto?.nombre}
                    </div>
                )},
                { header: 'SKU', accessor: 'sku', className: 'w-24 text-center text-gray-500 text-xs', render: (item) => item.Producto?.sku },
                { header: 'Pendiente', accessor: 'pendiente', className: 'w-24 text-center font-bold text-orange-500', render: (item) => parseFloat(item.cantidad) - parseFloat(item.cantidad_entregada) },
                { header: 'Stock', accessor: 'stock', className: 'w-20 text-center font-medium text-gray-600', render: (item) => item.Producto?.stock_actual }
            ]}
            datos={pendientes}
            emptyMessage="No hay productos pendientes de entrega."
            isLoading={isLoading}
          />
        </div>
        
        <div className="text-xs text-gray-400 text-right">
            Total ítems pendientes: {pendientes.length}
        </div>
      </div>
    </Modal>
  );
}
