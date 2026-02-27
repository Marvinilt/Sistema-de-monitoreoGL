import { useState, useCallback } from 'react';
import { Servidor } from '../types';
import { useServers } from '../hooks/useServers';
import { useMonitor } from '../hooks/useMonitor';
import { SummaryBar } from './SummaryBar';
import { ServerCard } from './ServerCard';
import { ServerDetailModal } from './ServerDetailModal';
import { AddServerForm } from './AddServerForm';
import { SettingsPanel } from './SettingsPanel';

export function Dashboard() {
  const {
    servidores, cargando, error,
    actualizarServidor, agregarServidor, eliminarServidor,
    agregarPuerto, eliminarPuerto, agregarUrl, eliminarUrl,
  } = useServers();

  const onServerUpdate = useCallback(
    (servidor: Servidor) => actualizarServidor(servidor),
    [actualizarServidor]
  );

  const { enProgreso, verificarServidor, verificarTodos } = useMonitor(onServerUpdate);
  const [servidorDetalle, setServidorDetalle] = useState<Servidor | null>(null);
  const [verificandoTodos, setVerificandoTodos] = useState(false);

  const handleVerificarTodos = async () => {
    setVerificandoTodos(true);
    try { await verificarTodos(); } finally { setVerificandoTodos(false); }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Cargando servidores...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <h1 className="text-xl font-bold text-gray-800">Monitor de Servidores</h1>
        <SettingsPanel />
      </header>

      {/* Barra de resumen */}
      <SummaryBar
        servidores={servidores}
        onVerificarTodos={handleVerificarTodos}
        verificando={verificandoTodos}
      />

      {/* Contenido */}
      <main className="p-6 space-y-6">
        <AddServerForm onAgregar={agregarServidor} />

        {servidores.length === 0 ? (
          <div className="text-center text-gray-400 py-16">
            No hay servidores registrados. Agrega uno para comenzar.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {servidores.map((s) => (
              <ServerCard
                key={s.id}
                servidor={s}
                enProgreso={enProgreso.has(s.id)}
                onClick={() => setServidorDetalle(s)}
                onVerificar={() => verificarServidor(s.id)}
                onEliminar={() => eliminarServidor(s.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal de detalle */}
      {servidorDetalle && (
        <ServerDetailModal
          servidor={servidores.find((s) => s.id === servidorDetalle.id) ?? servidorDetalle}
          onCerrar={() => setServidorDetalle(null)}
          onAgregarPuerto={(p) => agregarPuerto(servidorDetalle.id, p)}
          onEliminarPuerto={(p) => eliminarPuerto(servidorDetalle.id, p)}
          onAgregarUrl={(u) => agregarUrl(servidorDetalle.id, u)}
          onEliminarUrl={(uid) => eliminarUrl(servidorDetalle.id, uid)}
        />
      )}
    </div>
  );
}
