import * as fs from 'fs';
import * as path from 'path';
import * as fc from 'fast-check';
import { ConfigStore, validarPuerto, validarUrl } from './ConfigStore';

// Directorio temporal aislado — nunca toca data/config.json
const TEST_DATA_DIR = path.join(__dirname, '../../../data-test');

function testConfigFile(): string {
  return path.join(TEST_DATA_DIR, `config-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
}

function crearStore(): ConfigStore {
  return new ConfigStore(testConfigFile());
}

beforeAll(() => {
  if (!fs.existsSync(TEST_DATA_DIR)) fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
});

afterAll(() => {
  if (fs.existsSync(TEST_DATA_DIR)) fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Feature: server-monitor, Property 1: Registro de servidor persiste y es recuperable
// ---------------------------------------------------------------------------
test('Propiedad 1: Registro de servidor persiste y es recuperable', () => {
  fc.assert(
    fc.property(
      fc.record({
        nombre: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
        host: fc.ipV4(),
      }),
      (datos) => {
        const store = crearStore();
        store.agregarServidor(datos.nombre, datos.host);
        return store.obtenerServidores().some((s) => s.host === datos.host.toLowerCase());
      }
    ),
    { numRuns: 100 }
  );
});

// ---------------------------------------------------------------------------
// Feature: server-monitor, Property 2: Eliminación de servidor es completa
// ---------------------------------------------------------------------------
test('Propiedad 2: Eliminación de servidor es completa', () => {
  fc.assert(
    fc.property(
      fc.record({
        nombre: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
        host: fc.ipV4(),
      }),
      fc.array(fc.integer({ min: 0, max: 65535 }), { maxLength: 5 }),
      (datos, puertos) => {
        const store = crearStore();
        const servidor = store.agregarServidor(datos.nombre, datos.host);
        for (const p of [...new Set(puertos)]) store.agregarPuerto(servidor.id, p);
        store.eliminarServidor(servidor.id);
        return !store.obtenerServidores().some((s) => s.id === servidor.id);
      }
    ),
    { numRuns: 100 }
  );
});

// ---------------------------------------------------------------------------
// Feature: server-monitor, Property 3: Rechazo de servidores duplicados
// ---------------------------------------------------------------------------
test('Propiedad 3: Rechazo de servidores duplicados', () => {
  fc.assert(
    fc.property(
      fc.record({
        nombre: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
        host: fc.ipV4(),
      }),
      (datos) => {
        const store = crearStore();
        store.agregarServidor(datos.nombre, datos.host);
        const cantidadAntes = store.obtenerServidores().length;
        let lanzóError = false;
        try { store.agregarServidor('Otro', datos.host); } catch { lanzóError = true; }
        return lanzóError && store.obtenerServidores().length === cantidadAntes;
      }
    ),
    { numRuns: 100 }
  );
});

// ---------------------------------------------------------------------------
// Feature: server-monitor, Property 4: Validación de puertos
// ---------------------------------------------------------------------------
test('Propiedad 4: Validación de puertos rechaza entradas inválidas', () => {
  fc.assert(
    fc.property(
      fc.oneof(fc.integer({ max: -1 }), fc.integer({ min: 65536, max: 200000 })),
      (puerto) => {
        let lanzóError = false;
        try { validarPuerto(puerto); } catch { lanzóError = true; }
        return lanzóError;
      }
    ),
    { numRuns: 100 }
  );
});

test('Propiedad 4b: Validación de puertos acepta entradas válidas', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 65535 }),
      (puerto) => {
        let lanzóError = false;
        try { validarPuerto(puerto); } catch { lanzóError = true; }
        return !lanzóError;
      }
    ),
    { numRuns: 100 }
  );
});

// ---------------------------------------------------------------------------
// Feature: server-monitor, Property 5: Validación de URLs
// ---------------------------------------------------------------------------
test('Propiedad 5: Validación de URLs rechaza entradas inválidas', () => {
  for (const url of ['no-es-url', 'ftp://x.com', '//sin-proto.com', 'http://', '', '   ', 'javascript:x']) {
    expect(() => validarUrl(url)).toThrow();
  }
});

test('Propiedad 5b: Validación de URLs acepta URLs válidas', () => {
  for (const url of ['http://192.168.1.1', 'https://servidor.empresa.com', 'http://localhost:8080']) {
    expect(() => validarUrl(url)).not.toThrow();
  }
});

// ---------------------------------------------------------------------------
// Feature: server-monitor, Property 10: Persistencia round-trip
// ---------------------------------------------------------------------------
test('Propiedad 10: Persistencia round-trip de configuración', () => {
  fc.assert(
    fc.property(
      fc.record({
        nombre: fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
        host: fc.ipV4(),
      }),
      (datos) => {
        const file = testConfigFile();
        const store1 = new ConfigStore(file);
        const servidor = store1.agregarServidor(datos.nombre, datos.host);
        const store2 = new ConfigStore(file);
        const recuperado = store2.obtenerServidor(servidor.id);
        return (
          recuperado !== undefined &&
          recuperado.id === servidor.id &&
          recuperado.nombre === servidor.nombre &&
          recuperado.host === servidor.host
        );
      }
    ),
    { numRuns: 100 }
  );
});
