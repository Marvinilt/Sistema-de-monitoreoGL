import * as fc from 'fast-check';
import { ServicioNotificaciones } from './ServicioNotificaciones';
import {
  Servidor,
  ResultadoVerificacion,
  EstadoServidor,
  EstadoPuerto,
  EstadoUrl,
  ResultadoPuerto,
  UrlMonitoreada,
  ResultadoUrlVerificacion,
  CambioEstado,
} from '../types';

// ---------------------------------------------------------------------------
// Helpers para construir objetos de prueba
// ---------------------------------------------------------------------------

function crearServidor(overrides: Partial<Servidor> = {}): Servidor {
  return {
    id: 'srv-test',
    nombre: 'Servidor Test',
    host: '192.168.1.1',
    puertos: [],
    resultadosPuertos: [],
    urls: [],
    estado: 'ok',
    ultimaVerificacion: '2025-01-01T00:00:00.000Z', // ya verificado antes
    creadoEn: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function crearResultado(
  servidorId: string,
  estadoGeneral: EstadoServidor,
  puertos: ResultadoPuerto[] = [],
  urls: ResultadoUrlVerificacion[] = []
): ResultadoVerificacion {
  return {
    servidorId,
    timestamp: new Date().toISOString(),
    puertos,
    urls,
    estadoGeneral,
  };
}

// Generadores fast-check
const arbEstadoServidor = fc.constantFrom<EstadoServidor>('ok', 'alerta', 'desconocido');
const arbEstadoPuerto = fc.constantFrom<EstadoPuerto>('abierto', 'cerrado', 'sin_respuesta');
const arbEstadoUrl = fc.constantFrom<EstadoUrl>(
  'disponible',
  'no_disponible',
  'error_certificado',
  'desconocido'
);

// Par de estados distintos para servidor
const arbParEstadosDistintosServidor = fc
  .tuple(arbEstadoServidor, arbEstadoServidor)
  .filter(([a, b]) => a !== b);

// Par de estados distintos para puerto
const arbParEstadosDistintosPuerto = fc
  .tuple(arbEstadoPuerto, arbEstadoPuerto)
  .filter(([a, b]) => a !== b);

// Par de estados distintos para URL
const arbParEstadosDistintosUrl = fc
  .tuple(arbEstadoUrl, arbEstadoUrl)
  .filter(([a, b]) => a !== b);

// Instancia mínima de ServicioNotificaciones sin dependencias reales
function crearServicio(): ServicioNotificaciones {
  const mockStore = {
    obtenerConfiguracionEmail: () => ({
      habilitado: true,
      smtpHost: 'smtp.test.com',
      smtpPuerto: 587,
      smtpUsuario: 'user',
      smtpPassword: 'pass',
      remitente: 'test@test.com',
      destinatarios: ['admin@test.com'],
    }),
  } as any;

  const mockRegistro = {
    yaNotificado: () => false,
    registrar: () => {},
  } as any;

  const mockEmail = {
    enviarNotificacion: async () => {},
  } as any;

  return new ServicioNotificaciones(mockStore, mockRegistro, mockEmail);
}

// ---------------------------------------------------------------------------
// Feature: email-notifications, Property 4: detección correcta de cambios por tipo de recurso
// Validates: Requirements 2.1, 2.2, 2.3, 2.4
// ---------------------------------------------------------------------------

describe('Property 4: Detección correcta de cambios de servidor/puerto/URL', () => {
  const servicio = crearServicio();

  test('Property 4a: cambio de estado del servidor genera exactamente un CambioEstado de tipo servidor', () => {
    fc.assert(
      fc.property(arbParEstadosDistintosServidor, ([estadoAntes, estadoNuevo]) => {
        const servidor = crearServidor({ estado: estadoAntes });
        const resultado = crearResultado(servidor.id, estadoNuevo);

        const cambios = servicio.detectarCambios(servidor, resultado);

        const cambiosServidor = cambios.filter((c) => c.tipoRecurso === 'servidor');
        return (
          cambiosServidor.length === 1 &&
          cambiosServidor[0].estadoAnterior === estadoAntes &&
          cambiosServidor[0].estadoNuevo === estadoNuevo &&
          cambiosServidor[0].recursoId === servidor.id
        );
      }),
      { numRuns: 100 }
    );
  });

  test('Property 4b: cambio de estado de un puerto genera exactamente un CambioEstado de tipo puerto', () => {
    fc.assert(
      fc.property(arbParEstadosDistintosPuerto, ([estadoAntes, estadoNuevo]) => {
        const puerto = 8080;
        const servidor = crearServidor({
          puertos: [puerto],
          resultadosPuertos: [{ puerto, estado: estadoAntes, latenciaMs: null }],
        });
        const resultado = crearResultado(servidor.id, 'ok', [
          { puerto, estado: estadoNuevo, latenciaMs: null },
        ]);

        const cambios = servicio.detectarCambios(servidor, resultado);

        const cambiosPuerto = cambios.filter((c) => c.tipoRecurso === 'puerto');
        return (
          cambiosPuerto.length === 1 &&
          cambiosPuerto[0].estadoAnterior === estadoAntes &&
          cambiosPuerto[0].estadoNuevo === estadoNuevo
        );
      }),
      { numRuns: 100 }
    );
  });

  test('Property 4c: cambio de estado de una URL genera exactamente un CambioEstado de tipo url', () => {
    fc.assert(
      fc.property(arbParEstadosDistintosUrl, ([estadoAntes, estadoNuevo]) => {
        const urlId = 'url-001';
        const urlStr = 'https://example.com';

        const urlMon: UrlMonitoreada = {
          id: urlId,
          url: urlStr,
          estado: estadoAntes,
          codigoHttp: 200,
          errorCertificado: false,
          ultimaVerificacion: '2025-01-01T00:00:00.000Z', // ya verificada
        };

        const servidor = crearServidor({ urls: [urlMon] });

        const resultadoUrl: ResultadoUrlVerificacion = {
          urlId,
          url: urlStr,
          estado: estadoNuevo,
          codigoHttp: 200,
          errorCertificado: false,
          latenciaMs: null,
        };

        const resultado = crearResultado(servidor.id, 'ok', [], [resultadoUrl]);

        const cambios = servicio.detectarCambios(servidor, resultado);

        const cambiosUrl = cambios.filter((c) => c.tipoRecurso === 'url');
        return (
          cambiosUrl.length === 1 &&
          cambiosUrl[0].estadoAnterior === estadoAntes &&
          cambiosUrl[0].estadoNuevo === estadoNuevo
        );
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Feature: email-notifications, Property 5: sin cambio no genera notificación
// Validates: Requirements 2.4
// ---------------------------------------------------------------------------

describe('Property 5: Sin cambio no genera notificación', () => {
  const servicio = crearServicio();

  test('Property 5a: mismo estado de servidor no genera CambioEstado', () => {
    fc.assert(
      fc.property(arbEstadoServidor, (estado) => {
        const servidor = crearServidor({ estado });
        const resultado = crearResultado(servidor.id, estado);

        const cambios = servicio.detectarCambios(servidor, resultado);

        return cambios.filter((c) => c.tipoRecurso === 'servidor').length === 0;
      }),
      { numRuns: 100 }
    );
  });

  test('Property 5b: mismo estado de puerto no genera CambioEstado', () => {
    fc.assert(
      fc.property(arbEstadoPuerto, (estado) => {
        const puerto = 443;
        const servidor = crearServidor({
          puertos: [puerto],
          resultadosPuertos: [{ puerto, estado, latenciaMs: null }],
        });
        const resultado = crearResultado(servidor.id, 'ok', [
          { puerto, estado, latenciaMs: null },
        ]);

        const cambios = servicio.detectarCambios(servidor, resultado);

        return cambios.filter((c) => c.tipoRecurso === 'puerto').length === 0;
      }),
      { numRuns: 100 }
    );
  });

  test('Property 5c: mismo estado de URL no genera CambioEstado', () => {
    fc.assert(
      fc.property(arbEstadoUrl, (estado) => {
        const urlId = 'url-002';
        const urlStr = 'https://example.org';

        const urlMon: UrlMonitoreada = {
          id: urlId,
          url: urlStr,
          estado,
          codigoHttp: 200,
          errorCertificado: false,
          ultimaVerificacion: '2025-01-01T00:00:00.000Z',
        };

        const servidor = crearServidor({ urls: [urlMon] });

        const resultadoUrl: ResultadoUrlVerificacion = {
          urlId,
          url: urlStr,
          estado,
          codigoHttp: 200,
          errorCertificado: false,
          latenciaMs: null,
        };

        const resultado = crearResultado(servidor.id, 'ok', [], [resultadoUrl]);

        const cambios = servicio.detectarCambios(servidor, resultado);

        return cambios.filter((c) => c.tipoRecurso === 'url').length === 0;
      }),
      { numRuns: 100 }
    );
  });

  test('Property 5d: servidor sin cambios en ningún recurso retorna lista vacía', () => {
    fc.assert(
      fc.property(arbEstadoServidor, arbEstadoPuerto, arbEstadoUrl, (estadoSrv, estadoPuerto, estadoUrl) => {
        const puerto = 80;
        const urlId = 'url-003';
        const urlStr = 'https://test.com';

        const urlMon: UrlMonitoreada = {
          id: urlId,
          url: urlStr,
          estado: estadoUrl,
          codigoHttp: 200,
          errorCertificado: false,
          ultimaVerificacion: '2025-01-01T00:00:00.000Z',
        };

        const servidor = crearServidor({
          estado: estadoSrv,
          puertos: [puerto],
          resultadosPuertos: [{ puerto, estado: estadoPuerto, latenciaMs: null }],
          urls: [urlMon],
        });

        const resultado = crearResultado(
          servidor.id,
          estadoSrv,
          [{ puerto, estado: estadoPuerto, latenciaMs: null }],
          [{ urlId, url: urlStr, estado: estadoUrl, codigoHttp: 200, errorCertificado: false, latenciaMs: null }]
        );

        const cambios = servicio.detectarCambios(servidor, resultado);
        return cambios.length === 0;
      }),
      { numRuns: 100 }
    );
  });
});
