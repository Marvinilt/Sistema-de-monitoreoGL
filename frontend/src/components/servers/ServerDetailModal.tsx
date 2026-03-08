import React, { useEffect, useRef } from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { ServerCardProps } from './ServerCard';

export interface ServerDetailModalProps {
    server: ServerCardProps | null;
    isOpen: boolean;
    onClose: () => void;
    onCheck: (id: string) => void;
}

export const ServerDetailModal: React.FC<ServerDetailModalProps> = ({
    server,
    isOpen,
    onClose,
    onCheck,
}) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            modalRef.current?.focus();
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen || !server) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                tabIndex={-1}
                className="glass-panel w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-700 outline-none flex flex-col max-h-[90vh]"
            >
                <div className="flex justify-between items-center p-6 border-b border-gray-700/50">
                    <h2 id="modal-title" className="text-2xl font-bold flex flex-col">
                        <span className="text-gray-100">{server.name}</span>
                        <span className="text-sm font-mono text-gray-400 font-normal">{server.host}</span>
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-accent-neon rounded"
                        aria-label="Cerrar modal"
                    >
                        <span className="material-symbols-outlined text-[28px]">close</span>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-grow flex flex-col gap-6">
                    <div className="flex items-center justify-between bg-panel-dark p-4 rounded-xl border border-gray-700/50">
                        <div>
                            <p className="text-sm text-gray-400 mb-1">Estado General</p>
                            <StatusBadge status={server.status} />
                        </div>

                        <button
                            onClick={() => onCheck(server.id)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors bg-accent-neon text-black hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-background-dark"
                        >
                            <span className="material-symbols-outlined">refresh</span>
                            Forzar Verificación
                        </button>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-300 mb-3 border-b border-gray-700/50 pb-2">Monitoreo de Puertos</h3>

                        {!server.ports || server.ports.length === 0 ? (
                            <p className="text-gray-500 italic">No hay puertos configurados para este servidor.</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {server.ports.map((p) => {
                                    const isOpen = p.status === 'open';
                                    const ledClass = isOpen
                                        ? 'bg-accent-neon led-pulse shadow-[0_0_8px_theme(colors.accent-neon)]'
                                        : 'bg-danger shadow-[0_0_5px_theme(colors.danger)]';

                                    return (
                                        <div key={p.port} className="flex items-center justify-between bg-panel-dark/50 p-3 rounded border border-gray-700/30">
                                            <div className="flex items-center gap-3">
                                                <span className={`w-3 h-3 rounded-full ${ledClass}`} aria-hidden="true" />
                                                <div>
                                                    <p className="font-mono text-gray-200">Puerto {p.port}</p>
                                                    <p className="text-xs text-gray-500 uppercase">{p.protocol}</p>
                                                </div>
                                            </div>
                                            <span className={`text-sm font-bold ${isOpen ? 'text-accent-neon' : 'text-danger'}`}>
                                                {isOpen ? 'ONLINE' : 'OFFLINE'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
