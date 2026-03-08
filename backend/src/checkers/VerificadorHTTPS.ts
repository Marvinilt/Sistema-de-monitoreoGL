import axios, { AxiosError } from 'axios';
import * as https from 'https';
import { UrlMonitoreada, ResultadoUrlVerificacion, EstadoUrl } from '../types';

const TIMEOUT_MS = 10000;

// Headers que simulan un navegador para evitar bloqueos 403 por bot-filtering
const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
  'Cache-Control': 'no-cache',
};

/**
 * Feature: server-monitor, Property 6: Clasificación de estado HTTP es exhaustiva y correcta
 *
 * 401 y 403 se consideran DISPONIBLE porque el servidor está activo y respondiendo.
 * Solo indica que el recurso requiere autenticación, no que esté caído.
 */
export function clasificarEstadoHttp(codigo: number): EstadoUrl {
  if (codigo >= 200 && codigo <= 399) return 'disponible';
  if (codigo === 401 || codigo === 403) return 'disponible'; // Servidor activo, requiere auth
  return 'no_disponible';
}

export class VerificadorHTTPS {
  async verificarUrl(urlMon: UrlMonitoreada): Promise<ResultadoUrlVerificacion> {
    const inicio = Date.now();
    const agente = new https.Agent({ rejectUnauthorized: true });

    try {
      const respuesta = await axios.get(urlMon.url, {
        timeout: TIMEOUT_MS,
        validateStatus: () => true, // No lanzar error por códigos HTTP
        httpsAgent: agente,
        headers: BROWSER_HEADERS,
        maxRedirects: 5,
      });

      const estado = clasificarEstadoHttp(respuesta.status);
      console.log(`[VerificadorHTTPS] ${urlMon.url} → HTTP ${respuesta.status} → ${estado}`);
      return {
        urlId: urlMon.id,
        url: urlMon.url,
        estado,
        codigoHttp: respuesta.status,
        errorCertificado: false,
        latenciaMs: Date.now() - inicio,
      };
    } catch (err) {
      const error = err as AxiosError;
      const esCertificado = esErrorCertificado(error);

      return {
        urlId: urlMon.id,
        url: urlMon.url,
        estado: esCertificado ? 'error_certificado' : 'no_disponible',
        codigoHttp: null,
        errorCertificado: esCertificado,
        latenciaMs: null,
      };
    }
  }

  async verificarUrls(urls: UrlMonitoreada[]): Promise<ResultadoUrlVerificacion[]> {
    return Promise.all(urls.map((u) => this.verificarUrl(u)));
  }
}

function esErrorCertificado(error: AxiosError): boolean {
  const codigo = (error.cause as NodeJS.ErrnoException)?.code ?? '';
  return (
    codigo.startsWith('CERT_') ||
    codigo.startsWith('UNABLE_TO_VERIFY_') ||
    codigo === 'SELF_SIGNED_CERT_IN_CHAIN' ||
    codigo === 'ERR_TLS_CERT_ALTNAME_INVALID'
  );
}
