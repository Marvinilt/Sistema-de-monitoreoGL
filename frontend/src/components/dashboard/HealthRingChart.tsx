// Feature: frontend-redesign-futurista
// Requisitos: 5.2, 5.10

import { PieChart, Pie, Cell } from 'recharts';

interface HealthRingChartProps {
  totalServers: number;
  okServers: number;
}

export function calculateOkPercentage(totalServers: number, okServers: number): number {
  if (totalServers === 0) return 0;
  return (okServers / totalServers) * 100;
}

export function HealthRingChart({ totalServers, okServers }: HealthRingChartProps) {
  const percentage = calculateOkPercentage(totalServers, okServers);
  const displayPercent = Math.round(percentage);

  const data = totalServers === 0
    ? [{ value: 1 }]
    : [
        { value: okServers },
        { value: totalServers - okServers },
      ];

  const colors = totalServers === 0
    ? ['#161b26']
    : ['#0bda5e', '#161b26'];

  return (
    <div className="glass-panel rounded-lg p-4 flex flex-col items-center" role="img" aria-label={`Salud del sistema: ${displayPercent}% de servidores OK`}>
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">System Health</p>
      <div className="relative">
        <PieChart width={140} height={140}>
          <Pie
            data={data}
            cx={65}
            cy={65}
            innerRadius={45}
            outerRadius={65}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={colors[index]} />
            ))}
          </Pie>
        </PieChart>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold font-mono text-accent-neon">{displayPercent}%</span>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-1 font-mono">{okServers}/{totalServers} OK</p>
    </div>
  );
}
