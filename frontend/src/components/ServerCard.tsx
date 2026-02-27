import { Servidor } from '../types';
import { StatusBadge } from './StatusBadge';

interface Props {
  servidor: Servidor;
  enProgreso: boolean;
  onClick: () => void;
  onVerificar: () => void;
  onEliminar: () => void;
}

const fondoPorEstado: Record<Servidor['estado'], string> = {
  ok: 'bg-green-50 border-green-200',
  alerta: 'bg-red-50 border-red-200',
  desconocido: 'bg-gray-50 border-gray-200',
};

export function ServerCard({ servidor, enProgreso, onClick, onVerificar, onEliminar }: Props) {
  const fondo = fondoPorEstado[servidor.estado];
  const ultimaVer = servidor.ultimaVerificacion
    ? new Date(servidor.ultimaVerificacion).toLocaleString('es-CL')
    : 'Sin verificar';

  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer transition-shadow hover:shadow-md ${fondo}`}
      onClick={onClick}
      role="button"
      aria-label={`Ver detalle de ${servidor.nombre}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-gray-800">{servidor.nombre}</h3>
          <p className="text-xs text-gray-500">{servidor.host}</p>
        </div>
        <StatusBadge estado={servidor.estado} />
      </div>

      <div className="text-xs text-gray-500 mb-3">
        <span>{servidor.puertos.length} puerto(s) · {servidor.urls.length} URL(s)</span>
        <br />
        <span>Última verificación: {ultimaVer}</span>
      </div>

      {enProgreso && (
        <div className="flex items-center gap-1 text-xs text-blue-600 mb-2" aria-live="polite">
          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Verificando...
        </div>
      )}

      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onVerificar}
          disabled={enProgreso}
          className="flex-1 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Verificar
        </button>
        <button
          onClick={onEliminar}
          className="py-1 px-2 text-xs bg-white text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
          aria-label={`Eliminar ${servidor.nombre}`}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
