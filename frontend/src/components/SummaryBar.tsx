import { Servidor } from '../types';

interface Props {
  servidores: Servidor[];
  onVerificarTodos: () => void;
  verificando: boolean;
}

export function SummaryBar({ servidores, onVerificarTodos, verificando }: Props) {
  const ok = servidores.filter((s) => s.estado === 'ok').length;
  const alerta = servidores.filter((s) => s.estado === 'alerta').length;
  const total = servidores.length;

  return (
    <div className="flex items-center justify-between bg-white border-b px-6 py-3 shadow-sm">
      <div className="flex gap-6 text-sm">
        <span className="text-gray-500">Total: <strong>{total}</strong></span>
        <span className="text-green-700">OK: <strong>{ok}</strong></span>
        <span className="text-red-700">Alerta: <strong>{alerta}</strong></span>
      </div>
      <button
        onClick={onVerificarTodos}
        disabled={verificando}
        className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {verificando ? 'Verificando...' : 'Verificar Todo'}
      </button>
    </div>
  );
}
