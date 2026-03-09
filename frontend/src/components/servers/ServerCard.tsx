import React from 'react';
import { StatusBadge } from '../common/StatusBadge';

export interface PortStatus {
    port: number;
    status: 'open' | 'closed';
    protocol: string;
}

export interface UrlStatus {
    id: string;
    url: string;
    status: 'disponible' | 'no_disponible' | 'error_certificado' | 'desconocido';
}

export interface ServerCardProps {
    id: string;
    name: string;
    host: string;
    status: 'ok' | 'alert' | 'warning' | 'unknown';
    ports?: PortStatus[];
    urls?: UrlStatus[];
    onCheck: (id: string) => void;
    onClick?: (id: string) => void;
}

export const ServerCard: React.FC<ServerCardProps> = ({
    id,
    name,
    host,
    status,
    ports = [],
    urls = [],
    onCheck,
    onClick,
}) => {
    const isAlert = status === 'alert';
    const glowClass = isAlert ? 'glow-danger border-danger/50' : 'glow-success border-success/50';

    return (
        <div
            className={`glass-panel p-6 rounded-xl flex flex-col gap-4 border ${glowClass} transition-all duration-300 hover:brightness-110 cursor-pointer`}
            onClick={() => onClick && onClick(id)}
            role="button"
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={(e) => {
                if (onClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onClick(id);
                }
            }}
            aria-label={`Servidor ${name}, host ${host}, estado ${status}`}
        >
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold text-gray-100 mb-1">{name}</h3>
                    <p className="text-sm font-mono text-gray-400">{host}</p>
                </div>
                <StatusBadge status={status} />
            </div>

            <div className="bg-background-dark/50 rounded-lg p-3 mt-2 flex-grow">
                <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Puertos ({ports.length})</h4>
                <div className="flex flex-wrap gap-2">
                    {ports.map((p) => {
                        const isOpen = p.status === 'open';
                        const ledClass = isOpen
                            ? 'bg-accent-neon led-pulse shadow-[0_0_8px_theme(colors.accent-neon)]'
                            : 'bg-danger shadow-[0_0_5px_theme(colors.danger)]';

                        return (
                            <div
                                key={p.port}
                                className="flex items-center gap-1.5 bg-panel-dark px-2 py-1 rounded text-xs font-mono"
                                title={`${p.protocol.toUpperCase()} Port ${p.port} is ${p.status}`}
                            >
                                <span className={`w-2 h-2 rounded-full ${ledClass}`} aria-hidden="true" />
                                <span className={isOpen ? 'text-gray-200' : 'text-gray-500'}>{p.port}</span>
                            </div>
                        );
                    })}
                    {ports.length === 0 && (
                        <p className="text-xs text-gray-500 italic">Sin puertos configurados</p>
                    )}
                </div>

                {urls.length > 0 && (
                    <div className="mt-3">
                        <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2">URLs ({urls.length})</h4>
                        <div className="flex flex-col gap-1.5">
                            {urls.map((u) => {
                                const isUp = u.status === 'disponible';
                                const ledColor = isUp ? 'bg-success shadow-[0_0_8px_theme(colors.success)]'
                                    : u.status === 'error_certificado' ? 'bg-warning shadow-[0_0_5px_theme(colors.warning)]'
                                        : u.status === 'desconocido' ? 'bg-gray-500'
                                            : 'bg-danger shadow-[0_0_5px_theme(colors.danger)]';

                                return (
                                    <div key={u.id} className="flex items-center gap-2 bg-panel-dark px-2 py-1 rounded text-xs font-mono overflow-hidden" title={`URL Status: ${u.status}`}>
                                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ledColor}`} aria-hidden="true" />
                                        <span className={`truncate ${isUp ? 'text-gray-200' : 'text-gray-400'}`}>
                                            {u.url.replace(/^https?:\/\//, '')}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end mt-2 border-t border-gray-700/50 pt-4" onClick={e => e.stopPropagation()}>
                <button
                    onClick={() => onCheck(id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors bg-panel-dark hover:bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-neon"
                    aria-label={`Verificar estado de ${name}`}
                >
                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                    Actualizar
                </button>
            </div>
        </div>
    );
};
