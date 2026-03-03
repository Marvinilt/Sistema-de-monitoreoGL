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

// ---------------------------------------------------------------------------
// Tests de integración: Planificador resiliente ante fallos de ServicioNotificaciones
// Validates: Requirements 5.2
// ---------------------------------------------------------------------------

import { Planificador } from './Planificador';
import { ServicioMonitoreo } from './ServicioMonitoreo';

describe('Planificador: resiliencia ante excepciones', () => {
  test('ejecutarCiclo no lanza aunque verificarTodos rechace', async () => {
    const mockServicio = {
      verificarTodos: jest.fn().mockRejectedValue(new Error('fallo simulado')),
    } as unknown as ServicioMonitoreo;

    const planificador = new Planificador(mockServicio);

    // No debe lanzar excepción
    await expect(planificador.ejecutarCiclo()).resolves.toBeUndefined();
    expect(mockServicio.verificarTodos).toHaveBeenCalledTimes(1);
  });

  test('ejecutarCiclo continúa el ciclo aunque ServicioNotificaciones falle', async () => {
    let llamadas = 0;
    const mockServicio = {
      verificarTodos: jest.fn().mockImplementation(async () => {
        llamadas++;
        if (llamadas === 1) throw new Error('error de notificación');
        // segunda llamada exitosa
      }),
    } as unknown as ServicioMonitoreo;

    const planificador = new Planificador(mockServicio);

    // Primera llamada falla, no debe propagar
    await expect(planificador.ejecutarCiclo()).resolves.toBeUndefined();
    // Segunda llamada exitosa
    await expect(planificador.ejecutarCiclo()).resolves.toBeUndefined();

    expect(llamadas).toBe(2);
  });
});
