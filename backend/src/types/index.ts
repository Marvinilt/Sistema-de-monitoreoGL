// Tipos compartidos del Monitor de Servidores e Infraestructura

export type EstadoServidor = 'ok' | 'alerta' | 'desconocido';
export type EstadoUrl = 'disponible' | 'no_disponible' | 'error_certificado' | 'desconocido';
export type EstadoPuerto = 'abierto' | 'cerrado' | 'sin_respuesta';

export interface UrlMonitoreada {
  id: string;
  url: string;
  estado: EstadoUrl;
  codigoHttp: number | null;
  errorCertificado: boolean;
  ultimaVerificacion: string | null; // ISO 8601
}

export interface RecursosServidor {
  cpuPorcentaje: number;
  ramPorcentaje: number;
  discoPorcentaje: number;
  timestamp: string; // ISO 8601
  error?: string;
}

export interface Servidor {
  id: string;
  nombre: string;
  host: string; // IP o hostname
  puertos: number[];
  resultadosPuertos: ResultadoPuerto[]; // último resultado por puerto
  urls: UrlMonitoreada[];
  recursos?: RecursosServidor;
  estado: EstadoServidor;
  ultimaVerificacion: string | null; // ISO 8601
  creadoEn: string; // ISO 8601
}

export interface ResultadoPuerto {
  puerto: number;
  estado: EstadoPuerto;
  latenciaMs: number | null;
}

export interface ResultadoUrlVerificacion {
  urlId: string;
  url: string;
  estado: EstadoUrl;
  codigoHttp: number | null;
  errorCertificado: boolean;
  latenciaMs: number | null;
}

export interface ResultadoVerificacion {
  servidorId: string;
  timestamp: string; // ISO 8601
  puertos: ResultadoPuerto[];
  urls: ResultadoUrlVerificacion[];
  recursos?: RecursosServidor;
  estadoGeneral: EstadoServidor;
}

export interface ConfiguracionApp {
  intervaloMonitoreoSegundos: number; // 30 - 3600
  tema?: 'light' | 'dark';
}

// Requisito 1.1, 1.8: Configuración de email con parámetros SMTP y lista de destinatarios
export interface ConfiguracionEmail {
  habilitado: boolean;
  smtpHost: string;
  smtpPuerto: number;
  smtpUsuario: string;
  smtpPassword: string;
  remitente: string;
  destinatarios: string[]; // mínimo 1 dirección válida RFC 5322
}

export interface ConfiguracionParametros {
  umbralCpuPorcentaje: number;
  umbralRamPorcentaje: number;
  umbralDiscoPorcentaje: number;
}

// Requisito 2.1-2.4: Representa una transición de estado de un recurso monitoreable
export interface CambioEstado {
  recursoId: string;
  tipoRecurso: 'servidor' | 'puerto' | 'url' | 'recurso';
  nombreRecurso: string;
  estadoAnterior: string;
  estadoNuevo: string;
  timestamp: string; // ISO 8601
  servidorId: string;
  servidorNombre: string;
}

export interface ConfiguracionCompleta {
  configuracion: ConfiguracionApp;
  servidores: Servidor[];
  email?: ConfiguracionEmail; // opcional para retrocompatibilidad (Requisito 1.1, 1.8)
  parametros?: ConfiguracionParametros;
}

// Tipos para la API REST
export interface AgregarServidorDto {
  nombre: string;
  host: string;
}

export interface AgregarPuertoDto {
  puerto: number;
}

export interface AgregarUrlDto {
  url: string;
}

export interface ActualizarConfiguracionDto {
  intervaloMonitoreoSegundos: number;
}

// Tipos para WebSocket
export type EventoWebSocket =
  | { tipo: 'server-update'; datos: Servidor }
  | { tipo: 'check-progress'; datos: { servidorId: string; enProgreso: boolean } };
