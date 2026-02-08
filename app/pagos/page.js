'use client';
import { useState, useEffect } from 'react';
import LayoutPrincipal from '@/components/LayoutPrincipal';
import Tabla from '@/components/Tabla';
import Boton from '@/components/Boton';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { BanknotesIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'; // Assumes you have BanknotesIcon, check imports in Sidebar

export default function PagosPage() {
  const { showToast } = useToast();
  const [movimientos, setMovimientos] = useState([]);
  const [entidadTipo, setEntidadTipo] = useState('cliente'); // 'cliente' or 'proveedor'
  const [entidadId, setEntidadId] = useState('');
  const [entidades, setEntidades] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  // Nuevo Movimiento Form
  const [formData, setFormData] = useState({
    id_entidad: '',
    tipo: 'cliente',
    monto: '',
    tipo_mov: 'PAGO', // PAGO, COBRO, FACTURA, NOTA_CREDITO
    referencia: ''
  });

  useEffect(() => {
    fetchEntidades();
  }, [entidadTipo]);

  const fetchEntidades = async () => {
    try {
      const endpoint = entidadTipo === 'cliente' ? '/clientes' : '/proveedores';
      const { data } = await api.get(endpoint);
      setEntidades(data);
    } catch (error) {
      console.error(error);
      setEntidades([]);
    }
  };

  const fetchCuentaCorriente = async () => {
    if (!entidadId) return;
    try {
      const endpoint = entidadTipo === 'cliente' 
        ? `/cc_clientes/${entidadId}` 
        : `/cc_proveedores/${entidadId}`;
      const { data } = await api.get(endpoint);
      setMovimientos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching CC", error);
      showToast('No se pudieron cargar los movimientos', 'error');
      setMovimientos([]);
    }
  };

  useEffect(() => {
    if (entidadId) fetchCuentaCorriente();
    else setMovimientos([]);
  }, [entidadId, entidadTipo]);

  const handleCreateMovimiento = async (e) => {
    e.preventDefault();
    try {
      const endpoint = formData.tipo === 'cliente' ? '/cc_clientes/movimiento' : '/cc_proveedores/movimiento';
      // Backend should handle generic movement creation or specific endpoints
      // Assuming a generic manual movement endpoint exists or using specific logic
      // Since backend is strict, we might need adjustments. Let's assume a generic route or adapt.
      // If backend only has auto-logic, we might need to create a specific "Payment" endpoint.
      // Let's try standard POST to the CC route if architected, otherwise we might need to use /ventas or /compras for invoices
      // But for Pure Payments (Cobros/Pagos), we need a route. 
      // I will assume POST /cc_{tipo} exists for manual adjustments/payments based on architectural standard.
      
      await api.post(endpoint, {
        id_entidad: formData.id_entidad,
        debe: formData.tipo_mov === 'FACTURA' ? formData.monto : 0, // Simplified logic
        haber: formData.tipo_mov === 'PAGO' || formData.tipo_mov === 'COBRO' ? formData.monto : 0,
        tipo_mov: formData.tipo_mov,
        concepto: formData.referencia
      });

      showToast('Movimiento registrado', 'success');
      setShowModal(false);
      if (entidadId === formData.id_entidad) fetchCuentaCorriente();
    } catch (error) {
      console.error(error);
      showToast('No se pudo registrar el movimiento', 'error');
    }
  };

  const columnas = [
    { header: 'Fecha', accessor: 'fecha', render: (row) => new Date(row.fecha).toLocaleDateString() },
    { header: 'Concepto / Ref', accessor: 'referencia_id', render: (row) => `${row.tipo_mov} #${row.referencia_id || '-'}` },
    { header: 'Debe', accessor: 'debe', render: (row) => row.debe > 0 ? <span className="text-red-600 font-medium">$ {row.debe}</span> : '-' },
    { header: 'Haber', accessor: 'haber', render: (row) => row.haber > 0 ? <span className="text-green-600 font-medium">$ {row.haber}</span> : '-' },
    { header: 'Saldo Acumulado', accessor: 'saldo_acumulado', render: (row) => <span className="font-bold text-slate-800">$ {row.saldo_acumulado}</span> },
  ];

  return (
    <LayoutPrincipal>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cuentas Corrientes</h1>
          <p className="text-slate-500">Gestiona cobros y pagos</p>
        </div>
        <Boton onClick={() => setShowModal(true)} tipo="primary" className="flex items-center gap-2">
          <BanknotesIcon className="w-5 h-5" /> Registrar Pago/Cobro
        </Boton>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Entidad</label>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                className={`flex-1 py-1 px-3 rounded-md text-sm font-medium transition-colors ${entidadTipo === 'cliente' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => { setEntidadTipo('cliente'); setEntidadId(''); }}
              >
                Clientes
              </button>
              <button 
                className={`flex-1 py-1 px-3 rounded-md text-sm font-medium transition-colors ${entidadTipo === 'proveedor' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => { setEntidadTipo('proveedor'); setEntidadId(''); }}
              >
                Proveedores
              </button>
            </div>
          </div>
          <div className="md:col-span-2">
             <label className="block text-sm font-medium text-slate-700 mb-1">Seleccionar {entidadTipo === 'cliente' ? 'Cliente' : 'Proveedor'}</label>
             <select 
               className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700"
               value={entidadId}
               onChange={(e) => setEntidadId(e.target.value)}
             >
               <option value="">-- Seleccionar --</option>
               {entidades.map(e => (
                 <option key={e.id} value={e.id}>
                   {entidadTipo === 'cliente' ? e.nombre : e.razon_social} ({entidadTipo === 'cliente' ? e.cuit_cuil : e.cuit})
                 </option>
               ))}
             </select>
          </div>
        </div>
      </div>

      <Tabla 
        columnas={columnas} 
        datos={movimientos} 
      />

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title="Registrar Movimiento"
      >
        <form onSubmit={handleCreateMovimiento} className="space-y-4">
           <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
             <select 
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-700"
                value={formData.tipo}
                onChange={(e) => {
                  setFormData({...formData, tipo: e.target.value, id_entidad: ''});
                  // Trigger fetch options if needed or relying on parent state logic
                }}
             >
               <option value="cliente">Cobro a Cliente</option>
               <option value="proveedor">Pago a Proveedor</option>
             </select>
           </div>

           <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Entidad</label>
             {/* Simple logic: fetch all entities of type or reuse generic select logic */}
             <select 
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-700"
                value={formData.id_entidad}
                onChange={(e) => setFormData({...formData, id_entidad: e.target.value})}
                required
             >
               <option value="">Seleccionar...</option>
               {/* Simplified: This assumes we fetched both or fetches on modal open. For now using current loaded entities if type matches, else empty */}
               {entidadTipo === formData.tipo && entidades.map(e => (
                 <option key={e.id} value={e.id}>
                   {formData.tipo === 'cliente' ? e.nombre : e.razon_social}
                 </option>
               ))}
             </select>
             {entidadTipo !== formData.tipo && <p className="text-xs text-orange-500 mt-1">Cambia el filtro principal a {formData.tipo} para ver la lista.</p>}
           </div>

           <Input 
             label="Monto" 
             name="monto" 
             type="number" 
             step="0.01"
             value={formData.monto} 
             onChange={(e) => setFormData({...formData, monto: e.target.value})} 
             required 
           />
           
           <Input 
             label="Referencia / Concepto" 
             name="referencia" 
             value={formData.referencia} 
             onChange={(e) => setFormData({...formData, referencia: e.target.value})} 
             placeholder="Ej: Pago parcial efectivo"
           />

           <div className="pt-4 flex justify-end gap-3">
             <Boton tipo="ghost" onClick={() => setShowModal(false)}>Cancelar</Boton>
             <Boton type="submit" tipo="primary">Registrar</Boton>
           </div>
        </form>
      </Modal>
    </LayoutPrincipal>
  );
}
