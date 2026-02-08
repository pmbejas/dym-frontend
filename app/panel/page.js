'use client';
import LayoutPrincipal from '@/components/LayoutPrincipal';
import Tarjeta from '@/components/Tarjeta';
import { CurrencyDollarIcon, ShoppingCartIcon, UsersIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';

const StatsCard = ({ title, value, icon: Icon, color, trend }) => (
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
    {trend && (
      <div className="mt-4 flex items-center gap-2 text-sm">
        <span className="text-green-500 font-medium">{trend}</span>
        <span className="text-gray-400">vs mes anterior</span>
      </div>
    )}
  </Tarjeta>
);

export default function PanelPage() {
  return (
    <LayoutPrincipal>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-pastel-text">Panel de Control</h2>
          <p className="text-gray-400">Resumen general de tu negocio</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard 
            title="Ventas del Mes" 
            value="$ 1.250.000" 
            icon={CurrencyDollarIcon} 
            color="text-pastel-primary"
            trend="+12%"
          />
          <StatsCard 
            title="Pedidos Nuevos" 
            value="45" 
            icon={ShoppingCartIcon} 
            color="text-pastel-secondary"
            trend="+5%"
          />
          <StatsCard 
            title="Clientes Activos" 
            value="128" 
            icon={UsersIcon} 
            color="text-blue-400"
            trend="+2"
          />
          <StatsCard 
            title="Productos en Stock" 
            value="1,402" 
            icon={ArchiveBoxIcon} 
            color="text-pastel-accent"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tarjeta title="Ventas Recientes">
              <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg">
                Gráfico de Ventas (Próximamente chart.js)
              </div>
            </Tarjeta>
          </div>
          <div>
            <Tarjeta title="Bajo Stock" action={<a href="/stock" className="text-sm text-pastel-primary">Ver todo</a>}>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center">
                        <ArchiveBoxIcon className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Producto {i}</p>
                        <p className="text-xs text-red-400 font-medium">Queda: 2 u.</p>
                      </div>
                    </div>
                    <span className="text-xs bg-red-100 text-red-500 px-2 py-1 rounded-full">Alerta</span>
                  </div>
                ))}
              </div>
            </Tarjeta>
          </div>
        </div>
      </div>
    </LayoutPrincipal>
  );
}
