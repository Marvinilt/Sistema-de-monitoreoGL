// Feature: frontend-redesign-futurista
// Requisitos: 5.1, 5.2, 5.3, 5.6

import { useState, useMemo } from 'react';
import { useServers } from '../../hooks/useServers';
import { useMonitor } from '../../hooks/useMonitor';
import { MetricCard } from './MetricCard';
import { HealthRingChart } from './HealthRingChart';
import { LatencyChart, LatencyData, TimeFilter } from './LatencyChart';
import { NodeTable, NodeRow } from './NodeTable';

// Simulated latency data since backend doesn't expose history endpoint
function generateLatencyData(points: number, maxMs: number): { timestamp: string; latencyMs: number }[] {
  return Array.from({ length: points }, (_, i) => ({
    timestamp: `${i}`,
    latencyMs: Math.floor(Math.random() * maxMs) + 10,
  }));
}

const SIMULATED_DATA: LatencyData = {
  '60m': generateLatencyData(12, 200),
  '24h': generateLatencyData(24, 300),
  '7d': generateLatencyData(14, 400),
};

export function Dashboard() {
  const { servidores, cargando, actualizarServidor } = useServers();
  const { verificarServidor, enProgreso } = useMonitor(actualizarServidor);
  const [activeFilter, setActiveFilter] = useState<TimeFilter>('60m');

  const totalServers = servidores.length;
  const okServers = servidores.filter((s) => s.estado === 'ok').length;
  const alertServers = servidores.filter((s) => s.estado === 'alerta').length;

  const nodes: NodeRow[] = useMemo(() =>
    servidores.map((s) => {
      const totalPuertos = s.resultadosPuertos.length;
      const puertosAbiertos = s.resultadosPuertos.filter(p => p.estado === 'abierto').length;
      // Calcula qué porcentaje de puertos monitoreados están accesibles (100% = todos OK)
      const portLoad = totalPuertos > 0
        ? Math.round(((totalPuertos - puertosAbiertos) / totalPuertos) * 100)
        : 0;
      return {
        id: s.id,
        name: s.nombre,
        status: s.estado === 'ok' ? 'ok' : s.estado === 'alerta' ? 'alert' : 'warning',
        uptimeSeconds: s.ultimaVerificacion
          ? Math.floor((Date.now() - new Date(s.creadoEn).getTime()) / 1000)
          : 0,
        loadPercent: portLoad,
        isChecking: enProgreso.has(s.id),
      };
    }),
    [servidores, enProgreso]
  );

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 font-mono text-sm">
        Cargando datos...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard label="Servidores Totales" value={totalServers} borderColor="primary" icon="dns" />
        <MetricCard label="En línea (OK)" value={okServers} borderColor="accent-neon" icon="check_circle" />
        <MetricCard label="Alertas Activas" value={alertServers} borderColor="alert-neon" icon="warning" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <HealthRingChart totalServers={totalServers} okServers={okServers} />
        </div>
        <div className="lg:col-span-2">
          <LatencyChart
            data={SIMULATED_DATA}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        </div>
      </div>

      {/* Node Table */}
      <NodeTable nodes={nodes} onAction={(id) => verificarServidor(id)} />
    </div>
  );
}
