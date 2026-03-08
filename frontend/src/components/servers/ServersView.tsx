import React, { useState } from 'react';
import { ServerCard, ServerCardProps } from './ServerCard';
import { AddServerForm } from './AddServerForm';
import { ServerDetailModal } from './ServerDetailModal';
import { useServers } from '../../hooks/useServers';
import { useMonitor } from '../../hooks/useMonitor';
import { Servidor } from '../../types';

export const ServersView: React.FC = () => {
    const { servidores, agregarServidor, actualizarServidor } = useServers();
    const [selectedServerId, setSelectedServerId] = useState<string | null>(null);

    const { verificarServidor, verificarTodos, enProgreso } = useMonitor(actualizarServidor);

    const handleCheck = async (id: string) => {
        await verificarServidor(id);
    };

    const handleInvestigate = (id: string) => {
        setSelectedServerId(id);
    };

    const handleAddServer = async (data: { name: string; host: string }) => {
        try {
            await agregarServidor(data.name, data.host);
        } catch (e) {
            console.error('Failed to add server', e);
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
            status: isChecking ? 'warning' : status, // Muestra warning mientrar revisa
            ports: s.resultadosPuertos.map(rp => ({
                port: rp.puerto,
                status: rp.estado === 'abierto' ? 'open' : 'closed',
                protocol: 'tcp' // Simplification
            })),
            onCheck: handleCheck,
            onInvestigate: handleInvestigate,
            onClick: setSelectedServerId
        };
    };

    const mappedServers = servidores.map(mapServerToProps);
    const selectedServer = servidores.find(s => s.id === selectedServerId) || null;
    const selectedServerMapped = selectedServer ? mapServerToProps(selectedServer) : null;

    return (
        <div className="flex flex-col gap-6 p-6 pb-20 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
                        <span className="material-symbols-outlined text-[32px] text-accent-neon">dns</span>
                        Gestión de Servidores
                    </h1>
                    <p className="text-gray-400 mt-1">Monitorea y administra la infraestructura de red</p>
                </div>

                <button
                    onClick={verificarTodos}
                    className="flex items-center gap-2 bg-panel-dark border border-gray-600 hover:border-accent-neon text-gray-200 px-4 py-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-accent-neon">
                    <span className="material-symbols-outlined">sync</span>
                    Refrescar Todos
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Formulario en columna 1 */}
                <div className="xl:col-span-1 flex flex-col gap-6">
                    <AddServerForm onAdd={handleAddServer} />

                    <div className="glass-panel p-6 rounded-xl border border-gray-700/50">
                        <h3 className="text-lg font-bold text-gray-200 mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-gray-400">info</span>
                            Resumen
                        </h3>
                        <ul className="flex flex-col gap-3 text-sm">
                            <li className="flex justify-between items-center">
                                <span className="text-gray-400">Total monitoreados:</span>
                                <span className="font-bold text-gray-200 font-mono text-lg">{mappedServers.length}</span>
                            </li>
                            <li className="flex justify-between items-center">
                                <span className="text-gray-400">En estado crítico:</span>
                                <span className="font-bold text-danger font-mono text-lg">{mappedServers.filter(s => s.status === 'alert').length}</span>
                            </li>
                            <li className="flex justify-between items-center">
                                <span className="text-gray-400">En estado OK:</span>
                                <span className="font-bold text-success font-mono text-lg">{mappedServers.filter(s => s.status === 'ok').length}</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Grid de servidores columnas 2-4 */}
                <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
                    {mappedServers.map(server => (
                        <ServerCard
                            key={server.id}
                            {...server}
                        />
                    ))}
                    {mappedServers.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center p-12 glass-panel border border-dashed border-gray-700">
                            <span className="material-symbols-outlined text-[48px] text-gray-600 mb-4">dns</span>
                            <p className="text-gray-400">No hay servidores configurados. Añade uno para comenzar.</p>
                        </div>
                    )}
                </div>
            </div>

            <ServerDetailModal
                isOpen={!!selectedServerId}
                server={selectedServerMapped}
                onClose={() => setSelectedServerId(null)}
                onCheck={handleCheck}
            />
        </div>
    );
};
