'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LayoutPrincipal from '@/components/LayoutPrincipal';
import Boton from '@/components/Boton';
import Input from '@/components/Input';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function NuevaCompraPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cabecera
  const [idProveedor, setIdProveedor] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [numeroOrden, setNumeroOrden] = useState('');
  
  // Detalles
  const [detalles, setDetalles] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [costoUnitario, setCostoUnitario] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resProveedores, resProductos] = await Promise.all([
          api.get('/proveedores', { params: { page: 1, limit: 1000, search: '' } }),
          api.get('/productos', { params: { page: 1, limit: 1000, search: '' } })
        ]);
        setProveedores(resProveedores.data?.data || resProveedores.data || []);
        setProductos(resProductos.data?.data || []);
      } catch (error) {
        console.error("Error loading data", error);
      }
    };
    fetchData();
  }, []);

  const agregarProducto = () => {
    if (!productoSeleccionado || costoUnitario <= 0) return;
    const producto = productos.find(p => p.id === parseInt(productoSeleccionado));
    if (!producto) return;
    
    // Check duplication
    const existe = detalles.find(d => d.id_producto === producto.id);
    if (existe) {
       setDetalles(detalles.map(d => d.id_producto === producto.id ? { ...d, cantidad: d.cantidad + parseInt(cantidad) } : d));
    } else {
       setDetalles([...detalles, {
         id_producto: producto.id,
         nombre: producto.nombre,
         cantidad: parseInt(cantidad),
         costo_unitario: parseFloat(costoUnitario),
         subtotal: parseInt(cantidad) * parseFloat(costoUnitario)
       }]);
    }
    setProductoSeleccionado('');
    setCantidad(1);
    setCostoUnitario(0);
  };

  const eliminarDetalle = (index) => {
    const nuevosDetalles = [...detalles];
    nuevosDetalles.splice(index, 1);
    setDetalles(nuevosDetalles);
  };

  const total = detalles.reduce((acc, curr) => acc + curr.subtotal, 0);

  const handleSubmit = async () => {
    if (!idProveedor || detalles.length === 0) {
      showToast('Seleccione un proveedor y al menos un producto', 'warning');
      return;
    }

    setLoading(true);
    try {
      await api.post('/compras', {
        id_proveedor: idProveedor,
        fecha,
        numero_orden: numeroOrden,
        items: detalles.map(d => ({ 
          id_producto: d.id_producto, 
          cantidad: d.cantidad,
          costo_unitario: d.costo_unitario 
        }))
      });
      showToast('Compra registrada correctamente', 'success');
      router.push('/compras');
    } catch (error) {
      console.error(error);
      showToast('No se pudo registrar la compra', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LayoutPrincipal>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Nueva Compra</h1>
          <p className="text-slate-500">Registrar ingreso de mercadería</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario Cabecera */}
          <div className="lg:col-span-1 space-y-4 bg-white p-5 rounded-xl shadow-sm border border-slate-200 h-fit">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Proveedor</label>
              <select 
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-700"
                value={idProveedor}
                onChange={(e) => setIdProveedor(e.target.value)}
              >
                <option value="">-- Seleccionar --</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.razon_social}</option>)}
              </select>
            </div>
            <Input label="Fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            <Input label="N° Orden (Opcional)" value={numeroOrden} onChange={(e) => setNumeroOrden(e.target.value)} />
            
            <div className="pt-4 border-t border-slate-100">
               <div className="flex justify-between items-center mb-2">
                 <span className="text-slate-500 font-medium">Total Estimado</span>
                 <span className="text-2xl font-bold text-slate-900">$ {total}</span>
               </div>
               <Boton onClick={handleSubmit} tipo="primary" className="w-full justify-center" disabled={loading}>
                 {loading ? 'Procesando...' : 'Finalizar Compra'}
               </Boton>
            </div>
          </div>

          {/* Detalles */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-700 mb-3">Agregar Productos</h3>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Producto</label>
                  <select 
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-700"
                    value={productoSeleccionado}
                    onChange={(e) => setProductoSeleccionado(e.target.value)}
                  >
                    <option value="">Seleccionar...</option>
                    {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>
                <div className="w-20">
                  <Input label="Cant" type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
                </div>
                <div className="w-24">
                  <Input label="Costo" type="number" min="0" step="0.01" value={costoUnitario} onChange={(e) => setCostoUnitario(e.target.value)} />
                </div>
                <Boton onClick={agregarProducto} tipo="secondary" className="mb-[1px]">
                  <PlusIcon className="w-5 h-5" />
                </Boton>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               <table className="w-full text-sm text-left">
                 <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                   <tr>
                     <th className="px-4 py-2">Producto</th>
                     <th className="px-4 py-2 text-center">Cant</th>
                     <th className="px-4 py-2 text-right">Costo Unit.</th>
                     <th className="px-4 py-2 text-right">Subtotal</th>
                     <th className="px-4 py-2"></th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {detalles.map((d, idx) => (
                     <tr key={idx}>
                       <td className="px-4 py-3">{d.nombre}</td>
                       <td className="px-4 py-3 text-center">{d.cantidad}</td>
                       <td className="px-4 py-3 text-right">$ {d.costo_unitario}</td>
                       <td className="px-4 py-3 text-right font-medium">$ {d.subtotal}</td>
                       <td className="px-4 py-3 text-right">
                         <button onClick={() => eliminarDetalle(idx)} className="text-red-400 hover:text-red-600">
                           <TrashIcon className="w-4 h-4" />
                         </button>
                       </td>
                     </tr>
                   ))}
                   {detalles.length === 0 && (
                     <tr>
                       <td colSpan="5" className="px-4 py-8 text-center text-slate-400">
                         Agrega productos a la compra
                       </td>
                     </tr>
                   )}
                 </tbody>
               </table>
            </div>
          </div>
        </div>
      </div>
    </LayoutPrincipal>
  );
}
