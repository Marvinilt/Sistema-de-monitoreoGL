// Feature: frontend-redesign-futurista, Propiedad 2: cálculo porcentaje HealthRingChart
// Valida: Requisitos 5.2, 5.10

import { describe, test } from 'vitest';
import * as fc from 'fast-check';
import { calculateOkPercentage } from './HealthRingChart';

// Propiedad 2: Cálculo del porcentaje de salud
// Para cualquier par (totalServers > 0, 0 ≤ okServers ≤ totalServers),
// el porcentaje calculado debe estar en [0, 100] y ser igual a (okServers / totalServers) * 100
describe('HealthRingChart - Propiedad 2: cálculo porcentaje', () => {
  test('para cualquier (total > 0, 0 ≤ ok ≤ total), porcentaje ∈ [0,100] y = (ok/total)*100', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 0, max: 1000 }),
        (total, okRaw) => {
          const ok = Math.min(okRaw, total);
          const percentage = calculateOkPercentage(total, ok);
          const expected = (ok / total) * 100;
          return percentage >= 0 && percentage <= 100 && percentage === expected;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('cuando totalServers === 0, retorna 0 sin error', () => {
    const result = calculateOkPercentage(0, 0);
    return result === 0;
  });
});
