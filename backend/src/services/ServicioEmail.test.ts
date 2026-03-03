import * as fc from 'fast-check';
import { ServicioEmail } from './ServicioEmail';
import { CambioEstado } from '../types';

// Mock nodemailer at module level so createTransport is replaceable
jest.mock('nodemailer');
import * as nodemailer from 'nodemailer';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function crearConfigStore(habilitado = true) {
  return {
    obtenerConfiguracionEmail: () => ({
      habilitado,
      smtpHost: 'smtp.test.com',
      smtpPuerto: 587,
      smtpUsuario: 'user@test.com',
      smtpPassword: 'secret',
      remitente: 'Monitor <monitor@test.com>',
      destinatarios: ['admin@test.com'],
    }),
  } as any;
}

function crearCambio(overrides: Partial<CambioEstado> = {}): CambioEstado {
  return {
    recursoId: 'srv-001',
    tipoRecurso: 'servidor',
    nombreRecurso: 'Servidor Principal',
    estadoAnterior: 'ok',
    estadoNuevo: 'alerta',
    timestamp: new Date().toISOString(),
    servidorId: 'srv-001',
    servidorNombre: 'Servidor Principal',
    ...overrides,
  };
}

// Generadores fast-check
const arbTipoRecurso = fc.constantFrom<'servidor' | 'puerto' | 'url'>('servidor', 'puerto', 'url');
const arbEstado = fc.constantFrom(
  'ok', 'alerta', 'desconocido',
  'disponible', 'no_disponible', 'error_certificado',
  'abierto', 'cerrado', 'sin_respuesta'
);
const arbNombre = fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0);

const arbCambioEstado = fc.record<CambioEstado>({
  recursoId: fc.uuid(),
  tipoRecurso: arbTipoRecurso,
  nombreRecurso: arbNombre,
  estadoAnterior: arbEstado,
  estadoNuevo: arbEstado,
  timestamp: fc.constant(new Date().toISOString()),
  servidorId: fc.uuid(),
  servidorNombre: arbNombre,
});

// ---------------------------------------------------------------------------
// Feature: email-notifications, Property 6: HTML contiene información de cada cambio
// Validates: Requirements 4.2, 4.3
// ---------------------------------------------------------------------------

describe('Property 6: El HTML del correo contiene la información de cada cambio', () => {
  const servicio = new ServicioEmail(crearConfigStore());

  test('Property 6: construirHtml incluye nombre, tipo, estado anterior y nuevo de cada cambio', () => {
    fc.assert(
      fc.property(fc.array(arbCambioEstado, { minLength: 1, maxLength: 10 }), (cambios) => {
        const html = servicio.construirHtml(cambios);

        return cambios.every((c) => {
          const contieneNombreServidor = html.includes(c.servidorNombre);
          const contieneTipo = html.includes(c.tipoRecurso);
          const contieneEstadoAnterior = html.includes(c.estadoAnterior);
          const contieneEstadoNuevo = html.includes(c.estadoNuevo);
          return contieneNombreServidor && contieneTipo && contieneEstadoAnterior && contieneEstadoNuevo;
        });
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Tests unitarios — 6.4
// ---------------------------------------------------------------------------

describe('ServicioEmail - construirHtml', () => {
  const servicio = new ServicioEmail(crearConfigStore());

  test('contiene encabezado institucional y pie de página', () => {
    const html = servicio.construirHtml([crearCambio()]);
    expect(html).toContain('Monitor de Servidores');
    expect(html).toContain('Monitor Servidores');
  });

  test('colores correctos por estado: verde para ok/disponible/abierto', () => {
    const estados = ['ok', 'disponible', 'abierto'];
    for (const estado of estados) {
      const html = servicio.construirHtml([crearCambio({ estadoNuevo: estado })]);
      expect(html).toContain('#d4edda');
    }
  });

  test('colores correctos por estado: rojo para alerta/no_disponible/cerrado/sin_respuesta/error_certificado', () => {
    const estados = ['alerta', 'no_disponible', 'cerrado', 'sin_respuesta', 'error_certificado'];
    for (const estado of estados) {
      const html = servicio.construirHtml([crearCambio({ estadoNuevo: estado })]);
      expect(html).toContain('#f8d7da');
    }
  });

  test('colores correctos por estado: gris para desconocido', () => {
    const html = servicio.construirHtml([crearCambio({ estadoNuevo: 'desconocido' })]);
    expect(html).toContain('#e2e3e5');
  });

  test('tabla contiene columnas esperadas', () => {
    const html = servicio.construirHtml([crearCambio()]);
    expect(html).toContain('Servidor');
    expect(html).toContain('Recurso');
    expect(html).toContain('Tipo');
    expect(html).toContain('Estado Anterior');
    expect(html).toContain('Estado Nuevo');
  });
});

describe('ServicioEmail - enviarNotificacion', () => {
  let sendMailMock: jest.Mock;

  beforeEach(() => {
    sendMailMock = jest.fn().mockResolvedValue({});
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail: sendMailMock });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('formato del asunto con 1 cambio', async () => {
    const servicio = new ServicioEmail(crearConfigStore());
    await servicio.enviarNotificacion([crearCambio()]);

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const opts = sendMailMock.mock.calls[0][0];
    expect(opts.subject).toMatch(/^\[Monitor Servidores\] 1 cambio\(s\) detectado\(s\) - \d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
  });

  test('formato del asunto con múltiples cambios', async () => {
    const servicio = new ServicioEmail(crearConfigStore());
    await servicio.enviarNotificacion([crearCambio(), crearCambio(), crearCambio()]);

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const opts = sendMailMock.mock.calls[0][0];
    expect(opts.subject).toMatch(/^\[Monitor Servidores\] 3 cambio\(s\) detectado\(s\) - \d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
  });

  test('no envía si la lista de cambios está vacía', async () => {
    const servicio = new ServicioEmail(crearConfigStore());
    await servicio.enviarNotificacion([]);

    expect(sendMailMock).not.toHaveBeenCalled();
  });

  test('no envía si habilitado es false', async () => {
    const servicio = new ServicioEmail(crearConfigStore(false));
    await servicio.enviarNotificacion([crearCambio()]);

    expect(sendMailMock).not.toHaveBeenCalled();
  });

  test('captura error SMTP sin relanzar (Req 4.5, 4.6)', async () => {
    sendMailMock.mockRejectedValue(new Error('Connection timeout'));
    const servicio = new ServicioEmail(crearConfigStore());

    // No debe lanzar excepción
    await expect(servicio.enviarNotificacion([crearCambio()])).resolves.toBeUndefined();
  });
});
