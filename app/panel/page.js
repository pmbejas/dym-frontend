'use client';
import { useEffect, useState } from 'react';
import LayoutPrincipal from '@/components/LayoutPrincipal';
import Tarjeta from '@/components/Tarjeta';
import api from '@/services/api';
import Boton from '@/components/Boton';
import ModalEntregasPendientes from './ModalEntregasPendientes';
import { 
  CurrencyDollarIcon, 
  ShoppingCartIcon, 
  ArchiveBoxIcon, 
  TagIcon,
  TruckIcon
} from '@heroicons/react/24/outline';

const StatsCard = ({ title, value, icon: Icon, color, subtext }) => (
  <Tarjeta className="relative overflow-hidden group hover:shadow-md transition-all duration-300">
    <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
       <Icon className="w-24 h-24" />
    </div>
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color.replace('text-', 'bg-').replace('500', '100')} ${color}`}>
        <Icon className="w-8 h-8" />
      </div>
      <div>
        <p className="text-sm text-gray-400 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-700">{value}</p>
      </div>
    </div>
    {subtext && (
      <div className="mt-4 flex items-center gap-2 text-sm">
        <span className="text-gray-400">{subtext}</span>
      </div>
    )}
  </Tarjeta>
);

export default function PanelPage() {
  const [data, setData] = useState({
    stats: { ventasMes: 0, productosVendidosMes: 0 },
    ultimasVentas: [],
    ultimasCompras: [],
    topProductos: []
  });
  const [loading, setLoading] = useState(true);
  const [showPendientesModal, setShowPendientesModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/dashboard/summary');
        setData(response.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <LayoutPrincipal>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pastel-primary"></div>
        </div>
      </LayoutPrincipal>
    );
  }

  return (
    <LayoutPrincipal>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-pastel-text">Panel de Control</h2>
            <div className="flex items-center gap-4">
                <p className="text-gray-400">Resumen general de tu negocio</p>
                <button 
                    onClick={() => setShowPendientesModal(true)}
                    className="text-xs font-medium text-orange-500 bg-orange-50 px-2 py-1 rounded-md hover:bg-orange-100 flex items-center gap-1 transition-colors"
                >
                    <TruckIcon className="w-4 h-4" />
                    Ver Entregas Pendientes
                </button>
            </div>
          </div>
          
          {/* Stats Widget Compacto en el header */}
          <div className="flex gap-4">
             {/* Productos Vendidos */}
             <div className="bg-white px-5 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                <div className="p-1.5 bg-rose-100 rounded-lg text-rose-500">
                   <TagIcon className="w-5 h-5" />
                </div>
                <div>
                   <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Prod. Vendidos</p>
                   <p className="text-lg font-bold text-gray-700">{data.stats.productosVendidosMes || 0}</p>
                </div>
             </div>
             
             {/* Ventas del Mes */}
             <div className="bg-white px-5 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-500">
                   <ShoppingCartIcon className="w-5 h-5" />
                </div>
                <div>
                   <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Ventas Mes</p>
                   <p className="text-lg font-bold text-gray-700">{data.stats.ventasMes}</p>
                </div>
             </div>
          </div>
        </div>

        {/* Modal Entregas Pendientes */}
        {showPendientesModal && (
            <ModalEntregasPendientes onClose={() => setShowPendientesModal(false)} />
        )}

        {/* Grid de 2 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Bloque 1: Top Productos (Arriba Izquierda) - Tono Rosa */}
          <div className="bg-rose-50/50 rounded-xl border border-rose-100 p-1">
            <Tarjeta title="Top Productos" className="h-full bg-white/80 backdrop-blur-sm shadow-none" action={<a href="/productos" className="text-xs text-rose-500 hover:text-rose-700 font-medium">Inventario</a>}>
              <div className="space-y-2">
                {data.topProductos.length > 0 ? (
                  data.topProductos.map((item, index) => (
                    <div key={item.id_producto} className="flex items-center justify-between p-2 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs ${
                          index === 0 ? 'bg-yellow-100 text-yellow-600' :
                          index === 1 ? 'bg-gray-200 text-gray-600' :
                          index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-rose-100 text-rose-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-700 truncate" title={item.Producto?.nombre}>
                            {item.Producto?.nombre || 'Desconocido'}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate">{item.Producto?.sku}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <span className="block text-xs font-bold text-rose-500">{item.total_vendido}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-gray-400">
                    Sin datos
                  </div>
                )}
              </div>
            </Tarjeta>
          </div>

          {/* Bloque 2: Últimas Ventas (Arriba Derecha) - Tono Verde */}
          <div className="bg-emerald-50/50 rounded-xl border border-emerald-100 p-1">
            <Tarjeta title="Últimas 5 Ventas" className="h-full bg-white/80 backdrop-blur-sm shadow-none" action={<a href="/ventas" className="text-xs text-emerald-500 hover:text-emerald-700 font-medium">Ver todas</a>}>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-emerald-50/50 text-emerald-600">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium rounded-l-lg">Fecha</th>
                      <th className="px-3 py-2 text-left font-medium">Cliente</th>
                      <th className="px-3 py-2 text-right font-medium rounded-r-lg">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-50">
                    {data.ultimasVentas.length > 0 ? (
                      data.ultimasVentas.map((venta) => (
                        <tr key={venta.id} className="hover:bg-emerald-50/30 transition-colors">
                          <td className="px-3 py-2 text-gray-600 truncate max-w-[70px]">
                            {new Date(venta.fecha).toLocaleDateString('es-AR', {day: '2-digit', month: '2-digit', year: '2-digit'})}
                          </td>
                          <td className="px-3 py-2 text-gray-800 font-medium truncate max-w-[120px]" title={venta.Cliente ? `${venta.Cliente.apellido}, ${venta.Cliente.nombre}` : 'Consumidor Final'}>
                            {venta.Cliente ? `${venta.Cliente.apellido} ${venta.Cliente.nombre}` : 'Consumidor Final'}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-800 font-bold whitespace-nowrap">
                            {venta.moneda === 'USD' ? 'USD' : '$'}{parseFloat(venta.total).toLocaleString('es-AR')}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="px-4 py-8 text-center text-gray-400">Sin datos</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Tarjeta>
          </div>

          {/* Bloque 3: Últimas Compras (Abajo Izquierda) - Tono Azul */}
          <div className="bg-sky-50/50 rounded-xl border border-sky-100 p-1">
            <Tarjeta title="Últimas 5 Compras" className="h-full bg-white/80 backdrop-blur-sm shadow-none" action={<a href="/compras" className="text-xs text-sky-500 hover:text-sky-700 font-medium">Ver todas</a>}>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-sky-50/50 text-sky-600">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium rounded-l-lg">Fecha</th>
                      <th className="px-3 py-2 text-left font-medium">Proveedor</th>
                      <th className="px-3 py-2 text-right font-medium rounded-r-lg">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sky-50">
                    {data.ultimasCompras.length > 0 ? (
                      data.ultimasCompras.map((compra) => (
                        <tr key={compra.id} className="hover:bg-sky-50/30 transition-colors">
                          <td className="px-3 py-2 text-gray-600 truncate max-w-[70px]">
                            {new Date(compra.fecha).toLocaleDateString('es-AR', {day: '2-digit', month: '2-digit', year: '2-digit'})}
                          </td>
                          <td className="px-3 py-2 text-gray-800 font-medium truncate max-w-[120px]" title={compra.Proveedor?.razon_social}>
                            {compra.Proveedor?.razon_social || '-'}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-800 font-bold whitespace-nowrap">
                            {compra.moneda === 'USD' ? 'USD' : '$'}{parseFloat(compra.total).toLocaleString('es-AR')}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="px-4 py-8 text-center text-gray-400">Sin datos</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Tarjeta>
          </div>

          {/* Bloque 4: Espacio vacío (Abajo Derecha) */}
          <div className="flex items-center justify-center border-2 border-dashed border-gray-100 rounded-xl min-h-[200px] text-gray-300">
            <div className="text-center">
                <ArchiveBoxIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-xs font-medium">Espacio Disponible</p>
            </div>
          </div>

        </div>
      </div>
    </LayoutPrincipal>
  );
}
