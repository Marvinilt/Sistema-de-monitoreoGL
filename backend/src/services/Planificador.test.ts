import * as fc from 'fast-check';
import { validarIntervalo } from './Planificador';

// Feature: server-monitor, Property 9: Validación del intervalo de monitoreo

test('Propiedad 9a: Intervalos fuera de rango son rechazados', () => {
  fc.assert(
    fc.property(
      fc.oneof(
        fc.integer({ max: 29 }),
        fc.integer({ min: 3601, max: 100000 })
      ),
      (intervalo) => {
        let lanzóError = false;
        try {
          validarIntervalo(intervalo);
        } catch {
          lanzóError = true;
        }
        return lanzóError;
      }
    ),
    { numRuns: 100 }
  );
});

test('Propiedad 9b: Intervalos dentro de rango son aceptados', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 30, max: 3600 }),
      (intervalo) => {
        let lanzóError = false;
        try {
          validarIntervalo(intervalo);
        } catch {
          lanzóError = true;
        }
        return !lanzóError;
      }
    ),
    { numRuns: 100 }
  );
});
