// Feature: frontend-redesign-futurista
// Requisitos: 5.6, 5.7, 5.8

import { StatusBadge } from '../common/StatusBadge';

export type NodeStatus = 'ok' | 'alert' | 'warning';

export interface NodeRow {
  id: string;
  name: string;
  status: NodeStatus;
  uptimeSeconds: number;
  loadPercent: number;
  /** true mientras el backend está verificando este nodo */
  isChecking?: boolean;
}

interface NodeTableProps {
  nodes: NodeRow[];
  onAction: (nodeId: string) => void;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function getLoadColorClass(loadPercent: number): string {
  if (loadPercent >= 80) return 'bg-alert-neon';
  if (loadPercent >= 60) return 'bg-warning';
  return 'bg-accent-neon';
}

export function getStatusColorClass(status: NodeStatus): string {
  if (status === 'ok') return 'text-accent-neon';
  if (status === 'alert') return 'text-alert-neon';
  return 'text-warning';
}

export function NodeTable({ nodes, onAction }: NodeTableProps) {
  return (
    <div className="glass-panel rounded-lg overflow-hidden" role="table" aria-label="Tabla de nodos monitoreados">
      <div role="rowgroup">
        <div role="row" className="grid grid-cols-5 px-4 py-2 text-xs text-gray-400 uppercase tracking-wider border-b border-white/5">
          <span role="columnheader">Identidad del Nodo</span>
          <span role="columnheader">Estado</span>
          <span role="columnheader">Tiempo Activo</span>
          <span role="columnheader">Puertos con Falla</span>
          <span role="columnheader">Acciones</span>
        </div>
      </div>
      <div role="rowgroup">
        {nodes.length === 0 ? (
          <div className="px-4 py-6 text-center text-gray-500 text-sm font-mono">
            No hay nodos registrados
          </div>
        ) : (
          nodes.map((node) => (
            <div
              key={node.id}
              role="row"
              className="grid grid-cols-5 px-4 py-3 items-center border-b border-white/5 hover:bg-white/5 transition-colors"
            >
              <span role="cell" className="font-mono text-sm text-white truncate">{node.name}</span>
              <span role="cell">
                <StatusBadge status={node.status} />
              </span>
              <span role="cell" className="font-mono text-sm text-gray-300">{formatUptime(node.uptimeSeconds)}</span>
              <span role="cell" className="pr-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getLoadColorClass(node.loadPercent)}`}
                      style={{ width: `${Math.min(node.loadPercent, 100)}%` }}
                      aria-label={`Puertos con falla: ${node.loadPercent}%`}
                    />
                  </div>
                  <span className="text-xs font-mono text-gray-400 w-8 text-right">{node.loadPercent}%</span>
                </div>
              </span>
              <span role="cell">
                <button
                  onClick={() => !node.isChecking && onAction(node.id)}
                  disabled={node.isChecking}
                  className={`px-3 py-1 text-xs font-mono rounded border transition-colors ${node.isChecking
                      ? 'border-gray-600 text-gray-500 cursor-not-allowed opacity-60'
                      : 'border-primary text-primary hover:bg-primary hover:text-white cursor-pointer'
                    }`}
                  aria-label={`Actualizar ${node.name}`}
                >
                  {node.isChecking ? (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] animate-spin">autorenew</span>
                      Verificando…
                    </span>
                  ) : 'Actualizar'}
                </button>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
