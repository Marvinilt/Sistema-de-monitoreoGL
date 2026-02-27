import * as fs from 'fs';
import * as path from 'path';
import * as fc from 'fast-check';
import { ConfigStore, validarPuerto, validarUrl } from './ConfigStore';

// Directorio temporal para pruebas (evita tocar data/config.json real)
const TEST_DATA_DIR = path.join(__dirname, '../../data-test');
const TEST_CONFIG_FILE = path.join(TEST_DATA_DIR, 'config.json');

function crearStore(): ConfigStore {
  // Limpiar antes de cada instancia
  if (fs.existsSync(TEST_CONFIG_FILE)) fs.unlinkSync(TEST_CONFIG_FILE);
  // Parchamos la ruta interna usando variable de entorno
  process.env.CONFIG_FILE_OVERRIDE = TEST_CONFIG_FILE;
  return new ConfigStore();
}

beforeAll(() => {
  if (!fs.existsSync(TEST_DATA_DIR)) fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
});

afterAll(() => {
  if (fs.existsSync(TEST_DATA_DIR)) fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
});

beforeEach(() => {
  if (fs.existsSync(TEST_CONFIG_FILE)) fs.unlinkSync(TEST_CONFIG_FILE);
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
        const store = new ConfigStore();
        store.agregarServidor(datos.nombre, datos.host);
        const servidores = store.obtenerServidores();
        return servidores.some((s) => s.host === datos.host.toLowerCase());
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
        const store = new ConfigStore();
        const servidor = store.agregarServidor(datos.nombre, datos.host);
        const puertosSinDuplicados = [...new Set(puertos)];
        for (const p of puertosSinDuplicados) store.agregarPuerto(servidor.id, p);

        store.eliminarServidor(servidor.id);
        const servidores = store.obtenerServidores();
        return !servidores.some((s) => s.id === servidor.id);
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
        const store = new ConfigStore();
        store.agregarServidor(datos.nombre, datos.host);
        const cantidadAntes = store.obtenerServidores().length;

        let lanzóError = false;
        try {
          store.agregarServidor('Otro nombre', datos.host);
        } catch {
          lanzóError = true;
        }

        const cantidadDespues = store.obtenerServidores().length;
        return lanzóError && cantidadDespues === cantidadAntes;
      }
    ),
    { numRuns: 100 }
  );
});

// ---------------------------------------------------------------------------
// Feature: server-monitor, Property 4: Validación de puertos rechaza entradas inválidas
// ---------------------------------------------------------------------------
test('Propiedad 4: Validación de puertos rechaza entradas inválidas', () => {
  fc.assert(
    fc.property(
      fc.oneof(
        fc.integer({ max: -1 }),
        fc.integer({ min: 65536, max: 200000 })
      ),
      (puerto) => {
        let lanzóError = false;
        try {
          validarPuerto(puerto);
        } catch {
          lanzóError = true;
        }
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
        try {
          validarPuerto(puerto);
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
// Feature: server-monitor, Property 5: Validación de URLs rechaza entradas inválidas
// ---------------------------------------------------------------------------
test('Propiedad 5: Validación de URLs rechaza entradas inválidas', () => {
  const urlsInvalidas = [
    'no-es-url',
    'ftp://servidor.com',
    '//sin-protocolo.com',
    'http://',
    '',
    '   ',
    'javascript:alert(1)',
  ];

  for (const url of urlsInvalidas) {
    let lanzóError = false;
    try {
      validarUrl(url);
    } catch {
      lanzóError = true;
    }
    expect(lanzóError).toBe(true);
  }
});

test('Propiedad 5b: Validación de URLs acepta URLs válidas', () => {
  const urlsValidas = [
    'http://192.168.1.1',
    'https://servidor.empresa.com',
    'http://localhost:8080',
    'https://app.empresa.com/ruta',
  ];

  for (const url of urlsValidas) {
    expect(() => validarUrl(url)).not.toThrow();
  }
});

// ---------------------------------------------------------------------------
// Feature: server-monitor, Property 10: Persistencia round-trip de configuración
// ---------------------------------------------------------------------------
test('Propiedad 10: Persistencia round-trip de configuración', () => {
  fc.assert(
    fc.property(
      fc.record({
        nombre: fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
        host: fc.ipV4(),
      }),
      (datos) => {
        const store = new ConfigStore();
        const servidor = store.agregarServidor(datos.nombre, datos.host);

        // Leer desde disco creando nueva instancia
        const store2 = new ConfigStore();
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
