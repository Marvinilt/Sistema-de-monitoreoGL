import { ServicioMonitoreo, IServicioNotificaciones } from './ServicioMonitoreo';
import { ConfigStore } from '../store/ConfigStore';
import { Servidor, ResultadoVerificacion } from '../types';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

jest.mock('axios', () => ({
  get: jest.fn().mockResolvedValue({ data: { cpuPorcentaje: 10, ramPorcentaje: 20, discoPorcentaje: 30 } })
}));

// ---------------------------------------------------------------------------
// Tests de integración: ServicioMonitoreo llama a ServicioNotificaciones
// Validates: Requirements 5.1, 5.3
// ---------------------------------------------------------------------------

function crearConfigStoreTemp(): { store: ConfigStore; tmpDir: string } {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'monitor-test-'));
  const configFile = path.join(tmpDir, 'config.json');
  const store = new ConfigStore(configFile);
  return { store, tmpDir };
}

function crearServidorEnStore(store: ConfigStore): Servidor {
  return store.agregarServidor('Test Server', '127.0.0.1');
}

describe('ServicioMonitoreo: integración con ServicioNotificaciones', () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('procesarResultado es llamado después de cada verificación de servidor', async () => {
    const { store, tmpDir: td } = crearConfigStoreTemp();
    tmpDir = td;

    const servidor = crearServidorEnStore(store);

    const procesarResultadoMock = jest.fn().mockResolvedValue(undefined);
    const mockNotificaciones: IServicioNotificaciones = {
      procesarResultado: procesarResultadoMock,
    };

    const servicio = new ServicioMonitoreo(store, undefined, mockNotificaciones);

    await servicio.verificarServidor(servidor.id);

    // Esperar a que la promesa async fire-and-forget se resuelva
    await new Promise((r) => setTimeout(r, 50));

    expect(procesarResultadoMock).toHaveBeenCalledTimes(1);
    const [servidorAntes, resultado] = procesarResultadoMock.mock.calls[0] as [
      Servidor,
      ResultadoVerificacion
    ];
    expect(servidorAntes.id).toBe(servidor.id);
    expect(resultado.servidorId).toBe(servidor.id);
  });

  test('procesarResultado recibe el estado anterior (antes de actualizar)', async () => {
    const { store, tmpDir: td } = crearConfigStoreTemp();
    tmpDir = td;

    const servidor = crearServidorEnStore(store);
    // El estado inicial es 'desconocido'
    expect(servidor.estado).toBe('desconocido');

    let estadoAntesCapturado: string | undefined;
    const mockNotificaciones: IServicioNotificaciones = {
      procesarResultado: jest.fn().mockImplementation(async (servidorAntes: Servidor) => {
        estadoAntesCapturado = servidorAntes.estado;
      }),
    };

    const servicio = new ServicioMonitoreo(store, undefined, mockNotificaciones);
    await servicio.verificarServidor(servidor.id);
    await new Promise((r) => setTimeout(r, 50));

    // El estado anterior capturado debe ser 'desconocido' (el inicial)
    expect(estadoAntesCapturado).toBe('desconocido');
  });

  test('error en procesarResultado no interrumpe verificarServidor', async () => {
    const { store, tmpDir: td } = crearConfigStoreTemp();
    tmpDir = td;

    const servidor = crearServidorEnStore(store);

    const mockNotificaciones: IServicioNotificaciones = {
      procesarResultado: jest.fn().mockRejectedValue(new Error('fallo en notificación')),
    };

    const servicio = new ServicioMonitoreo(store, undefined, mockNotificaciones);

    // No debe lanzar excepción
    await expect(servicio.verificarServidor(servidor.id)).resolves.toBeDefined();
    await new Promise((r) => setTimeout(r, 50));
  });

  test('verificarTodos llama procesarResultado por cada servidor', async () => {
    const { store, tmpDir: td } = crearConfigStoreTemp();
    tmpDir = td;

    store.agregarServidor('Servidor A', '10.0.0.1');
    store.agregarServidor('Servidor B', '10.0.0.2');

    const procesarResultadoMock = jest.fn().mockResolvedValue(undefined);
    const mockNotificaciones: IServicioNotificaciones = {
      procesarResultado: procesarResultadoMock,
    };

    const servicio = new ServicioMonitoreo(store, undefined, mockNotificaciones);
    await servicio.verificarTodos();
    await new Promise((r) => setTimeout(r, 100));

    expect(procesarResultadoMock).toHaveBeenCalledTimes(2);
  });
});
