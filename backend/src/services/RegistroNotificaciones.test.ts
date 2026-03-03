import * as fs from 'fs';
import * as path from 'path';
import * as fc from 'fast-check';
import { RegistroNotificaciones } from './RegistroNotificaciones';
import { CambioEstado } from '../types';

const TEST_DATA_DIR = path.join(__dirname, '../../../data-test-notif');

function testNotifFile(): string {
  return path.join(
    TEST_DATA_DIR,
    `notif-${Date.now()}-${Math.random().toString(36).slice(2)}.json`
  );
}

function crearRegistro(file?: string): RegistroNotificaciones {
  return new RegistroNotificaciones(file ?? testNotifFile());
}

// Generador de CambioEstado arbitrario
const arbCambio = fc.record({
  recursoId: fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
  tipoRecurso: fc.constantFrom('servidor', 'puerto', 'url') as fc.Arbitrary<'servidor' | 'puerto' | 'url'>,
  nombreRecurso: fc.string({ minLength: 1, maxLength: 30 }),
  estadoAnterior: fc.constantFrom('ok', 'alerta', 'desconocido', 'abierto', 'cerrado', 'disponible', 'no_disponible'),
  estadoNuevo: fc.constantFrom('ok', 'alerta', 'desconocido', 'abierto', 'cerrado', 'disponible', 'no_disponible'),
  timestamp: fc.constant(new Date().toISOString()),
  servidorId: fc.string({ minLength: 1, maxLength: 20 }),
  servidorNombre: fc.string({ minLength: 1, maxLength: 30 }),
});

beforeAll(() => {
  if (!fs.existsSync(TEST_DATA_DIR)) fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
});

afterAll(() => {
  if (fs.existsSync(TEST_DATA_DIR)) fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Feature: email-notifications, Property 2: registro persiste cambios notificados
// Validates: Requirements 3.1, 3.2
// ---------------------------------------------------------------------------
test('Property 2: Registro persiste cambios notificados (round-trip)', () => {
  fc.assert(
    fc.property(arbCambio, (cambio) => {
      const registro = crearRegistro();
      registro.registrar(cambio);
      return registro.yaNotificado(cambio) === true;
    }),
    { numRuns: 100 }
  );
});

// ---------------------------------------------------------------------------
// Feature: email-notifications, Property 1: deduplicación de notificaciones
// Validates: Requirements 3.2, 3.3
// ---------------------------------------------------------------------------
test('Property 1: Deduplicación — yaNotificado retorna true para cambio ya registrado', () => {
  fc.assert(
    fc.property(arbCambio, (cambio) => {
      const registro = crearRegistro();
      registro.registrar(cambio);
      // Segunda llamada con el mismo cambio debe retornar true
      return registro.yaNotificado(cambio) === true;
    }),
    { numRuns: 100 }
  );
});

// ---------------------------------------------------------------------------
// Feature: email-notifications, Property 3: cambios distintos no son deduplicados
// Validates: Requirements 3.4
// ---------------------------------------------------------------------------
test('Property 3: Cambios distintos no son deduplicados', () => {
  fc.assert(
    fc.property(
      arbCambio,
      fc.constantFrom('ok', 'alerta', 'desconocido', 'abierto', 'cerrado', 'disponible', 'no_disponible'),
      (cambio, estadoDistinto) => {
        // Asegurar que el estadoNuevo del segundo cambio sea diferente al del primero
        fc.pre(estadoDistinto !== cambio.estadoNuevo);

        const cambioDistinto: CambioEstado = {
          ...cambio,
          estadoNuevo: estadoDistinto,
        };

        const registro = crearRegistro();
        registro.registrar(cambio);

        // El segundo cambio (diferente transición) NO debe estar deduplicado
        return registro.yaNotificado(cambioDistinto) === false;
      }
    ),
    { numRuns: 100 }
  );
});

// ---------------------------------------------------------------------------
// Test unitario: persistencia sobrevive reinicio de instancia (Requisito 3.5)
// ---------------------------------------------------------------------------
test('3.5 Persistencia sobrevive reinicio de instancia', () => {
  const file = testNotifFile();

  const cambio: CambioEstado = {
    recursoId: 'srv-001',
    tipoRecurso: 'servidor',
    nombreRecurso: 'Servidor Principal',
    estadoAnterior: 'ok',
    estadoNuevo: 'alerta',
    timestamp: new Date().toISOString(),
    servidorId: 'srv-001',
    servidorNombre: 'Servidor Principal',
  };

  // Primera instancia: registrar el cambio
  const registro1 = new RegistroNotificaciones(file);
  registro1.registrar(cambio);

  // Segunda instancia apuntando al mismo archivo
  const registro2 = new RegistroNotificaciones(file);
  expect(registro2.yaNotificado(cambio)).toBe(true);
});

// ---------------------------------------------------------------------------
// Test unitario: archivo corrupto se reinicia vacío con log de advertencia
// ---------------------------------------------------------------------------
test('Archivo corrupto se reinicia vacío con log de advertencia', () => {
  const file = testNotifFile();
  fs.writeFileSync(file, '{ esto no es json válido !!!', 'utf-8');

  const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

  const registro = new RegistroNotificaciones(file);

  expect(warnSpy).toHaveBeenCalledWith(
    expect.stringContaining('Archivo corrupto'),
    expect.anything()
  );

  const cambio: CambioEstado = {
    recursoId: 'x',
    tipoRecurso: 'servidor',
    nombreRecurso: 'X',
    estadoAnterior: 'ok',
    estadoNuevo: 'alerta',
    timestamp: new Date().toISOString(),
    servidorId: 'x',
    servidorNombre: 'X',
  };

  // Después de reiniciar, no debe haber nada registrado
  expect(registro.yaNotificado(cambio)).toBe(false);

  warnSpy.mockRestore();
});
