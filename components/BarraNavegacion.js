'use client';
import { Bars3Icon, BellIcon, ArrowRightOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCotizacion } from '@/context/CotizacionContext';

export default function BarraNavegacion({ sidebarOpen, setSidebarOpen }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { cotizacion } = useCotizacion();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="sticky top-0 z-40 bg-[var(--bg-secondary)] border-b border-[var(--border-light)] h-14 flex items-center justify-between px-4 lg:px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 -ml-1.5 text-[var(--text-secondary)] lg:hidden hover:bg-[var(--bg-primary)] rounded transition-colors"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
        <span className="text-sm font-bold text-[var(--text-secondary)] hidden sm:block uppercase tracking-wide">Panel de Administración</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Exchange Rate Display */}
        <Link 
            href="/configuracion"
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--bg-primary)] hover:bg-[var(--border-light)] text-[var(--text-primary)] text-xs font-medium transition-colors border border-[var(--border-light)]"
            title="Ir a Configuración"
        >
            <span className="text-[var(--color-success)] font-bold">USD</span>
            <span className="font-mono font-bold">$ {cotizacion ? cotizacion.toFixed(2) : '---'}</span>
        </Link>
        <div className="h-6 w-px bg-[var(--border-light)] mx-1 hidden md:block"></div>
        
        {/* Notifications */}
        <button className="relative p-1.5 text-[var(--text-muted)] hover:text-[var(--color-brand-primary)] transition-colors">
          <BellIcon className="w-6 h-6" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--color-danger)] rounded-full ring-2 ring-[var(--bg-secondary)]"></span>
        </button>
        
        <div className="h-6 w-px bg-[var(--border-light)] mx-1"></div>

        {/* User Profile / Logout */}
        <div className="flex items-center gap-3 pl-1">
           <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-[var(--text-primary)]">{user?.nombre || 'Usuario'}</p>
            <p className="text-[10px] text-[var(--text-muted)] capitalize">{user?.rol || 'Rol'}</p>
          </div>
          <UserCircleIcon className="w-8 h-8 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors" />
          <button 
            onClick={handleLogout}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--bg-primary)] rounded transition-colors"
            title="Cerrar Sesión"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
