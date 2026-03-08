// Feature: frontend-redesign-futurista
// Requisitos: 5.3, 5.4, 5.5

import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export type TimeFilter = '60m' | '24h' | '7d';

export interface LatencyDataPoint {
  timestamp: string;
  latencyMs: number;
}

export type LatencyData = Record<TimeFilter, LatencyDataPoint[]>;

interface LatencyChartProps {
  data: LatencyData;
  activeFilter?: TimeFilter;
  onFilterChange?: (filter: TimeFilter) => void;
}

const FILTERS: TimeFilter[] = ['60m', '24h', '7d'];

export function LatencyChart({ data, activeFilter: externalFilter, onFilterChange }: LatencyChartProps) {
  const [internalFilter, setInternalFilter] = useState<TimeFilter>('60m');
  const activeFilter = externalFilter ?? internalFilter;

  const handleFilterChange = (f: TimeFilter) => {
    setInternalFilter(f);
    onFilterChange?.(f);
  };

  const activeData = data[activeFilter];

  return (
    <div className="glass-panel rounded-lg p-4" role="region" aria-label="Gráfico de latencia">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400 uppercase tracking-wider">Latency</p>
        <div className="flex gap-1" role="group" aria-label="Filtro de tiempo">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => handleFilterChange(f)}
              className={`px-2 py-0.5 text-xs font-mono rounded transition-colors ${
                activeFilter === f
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              aria-pressed={activeFilter === f}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {activeData.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-gray-500 text-sm font-mono">
          Sin datos disponibles
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={activeData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0d59f2" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#0d59f2" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="timestamp" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: '#161b26', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 6, fontSize: 11 }}
              labelStyle={{ color: '#9ca3af' }}
              itemStyle={{ color: '#0d59f2' }}
            />
            <Area
              type="monotone"
              dataKey="latencyMs"
              stroke="#0d59f2"
              strokeWidth={2}
              fill="url(#latencyGradient)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
