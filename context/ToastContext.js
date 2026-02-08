'use client';
import { createContext, useContext, useState, useCallback } from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastItem({ message, type, onClose }) {
  const styles = {
    success: 'bg-white border-slate-200 text-slate-800 shadow-xl shadow-slate-200/50',
    error: 'bg-white border-red-200 text-slate-800 shadow-xl shadow-red-200/20',
    warning: 'bg-white border-amber-200 text-slate-800 shadow-xl shadow-amber-200/20',
    info: 'bg-white border-blue-200 text-slate-800 shadow-xl shadow-blue-200/20',
  };

  const icons = {
    success: <CheckCircleIcon className="w-5 h-5 text-emerald-500" />,
    error: <ExclamationCircleIcon className="w-5 h-5 text-red-500" />,
    warning: <ExclamationCircleIcon className="w-5 h-5 text-amber-500" />,
    info: <InformationCircleIcon className="w-5 h-5 text-blue-500" />,
  };

  return (
    <div className={`pointer-events-auto min-w-[320px] max-w-sm p-4 rounded-lg border flex items-start gap-3 transition-all animate-in slide-in-from-right-full fade-in duration-300 ring-1 ring-black/5 ${styles[type] || styles.info}`}>
      <div className="flex-shrink-0 mt-0.5">
        {icons[type] || icons.info}
      </div>
      <div className="flex-1 text-sm font-medium leading-5">{message}</div>
      <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none -mt-1 -mr-1 p-1 rounded-md hover:bg-slate-50">
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
