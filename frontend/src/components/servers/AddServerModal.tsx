import React, { useState, useEffect } from 'react';

export interface AddServerData {
    name: string;
    host: string;
    ports?: number[];
    url?: string;
}

export interface AddServerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (data: AddServerData) => Promise<void>;
}

export const AddServerModal: React.FC<AddServerModalProps> = ({ isOpen, onClose, onAdd }) => {
    const [name, setName] = useState('');
    const [host, setHost] = useState('');
    const [portsInput, setPortsInput] = useState('');
    const [urlInput, setUrlInput] = useState('');
    const [errors, setErrors] = useState<{ name?: string; host?: string; ports?: string; url?: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Trap focus inside modal logic and Esc close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        } else {
            // reset form on close
            setName('');
            setHost('');
            setPortsInput('');
            setUrlInput('');
            setErrors({});
            setIsSubmitting(false);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const validate = () => {
        const newErrors: { name?: string; host?: string; ports?: string; url?: string } = {};
        if (!name.trim()) newErrors.name = 'El nombre es requerido.';

        // IPV4 or hostname regex
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;

        if (!host.trim()) {
            newErrors.host = 'El host es requerido.';
        } else if (!ipv4Regex.test(host) && !hostnameRegex.test(host)) {
            newErrors.host = 'Debe ser una IP o Hostname válido.';
        }

        if (portsInput.trim()) {
            const ports = portsInput.split(',').map(p => p.trim());
            const invalidPort = ports.some(p => isNaN(Number(p)) || Number(p) <= 0 || Number(p) > 65535);
            if (invalidPort) newErrors.ports = 'Los puertos deben ser números entre 1 y 65535 separados por comas.';
        }

        if (urlInput.trim()) {
            try {
                new URL(urlInput);
            } catch {
                newErrors.url = 'La URL debe ser válida (ej: https://ejemplo.com).';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            setIsSubmitting(true);
            const parsedPorts = portsInput.trim() ? portsInput.split(',').map(p => Number(p.trim())) : undefined;
            const parsedUrl = urlInput.trim() || undefined;
            try {
                await onAdd({ name: name.trim(), host: host.trim(), ports: parsedPorts, url: parsedUrl });
                onClose();
            } catch (error) {
                console.error("Error al añadir servidor:", error);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div className="glass-panel border border-gray-700/50 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative shadow-accent-neon/5 animate-slide-up">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-accent-neon rounded-full p-1"
                    aria-label="Cerrar modal"
                >
                    <span className="material-symbols-outlined self-center flex">close</span>
                </button>

                <h2 id="modal-title" className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="material-symbols-outlined text-accent-neon text-3xl">dns</span>
                    Añadir Nuevo Servidor
                </h2>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="name" className="text-sm font-medium text-gray-300">
                            Nombre del Servidor
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={`bg-panel-dark border ${errors.name ? 'border-danger focus:ring-danger' : 'border-gray-600 focus:ring-accent-neon'} text-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 transition-all`}
                            placeholder="Ej: Base de Datos Principal"
                        />
                        {errors.name && <p className="text-xs text-danger mt-1">{errors.name}</p>}
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
                            className={`bg-panel-dark border ${errors.host ? 'border-danger focus:ring-danger' : 'border-gray-600 focus:ring-accent-neon'} text-gray-200 rounded-lg p-2.5 font-mono focus:outline-none focus:ring-2 transition-all`}
                            placeholder="Ej: 192.168.1.100 o api.dominio.com"
                        />
                        {errors.host && <p className="text-xs text-danger mt-1">{errors.host}</p>}
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="ports" className="text-sm font-medium text-gray-300 flex items-center justify-between">
                            <span>Puertos a Monitorear</span>
                            <span className="text-xs text-gray-500 font-normal ml-2">(Opcional)</span>
                        </label>
                        <input
                            id="ports"
                            type="text"
                            value={portsInput}
                            onChange={(e) => setPortsInput(e.target.value)}
                            className={`bg-panel-dark border ${errors.ports ? 'border-danger focus:ring-danger' : 'border-gray-600 focus:ring-accent-neon'} text-gray-200 rounded-lg p-2.5 font-mono focus:outline-none focus:ring-2 transition-all`}
                            placeholder="Ej: 80, 443, 5432"
                        />
                        {errors.ports && <p className="text-xs text-danger mt-1">{errors.ports}</p>}
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="url" className="text-sm font-medium text-gray-300 flex items-center justify-between">
                            <span>URL del Sitio Web</span>
                            <span className="text-xs text-gray-500 font-normal ml-2">(Opcional)</span>
                        </label>
                        <input
                            id="url"
                            type="text"
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            className={`bg-panel-dark border ${errors.url ? 'border-danger focus:ring-danger' : 'border-gray-600 focus:ring-accent-neon'} text-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 transition-all font-mono`}
                            placeholder="Ej: https://misitio.com"
                        />
                        {errors.url && <p className="text-xs text-danger mt-1">{errors.url}</p>}
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 bg-accent-neon text-black font-bold py-2 px-6 rounded-lg hover:brightness-110 transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-background-dark disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <span className="material-symbols-outlined animate-spin-slow">autorenew</span>
                            ) : (
                                <span className="material-symbols-outlined">save</span>
                            )}
                            {isSubmitting ? 'Guardando...' : 'Guardar Servidor'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
