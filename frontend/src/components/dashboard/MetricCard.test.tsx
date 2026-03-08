// Feature: frontend-redesign-futurista, Propiedad 5.9: MetricCard renderiza valor y etiqueta
import { describe, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { MetricCard } from './MetricCard';

// Propiedad 5.9: MetricCard renderiza valor y etiqueta
// Valida: Requisito 5.9
describe('MetricCard - Propiedad 5.9: renderiza valor y etiqueta', () => {
  test('para cualquier valor y etiqueta, ambos aparecen en el renderizado', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 9999 }),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        fc.constantFrom('primary', 'accent-neon', 'alert-neon' as const),
        (value, label, borderColor) => {
          const { unmount, container } = render(
            <MetricCard value={value} label={label} borderColor={borderColor} />
          );
          const hasValue = container.textContent?.includes(String(value)) ?? false;
          const hasLabel = container.textContent?.includes(label) ?? false;
          unmount();
          return hasValue && hasLabel;
        }
      ),
      { numRuns: 100 }
    );
  });
});
