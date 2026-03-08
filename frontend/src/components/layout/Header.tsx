// Feature: frontend-redesign-futurista
// Requisitos: 3.8, 3.9, 3.10, 3.11, 3.12, 11.1

import { useState } from 'react';

interface HeaderProps {
  systemStatus?: 'operational' | 'degraded' | 'down';
  uptimeSeconds?: number;
  onSearch?: (query: string) => void;
}

/**
 * Formats uptime seconds into a human-readable string.
 * Propiedad 6: formato uptime
 */
export function formatUptime(seconds: number): string {
  if (seconds < 0) seconds = 0;
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (d > 0) {
    return `${d}d ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function Header({
  systemStatus = 'operational',
  uptimeSeconds = 0,
  onSearch,
}: HeaderProps) {
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    onSearch?.(e.target.value);
  };

  return (
    <header className="glass-panel px-6 py-3 flex items-center gap-4 border-b border-white/5">
      {/* System status indicator */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className={`w-2.5 h-2.5 rounded-full led-pulse ${
            systemStatus === 'operational'
              ? 'bg-accent-neon'
              : systemStatus === 'degraded'
              ? 'bg-warning'
              : 'bg-danger'
          }`}
          aria-hidden="true"
        />
        <span className="text-sm text-gray-300 whitespace-nowrap">
          System Status:{' '}
          <span className="text-accent-neon font-medium capitalize">{systemStatus === 'operational' ? 'Operational' : systemStatus}</span>
        </span>
      </div>

      {/* Uptime */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-xs text-gray-500">Uptime:</span>
        <span className="font-mono text-xs text-gray-300">{formatUptime(uptimeSeconds)}</span>
      </div>

      {/* Search bar */}
      <div className="flex-1 max-w-md relative">
        <span
          className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg pointer-events-none"
          aria-hidden="true"
        >
          search
        </span>
        <input
          type="search"
          placeholder="Buscar servidor..."
          value={searchValue}
          onChange={handleSearch}
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
          aria-label="Buscar servidor"
        />
      </div>

      <div className="flex items-center gap-1 ml-auto">
        {/* Notifications button */}
        <button
          type="button"
          aria-label="Notificaciones"
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="material-symbols-outlined text-xl" aria-hidden="true">notifications</span>
        </button>

        {/* Settings button */}
        <button
          type="button"
          aria-label="Configuración"
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="material-symbols-outlined text-xl" aria-hidden="true">settings</span>
        </button>
      </div>
    </header>
  );
}
