import axios, { AxiosError } from 'axios';
import { UrlMonitoreada, ResultadoUrlVerificacion, EstadoUrl } from '../types';

const TIMEOUT_MS = 10000;

// Feature: server-monitor, Property 6: Clasificación de estado HTTP es exhaustiva y correcta
export function clasificarEstadoHttp(codigo: number): EstadoUrl {
  if (codigo >= 200 && codigo <= 399) return 'disponible';
  return 'no_disponible';
}

export class VerificadorHTTPS {
  async verificarUrl(urlMon: UrlMonitoreada): Promise<ResultadoUrlVerificacion> {
    const inicio = Date.now();
    try {
      const respuesta = await axios.get(urlMon.url, {
        timeout: TIMEOUT_MS,
        validateStatus: () => true, // No lanzar error por códigos HTTP
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: true }),
      });

      const estado = clasificarEstadoHttp(respuesta.status);
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
