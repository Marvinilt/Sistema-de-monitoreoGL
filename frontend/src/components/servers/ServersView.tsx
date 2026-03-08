import React, { useState } from 'react';
import { ServerCard, ServerCardProps } from './ServerCard';
import { ServerDetailModal } from './ServerDetailModal';
import { AddServerModal, AddServerData } from './AddServerModal';
import { useServers } from '../../hooks/useServers';
import { useMonitor } from '../../hooks/useMonitor';
import { Servidor } from '../../types';

export const ServersView: React.FC = () => {
    const { servidores, agregarServidor, actualizarServidor, agregarPuerto, agregarUrl, eliminarPuerto, eliminarUrl } = useServers();
    const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const { verificarServidor, verificarTodos, enProgreso } = useMonitor(actualizarServidor);

    const handleCheck = async (id: string) => {
        await verificarServidor(id);
    };


    const handleAddServer = async (data: AddServerData) => {
        try {
            // Se asume que agregarServidor devuelve el servidor o un ID. Si useServers dice: "return nuevo"
            const nuevoServidor = await agregarServidor(data.name, data.host);
            if (nuevoServidor) {
                // Agregar puertos iterando
                if (data.ports && data.ports.length > 0) {
                    for (const port of data.ports) {
                        await agregarPuerto(nuevoServidor.id, port);
                    }
                }
                // Agregar url
                if (data.url) {
                    await agregarUrl(nuevoServidor.id, data.url);
                }

                // Disparar chequeo inicial
                await verificarServidor(nuevoServidor.id);
            }
        } catch (e) {
            console.error('Failed to add server details', e);
            throw e; // lanza de nuevo para que el modal handlee el setIsSubmitting(false) si deseáramos
        }
    };

    const mapServerToProps = (s: Servidor): ServerCardProps => {
        let status: ServerCardProps['status'] = 'unknown';
        if (s.estado === 'ok') status = 'ok';
        if (s.estado === 'alerta') status = 'alert';

        const isChecking = enProgreso.has(s.id);

        return {
            id: s.id,
            name: s.nombre,
            host: s.host,
            status: isChecking ? 'warning' : status, // Muestra warning mientras revisa
            ports: s.resultadosPuertos.map(rp => ({
                port: rp.puerto,
                status: rp.estado === 'abierto' ? 'open' : 'closed',
                protocol: 'tcp' // Simplification
            })),
            urls: s.urls.map(u => ({
                id: u.id,
                url: u.url,
                status: u.estado
            })),
            onCheck: handleCheck,
            onClick: setSelectedServerId
        };
    };

    const mappedServers = servidores.map(mapServerToProps);
    const selectedServer = servidores.find(s => s.id === selectedServerId) || null;

    return (
        <div className="flex flex-col gap-6 p-6 pb-20 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
                        <span className="material-symbols-outlined text-[32px] text-accent-neon">dns</span>
                        Gestión de Servidores
                    </h1>
                    <p className="text-gray-400 mt-1">Monitorea y administra la infraestructura de red</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center justify-center gap-2 bg-accent-neon text-black font-bold py-2 px-4 rounded-lg hover:brightness-110 transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-background-dark shadow-neon"
                    >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        Añadir Servidor
                    </button>

                    <button
                        onClick={verificarTodos}
                        className="flex items-center justify-center gap-2 bg-panel-dark border border-gray-600 hover:border-accent-neon text-gray-200 px-4 py-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-accent-neon shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[20px]">sync</span>
                        Refrescar Todos
                    </button>
                </div>
            </div>

            {/* Resumen Metrics Horizontal Card */}
            <div className="glass-panel p-4 rounded-xl border border-gray-700/50 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-gray-400 text-2xl">info</span>
                    <span className="text-lg font-bold text-gray-200">Resumen de Red</span>
                </div>

                <div className="flex divide-x divide-gray-700 w-full md:w-auto">
                    <div className="px-6 flex flex-col items-center flex-1">
                        <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total</span>
                        <span className="font-bold text-gray-200 font-mono text-xl">{mappedServers.length}</span>
                    </div>
                    <div className="px-6 flex flex-col items-center flex-1">
                        <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">OK</span>
                        <span className="font-bold text-success font-mono text-xl">{mappedServers.filter(s => s.status === 'ok').length}</span>
                    </div>
                    <div className="px-6 flex flex-col items-center flex-1">
                        <span className="text-xs text-danger uppercase tracking-wider font-semibold animate-pulse-slow">Críticos</span>
                        <span className="font-bold text-danger font-mono text-xl">{mappedServers.filter(s => s.status === 'alert').length}</span>
                    </div>
                </div>
            </div>

            {/* Grid de servidores a ancho completo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max">
                {mappedServers.map(server => (
                    <ServerCard
                        key={server.id}
                        {...server}
                    />
                ))}
                {mappedServers.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center p-16 glass-panel border border-dashed border-gray-700 rounded-2xl">
                        <div className="w-16 h-16 rounded-full bg-panel-dark flex items-center justify-center border border-gray-600 shadow-neon mb-4">
                            <span className="material-symbols-outlined text-[32px] text-gray-400">dns</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-200 mb-2">Ningún Servidor Configurado</h3>
                        <p className="text-gray-400 text-center max-w-md">Comienza a monitorear tu infraestructura de TI haciendo clic en "Añadir Servidor" en la parte superior derecha.</p>

                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="mt-6 flex items-center justify-center gap-2 bg-panel-dark text-accent-neon font-bold py-2 px-6 rounded-lg border border-accent-neon hover:bg-accent-neon/10 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-neon"
                        >
                            <span className="material-symbols-outlined">add</span>
                            Primer Servidor
                        </button>
                    </div>
                )}
            </div>

            <ServerDetailModal
                isOpen={!!selectedServerId}
                server={selectedServer}
                onClose={() => setSelectedServerId(null)}
                onCheck={handleCheck}
                onAddPort={agregarPuerto}
                onRemovePort={eliminarPuerto}
                onAddUrl={agregarUrl}
                onRemoveUrl={eliminarUrl}
            />

            <AddServerModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddServer}
            />
        </div>
    );
};
