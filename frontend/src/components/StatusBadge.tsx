import { EstadoServidor } from '../types';

interface Props {
  estado: EstadoServidor;
}

const config: Record<EstadoServidor, { label: string; className: string }> = {
  ok: { label: 'OK', className: 'bg-green-100 text-green-800 border border-green-300' },
  alerta: { label: 'Alerta', className: 'bg-red-100 text-red-800 border border-red-300' },
  desconocido: { label: 'Desconocido', className: 'bg-gray-100 text-gray-600 border border-gray-300' },
};

export function StatusBadge({ estado }: Props) {
  const { label, className } = config[estado];
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}
