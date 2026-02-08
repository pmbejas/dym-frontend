'use client';
import LayoutPrincipal from '@/components/LayoutPrincipal';
import { ChartBarIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

export default function ReportesPage() {
  return (
    <LayoutPrincipal>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reportes de Productos</h1>
          <p className="text-slate-500">Análisis y estadísticas de inventario</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
           <WrenchScrewdriverIcon className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Sección en Construcción</h2>
        <p className="text-slate-500 max-w-md">
          Estamos trabajando en un panel de reportes avanzado para que puedas visualizar el rendimiento de tu inventario.
        </p>
        <button className="mt-6 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-medium hover:bg-indigo-100 transition-colors">
          Volver al Panel
        </button>
      </div>
    </LayoutPrincipal>
  );
}
