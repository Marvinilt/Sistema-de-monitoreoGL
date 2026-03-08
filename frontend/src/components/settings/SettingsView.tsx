import React, { useState } from 'react';

interface SmtpConfig {
    host: string;
    port: number;
    secure: boolean;
    rejectUnauthorized: boolean;
    auth: {
        user: string;
        pass: string;
    };
    from: string;
    to: string;
    subjectPrefix: string;
}

const DEFAULT_CONFIG: SmtpConfig = {
    host: '172.30.1.50',
    port: 25,
    secure: false,
    rejectUnauthorized: false,
    auth: { user: '', pass: '' },
    from: 'Monitor <mlemus@minfin.gob.gt>',
    to: 'mlemus@minfin.gob.gt',
    subjectPrefix: '[Monitor Servidores]'
};

export const SettingsView: React.FC = () => {
    const [config, setConfig] = useState<SmtpConfig>(DEFAULT_CONFIG);
    const [intervalMin, setIntervalMin] = useState<number>(5);
    const [saved, setSaved] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Guardando configuración SMTP:', config, 'Intervalo:', intervalMin);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="flex flex-col gap-6 p-6 pb-20 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
                    <span className="material-symbols-outlined text-[32px] text-accent-neon">settings</span>
                    Configuración
                </h1>
                <p className="text-gray-400 mt-1">Preferencias del sistema de monitoreo y notificaciones</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <form onSubmit={handleSubmit} className="md:col-span-2 glass-panel p-6 rounded-xl border border-gray-700/50 flex flex-col gap-6">
                    <h2 className="text-xl font-bold text-gray-200 border-b border-gray-700/50 pb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-gray-400">mail</span>
                        Servidor SMTP
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-300">Host</label>
                            <input type="text" value={config.host} onChange={e => setConfig({ ...config, host: e.target.value })} className="bg-panel-dark border border-gray-600 focus:ring-accent-neon text-gray-200 rounded-lg p-2 font-mono focus:outline-none focus:ring-2" required />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-300">Puerto</label>
                            <input type="number" value={config.port} onChange={e => setConfig({ ...config, port: parseInt(e.target.value) || 25 })} className="bg-panel-dark border border-gray-600 focus:ring-accent-neon text-gray-200 rounded-lg p-2 font-mono focus:outline-none focus:ring-2" required />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-300">Usuario (Opcional)</label>
                            <input type="text" value={config.auth.user} onChange={e => setConfig({ ...config, auth: { ...config.auth, user: e.target.value } })} className="bg-panel-dark border border-gray-600 focus:ring-accent-neon text-gray-200 rounded-lg p-2 focus:outline-none focus:ring-2" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-300">Contraseña (Opcional)</label>
                            <input type="password" value={config.auth.pass} onChange={e => setConfig({ ...config, auth: { ...config.auth, pass: e.target.value } })} className="bg-panel-dark border border-gray-600 focus:ring-accent-neon text-gray-200 rounded-lg p-2 focus:outline-none focus:ring-2" />
                        </div>
                    </div>

                    <div className="flex gap-4 p-3 bg-panel-dark/50 rounded-lg border border-gray-700/30">
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                            <input type="checkbox" checked={config.secure} onChange={e => setConfig({ ...config, secure: e.target.checked })} className="rounded bg-panel-dark border-gray-600 text-accent-neon focus:ring-accent-neon" />
                            Usar SSL/TLS Seguro
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                            <input type="checkbox" checked={config.rejectUnauthorized} onChange={e => setConfig({ ...config, rejectUnauthorized: e.target.checked })} className="rounded bg-panel-dark border-gray-600 text-accent-neon focus:ring-accent-neon" />
                            Verificar Certificado
                        </label>
                    </div>

                    <h2 className="text-xl font-bold text-gray-200 border-b border-gray-700/50 pb-2 mt-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-gray-400">send</span>
                        Mensajería
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-300">Remitente (From)</label>
                            <input type="text" value={config.from} onChange={e => setConfig({ ...config, from: e.target.value })} className="bg-panel-dark border border-gray-600 focus:ring-accent-neon text-gray-200 rounded-lg p-2 focus:outline-none focus:ring-2" required />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-300">Destinatarios (To)</label>
                            <input type="text" value={config.to} onChange={e => setConfig({ ...config, to: e.target.value })} className="bg-panel-dark border border-gray-600 focus:ring-accent-neon text-gray-200 rounded-lg p-2 focus:outline-none focus:ring-2" required />
                        </div>
                        <div className="flex flex-col gap-1 sm:col-span-2">
                            <label className="text-sm font-medium text-gray-300">Prefijo del Asunto</label>
                            <input type="text" value={config.subjectPrefix} onChange={e => setConfig({ ...config, subjectPrefix: e.target.value })} className="bg-panel-dark border border-gray-600 focus:ring-accent-neon text-gray-200 rounded-lg p-2 focus:outline-none focus:ring-2" required />
                        </div>
                    </div>

                    <h2 className="text-xl font-bold text-gray-200 border-b border-gray-700/50 pb-2 mt-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-gray-400">schedule</span>
                        Frecuencia de Monitoreo
                    </h2>
                    <div className="flex items-center gap-4">
                        <input type="range" min="1" max="60" value={intervalMin} onChange={e => setIntervalMin(parseInt(e.target.value))} className="w-full sm:w-1/2 accent-accent-neon" />
                        <span className="text-accent-neon font-bold text-lg w-20 text-right">{intervalMin} min</span>
                    </div>

                    <div className="flex justify-end mt-4 border-t border-gray-700/50 pt-4 items-center gap-4">
                        {saved && <span className="text-success font-medium flex items-center gap-1"><span className="material-symbols-outlined text-[20px]">check_circle</span> Guardado correctamente</span>}
                        <button
                            type="submit"
                            className="flex items-center justify-center gap-2 bg-accent-neon text-black font-bold py-2 px-6 rounded-lg hover:brightness-110 transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-background-dark"
                        >
                            <span className="material-symbols-outlined text-[20px]">save</span>
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
