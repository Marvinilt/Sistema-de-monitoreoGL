import { ConfigStore } from '../store/ConfigStore';
import { RegistroNotificaciones } from './RegistroNotificaciones';
import {
  Servidor,
  ResultadoVerificacion,
  CambioEstado,
} from '../types';

/**
 * Interfaz mínima del ServicioEmail para desacoplar la dependencia.
 * La implementación completa se crea en la tarea 6.
 */
export interface IServicioEmail {
  enviarNotificacion(cambios: CambioEstado[]): Promise<void>;
}

/**
 * Orquesta la detección de cambios de estado y el envío de notificaciones.
 * Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5, 4.7
 */
export class ServicioNotificaciones {
  constructor(
    private store: ConfigStore,
    private registro: RegistroNotificaciones,
    private servicioEmail: IServicioEmail
  ) {}

  /**
   * Procesa el resultado de una verificación comparando con el estado anterior.
   * Detecta cambios, filtra duplicados y envía notificación si corresponde.
   * Requisitos: 2.1–2.5, 4.7, 5.1, 5.3
   */
  async procesarResultado(
    servidorAntes: Servidor,
    resultado: ResultadoVerificacion
  ): Promise<void> {
    const config = this.store.obtenerConfiguracionEmail();

    // Omitir si no hay configuración o está deshabilitada (Req 4.7)
    if (!config || !config.habilitado) {
      console.log(`[ServicioNotificaciones] Omitido: habilitado=${config?.habilitado ?? 'sin config'} para servidor ${servidorAntes.nombre}`);
      return;
    }

    const cambios = this.detectarCambios(servidorAntes, resultado);
    
    if (cambios.length === 0) return;
    console.log(`[ServicioNotificaciones] Cambios detectados para ${servidorAntes.nombre}: ${cambios.length}`);
    
    // Filtrar cambios ya notificados (Req 3.2, 3.3)
    const nuevos = cambios.filter((c) => !this.registro.yaNotificado(c));
    console.log(`[ServicioNotificaciones] Cambios nuevos (no deduplicados): ${nuevos.length}`);

    if (nuevos.length === 0) return;

    // Enviar correo con los cambios nuevos
    await this.servicioEmail.enviarNotificacion(nuevos);

    // Registrar los cambios notificados (Req 3.1, 3.5)
    for (const cambio of nuevos) {
      this.registro.registrar(cambio);
    }
  }

  /**
   * Detecta cambios de estado comparando el servidor anterior con el resultado actual.
   * Maneja primera verificación registrando estado inicial sin notificar (Req 2.5).
   * Requisitos: 2.1, 2.2, 2.3, 2.4
   */
  detectarCambios(
    servidorAntes: Servidor,
    resultado: ResultadoVerificacion
  ): CambioEstado[] {
    const cambios: CambioEstado[] = [];
    const timestamp = resultado.timestamp;
    const servidorId = servidorAntes.id;
    const servidorNombre = servidorAntes.nombre;

    // --- Estado general del servidor (Req 2.1) ---
    const estadoAnteriorServidor = servidorAntes.estado;
    const estadoNuevoServidor = resultado.estadoGeneral;

    if (estadoAnteriorServidor === 'desconocido' && servidorAntes.ultimaVerificacion === null) {
      // Primera verificación: registrar estado inicial sin notificar (Req 2.5)
      // No se agrega CambioEstado
    } else if (estadoAnteriorServidor !== estadoNuevoServidor) {
      cambios.push({
        recursoId: servidorId,
        tipoRecurso: 'servidor',
        nombreRecurso: servidorNombre,
        estadoAnterior: estadoAnteriorServidor,
        estadoNuevo: estadoNuevoServidor,
        timestamp,
        servidorId,
        servidorNombre,
      });
    }

    // --- Puertos (Req 2.2) ---
    for (const resultadoPuerto of resultado.puertos) {
      const anteriorPuerto = servidorAntes.resultadosPuertos.find(
        (rp) => rp.puerto === resultadoPuerto.puerto
      );

      if (!anteriorPuerto) {
        // Puerto nuevo: primera vez que se verifica, no notificar
        continue;
      }

      if (anteriorPuerto.estado !== resultadoPuerto.estado) {
        cambios.push({
          recursoId: `${servidorId}:puerto:${resultadoPuerto.puerto}`,
          tipoRecurso: 'puerto',
          nombreRecurso: `Puerto ${resultadoPuerto.puerto}`,
          estadoAnterior: anteriorPuerto.estado,
          estadoNuevo: resultadoPuerto.estado,
          timestamp,
          servidorId,
          servidorNombre,
        });
      }
    }

    // --- URLs (Req 2.3) ---
    for (const resultadoUrl of resultado.urls) {
      const anteriorUrl = servidorAntes.urls.find((u) => u.id === resultadoUrl.urlId);

      if (!anteriorUrl) {
        // URL nueva: primera vez que se verifica, no notificar
        continue;
      }

      // Si el estado anterior era 'desconocido' y nunca se verificó, es primera vez
      if (anteriorUrl.estado === 'desconocido' && anteriorUrl.ultimaVerificacion === null) {
        continue;
      }

      if (anteriorUrl.estado !== resultadoUrl.estado) {
        cambios.push({
          recursoId: `${servidorId}:url:${resultadoUrl.urlId}`,
          tipoRecurso: 'url',
          nombreRecurso: resultadoUrl.url,
          estadoAnterior: anteriorUrl.estado,
          estadoNuevo: resultadoUrl.estado,
          timestamp,
          servidorId,
          servidorNombre,
        });
      }
    }

    // --- Recursos ---
    if (resultado.recursos && servidorAntes.recursos) {
      const configParam = this.store.obtenerConfiguracionParametros();
      const uCPU = configParam.umbralCpuPorcentaje;
      const uRAM = configParam.umbralRamPorcentaje;
      const uDisco = configParam.umbralDiscoPorcentaje;

      const evalEstado = (valor: number, umbral: number) => (valor > umbral ? 'alerta' : 'ok');
      
      const resAntes = servidorAntes.recursos;
      const resNuevo = resultado.recursos;

      const metricas = [
        { id: 'cpu', nombre: 'CPU', antes: resAntes.cpuPorcentaje, nuevo: resNuevo.cpuPorcentaje, umbral: uCPU },
        { id: 'ram', nombre: 'Memoria RAM', antes: resAntes.ramPorcentaje, nuevo: resNuevo.ramPorcentaje, umbral: uRAM },
        { id: 'disco', nombre: 'Espacio de Disco', antes: resAntes.discoPorcentaje, nuevo: resNuevo.discoPorcentaje, umbral: uDisco }
      ];

      for (const m of metricas) {
        const estadoAnt = evalEstado(m.antes, m.umbral);
        const estadoNue = evalEstado(m.nuevo, m.umbral);
        if (estadoAnt !== estadoNue) {
          const detailNue = estadoNue === 'alerta' ? `alerta (${Math.round(m.nuevo)}%)` : `ok (${Math.round(m.nuevo)}%)`;
          const detailAnt = estadoAnt === 'alerta' ? `alerta (${Math.round(m.antes)}%)` : `ok (${Math.round(m.antes)}%)`;
          cambios.push({
            recursoId: `${servidorId}:recurso:${m.id}`,
            tipoRecurso: 'recurso',
            nombreRecurso: m.nombre,
            estadoAnterior: detailAnt,
            estadoNuevo: detailNue,
            timestamp,
            servidorId,
            servidorNombre,
          });
        }
      }
    }

    return cambios;
  }
}
