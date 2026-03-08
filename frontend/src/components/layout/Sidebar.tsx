// Feature: frontend-redesign-futurista
// Requisitos: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.12, 3.13

import { NavLink } from 'react-router-dom';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',   path: '/',         icon: 'dashboard' },
  { label: 'Servers',     path: '/servers',  icon: 'dns' },
  { label: 'SMTP Config', path: '/settings', icon: 'mail' },
  { label: 'Logs',        path: '/logs',     icon: 'article' },
];

export function Sidebar() {
  return (
    <aside
      role="navigation"
      aria-label="Navegación principal"
      className="w-64 h-screen flex flex-col glass-panel bg-panel-dark border-r border-white/5 flex-shrink-0"
    >
      {/* Logo */}
      <div className="flex flex-col items-center py-6 px-4 border-b border-white/5">
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-primary text-3xl" aria-hidden="true">
            security
          </span>
          <span className="text-white font-bold text-lg tracking-wide">MonitorSistemas-GL</span>
        </div>
        <span className="font-mono text-xs text-gray-500">v2.4.0-Alpha</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5',
              ].join(' ')
            }
          >
            <span className="material-symbols-outlined text-xl" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User avatar */}
      <div className="px-4 py-4 border-t border-white/5">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center"
            aria-label="Avatar de usuario"
          >
            <span className="material-symbols-outlined text-primary text-lg" aria-hidden="true">
              person
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-white text-sm font-medium">Admin</span>
            <span className="text-gray-500 text-xs font-mono">Sistema</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
