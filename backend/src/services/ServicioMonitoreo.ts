import axios from 'axios';
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

    const parametrosConfig = this.store.obtenerConfiguracionParametros();
    let cpuPorcentaje = 0;
    let ramPorcentaje = 0;
    let discoPorcentaje = 0;
    let errorAgente: string | undefined;

    try {
      const agenteUrl = servidor.urlAgenteRecursos || `http://${servidor.host}:9000/metrics`;
      const resp = await axios.get(agenteUrl, { timeout: 5000 });
      if (resp.data) {
        cpuPorcentaje = Number(resp.data.cpuPorcentaje) || 0;
        ramPorcentaje = Number(resp.data.ramPorcentaje) || 0;
        discoPorcentaje = Number(resp.data.discoPorcentaje) || 0;
      } else {
        errorAgente = 'Respuesta vacía del agente';
      }
    } catch (err: any) {
      console.error(`[ServicioMonitoreo] Error al consultar agente en ${servidor.nombre}:`, err.message);
      errorAgente = 'Agente No Disponible';
    }

    const recursos: import('../types').RecursosServidor = {
      cpuPorcentaje,
      ramPorcentaje,
      discoPorcentaje,
      timestamp: new Date().toISOString(),
      ...(errorAgente ? { error: errorAgente } : {}),
    };

    let recursosCríticos = false;
    if (!errorAgente) {
      if (cpuPorcentaje > parametrosConfig.umbralCpuPorcentaje) recursosCríticos = true;
      if (ramPorcentaje > parametrosConfig.umbralRamPorcentaje) recursosCríticos = true;
      if (discoPorcentaje > parametrosConfig.umbralDiscoPorcentaje) recursosCríticos = true;
    }

    const estadoBase = determinarEstado(puertos, urls);
    const estadoGeneral: EstadoServidor = recursosCríticos ? 'alerta' : estadoBase;

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

    this.store.actualizarEstadoServidor(servidorId, estadoGeneral, urlsActualizadas, puertos, recursos);
    this.onUpdate?.(servidorId);

    const resultado: ResultadoVerificacion = {
      servidorId,
      timestamp: new Date().toISOString(),
      puertos,
      urls,
      recursos,
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
  const hayUrls = urls.length > 0;
  const todasUrlsDisponibles = hayUrls && urls.every(
    (u) => u.estado === 'disponible'
  );

  // Si hay URLs y todas responden correctamente, el servidor está OK aunque
  // los puertos TCP no sean alcanzables (puede ser una restricción de red/firewall
  // desde la máquina del monitor, pero el servicio HTTP es accesible)
  if (todasUrlsDisponibles) return 'ok';

  const hayUrlProblema = hayUrls && urls.some(
    (u) => u.estado === 'no_disponible' || u.estado === 'error_certificado'
  );
  if (hayUrlProblema) return 'alerta';

  // Sin URLs: depender únicamente de los puertos TCP
  const hayPuertoProblema = puertos.some(
    (p) => p.estado === 'cerrado' || p.estado === 'sin_respuesta'
  );
  if (hayPuertoProblema) return 'alerta';

  if (puertos.length === 0 && urls.length === 0) return 'desconocido';
  return 'ok';
}
