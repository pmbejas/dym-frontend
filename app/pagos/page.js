'use client';
import LayoutPrincipal from '@/components/LayoutPrincipal';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function PagosPage() {
  return (
    <LayoutPrincipal>
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 max-w-2xl text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-amber-900 mb-3">
            Módulo en Desarrollo
          </h2>
          <p className="text-amber-700 mb-4">
            El módulo de Cuentas Corrientes y Pagos/Cobros está actualmente en desarrollo.
          </p>
          <div className="bg-white rounded-lg p-4 text-left text-sm text-slate-600">
            <p className="font-semibold mb-2">Funcionalidades disponibles actualmente:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Registro de pagos en Ventas (módulo Ventas)</li>
              <li>Registro de pagos en Compras (módulo Compras)</li>
              <li>Historial de pagos en detalle de cada venta/compra</li>
            </ul>
          </div>
        </div>
      </div>
    </LayoutPrincipal>
  );
}
