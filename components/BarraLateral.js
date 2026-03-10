'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { 
  HomeIcon, 
  TagIcon, 
  UsersIcon, 
  TruckIcon, 
  ShoppingCartIcon, 
  CurrencyDollarIcon, 
  BanknotesIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';

const menuStructure = [
  { 
    section: 'Principal', 
    items: [
      { name: 'Panel', href: '/panel', icon: HomeIcon }
    ]
  },
  { 
    section: 'Operaciones', 
    items: [
      { name: 'Ventas', href: '/ventas', icon: ShoppingCartIcon },
      { name: 'Compras', href: '/compras', icon: CurrencyDollarIcon },
      { name: 'Pagos/Cobros', href: '/pagos', icon: BanknotesIcon },
    ]
  },
  { 
    section: 'Inventario', 
    items: [
      { name: 'Productos', href: '/productos', icon: TagIcon },
      { name: 'Gestión de Precios', href: '/precios', icon: BanknotesIcon },
    ]
  },
  {
    section: 'Directorios',
    items: [
      { name: 'Clientes', href: '/clientes', icon: UsersIcon },
      { name: 'Proveedores', href: '/proveedores', icon: TruckIcon },
    ]
  },
  {
    section: 'Configuración',
    items: [
      { name: 'Categorías', href: '/categorias', icon: FolderIcon },
      { name: 'Listas de Precios', href: '/listas-precios', icon: BanknotesIcon },
      { name: 'Configuración General', href: '/configuracion', icon: WrenchScrewdriverIcon },
      { name: 'Usuarios', href: '/usuarios', icon: UsersIcon },
    ]
  }
];

export default function BarraLateral({ open, setOpen }) {
  const pathname = usePathname();
  const { user } = useAuth();
  // State for top-level accordion sections
  const [expandedSections, setExpandedMenus] = useState({}); // Keep name for compatibility or rename? 
  // Let's rename for clarity: 
  const [openSection, setOpenSection] = useState(null); // String or null for accordion
  
  // State for sub-menus (children of items)
  const [expandedSubMenus, setExpandedSubMenus] = useState({});

  // Initialize open section based on path
  useState(() => {
    for (const group of menuStructure) {
        if (group.items.some(item => 
            (pathname === item.href || pathname.startsWith(item.href + '/')) || 
            (item.children && item.children.some(child => pathname === child.href || pathname.startsWith(child.href + '/')))
        )) {
            setOpenSection(group.section);
            break;
        }
    }
  });

  const toggleSection = (sectionName) => {
    setOpenSection(prev => prev === sectionName ? null : sectionName);
  };

  const toggleSubMenu = (name) => {
    setExpandedSubMenus(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const isLinkActive = (href) => pathname === href || pathname.startsWith(href + '/');

  // Shim to map my new state variables to the previous render code I just wrote
  const expandedMenus = { [openSection]: true }; // This maps 'Section Name' to true if openSection matches


  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-light)] transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0 flex flex-col shadow-sm
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-12 border-b border-[var(--border-light)] shrink-0 bg-[var(--bg-secondary)]">
        <div className="w-7 h-7 bg-[var(--color-brand-primary)] rounded-md flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">D</span>
        </div>
        <h1 className="text-sm font-bold text-[var(--text-primary)]">
          DyM Importados
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {menuStructure.map((group, idx) => {
           // Filter items based on role
           const visibleItems = group.items.filter(item => {
               if (item.name === 'Usuarios') {
                   return user?.rol === 'ADMIN';
               }
               return true;
           });

           if (visibleItems.length === 0) return null;

           const groupHasActiveItem = visibleItems.some(item => 
             isLinkActive(item.href) || (item.children && item.children.some(child => isLinkActive(child.href)))
           );
           
           const isActiveSection = expandedMenus[group.section] === true || (expandedMenus[group.section] === undefined && groupHasActiveItem);
            
           return (
          <div key={idx} className="border-b border-slate-100 last:border-0 pb-1 mb-1">
             {group.section && (
               <button 
                 onClick={() => toggleSection(group.section)}
                 className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors
                   ${expandedMenus[group.section] 
                     ? 'text-[var(--color-brand-primary)] bg-indigo-50/50' 
                     : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                   }
                 `}
               >
                 <span>{group.section}</span>
                 {expandedMenus[group.section] ? (
                   <ChevronDownIcon className="w-3 h-3" />
                 ) : (
                   <ChevronRightIcon className="w-3 h-3" />
                 )}
               </button>
             )}
             
             <div 
               className={`overflow-hidden transition-all duration-300 ease-in-out`}
               style={{ 
                 maxHeight: expandedMenus[group.section] ? '500px' : '0px',
                 opacity: expandedMenus[group.section] ? 1 : 0.5
               }}
             >
               <ul className="space-y-0.5 mt-1 px-2 pb-2">
                 {group.items.map((item) => {
                   const Icon = item.icon;
                   const hasChildren = item.children && item.children.length > 0;
                   // Use expandedSubMenus state for children, separate from sections
                   const isExpanded = expandedSubMenus[item.name]; 
                   const isChildActive = hasChildren && item.children.some(child => isLinkActive(child.href));
                   const isActive = !hasChildren && isLinkActive(item.href);
                   
                   return (
                     <li key={item.name}>
                       {hasChildren ? (
                         <>
                           <button 
                             onClick={() => toggleSubMenu(item.name)}
                             className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md transition-all text-sm font-medium
                               ${isChildActive || isExpanded 
                                 ? 'text-[var(--text-primary)] bg-[var(--bg-primary)]' 
                                 : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]'}
                             `}
                           >
                             <div className="flex items-center gap-2">
                               <Icon className="w-4 h-4" />
                               <span>{item.name}</span>
                             </div>
                             {isExpanded ? (
                               <ChevronDownIcon className="w-3 h-3 text-[var(--text-muted)]" />
                             ) : (
                               <ChevronRightIcon className="w-3 h-3 text-[var(--text-muted)]" />
                             )}
                           </button>
                           
                           {isExpanded && (
                             <ul className="mt-0.5 ml-4 space-y-0.5 border-l border-[var(--border-light)] pl-2">
                               {item.children.map(child => {
                                 const childActive = isLinkActive(child.href);
                                 return (
                                   <li key={child.name}>
                                     <Link
                                       href={child.href}
                                       onClick={() => setOpen && setOpen(false)}
                                       className={`flex items-center px-2 py-1 rounded-md text-sm transition-colors
                                         ${childActive 
                                           ? 'text-[var(--color-brand-primary)] font-semibold bg-[var(--color-primary-light)]' 
                                           : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'}
                                       `}
                                     >
                                       {child.name}
                                     </Link>
                                   </li>
                                 )
                               })}
                             </ul>
                           )}
                         </>
                       ) : (
                         <Link 
                           href={item.href}
                           onClick={() => setOpen && setOpen(false)} 
                           className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-all text-sm font-medium
                             ${isActive 
                               ? 'bg-[var(--color-brand-primary)] text-white shadow-sm' 
                               : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]'
                             }
                           `}
                         >
                           <Icon className="w-4 h-4" />
                           <span>{item.name}</span>
                         </Link>
                       )}
                     </li>
                   );
                 })}
               </ul>
             </div>
          </div>
        )})}
      </nav>
      
      {/* Footer */}
      <div className="p-3 border-t border-[var(--border-light)] shrink-0 bg-[var(--bg-secondary)]">
        <p className="text-[10px] text-[var(--text-muted)] text-center font-medium">v1.1.0 • Sistema de Gestión</p>
      </div>
    </aside>
  );
}
