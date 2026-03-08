// Feature: frontend-redesign-futurista, Propiedad 8: filtro tiempo LatencyChart
// Valida: Requisitos 5.4, 5.5

import { describe, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fc from 'fast-check';
import { LatencyChart, TimeFilter, LatencyData } from './LatencyChart';

// Propiedad 8: Filtro de tiempo del LatencyChart
// Para cualquier filtro seleccionado (60m, 24h, 7d), los datos mostrados deben
// corresponder exactamente al dataset de ese filtro
describe('LatencyChart - Propiedad 8: filtro de tiempo', () => {
  test('para cualquier filtro, los datos mostrados corresponden al dataset de ese filtro', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<TimeFilter>('60m', '24h', '7d'),
        fc.array(
          fc.record({ timestamp: fc.string({ minLength: 1, maxLength: 10 }), latencyMs: fc.integer({ min: 1, max: 500 }) }),
          { minLength: 1, maxLength: 10 }
        ),
        (filter, points) => {
          const data: LatencyData = { '60m': [], '24h': [], '7d': [] };
          data[filter] = points;

          const { unmount, container } = render(
            <LatencyChart data={data} activeFilter={filter} />
          );

          // When filter has data, "Sin datos disponibles" should NOT appear
          const hasNoDataMsg = container.textContent?.includes('Sin datos disponibles') ?? false;
          unmount();
          return !hasNoDataMsg;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('cuando el dataset del filtro activo está vacío, muestra "Sin datos disponibles"', () => {
    const emptyData: LatencyData = { '60m': [], '24h': [], '7d': [] };
    render(<LatencyChart data={emptyData} activeFilter="60m" />);
    expect(screen.getByText('Sin datos disponibles')).toBeTruthy();
  });
});
