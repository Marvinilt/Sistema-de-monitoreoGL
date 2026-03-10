import { ParametersPanel } from '../components/ParametersPanel';

export function ParametersView() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Configuración Parámetros</h1>
        <p className="text-gray-400">
          Ajusta los umbrales de uso de recursos permitidos en los servidores para definir cuándo entrarán en estado de alerta.
        </p>
      </header>
      <div className="glass-panel p-6">
        <ParametersPanel />
      </div>
    </div>
  );
}
