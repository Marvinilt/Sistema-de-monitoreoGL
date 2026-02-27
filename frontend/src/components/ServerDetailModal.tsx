import { Servidor } from '../types';

interface Props {
  servidor: Servidor;
  onCerrar: () => void;
  onAgregarPuerto: (puerto: number) => void;
  onEliminarPuerto: (puerto: number) => void;
  onAgregarUrl: (url: string) => void;
  onEliminarUrl: (urlId: string) => void;
}

const estadoPuertoColor: Record<string, string> = {
  abierto: 'text-green-700',
  cerrado: 'text-red-700',
  sin_respuesta: 'text-yellow-700',
};

const estadoUrlColor: Record<string, string> = {
  disponible: 'text-green-700',
  no_disponible: 'text-red-700',
  error_certificado: 'text-orange-700',
  desconocido: 'text-gray-500',
};

export function ServerDetailModal({
  servidor, onCerrar, onAgregarPuerto, onEliminarPuerto, onAgregarUrl, onEliminarUrl,
}: Props) {
  const handleAgregarPuerto = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const puerto = Number(fd.get('puerto'));
    if (!isNaN(puerto)) { onAgregarPuerto(puerto); e.currentTarget.reset(); }
  };

  const handleAgregarUrl = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const url = fd.get('url') as string;
    if (url?.trim()) { onAgregarUrl(url.trim()); e.currentTarget.reset(); }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalle de ${servidor.nombre}`}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="font-bold text-lg">{servidor.nombre}</h2>
            <p className="text-sm text-gray-500">{servidor.host}</p>
          </div>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 text-xl" aria-label="Cerrar">✕</button>
        </div>

        <div className="p-4 space-y-5">
          {/* Puertos */}
          <section>
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Puertos TCP</h3>
            {servidor.puertos.length === 0 ? (
              <p className="text-xs text-gray-400">Sin puertos configurados</p>
            ) : (
              <ul className="space-y-1">
                {servidor.puertos.map((p) => (
                  <li key={p} className="flex items-center justify-between text-sm">
                    <span className="font-mono">{p}</span>
                    <button onClick={() => onEliminarPuerto(p)} className="text-xs text-red-500 hover:underline">Eliminar</button>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={handleAgregarPuerto} className="flex gap-2 mt-2">
              <input name="puerto" type="number" min={0} max={65535} placeholder="Puerto (0-65535)"
                className="flex-1 border rounded px-2 py-1 text-sm" required />
              <button type="submit" className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">+</button>
            </form>
          </section>

          {/* URLs */}
          <section>
            <h3 className="font-semibold text-sm text-gray-700 mb-2">URLs / Sitios IIS</h3>
            {servidor.urls.length === 0 ? (
              <p className="text-xs text-gray-400">Sin URLs configuradas</p>
            ) : (
              <ul className="space-y-2">
                {servidor.urls.map((u) => (
                  <li key={u.id} className="text-sm border rounded p-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="break-all text-xs font-mono">{u.url}</span>
                      <button onClick={() => onEliminarUrl(u.id)} className="text-xs text-red-500 hover:underline shrink-0">Eliminar</button>
                    </div>
                    <div className={`text-xs mt-1 ${estadoUrlColor[u.estado]}`}>
                      {u.estado}{u.codigoHttp ? ` (HTTP ${u.codigoHttp})` : ''}
                      {u.errorCertificado ? ' · Certificado inválido' : ''}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={handleAgregarUrl} className="flex gap-2 mt-2">
              <input name="url" type="url" placeholder="https://sitio.empresa.com"
                className="flex-1 border rounded px-2 py-1 text-sm" required />
              <button type="submit" className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">+</button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
