import React, { useState } from 'react';

export type LogType = 'info' | 'warning' | 'error' | 'success';

export interface LogEntry {
    id: string;
    timestamp: string;
    type: LogType;
    source: string;
    message: string;
}

const MOCK_LOGS: LogEntry[] = [
    { id: '1', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), type: 'error', source: 'Web Server Alpha', message: 'Connection timeout on port 80.' },
    { id: '2', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), type: 'warning', source: 'Cache Layer', message: 'High memory usage (85%).' },
    { id: '3', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), type: 'success', source: 'Database Prod', message: 'Backup completed successfully.' },
    { id: '4', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), type: 'info', source: 'System', message: 'Scheduled maintenance started.' },
    { id: '5', timestamp: new Date(Date.now() - 1000 * 60 * 125).toISOString(), type: 'info', source: 'System', message: 'System boot completed.' },
];

export const LogsView: React.FC = () => {
    // En la implementación real estos logs vendrían de useMonitor o un hook similar
    const [logs] = useState<LogEntry[]>(MOCK_LOGS);

    // Property to maintain: chronologically descending order (newest first)
    const sortedLogs = [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const getLogColorAndIcon = (type: LogType) => {
        switch (type) {
            case 'error': return { color: 'text-danger', border: 'border-danger/30', bg: 'bg-danger/10', icon: 'error' };
            case 'warning': return { color: 'text-warning', border: 'border-warning/30', bg: 'bg-warning/10', icon: 'warning' };
            case 'success': return { color: 'text-success', border: 'border-success/30', bg: 'bg-success/10', icon: 'check_circle' };
            case 'info':
            default: return { color: 'text-accent-neon', border: 'border-accent-neon/30', bg: 'bg-accent-neon/10', icon: 'info' };
        }
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleString();
    };

    return (
        <div className="flex flex-col gap-6 p-6 pb-20 max-w-6xl mx-auto h-full">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
                        <span className="material-symbols-outlined text-[32px] text-accent-neon">terminal</span>
                        Registro de Eventos
                    </h1>
                    <p className="text-gray-400 mt-1">Historial del sistema y alertas de servidores</p>
                </div>

                <div className="flex items-center gap-3 bg-panel-dark px-4 py-2 rounded-lg border border-gray-600">
                    <span className="material-symbols-outlined text-gray-400">filter_list</span>
                    <span className="text-sm font-medium text-gray-300">Filtros Activos: Ninguno</span>
                </div>
            </div>

            <div
                className="glass-panel rounded-xl border border-gray-700/50 flex flex-col flex-grow overflow-hidden"
                role="log"
                aria-live="polite"
            >
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-700/80 bg-background-dark/50 text-xs uppercase tracking-wider text-gray-400 font-bold">
                    <div className="col-span-3">Timestamp</div>
                    <div className="col-span-2">Tipo</div>
                    <div className="col-span-3">Origen</div>
                    <div className="col-span-4">Descripción</div>
                </div>

                <div className="flex flex-col overflow-y-auto">
                    {sortedLogs.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 italic">No hay registros para mostrar.</div>
                    ) : (
                        sortedLogs.map((log) => {
                            const style = getLogColorAndIcon(log.type);
                            return (
                                <div key={log.id} className={`grid grid-cols-12 gap-4 p-4 border-b border-gray-700/30 hover:bg-gray-800/30 transition-colors ${style.bg} items-center`}>
                                    <div className="col-span-3 text-sm font-mono text-gray-300 whitespace-nowrap overflow-hidden text-ellipsis">
                                        {formatDate(log.timestamp)}
                                    </div>
                                    <div className="col-span-2 flex items-center gap-2">
                                        <span className={`material-symbols-outlined text-[18px] ${style.color}`}>{style.icon}</span>
                                        <span className={`text-xs font-bold uppercase ${style.color} rounded border px-2 py-0.5 ${style.border}`}>
                                            {log.type}
                                        </span>
                                    </div>
                                    <div className="col-span-3 text-sm font-medium text-gray-200">
                                        {log.source}
                                    </div>
                                    <div className="col-span-4 text-sm text-gray-400">
                                        {log.message}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
