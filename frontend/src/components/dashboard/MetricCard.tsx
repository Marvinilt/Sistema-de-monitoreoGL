// Feature: frontend-redesign-futurista
// Requisitos: 5.1, 5.9

type BorderColor = 'primary' | 'accent-neon' | 'alert-neon';

interface MetricCardProps {
  label: string;
  value: number;
  borderColor: BorderColor;
  icon?: string;
}

const borderColorClass: Record<BorderColor, string> = {
  'primary':    'border-l-primary',
  'accent-neon':'border-l-accent-neon',
  'alert-neon': 'border-l-alert-neon',
};

export function MetricCard({ label, value, borderColor, icon }: MetricCardProps) {
  return (
    <div
      className={`glass-panel rounded-lg p-4 border-l-4 ${borderColorClass[borderColor]}`}
      role="region"
      aria-label={label}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 font-sans uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-white font-mono mt-1">{value}</p>
        </div>
        {icon && (
          <span className="material-symbols-outlined text-3xl text-gray-500" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}
