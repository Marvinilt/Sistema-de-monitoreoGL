// Feature: frontend-redesign-futurista
// Requisitos: 10.1, 10.2, 10.3, 10.4, 10.5

export type ServerStatus = 'ok' | 'alert' | 'warning' | 'unknown';

interface StatusBadgeProps {
  status: ServerStatus;
  label?: string;
}

const statusConfig: Record<ServerStatus, { label: string; colorClass: string; extraClass: string }> = {
  ok:      { label: 'OK',      colorClass: 'text-accent-neon border-accent-neon', extraClass: 'neon-glow-green' },
  alert:   { label: 'ALERT',   colorClass: 'text-alert-neon border-alert-neon',   extraClass: '' },
  warning: { label: 'WARNING', colorClass: 'text-warning border-warning',         extraClass: '' },
  unknown: { label: 'UNKNOWN', colorClass: 'text-gray-400 border-gray-600',       extraClass: '' },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const { label: defaultLabel, colorClass, extraClass } = statusConfig[status];
  const displayLabel = label ?? defaultLabel;

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded border text-xs font-mono ${colorClass} ${extraClass}`.trim()}
      aria-label={`Estado: ${displayLabel}`}
    >
      {displayLabel}
    </span>
  );
}
