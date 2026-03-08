import React, { useState } from 'react';
import { ServerCard, ServerCardProps } from './ServerCard';
import { AddServerForm } from './AddServerForm';
import { ServerDetailModal } from './ServerDetailModal';

// Temporal mock data for visual building
const MOCK_SERVERS: ServerCardProps[] = [
    { id: '1', name: 'Database Prod', host: '10.0.0.15', status: 'ok', ports: [{ port: 5432, status: 'open', protocol: 'tcp' }], onCheck: () => { }, onInvestigate: () => { } },
    { id: '2', name: 'Web Server Alpha', host: '10.0.0.22', status: 'alert', ports: [{ port: 80, status: 'closed', protocol: 'tcp' }, { port: 443, status: 'open', protocol: 'tcp' }], onCheck: () => { }, onInvestigate: () => { } },
    { id: '3', name: 'Cache Layer', host: '10.0.0.50', status: 'warning', ports: [{ port: 6379, status: 'open', protocol: 'tcp' }], onCheck: () => { }, onInvestigate: () => { } },
    { id: '4', name: 'New Instance', host: 'server.cloud.net', status: 'unknown', ports: [], onCheck: () => { }, onInvestigate: () => { } }
];

export const ServersView: React.FC = () => {
    const [servers, setServers] = useState<ServerCardProps[]>(MOCK_SERVERS);
    const [selectedServerId, setSelectedServerId] = useState<string | null>(null);

    const handleCheck = (id: string) => {
        console.log('Checking server', id);
    };

    const handleInvestigate = (id: string) => {
        console.log('Investigating server', id);
        setSelectedServerId(id);
    };

    const handleAddServer = (data: { name: string; host: string }) => {
        console.log('Adding server', data);
        const newServer: ServerCardProps = {
            id: Math.random().toString(36).substring(7),
            name: data.name,
            host: data.host,
            status: 'unknown',
            ports: [],
            onCheck: handleCheck,
            onInvestigate: handleInvestigate,
            onClick: setSelectedServerId
        };
        setServers([...servers, newServer]);
    };

    const selectedServer = servers.find(s => s.id === selectedServerId) || null;

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

                <button className="flex items-center gap-2 bg-panel-dark border border-gray-600 hover:border-accent-neon text-gray-200 px-4 py-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-accent-neon">
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
                                <span className="font-bold text-gray-200 font-mono text-lg">{servers.length}</span>
                            </li>
                            <li className="flex justify-between items-center">
                                <span className="text-gray-400">En estado crítico:</span>
                                <span className="font-bold text-danger font-mono text-lg">{servers.filter(s => s.status === 'alert').length}</span>
                            </li>
                            <li className="flex justify-between items-center">
                                <span className="text-gray-400">En estado OK:</span>
                                <span className="font-bold text-success font-mono text-lg">{servers.filter(s => s.status === 'ok').length}</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Grid de servidores columnas 2-4 */}
                <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
                    {servers.map(server => (
                        <ServerCard
                            key={server.id}
                            {...server}
                            onCheck={handleCheck}
                            onInvestigate={handleInvestigate}
                            onClick={setSelectedServerId}
                        />
                    ))}
                </div>
            </div>

            <ServerDetailModal
                isOpen={!!selectedServerId}
                server={selectedServer}
                onClose={() => setSelectedServerId(null)}
                onCheck={handleCheck}
            />
        </div>
    );
};
