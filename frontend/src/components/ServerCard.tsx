import { Servidor, EstadoPuerto, EstadoUrl } from '../types';
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

const iconoPuerto: Record<EstadoPuerto, { icon: string; color: string }> = {
  abierto:      { icon: '●', color: 'text-green-600' },
  cerrado:      { icon: '●', color: 'text-red-600' },
  sin_respuesta:{ icon: '●', color: 'text-yellow-500' },
};

const iconoUrl: Record<EstadoUrl, { icon: string; color: string }> = {
  disponible:       { icon: '●', color: 'text-green-600' },
  no_disponible:    { icon: '●', color: 'text-red-600' },
  error_certificado:{ icon: '●', color: 'text-orange-500' },
  desconocido:      { icon: '○', color: 'text-gray-400' },
};

export function ServerCard({ servidor, enProgreso, onClick, onVerificar, onEliminar }: Props) {
  const fondo = fondoPorEstado[servidor.estado];
  const ultimaVer = servidor.ultimaVerificacion
    ? new Date(servidor.ultimaVerificacion).toLocaleString('es-CL')
    : 'Sin verificar';

  const tienePuertosVerificados = servidor.resultadosPuertos?.length > 0;
  const tieneUrlsVerificadas = servidor.urls.some((u) => u.estado !== 'desconocido');

  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer transition-shadow hover:shadow-md ${fondo}`}
      onClick={onClick}
      role="button"
      aria-label={`Ver detalle de ${servidor.nombre}`}
    >
      {/* Encabezado */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-gray-800 text-sm">{servidor.nombre}</h3>
          <p className="text-xs text-gray-500 font-mono">{servidor.host}</p>
        </div>
        <StatusBadge estado={servidor.estado} />
      </div>

      {/* Resultados de puertos */}
      {tienePuertosVerificados ? (
        <div className="mb-2">
          <p className="text-xs text-gray-500 mb-1">Puertos:</p>
          <div className="flex flex-wrap gap-1">
            {servidor.resultadosPuertos.map((r) => {
              const { icon, color } = iconoPuerto[r.estado];
              return (
                <span
                  key={r.puerto}
                  className={`inline-flex items-center gap-0.5 text-xs font-mono px-1.5 py-0.5 rounded bg-white/60 border ${
                    r.estado === 'abierto' ? 'border-green-200' :
                    r.estado === 'cerrado' ? 'border-red-200' : 'border-yellow-200'
                  }`}
                  title={`Puerto ${r.puerto}: ${r.estado}${r.latenciaMs ? ` (${r.latenciaMs}ms)` : ''}`}
                >
                  <span className={color}>{icon}</span>
                  {r.puerto}
                </span>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400 mb-2">
          Puertos: {servidor.puertos.length > 0 ? servidor.puertos.join(', ') : 'ninguno'}
        </p>
      )}

      {/* Resultados de URLs */}
      {servidor.urls.length > 0 && (
        <div className="mb-2">
          <p className="text-xs text-gray-500 mb-1">URLs:</p>
          <div className="space-y-0.5">
            {servidor.urls.map((u) => {
              const { icon, color } = iconoUrl[u.estado];
              const nombreCorto = u.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
              return (
                <div key={u.id} className="flex items-center gap-1 text-xs" title={`${u.url}: ${u.estado}${u.codigoHttp ? ` HTTP ${u.codigoHttp}` : ''}`}>
                  <span className={`${color} shrink-0`}>{icon}</span>
                  <span className="truncate text-gray-600 font-mono">{nombreCorto}</span>
                  {u.codigoHttp && (
                    <span className={`shrink-0 ${u.codigoHttp >= 400 ? 'text-red-500' : 'text-green-600'}`}>
                      {u.codigoHttp}
                    </span>
                  )}
                  {u.errorCertificado && (
                    <span className="shrink-0 text-orange-500" title="Error de certificado SSL">🔒</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Última verificación */}
      <p className="text-xs text-gray-400 mb-2">
        {tieneUrlsVerificadas || tienePuertosVerificados ? `Verificado: ${ultimaVer}` : 'Sin verificar'}
      </p>

      {/* Spinner */}
      {enProgreso && (
        <div className="flex items-center gap-1 text-xs text-blue-600 mb-2" aria-live="polite">
          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Verificando...
        </div>
      )}

      {/* Acciones */}
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
