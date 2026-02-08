'use client';
import { useState, useEffect } from 'react';
import LayoutPrincipal from '@/components/LayoutPrincipal';
import Boton from '@/components/Boton';
import Input from '@/components/Input';
import { useCotizacion } from '@/context/CotizacionContext';
import { useToast } from '@/context/ToastContext';
import { BanknotesIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

export default function ConfiguracionPage() {
  const { cotizacion, updateCotizacion, refreshCotizacion } = useCotizacion();
  const { showToast } = useToast();
  
  const [localRate, setLocalRate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Populate with current context value
    if (cotizacion) setLocalRate(cotizacion.toString());
  }, [cotizacion]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
        const success = await updateCotizacion(localRate);
        if (success) {
            showToast('Cotización actualizada', 'success');
        } else {
            showToast('Error al actualizar cotización', 'error');
        }
    } catch (error) {
        console.error(error);
        showToast('Error inesperado', 'error');
    } finally {
        setSaving(false);
    }
  };

  return (
    <LayoutPrincipal>
        <div className="flex items-center gap-3 mb-6">
            <Cog6ToothIcon className="w-8 h-8 text-slate-400" />
            <h1 className="text-2xl font-bold text-slate-800">Configuración General</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tarjeta Cotizacion */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <BanknotesIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Cotización Dólar</h2>
                        <p className="text-xs text-slate-500">Valor de referencia para conversión a Pesos</p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-slate-700">Valor Actual (1 USD = X ARS)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">$</span>
                            <input 
                                type="number" 
                                step="0.01"
                                className="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                value={localRate}
                                onChange={(e) => setLocalRate(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Boton onClick={refreshCotizacion} tipo="ghost" type="button">Cancelar</Boton>
                        <Boton loading={saving} tipo="primary" type="submit">Guardar Cambios</Boton>
                    </div>
                </form>
            </div>

            {/* Placeholder for other settings */}
            <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                <p className="text-sm">Más configuraciones próximamente...</p>
            </div>
        </div>
    </LayoutPrincipal>
  );
}
