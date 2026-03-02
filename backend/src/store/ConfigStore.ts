import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  Servidor,
  UrlMonitoreada,
  ConfiguracionApp,
  ConfiguracionCompleta,
  EstadoServidor,
} from '../types';

const DEFAULT_DATA_DIR = path.join(__dirname, '../../data');
const DEFAULT_CONFIG_FILE = path.join(DEFAULT_DATA_DIR, 'config.json');

const CONFIG_DEFAULT: ConfiguracionCompleta = {
  configuracion: { intervaloMonitoreoSegundos: 60 },
  servidores: [],
};

export class ConfigStore {
  private datos: ConfiguracionCompleta;
  private configFile: string;
  private dataDir: string;

  constructor(configFilePath?: string) {
    this.configFile = configFilePath ?? DEFAULT_CONFIG_FILE;
    this.dataDir = path.dirname(this.configFile);
    this.datos = this.cargar();
  }

  // --- Persistencia ---

  private cargar(): ConfiguracionCompleta {
    try {
      if (!fs.existsSync(this.dataDir)) fs.mkdirSync(this.dataDir, { recursive: true });
      if (!fs.existsSync(this.configFile)) {
        fs.writeFileSync(this.configFile, JSON.stringify(CONFIG_DEFAULT, null, 2), 'utf-8');
        return JSON.parse(JSON.stringify(CONFIG_DEFAULT));
      }
      const contenido = fs.readFileSync(this.configFile, 'utf-8');
      const datos = JSON.parse(contenido) as ConfiguracionCompleta;
      // Retrocompatibilidad: asegurar que todos los servidores tengan resultadosPuertos
      datos.servidores = datos.servidores.map((s) => ({
        ...s,
        resultadosPuertos: s.resultadosPuertos ?? [],
      }));
      return datos;
    } catch {
      return JSON.parse(JSON.stringify(CONFIG_DEFAULT));
    }
  }

  private guardar(): void {
    if (!fs.existsSync(this.dataDir)) fs.mkdirSync(this.dataDir, { recursive: true });
    const tmp = this.configFile + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(this.datos, null, 2), 'utf-8');
    fs.renameSync(tmp, this.configFile);
  }

  // --- Servidores ---

  obtenerServidores(): Servidor[] {
    return this.datos.servidores;
  }

  obtenerServidor(id: string): Servidor | undefined {
    return this.datos.servidores.find((s) => s.id === id);
  }

  agregarServidor(nombre: string, host: string): Servidor {
    const hostNorm = host.trim().toLowerCase();
    if (!nombre || !nombre.trim()) throw new Error('El nombre del servidor es requerido');
    if (!hostNorm) throw new Error('El host del servidor es requerido');

    const duplicado = this.datos.servidores.find(
      (s) => s.host.toLowerCase() === hostNorm
    );
    if (duplicado) throw new Error(`Ya existe un servidor con el host "${host}"`);

    const servidor: Servidor = {
      id: uuidv4(),
      nombre: nombre.trim(),
      host: hostNorm,
      puertos: [],
      resultadosPuertos: [],
      urls: [],
      estado: 'desconocido' as EstadoServidor,
      ultimaVerificacion: null,
      creadoEn: new Date().toISOString(),
    };

    this.datos.servidores.push(servidor);
    this.guardar();
    return servidor;
  }

  eliminarServidor(id: string): void {
    const idx = this.datos.servidores.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error(`Servidor con id "${id}" no encontrado`);
    this.datos.servidores.splice(idx, 1);
    this.guardar();
  }

  // --- Puertos ---

  agregarPuerto(servidorId: string, puerto: number): void {
    const servidor = this._getServidor(servidorId);
    validarPuerto(puerto);
    if (servidor.puertos.includes(puerto))
      throw new Error(`El puerto ${puerto} ya está registrado en este servidor`);
    servidor.puertos.push(puerto);
    this.guardar();
  }

  eliminarPuerto(servidorId: string, puerto: number): void {
    const servidor = this._getServidor(servidorId);
    const idx = servidor.puertos.indexOf(puerto);
    if (idx === -1) throw new Error(`El puerto ${puerto} no está registrado en este servidor`);
    servidor.puertos.splice(idx, 1);
    this.guardar();
  }

  // --- URLs ---

  agregarUrl(servidorId: string, url: string): UrlMonitoreada {
    const servidor = this._getServidor(servidorId);
    validarUrl(url);
    const urlNorm = url.trim();
    if (servidor.urls.some((u) => u.url === urlNorm))
      throw new Error(`La URL "${url}" ya está registrada en este servidor`);

    const urlMon: UrlMonitoreada = {
      id: uuidv4(),
      url: urlNorm,
      estado: 'desconocido',
      codigoHttp: null,
      errorCertificado: false,
      ultimaVerificacion: null,
    };
    servidor.urls.push(urlMon);
    this.guardar();
    return urlMon;
  }

  eliminarUrl(servidorId: string, urlId: string): void {
    const servidor = this._getServidor(servidorId);
    const idx = servidor.urls.findIndex((u) => u.id === urlId);
    if (idx === -1) throw new Error(`URL con id "${urlId}" no encontrada en este servidor`);
    servidor.urls.splice(idx, 1);
    this.guardar();
  }

  // --- Configuración ---

  obtenerConfiguracion(): ConfiguracionApp {
    return this.datos.configuracion;
  }

  actualizarConfiguracion(config: Partial<ConfiguracionApp>): ConfiguracionApp {
    if (config.intervaloMonitoreoSegundos !== undefined) {
      const intervalo = config.intervaloMonitoreoSegundos;
      if (intervalo < 30 || intervalo > 3600)
        throw new Error('El intervalo debe estar entre 30 y 3600 segundos');
      this.datos.configuracion.intervaloMonitoreoSegundos = intervalo;
    }
    this.guardar();
    return this.datos.configuracion;
  }

  // --- Estado del servidor ---

  actualizarEstadoServidor(
    servidorId: string,
    estado: EstadoServidor,
    urls?: UrlMonitoreada[],
    resultadosPuertos?: import('../types').ResultadoPuerto[]
  ): void {
    const servidor = this._getServidor(servidorId);
    servidor.estado = estado;
    servidor.ultimaVerificacion = new Date().toISOString();
    if (urls) servidor.urls = urls;
    if (resultadosPuertos) servidor.resultadosPuertos = resultadosPuertos;
    this.guardar();
  }

  // --- Helpers ---

  private _getServidor(id: string): Servidor {
    const s = this.datos.servidores.find((s) => s.id === id);
    if (!s) throw new Error(`Servidor con id "${id}" no encontrado`);
    return s;
  }
}

// --- Funciones de validación exportadas (usadas también en pruebas) ---

export function validarPuerto(puerto: number): void {
  if (!Number.isInteger(puerto) || puerto < 0 || puerto > 65535)
    throw new Error(`Puerto inválido: ${puerto}. Debe ser un entero entre 0 y 65535`);
}

export function validarUrl(url: string): void {
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')
      throw new Error('Protocolo inválido');
  } catch {
    throw new Error(`URL inválida: "${url}". Debe comenzar con http:// o https://`);
  }
}
