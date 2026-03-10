import { useState, useEffect } from 'react';
import { obtenerConfiguracionParametros, actualizarConfiguracionParametros } from '../services/api';
import { ConfiguracionParametros } from '../types';

const PARAMETROS_VACIOS: ConfiguracionParametros = {
  umbralCpuPorcentaje: 90,
  umbralRamPorcentaje: 85,
  umbralDiscoPorcentaje: 90,
};

export function ParametersPanel() {
  const [parametros, setParametros] = useState<ConfiguracionParametros>(PARAMETROS_VACIOS);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  useEffect(() => {
    obtenerConfiguracionParametros().then((c) => {
      if (c) setParametros(c);
    });
  }, []);

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);
    try {
      const actualizado = await actualizarConfiguracionParametros(parametros);
      setParametros(actualizado);
      setMensaje({ tipo: 'ok', texto: 'Parámetros guardados correctamente' });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: (err as Error).message });
    } finally {
      setGuardando(false);
    }
  };

  const handleCambio = (campo: keyof ConfiguracionParametros, valor: string) => {
    setParametros((prev) => ({ ...prev, [campo]: Number(valor) }));
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleGuardar} className="space-y-6 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-panel-dark border border-white/5 rounded-lg p-5">
            <label className="block text-sm font-medium text-gray-300 mb-3">CPU Máxima (%)</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="100"
                value={parametros.umbralCpuPorcentaje}
                onChange={(e) => handleCambio('umbralCpuPorcentaje', e.target.value)}
                className="flex-1 bg-black/30 border border-white/10 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <span className="text-gray-500 font-mono">%</span>
            </div>
            <p className="mt-2 text-xs text-gray-500 hidden md:block">
              Si un servidor supera este umbral de CPU, entrará en alerta.
            </p>
          </div>

          <div className="bg-panel-dark border border-white/5 rounded-lg p-5">
            <label className="block text-sm font-medium text-gray-300 mb-3">RAM Máxima (%)</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="100"
                value={parametros.umbralRamPorcentaje}
                onChange={(e) => handleCambio('umbralRamPorcentaje', e.target.value)}
                className="flex-1 bg-black/30 border border-white/10 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <span className="text-gray-500 font-mono">%</span>
            </div>
            <p className="mt-2 text-xs text-gray-500 hidden md:block">
              Si un servidor supera este umbral de RAM, entrará en alerta.
            </p>
          </div>

          <div className="bg-panel-dark border border-white/5 rounded-lg p-5">
            <label className="block text-sm font-medium text-gray-300 mb-3">Disco Máximo (%)</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="100"
                value={parametros.umbralDiscoPorcentaje}
                onChange={(e) => handleCambio('umbralDiscoPorcentaje', e.target.value)}
                className="flex-1 bg-black/30 border border-white/10 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <span className="text-gray-500 font-mono">%</span>
            </div>
            <p className="mt-2 text-xs text-gray-500 hidden md:block">
              Límite de capacidad del disco duro, por encima generará alerta.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-white/5">
          <button
            type="submit"
            disabled={guardando}
            className="flex items-center gap-2 px-6 py-2 bg-primary/90 text-white rounded-lg hover:bg-primary font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
          >
            {guardando ? (
              <span className="material-symbols-outlined animate-spin text-sm" aria-hidden="true">refresh</span>
            ) : (
              <span className="material-symbols-outlined text-sm" aria-hidden="true">save</span>
            )}
            Guardar parámetros
          </button>
          {mensaje && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border ${
              mensaje.tipo === 'ok' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-red-500/10 text-red-500 border-red-500/20'
            }`}>
              <span className="material-symbols-outlined text-[16px]">
                {mensaje.tipo === 'ok' ? 'check_circle' : 'error'}
              </span>
              {mensaje.texto}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
