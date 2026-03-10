'use client';
import { useState, useEffect } from 'react';
import LayoutPrincipal from '@/components/LayoutPrincipal';
import Boton from '@/components/Boton';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
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

            {/* Validación de Documentos */}
            <DocumentValidation />
        </div>
    </LayoutPrincipal>
  );
}

function DocumentValidation() {
    const [token, setToken] = useState('');
    const [validating, setValidating] = useState(false);
    const [result, setResult] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const { showToast } = useToast();

    const handleValidate = async (e) => {
        e.preventDefault();
        if (!token.trim()) {
            showToast('Ingrese un código de validación', 'warning');
            return;
        }

        setValidating(true);
        setResult(null);

        try {
            // Try purchase first
            const { validatePurchase, validateSale } = await import('@/services/api');
            
            try {
                const purchaseRes = await validatePurchase(token);
                setResult(purchaseRes.data);
                setShowModal(true);
            } catch (purchaseError) {
                // If not a purchase, try sale
                try {
                    const saleRes = await validateSale(token);
                    setResult(saleRes.data);
                    setShowModal(true);
                } catch (saleError) {
                    setResult({ valid: false, message: 'Documento no encontrado' });
                    setShowModal(true);
                }
            }
        } catch (error) {
            console.error('Error validando:', error);
            showToast('Error al validar documento', 'error');
            setResult({ valid: false, message: 'Error de conexión' });
            setShowModal(true);
        } finally {
            setValidating(false);
        }
    };

    return (
        <>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Validación de Documentos</h2>
                        <p className="text-xs text-slate-500">Verificar autenticidad de comprobantes</p>
                    </div>
                </div>

                <form onSubmit={handleValidate} className="space-y-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-slate-700">Código de Barras</label>
                        <input 
                            type="text"
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="Escanee o ingrese el código..."
                        />
                    </div>
                    <Boton loading={validating} tipo="primary" type="submit" className="w-full">
                        Validar Documento
                    </Boton>
                </form>
            </div>

            {/* Modal de Resultados */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Resultado de Validación">
                {result && (
                    <div className={`p-6 rounded-lg ${result.valid ? 'bg-green-50' : 'bg-red-50'}`}>
                        {result.valid ? (
                            <>
                                <div className="flex items-center gap-3 mb-4">
                                    <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <h3 className="text-2xl font-bold text-green-900">Documento Válido</h3>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between border-b border-green-200 pb-2">
                                        <span className="font-semibold text-green-800">Tipo:</span>
                                        <span className="text-green-700">{result.tipo}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-green-200 pb-2">
                                        <span className="font-semibold text-green-800">Número:</span>
                                        <span className="text-green-700">{result.numero}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-green-200 pb-2">
                                        <span className="font-semibold text-green-800">Fecha:</span>
                                        <span className="text-green-700">{new Date(result.fecha).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-green-200 pb-2">
                                        <span className="font-semibold text-green-800">Total:</span>
                                        <span className="text-green-700 font-bold text-lg">{result.moneda} ${parseFloat(result.total).toLocaleString('es-AR')}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-green-200 pb-2">
                                        <span className="font-semibold text-green-800">Estado:</span>
                                        <span className="text-green-700">{result.estado}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold text-green-800">{result.tipo === 'COMPRA' ? 'Proveedor' : 'Cliente'}:</span>
                                        <span className="text-green-700">{result.proveedor || result.cliente || '-'}</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-3 mb-4">
                                    <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <h3 className="text-2xl font-bold text-red-900">Documento No Válido</h3>
                                </div>
                                <p className="text-red-700 text-lg">{result.message}</p>
                            </>
                        )}
                    </div>
                )}
            </Modal>
        </>
    );
}
