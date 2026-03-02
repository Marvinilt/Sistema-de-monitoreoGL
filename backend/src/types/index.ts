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

export interface Servidor {
  id: string;
  nombre: string;
  host: string; // IP o hostname
  puertos: number[];
  resultadosPuertos: ResultadoPuerto[]; // último resultado por puerto
  urls: UrlMonitoreada[];
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
  estadoGeneral: EstadoServidor;
}

export interface ConfiguracionApp {
  intervaloMonitoreoSegundos: number; // 30 - 3600
}

export interface ConfiguracionCompleta {
  configuracion: ConfiguracionApp;
  servidores: Servidor[];
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
