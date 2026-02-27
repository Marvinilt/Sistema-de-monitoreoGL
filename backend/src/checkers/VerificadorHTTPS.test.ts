import * as fc from 'fast-check';
import { clasificarEstadoHttp } from './VerificadorHTTPS';

// Feature: server-monitor, Property 6: Clasificación de estado HTTP es exhaustiva y correcta

test('Propiedad 6a: Códigos 200-399 se clasifican como disponible', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 200, max: 399 }),
      (codigo) => clasificarEstadoHttp(codigo) === 'disponible'
    ),
    { numRuns: 100 }
  );
});

test('Propiedad 6b: Códigos 400-599 se clasifican como no_disponible', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 400, max: 599 }),
      (codigo) => clasificarEstadoHttp(codigo) === 'no_disponible'
    ),
    { numRuns: 100 }
  );
});

test('Propiedad 6c: Clasificación es mutuamente excluyente', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 200, max: 599 }),
      (codigo) => {
        const estado = clasificarEstadoHttp(codigo);
        return estado === 'disponible' || estado === 'no_disponible';
      }
    ),
    { numRuns: 100 }
  );
});
