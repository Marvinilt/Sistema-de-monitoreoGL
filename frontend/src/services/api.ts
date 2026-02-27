import axios from 'axios';
import { Servidor, UrlMonitoreada, ConfiguracionApp } from '../types';

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
