import axios from 'axios';
import { Servidor, UrlMonitoreada, ConfiguracionApp, ConfiguracionEmail, ResultadoPruebaConexion } from '../types';

const http = axios.create({ baseURL: '/api' });

// Servidores
export const obtenerServidores = (): Promise<Servidor[]> =>
  http.get<Servidor[]>('/servers').then((r) => r.data);

export const agregarServidor = (nombre: string, host: string): Promise<Servidor> =>
  http.post<Servidor>('/servers', { nombre, host }).then((r) => r.data);

export const eliminarServidor = (id: string): Promise<void> =>
  http.delete(`/servers/${id}`).then(() => undefined);

// Puertos
export const agregarPuerto = (servidorId: string, puerto: number): Promise<Servidor> =>
  http.post<Servidor>(`/servers/${servidorId}/ports`, { puerto }).then((r) => r.data);

export const eliminarPuerto = (servidorId: string, puerto: number): Promise<void> =>
  http.delete(`/servers/${servidorId}/ports/${puerto}`).then(() => undefined);

// URLs
export const agregarUrl = (servidorId: string, url: string): Promise<UrlMonitoreada> =>
  http.post<UrlMonitoreada>(`/servers/${servidorId}/urls`, { url }).then((r) => r.data);

export const eliminarUrl = (servidorId: string, urlId: string): Promise<void> =>
  http.delete(`/servers/${servidorId}/urls/${urlId}`).then(() => undefined);

// Monitoreo
export const verificarServidor = (id: string) =>
  http.post(`/monitor/check/${id}`).then((r) => r.data);

export const verificarTodos = () =>
  http.post('/monitor/check-all').then((r) => r.data);

// Configuración
export const obtenerConfiguracion = (): Promise<ConfiguracionApp> =>
  http.get<ConfiguracionApp>('/settings').then((r) => r.data);

export const actualizarConfiguracion = (config: Partial<ConfiguracionApp>): Promise<ConfiguracionApp> =>
  http.put<ConfiguracionApp>('/settings', config).then((r) => r.data);

// Configuración de Email
export const obtenerConfiguracionEmail = (): Promise<ConfiguracionEmail | null> =>
  http.get<ConfiguracionEmail>('/config/email').then((r) => r.data).catch(() => null);

export const actualizarConfiguracionEmail = (config: ConfiguracionEmail): Promise<ConfiguracionEmail> =>
  http.put<ConfiguracionEmail>('/config/email', config).then((r) => r.data);

export const probarConexionEmail = (config: ConfiguracionEmail): Promise<ResultadoPruebaConexion> =>
  http.post<ResultadoPruebaConexion>('/config/email/test', config).then((r) => r.data);

// Logs
export const obtenerNotificaciones = (): Promise<{ notificaciones: { claveDeduplicacion: string, timestamp: string }[] }> =>
  http.get('/notifications').then((r) => r.data);
