// Feature: frontend-redesign-futurista
// Requisitos: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.12, 3.13

import { useState } from 'react';
import { NavLink } from 'react-router-dom';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Tablero', path: '/', icon: 'dashboard' },
  { label: 'Servidores', path: '/servers', icon: 'dns' },
  { label: 'Config. SMTP', path: '/settings', icon: 'mail' },
  { label: 'Config. Parámetros', path: '/parameters', icon: 'settings_suggest' },
  { label: 'Registros', path: '/logs', icon: 'article' },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      role="navigation"
      aria-label="Navegación principal"
      className={`${isCollapsed ? 'w-20' : 'w-64'} h-screen flex flex-col glass-panel bg-panel-dark border-r border-white/5 flex-shrink-0 transition-all duration-300 relative`}
    >
      {/* Logo */}
      <div className={`flex flex-col items-center py-6 px-4 border-b border-white/5 min-h-[102px] ${isCollapsed ? 'justify-center' : ''}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-primary text-3xl" aria-hidden="true" title="MonitorSistemas-GL">
            security
          </span>
          {!isCollapsed && <span className="text-white font-bold text-lg tracking-wide whitespace-nowrap overflow-hidden">MonitorSistemas-GL</span>}
        </div>
        {!isCollapsed && <span className="font-mono text-xs text-gray-500">v2.4.0-Alpha</span>}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto custom-scrollbar overflow-x-hidden">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            title={isCollapsed ? item.label : undefined}
            className={({ isActive }) =>
              [
                'flex items-center rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isCollapsed ? 'justify-center py-3' : 'gap-3 px-3 py-2.5',
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent',
              ].join(' ')
            }
          >
            <span className="material-symbols-outlined text-xl flex-shrink-0" aria-hidden="true">
              {item.icon}
            </span>
            {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Pestaña flotante de colapso — anclada al borde derecho, centrada verticalmente */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? 'Expandir menú' : 'Contraer menú'}
        aria-label={isCollapsed ? 'Expandir menú' : 'Contraer menú'}
        className="absolute top-1/2 -translate-y-1/2 -right-4 z-10
                   w-4 h-10 flex items-center justify-center
                   bg-panel-dark border border-white/10 border-l-0
                   rounded-r-md
                   text-gray-500 hover:text-primary
                   transition-colors duration-200
                   focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
      >
        <span className="material-symbols-outlined text-[14px] leading-none select-none">
          {isCollapsed ? 'chevron_right' : 'chevron_left'}
        </span>
      </button>


      {/* User avatar */}
      <div className={`px-4 py-4 border-t border-white/5 min-h-[73px] flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 flex-shrink-0 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center"
            title="Admin - Sistema"
            aria-label="Avatar de usuario"
          >
            <span className="material-symbols-outlined text-primary text-lg" aria-hidden="true">
              person
            </span>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-white text-sm font-medium whitespace-nowrap">Admin</span>
              <span className="text-gray-500 text-xs font-mono whitespace-nowrap">Sistema</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
