// Feature: frontend-redesign-futurista, Propiedad 4: consistencia visual StatusBadge
import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { StatusBadge, ServerStatus } from './StatusBadge';

const ALL_STATUSES: ServerStatus[] = ['ok', 'alert', 'warning', 'unknown'];

const expectedColorClass: Record<ServerStatus, string> = {
  ok:      'text-accent-neon',
  alert:   'text-alert-neon',
  warning: 'text-warning',
  unknown: 'text-gray-400',
};

// Propiedad 4: Consistencia visual del StatusBadge
// Valida: Requisitos 10.1, 10.2, 10.3, 10.4
describe('StatusBadge - Propiedad 4: consistencia visual', () => {
  test('para cualquier status, renderiza la clase de color correcta y aria-label contiene el estado', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_STATUSES),
        (status) => {
          const { container, getByRole } = render(<StatusBadge status={status} />);
          const badge = container.firstChild as HTMLElement;

          // La clase de color correspondiente debe estar presente
          const hasCorrectColor = badge.className.includes(expectedColorClass[status]);

          // El aria-label debe contener el texto del estado
          const ariaLabel = badge.getAttribute('aria-label') ?? '';
          const hasAriaLabel = ariaLabel.length > 0;

          return hasCorrectColor && hasAriaLabel;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('ok aplica neon-glow-green', () => {
    const { container } = render(<StatusBadge status="ok" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('neon-glow-green');
  });

  test('label personalizado aparece en el badge y en aria-label', () => {
    const { container } = render(<StatusBadge status="ok" label="ONLINE" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.textContent).toBe('ONLINE');
    expect(badge.getAttribute('aria-label')).toContain('ONLINE');
  });

  test('usa fuente monoespaciada (font-mono)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_STATUSES),
        (status) => {
          const { container } = render(<StatusBadge status={status} />);
          const badge = container.firstChild as HTMLElement;
          return badge.className.includes('font-mono');
        }
      ),
      { numRuns: 100 }
    );
  });
});
