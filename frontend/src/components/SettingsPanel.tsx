import { useState, useEffect } from 'react';
import { obtenerConfiguracion, actualizarConfiguracion } from '../services/api';

export function SettingsPanel() {
  const [intervalo, setIntervalo] = useState(60);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    obtenerConfiguracion().then((c) => setIntervalo(c.intervaloMonitoreoSegundos));
  }, []);

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);
    try {
      await actualizarConfiguracion({ intervaloMonitoreoSegundos: intervalo });
      setMensaje('Configuración guardada');
    } catch (err) {
      setMensaje((err as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={handleGuardar} className="flex items-center gap-3 text-sm">
      <label htmlFor="intervalo" className="text-gray-600 whitespace-nowrap">
        Intervalo de monitoreo:
      </label>
      <input
        id="intervalo"
        type="number"
        min={30}
        max={3600}
        value={intervalo}
        onChange={(e) => setIntervalo(Number(e.target.value))}
        className="w-24 border rounded px-2 py-1 text-sm"
      />
      <span className="text-gray-500">seg</span>
      <button
        type="submit"
        disabled={guardando}
        className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        {guardando ? '...' : 'Guardar'}
      </button>
      {mensaje && <span className="text-xs text-green-700">{mensaje}</span>}
    </form>
  );
}
