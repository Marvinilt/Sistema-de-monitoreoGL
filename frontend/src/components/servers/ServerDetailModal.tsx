import React, { useEffect, useRef, useState } from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { Servidor } from '../../types';

export interface ServerDetailModalProps {
    server: Servidor | null;
    isOpen: boolean;
    onClose: () => void;
    onCheck: (id: string) => void;
    onAddPort: (id: string, port: number) => Promise<void>;
    onRemovePort: (id: string, port: number) => Promise<void>;
    onAddUrl: (id: string, url: string) => Promise<void>;
    onRemoveUrl: (id: string, urlId: string) => Promise<void>;
    onRename: (id: string, nombre: string) => Promise<void>;
}

export const ServerDetailModal: React.FC<ServerDetailModalProps> = ({
    server,
    isOpen,
    onClose,
    onCheck,
    onAddPort,
    onRemovePort,
    onAddUrl,
    onRemoveUrl,
    onRename,
}) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [newPort, setNewPort] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [editingName, setEditingName] = useState(false);
    const [nameValue, setNameValue] = useState('');

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (editingName) setEditingName(false);
                else onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            modalRef.current?.focus();
            setNameValue(server?.nombre ?? '');
            setEditingName(false);
        } else {
            setNewPort('');
            setNewUrl('');
            setEditingName(false);
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose, server?.nombre]);

    useEffect(() => {
        if (editingName) nameInputRef.current?.select();
    }, [editingName]);

    if (!isOpen || !server) return null;

    const handleAddPort = async (e: React.FormEvent) => {
        e.preventDefault();
        const p = Number(newPort);
        if (p > 0 && p <= 65535) {
            await onAddPort(server.id, p);
            setNewPort('');
        }
    };

    const handleAddUrl = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newUrl.trim()) {
            await onAddUrl(server.id, newUrl.trim());
            setNewUrl('');
        }
    };

    const handleConfirmName = async () => {
        const trimmed = nameValue.trim();
        if (trimmed && trimmed !== server.nombre) {
            await onRename(server.id, trimmed);
        }
        setEditingName(false);
    };

    const isChecking = server.estado === 'desconocido';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                tabIndex={-1}
                className="glass-panel w-full max-w-2xl rounded-2xl shadow-2xl shadow-accent-neon/5 border border-gray-700 outline-none flex flex-col max-h-[90vh] animate-slide-up"
            >
                <div className="flex justify-between items-start p-6 border-b border-gray-700/50 gap-4">
                    <div className="flex-1 min-w-0">
                        {editingName ? (
                            <input
                                ref={nameInputRef}
                                id="modal-title"
                                value={nameValue}
                                onChange={(e) => setNameValue(e.target.value)}
                                onBlur={handleConfirmName}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleConfirmName();
                                    if (e.key === 'Escape') setEditingName(false);
                                }}
                                className="w-full text-xl font-bold text-gray-100 bg-white/5 border border-accent-neon/50 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-accent-neon"
                                aria-label="Nombre del servidor"
                            />
                        ) : (
                            <button
                                id="modal-title"
                                onClick={() => setEditingName(true)}
                                title="Clic para editar el nombre"
                                className="group flex items-center gap-2 text-left w-full"
                            >
                                <span className="text-xl font-bold text-gray-100 truncate">{server.nombre}</span>
                                <span className="material-symbols-outlined text-[16px] text-gray-500 group-hover:text-accent-neon transition-colors flex-shrink-0">
                                    edit
                                </span>
                            </button>
                        )}
                        <span className="text-sm font-mono text-gray-400">{server.host}</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-accent-neon rounded flex-shrink-0"
                        aria-label="Cerrar modal"
                    >
                        <span className="material-symbols-outlined text-[28px]">close</span>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-grow flex flex-col gap-6 custom-scrollbar">
                    <div className="flex items-center justify-between bg-panel-dark p-4 rounded-xl border border-gray-700/50">
                        <div>
                            <p className="text-sm text-gray-400 mb-1">Estado General</p>
                            <StatusBadge status={server.estado === 'alerta' ? 'alert' : server.estado === 'ok' ? 'ok' : 'warning'} />
                        </div>

                        <button
                            onClick={() => onCheck(server.id)}
                            disabled={isChecking}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors bg-accent-neon text-black hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-background-dark shadow-neon ${isChecking ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <span className={`material-symbols-outlined ${isChecking ? 'animate-spin-slow' : ''}`}>
                                {isChecking ? 'autorenew' : 'refresh'}
                            </span>
                            {isChecking ? 'Verificando...' : 'Forzar Verificación'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Panel Puertos */}
                        <div className="flex flex-col gap-3">
                            <h3 className="text-lg font-semibold text-gray-300 border-b border-gray-700/50 pb-2">Puertos</h3>

                            {!server.resultadosPuertos || server.resultadosPuertos.length === 0 ? (
                                <p className="text-gray-500 italic text-sm">No hay puertos configurados.</p>
                            ) : (
                                <ul className="flex flex-col gap-2">
                                    {server.resultadosPuertos.map((rp) => {
                                        const isOpen = rp.estado === 'abierto';
                                        const ledClass = isOpen
                                            ? 'bg-accent-neon led-pulse shadow-neon'
                                            : 'bg-danger shadow-[0_0_5px_theme(colors.danger)]';

                                        return (
                                            <li key={rp.puerto} className="flex justify-between items-center group bg-panel-dark/30 p-2 rounded border border-gray-700/30">
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-2.5 h-2.5 rounded-full ${ledClass}`} aria-hidden="true" />
                                                    <span className="font-mono text-gray-200">TCP {rp.puerto}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {rp.latenciaMs !== null && <span className="text-xs text-gray-500">{rp.latenciaMs}ms</span>}
                                                    <button
                                                        onClick={() => onRemovePort(server.id, rp.puerto)}
                                                        className="text-gray-500 hover:text-danger focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="Eliminar Puerto"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}

                            <form onSubmit={handleAddPort} className="flex gap-2.5 mt-2">
                                <input
                                    type="number"
                                    min="1" max="65535"
                                    value={newPort}
                                    onChange={e => setNewPort(e.target.value)}
                                    placeholder="Ej: 8080"
                                    className="bg-panel-dark flex-1 border border-gray-600 text-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-accent-neon text-sm font-mono"
                                />
                                <button type="submit" disabled={!newPort} className="bg-white/10 text-white rounded p-1.5 hover:bg-white/20 focus:outline-none transition-colors disabled:opacity-50">
                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                </button>
                            </form>
                        </div>

                        {/* Panel URLs */}
                        <div className="flex flex-col gap-3">
                            <h3 className="text-lg font-semibold text-gray-300 border-b border-gray-700/50 pb-2">Sitios Web (URLs)</h3>

                            {!server.urls || server.urls.length === 0 ? (
                                <p className="text-gray-500 italic text-sm">No hay URLs configuradas.</p>
                            ) : (
                                <ul className="flex flex-col gap-2">
                                    {server.urls.map((u) => {
                                        const isUp = u.estado === 'disponible';
                                        const ledClass = isUp
                                            ? 'bg-accent-neon led-pulse shadow-neon'
                                            : u.estado === 'error_certificado' ? 'bg-warning shadow-[0_0_5px_theme(colors.warning)]'
                                                : 'bg-danger shadow-[0_0_5px_theme(colors.danger)]';

                                        return (
                                            <li key={u.id} className="flex justify-between items-center group bg-panel-dark/30 p-2 rounded border border-gray-700/30">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${ledClass}`} aria-hidden="true" />
                                                    <a href={u.url} target="_blank" rel="noreferrer" className="font-mono text-gray-300 text-sm hover:text-accent-neon truncate transition-colors">
                                                        {u.url.replace(/^https?:\/\//, '')}
                                                    </a>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {u.codigoHttp && <span className={`text-xs px-1.5 rounded ${isUp ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>{u.codigoHttp}</span>}
                                                    <button
                                                        onClick={() => onRemoveUrl(server.id, u.id)}
                                                        className="text-gray-500 hover:text-danger focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="Eliminar URL"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}

                            <form onSubmit={handleAddUrl} className="flex gap-2.5 mt-2">
                                <input
                                    type="url"
                                    value={newUrl}
                                    onChange={e => setNewUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="bg-panel-dark flex-1 border border-gray-600 text-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-accent-neon text-sm font-mono"
                                />
                                <button type="submit" disabled={!newUrl.trim()} className="bg-white/10 text-white rounded p-1.5 hover:bg-white/20 focus:outline-none transition-colors disabled:opacity-50">
                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
