import { useState, useRef } from 'react';
import Modal from './Modal';
import Boton from './Boton';
import { DocumentArrowUpIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';

export default function ImportModal({ isOpen, onClose, onSuccess, categorias = [] }) {
    const { showToast } = useToast();
    const fileInputRef = useRef(null);
    const [file, setFile] = useState(null);
    const [idCategoriaDestino, setIdCategoriaDestino] = useState('');
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [step, setStep] = useState('select'); // 'select', 'confirm', 'result'

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null); 
        }
    };

    const handleContinue = () => {
        if (file) setStep('confirm');
    };

    const handleImport = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        if (idCategoriaDestino) {
            formData.append('id_categoria_destino', idCategoriaDestino);
        }

        setUploading(true);
        try {
            const { data } = await api.post('/productos/importar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResult(data);
            setStep('result');
            showToast('Proceso finalizado. Revise el resumen.', 'success');
        } catch (error) {
            console.error('Error uploading file:', error);
            const errorMsg = error.response?.data?.message || 'Error al importar productos';
            showToast(errorMsg, 'error');
            // Stay in confirm or go back? Maybe stay to retry or cancel
        } finally {
            setUploading(false);
        }
    };

    const handleFinalize = () => {
        onSuccess(); // Trigger refresh in parent
        handleClose();
    };

    const handleClose = () => {
        setFile(null);
        setIdCategoriaDestino('');
        setResult(null);
        setStep('select');
        if (fileInputRef.current) fileInputRef.current.value = '';
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Importar Productos Masivamente">
            <div className="p-4">
                {step === 'select' && (
                    <div className="flex flex-col gap-6">
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
                            <DocumentArrowUpIcon className="w-6 h-6 text-blue-500 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-semibold text-blue-800">Instrucciones</h4>
                                <p className="text-xs text-blue-600 mt-1">
                                    Sube un archivo Excel (.xlsx) con las columnas: <b>sku</b>, <b>nombre</b>, <b>precio_base_usd</b>.
                                    <br />
                                    Si el SKU existe, se actualizará el precio. Si no, se creará un nuevo producto.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-slate-700">Seleccionar Archivo</label>
                            <input 
                                type="file" 
                                accept=".xlsx, .xls" 
                                ref={fileInputRef} 
                                onChange={handleFileChange}
                                className="block w-full text-sm text-slate-500
                                  file:mr-4 file:py-2 file:px-4
                                  file:rounded-full file:border-0
                                  file:text-sm file:font-semibold
                                  file:bg-indigo-50 file:text-indigo-700
                                  hover:file:bg-indigo-100
                                "
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-slate-700">Forzar Categoría (Opcional)</label>
                            <select
                                value={idCategoriaDestino}
                                onChange={(e) => setIdCategoriaDestino(e.target.value)}
                                className="block w-full px-3 py-2 text-sm text-slate-700 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            >
                                <option value="">Mantener categoría del Excel o Sin Categoría</option>
                                {categorias.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                ))}
                            </select>
                            <span className="text-xs text-slate-500">
                                Si seleccionas una categoría, todos los productos del Excel serán guardados en ella.
                            </span>
                        </div>

                        <div className="flex justify-end gap-3 mt-4">
                            <Boton tipo="ghost" onClick={handleClose}>Cancelar</Boton>
                            <Boton 
                                onClick={handleContinue} 
                                tipo="primary" 
                                disabled={!file}
                                className="flex items-center gap-2"
                            >
                                Continuar <DocumentArrowUpIcon className="w-5 h-5" />
                            </Boton>
                        </div>
                    </div>
                )}

                {step === 'confirm' && (
                    <div className="flex flex-col gap-6 items-center text-center">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center animate-pulse">
                            <ExclamationTriangleIcon className="w-10 h-10 text-yellow-600" />
                        </div>
                        
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">¿Estás seguro?</h3>
                            <p className="text-slate-500 text-sm mt-2 px-4">
                                Se procesará el archivo <b>{file?.name}</b>.
                                <br/>Esta acción modificará la base de datos y <b>no se puede deshacer</b>.
                            </p>
                        </div>

                        <div className="flex justify-center gap-3 w-full mt-4">
                            <Boton tipo="ghost" onClick={() => setStep('select')}>Atrás</Boton>
                            <Boton 
                                onClick={handleImport} 
                                tipo="primary" 
                                disabled={uploading}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                            >
                                {uploading ? (
                                    <>
                                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                                        Procesando...
                                    </>
                                ) : 'Confirmar e Importar'}
                            </Boton>
                        </div>
                    </div>
                )}

                {step === 'result' && result && (
                    <div className="flex flex-col gap-6 items-center text-center">
                         <div className={`w-16 h-16 rounded-full flex items-center justify-center ${result.detalles.errors === 0 ? 'bg-green-100' : 'bg-orange-100'}`}>
                            {result.detalles.errors === 0 ? (
                                <CheckCircleIcon className="w-10 h-10 text-green-600" />
                            ) : (
                                <ExclamationTriangleIcon className="w-10 h-10 text-orange-500" />
                            )}
                        </div>
                        
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">
                                {result.detalles.errors === 0 ? '¡Importación Exitosa!' : 'Proceso Finalizado'}
                            </h3>
                            <p className="text-slate-500 text-sm mt-1">{result.message}</p>
                            
                            {result?.detalles && (
                                <div className="mt-4 bg-slate-50 rounded-lg p-3 text-sm border border-slate-200 w-full text-left">
                                    <ul className="flex flex-col gap-1 text-slate-600 mb-2">
                                        <li>Procesados: <b>{result.detalles.processed}</b></li>
                                        <li className="text-green-600">Creados: <b>{result.detalles.created}</b></li>
                                        <li className="text-blue-600">Actualizados: <b>{result.detalles.updated}</b></li>
                                        <li className="text-red-500">Errores: <b>{result.detalles.errors}</b></li>
                                    </ul>
                                    
                                    {/* Show first few errors */}
                                    {result.detalles.detalles && result.detalles.detalles.filter(d => d.status === 'error').length > 0 && (
                                        <div className="mt-2 border-t border-slate-200 pt-2">
                                            <p className="text-xs font-semibold text-red-500 mb-1">Detalles de Errores (Primeros 5):</p>
                                            <ul className="text-xs text-slate-500 flex flex-col gap-1">
                                                {result.detalles.detalles
                                                    .filter(d => d.status === 'error')
                                                    .slice(0, 5)
                                                    .map((err, idx) => (
                                                        <li key={idx} className="break-all">
                                                            <span className="font-mono text-slate-400">[{err.sku}]:</span> {err.message}
                                                        </li>
                                                    ))
                                                }
                                                {result.detalles.errors > 5 && (
                                                    <li className="text-slate-400 italic">... y {result.detalles.errors - 5} errores más.</li>
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-center w-full mt-2">
                            <Boton onClick={handleFinalize} tipo="primary" className="w-full">
                                Finalizar y Ver Cambios
                            </Boton>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
