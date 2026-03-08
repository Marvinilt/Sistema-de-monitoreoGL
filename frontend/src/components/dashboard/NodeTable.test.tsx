// Feature: frontend-redesign-futurista, Propiedad 5.7-5.8: mapeo status→color NodeTable
// Valida: Requisitos 5.7, 5.8

import { describe, test } from 'vitest';
import * as fc from 'fast-check';
import { getStatusColorClass, getLoadColorClass, NodeStatus } from './NodeTable';

// Propiedad: mapeo status→color
// Para cualquier nodo con status ok o alert, la clase de color renderizada debe corresponder al status
describe('NodeTable - Propiedad 5.7-5.8: mapeo status→color', () => {
  test('status ok siempre produce clase text-accent-neon', () => {
    fc.assert(
      fc.property(
        fc.constant<NodeStatus>('ok'),
        (status) => getStatusColorClass(status) === 'text-accent-neon'
      ),
      { numRuns: 100 }
    );
  });

  test('status alert siempre produce clase text-alert-neon', () => {
    fc.assert(
      fc.property(
        fc.constant<NodeStatus>('alert'),
        (status) => getStatusColorClass(status) === 'text-alert-neon'
      ),
      { numRuns: 100 }
    );
  });

  test('para cualquier status ok o alert, la clase de color es la correcta', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<NodeStatus>('ok', 'alert'),
        (status) => {
          const cls = getStatusColorClass(status);
          if (status === 'ok') return cls === 'text-accent-neon';
          if (status === 'alert') return cls === 'text-alert-neon';
          return false;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('barra de carga ≥80% produce clase bg-alert-neon', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 80, max: 100 }),
        (load) => getLoadColorClass(load) === 'bg-alert-neon'
      ),
      { numRuns: 100 }
    );
  });

  test('barra de carga <60% produce clase bg-accent-neon', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 59 }),
        (load) => getLoadColorClass(load) === 'bg-accent-neon'
      ),
      { numRuns: 100 }
    );
  });
});
