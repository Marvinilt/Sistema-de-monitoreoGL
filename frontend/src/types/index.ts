// Tipos del frontend — espejo de los tipos del backend

export type EstadoServidor = 'ok' | 'alerta' | 'desconocido';
export type EstadoUrl = 'disponible' | 'no_disponible' | 'error_certificado' | 'desconocido';
export type EstadoPuerto = 'abierto' | 'cerrado' | 'sin_respuesta';

export interface UrlMonitoreada {
  id: string;
  url: string;
  estado: EstadoUrl;
  codigoHttp: number | null;
  errorCertificado: boolean;
  ultimaVerificacion: string | null;
}

export interface RecursosServidor {
  cpuPorcentaje: number;
  ramPorcentaje: number;
  discoPorcentaje: number;
  timestamp: string;
}

export interface Servidor {
  id: string;
  nombre: string;
  host: string;
  puertos: number[];
  resultadosPuertos: ResultadoPuerto[]; // último resultado por puerto
  urls: UrlMonitoreada[];
  recursos?: RecursosServidor;
  estado: EstadoServidor;
  ultimaVerificacion: string | null;
  creadoEn: string;
}

export interface ResultadoPuerto {
  puerto: number;
  estado: EstadoPuerto;
  latenciaMs: number | null;
}

export interface ConfiguracionApp {
  intervaloMonitoreoSegundos: number;
  tema?: 'light' | 'dark';
}

export type EventoWebSocket =
  | { tipo: 'server-update'; datos: Servidor }
  | { tipo: 'check-progress'; datos: { servidorId: string; enProgreso: boolean } };

export interface ConfiguracionEmail {
  habilitado: boolean;
  smtpHost: string;
  smtpPuerto: number;
  smtpUsuario: string;
  smtpPassword: string;
  remitente: string;
  destinatarios: string[]; // mínimo 1 dirección válida
}

export interface ConfiguracionParametros {
  umbralCpuPorcentaje: number;
  umbralRamPorcentaje: number;
  umbralDiscoPorcentaje: number;
}

export interface ResultadoPruebaConexion {
  ok: boolean;
  mensaje: string;
}
