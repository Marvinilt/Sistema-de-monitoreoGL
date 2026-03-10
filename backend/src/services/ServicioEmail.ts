import * as nodemailer from 'nodemailer';
import { lookup as dnsLookup } from 'dns';
import { ConfigStore } from '../store/ConfigStore';
import { CambioEstado } from '../types';

// Colores por estado (Requisito 4.3)
const COLORES_ESTADO: Record<string, string> = {
  ok: '#d4edda',
  disponible: '#d4edda',
  abierto: '#d4edda',
  alerta: '#f8d7da',
  no_disponible: '#f8d7da',
  cerrado: '#f8d7da',
  sin_respuesta: '#f8d7da',
  error_certificado: '#f8d7da',
  desconocido: '#e2e3e5',
};

const ICONOS_ESTADO: Record<string, string> = {
  ok: '✅',
  disponible: '✅',
  abierto: '✅',
  alerta: '🔴',
  no_disponible: '🔴',
  cerrado: '🔴',
  sin_respuesta: '🔴',
  error_certificado: '⚠️',
  desconocido: '❓',
};

function colorEstado(estado: string): string {
  if (estado.startsWith('alerta')) return COLORES_ESTADO['alerta'];
  if (estado.startsWith('ok')) return COLORES_ESTADO['ok'];
  return COLORES_ESTADO[estado] ?? '#e2e3e5';
}

function iconoEstado(estado: string): string {
  if (estado.startsWith('alerta')) return ICONOS_ESTADO['alerta'];
  if (estado.startsWith('ok')) return ICONOS_ESTADO['ok'];
  return ICONOS_ESTADO[estado] ?? '❓';
}

/**
 * Construye y despacha correos HTML de notificación via SMTP.
 * Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */
export class ServicioEmail {
  constructor(private store: ConfigStore) {}

  /**
   * Construye el cuerpo HTML del correo con tabla de cambios.
   * Requisitos: 4.2, 4.3
   */
  construirHtml(cambios: CambioEstado[]): string {
    const filas = cambios
      .map((c) => {
        const colorAnterior = colorEstado(c.estadoAnterior);
        const colorNuevo = colorEstado(c.estadoNuevo);
        const hora = new Date(c.timestamp).toLocaleTimeString('es-GT', { hour12: false });
        return `
        <tr>
          <td style="padding:8px;border:1px solid #dee2e6;">${c.servidorNombre}</td>
          <td style="padding:8px;border:1px solid #dee2e6;">${c.nombreRecurso}</td>
          <td style="padding:8px;border:1px solid #dee2e6;">${c.tipoRecurso}</td>
          <td style="padding:8px;border:1px solid #dee2e6;background:${colorAnterior};">${iconoEstado(c.estadoAnterior)} ${c.estadoAnterior}</td>
          <td style="padding:8px;border:1px solid #dee2e6;background:${colorNuevo};">${iconoEstado(c.estadoNuevo)} ${c.estadoNuevo}</td>
          <td style="padding:8px;border:1px solid #dee2e6;">${hora}</td>
        </tr>`;
      })
      .join('');

    return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Monitor Servidores</title></head>
<body style="font-family:Arial,sans-serif;color:#333;margin:0;padding:20px;">
  <div style="max-width:800px;margin:0 auto;">
    <h2 style="background:#343a40;color:#fff;padding:16px;margin:0;">
      Monitor de Servidores — Alerta de Cambios
    </h2>
    <p style="margin:16px 0;">Se detectaron <strong>${cambios.length}</strong> cambio(s) de estado:</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="background:#f8f9fa;">
          <th style="padding:8px;border:1px solid #dee2e6;text-align:left;">Servidor</th>
          <th style="padding:8px;border:1px solid #dee2e6;text-align:left;">Recurso</th>
          <th style="padding:8px;border:1px solid #dee2e6;text-align:left;">Tipo</th>
          <th style="padding:8px;border:1px solid #dee2e6;text-align:left;">Estado Anterior</th>
          <th style="padding:8px;border:1px solid #dee2e6;text-align:left;">Estado Nuevo</th>
          <th style="padding:8px;border:1px solid #dee2e6;text-align:left;">Hora</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>
    <p style="margin-top:24px;font-size:12px;color:#6c757d;border-top:1px solid #dee2e6;padding-top:12px;">
      Este mensaje fue generado automáticamente por Monitor Servidores. Por favor no responda este correo.
    </p>
  </div>
</body>
</html>`;
  }

  /**
   * Crea el transporte SMTP con timeout de 10 segundos.
   * Requisito 4.5
   */
  private crearTransporte(config: NonNullable<ReturnType<ConfigStore['obtenerConfiguracionEmail']>>): nodemailer.Transporter {
    return nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPuerto,
      secure: false,
      ignoreTLS: true,
      tls: { rejectUnauthorized: false },
      auth: config.smtpUsuario ? {
        user: config.smtpUsuario,
        pass: config.smtpPassword,
      } : undefined,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 10_000,
      dnsLookup,
    } as nodemailer.TransportOptions);
  }

  /**
   * Envía un correo consolidado con todos los cambios detectados.
   * Captura errores SMTP sin relanzar (Requisitos 4.5, 4.6).
   * Requisitos: 4.1, 4.4
   */
  async enviarNotificacion(cambios: CambioEstado[]): Promise<void> {
    if (cambios.length === 0) return;

    const config = this.store.obtenerConfiguracionEmail();
    if (!config || !config.habilitado) return;

    // Asunto: [Monitor Servidores] N cambio(s) detectado(s) - DD/MM/YYYY HH:MM (Req 4.4)
    const ahora = new Date();
    const dd = String(ahora.getDate()).padStart(2, '0');
    const mm = String(ahora.getMonth() + 1).padStart(2, '0');
    const yyyy = ahora.getFullYear();
    const hh = String(ahora.getHours()).padStart(2, '0');
    const min = String(ahora.getMinutes()).padStart(2, '0');
    const asunto = `[Monitor Servidores] ${cambios.length} cambio(s) detectado(s) - ${dd}/${mm}/${yyyy} ${hh}:${min}`;

    const html = this.construirHtml(cambios);

    try {
      const transporter = this.crearTransporte(config);
      console.log(`[ServicioEmail] Enviando a ${config.destinatarios.join(', ')} via ${config.smtpHost}:${config.smtpPuerto}`);
      await transporter.sendMail({
        from: config.remitente,
        to: config.destinatarios.join(', '),
        subject: asunto,
        html,
      });
      console.log(`[ServicioEmail] Correo enviado: ${asunto}`);
    } catch (error) {
      // Req 4.5, 4.6: loguear sin relanzar
      console.error('[ServicioEmail] Error al enviar notificación:', error);
    }
  }
}
