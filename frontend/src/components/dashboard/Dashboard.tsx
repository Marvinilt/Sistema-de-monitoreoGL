// Feature: frontend-redesign-futurista
// Requisitos: 5.1, 5.2, 5.3, 5.6

import { useState, useMemo } from 'react';
import { useServers } from '../../hooks/useServers';
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
  '7d':  generateLatencyData(14, 400),
};

export function Dashboard() {
  const { servidores, cargando } = useServers();
  const [activeFilter, setActiveFilter] = useState<TimeFilter>('60m');

  const totalServers = servidores.length;
  const okServers = servidores.filter((s) => s.estado === 'ok').length;
  const alertServers = servidores.filter((s) => s.estado === 'alerta').length;

  const nodes: NodeRow[] = useMemo(() =>
    servidores.map((s) => ({
      id: s.id,
      name: s.nombre,
      status: s.estado === 'ok' ? 'ok' : s.estado === 'alerta' ? 'alert' : 'warning',
      uptimeSeconds: s.ultimaVerificacion
        ? Math.floor((Date.now() - new Date(s.creadoEn).getTime()) / 1000)
        : 0,
      loadPercent: Math.floor(Math.random() * 100),
    })),
    [servidores]
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
        <MetricCard label="Total Servers" value={totalServers} borderColor="primary" icon="dns" />
        <MetricCard label="OK Status" value={okServers} borderColor="accent-neon" icon="check_circle" />
        <MetricCard label="Active Alerts" value={alertServers} borderColor="alert-neon" icon="warning" />
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
      <NodeTable nodes={nodes} onAction={(id) => console.log('action', id)} />
    </div>
  );
}
