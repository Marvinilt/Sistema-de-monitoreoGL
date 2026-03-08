import React, { useState } from 'react';

export interface AddServerFormProps {
    onAdd: (server: { name: string; host: string }) => void;
}

export const AddServerForm: React.FC<AddServerFormProps> = ({ onAdd }) => {
    const [name, setName] = useState('');
    const [host, setHost] = useState('');
    const [errors, setErrors] = useState<{ name?: string; host?: string }>({});

    const validate = () => {
        const newErrors: { name?: string; host?: string } = {};
        if (!name.trim()) {
            newErrors.name = 'El nombre es requerido.';
        }

        // IPV4 or hostname regex
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;

        if (!host.trim()) {
            newErrors.host = 'El host es requerido.';
        } else if (!ipv4Regex.test(host) && !hostnameRegex.test(host)) {
            newErrors.host = 'Debe ser una IP o Hostname válido.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onAdd({ name: name.trim(), host: host.trim() });
            setName('');
            setHost('');
            setErrors({});
        }
    };

    return (
        <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-xl border border-gray-700/50 flex flex-col gap-4">
            <h3 className="text-xl font-bold text-gray-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-accent-neon">add_circle</span>
                Añadir Servidor
            </h3>

            <div className="flex flex-col gap-1">
                <label htmlFor="name" className="text-sm font-medium text-gray-300">
                    Nombre del Servidor
                </label>
                <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`bg-panel-dark border ${errors.name ? 'border-danger focus:ring-danger' : 'border-gray-600 focus:ring-accent-neon'} text-gray-200 rounded-lg p-2 focus:outline-none focus:ring-2`}
                    placeholder="Ej: Base de Datos Principal"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && <p id="name-error" className="text-xs text-danger mt-1">{errors.name}</p>}
            </div>

            <div className="flex flex-col gap-1">
                <label htmlFor="host" className="text-sm font-medium text-gray-300">
                    Host (IP o Dominio)
                </label>
                <input
                    id="host"
                    type="text"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    className={`bg-panel-dark border ${errors.host ? 'border-danger focus:ring-danger' : 'border-gray-600 focus:ring-accent-neon'} text-gray-200 rounded-lg p-2 font-mono focus:outline-none focus:ring-2`}
                    placeholder="Ej: 192.168.1.100 o db.internal.net"
                    aria-invalid={!!errors.host}
                    aria-describedby={errors.host ? 'host-error' : undefined}
                />
                {errors.host && <p id="host-error" className="text-xs text-danger mt-1">{errors.host}</p>}
            </div>

            <button
                type="submit"
                className="mt-2 flex items-center justify-center gap-2 bg-accent-neon text-black font-bold py-2 px-4 rounded-lg hover:brightness-110 transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-background-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <span className="material-symbols-outlined text-[20px]">save</span>
                Guardar Servidor
            </button>
        </form>
    );
};
