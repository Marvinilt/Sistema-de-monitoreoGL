import { ConfigStore } from '../store/ConfigStore';
import { VerificadorPuertos } from '../checkers/VerificadorPuertos';
import { VerificadorHTTPS } from '../checkers/VerificadorHTTPS';
import {
  ResultadoVerificacion,
  EstadoServidor,
  Servidor,
  UrlMonitoreada,
  ResultadoUrlVerificacion,
} from '../types';

export type OnServerUpdate = (servidorId: string) => void;

/** Interfaz mínima para desacoplar ServicioNotificaciones de ServicioMonitoreo */
export interface IServicioNotificaciones {
  procesarResultado(servidorAntes: Servidor, resultado: ResultadoVerificacion): Promise<void>;
}

export class ServicioMonitoreo {
  private verificadorPuertos = new VerificadorPuertos();
  private verificadorHTTPS = new VerificadorHTTPS();
  private onUpdate?: OnServerUpdate;

  constructor(
    private store: ConfigStore,
    onUpdate?: OnServerUpdate,
    private servicioNotificaciones?: IServicioNotificaciones
  ) {
    this.onUpdate = onUpdate;
  }

  async verificarServidor(servidorId: string): Promise<ResultadoVerificacion> {
    const servidor = this.store.obtenerServidor(servidorId);
    if (!servidor) throw new Error(`Servidor "${servidorId}" no encontrado`);

    // Capturar estado anterior antes de actualizar (Req 5.1)
    const servidorAntes: Servidor = { ...servidor };

    const [puertos, urls] = await Promise.all([
      this.verificadorPuertos.verificarPuertos(servidor.host, servidor.puertos),
      this.verificadorHTTPS.verificarUrls(servidor.urls),
    ]);

    const estadoGeneral = determinarEstado(puertos, urls);

    // Actualizar URLs con resultados
    const urlsActualizadas: UrlMonitoreada[] = servidor.urls.map((u) => {
      const res = urls.find((r) => r.urlId === u.id);
      if (!res) return u;
      return {
        ...u,
        estado: res.estado,
        codigoHttp: res.codigoHttp,
        errorCertificado: res.errorCertificado,
        ultimaVerificacion: new Date().toISOString(),
      };
    });

    this.store.actualizarEstadoServidor(servidorId, estadoGeneral, urlsActualizadas, puertos);
    this.onUpdate?.(servidorId);

    const resultado: ResultadoVerificacion = {
      servidorId,
      timestamp: new Date().toISOString(),
      puertos,
      urls,
      estadoGeneral,
    };

    // Llamar a ServicioNotificaciones de forma asíncrona sin bloquear (Req 5.1, 5.3)
    if (this.servicioNotificaciones) {
      this.servicioNotificaciones
        .procesarResultado(servidorAntes, resultado)
        .catch((err) =>
          console.error('[ServicioMonitoreo] Error en procesarResultado:', err)
        );
    }

    return resultado;
  }

  async verificarTodos(): Promise<ResultadoVerificacion[]> {
    const servidores = this.store.obtenerServidores();
    return Promise.all(servidores.map((s) => this.verificarServidor(s.id)));
  }
}

function determinarEstado(
  puertos: ResultadoVerificacion['puertos'],
  urls: ResultadoUrlVerificacion[]
): EstadoServidor {
  const hayPuertoProblema = puertos.some(
    (p) => p.estado === 'cerrado' || p.estado === 'sin_respuesta'
  );
  const hayUrlProblema = urls.some(
    (u) => u.estado === 'no_disponible' || u.estado === 'error_certificado'
  );
  if (hayPuertoProblema || hayUrlProblema) return 'alerta';
  if (puertos.length === 0 && urls.length === 0) return 'desconocido';
  return 'ok';
}
