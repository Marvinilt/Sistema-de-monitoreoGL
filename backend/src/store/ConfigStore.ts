import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  Servidor,
  UrlMonitoreada,
  ConfiguracionApp,
  ConfiguracionCompleta,
  ConfiguracionEmail,
  EstadoServidor,
} from '../types';

const DEFAULT_DATA_DIR = path.join(__dirname, '../../data');
const DEFAULT_CONFIG_FILE = path.join(DEFAULT_DATA_DIR, 'config.json');

const CONFIG_DEFAULT: ConfiguracionCompleta = {
  configuracion: { intervaloMonitoreoSegundos: 60, tema: 'dark' },
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
      // Retrocompatibilidad: asegurar que configuración tenga tema
      if (!datos.configuracion.tema) {
        datos.configuracion.tema = 'dark';
      }
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

  agregarServidor(nombre: string, host: string, urlAgenteRecursos?: string): Servidor {
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
      urlAgenteRecursos: urlAgenteRecursos?.trim() || undefined,
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

  actualizarServidorConfig(id: string, nombre: string, host: string, urlAgenteRecursos?: string): Servidor {
    const servidor = this._getServidor(id);
    if (!nombre.trim()) throw new Error('El nombre no puede estar vacío');
    const hostNorm = host.trim().toLowerCase();
    if (!hostNorm) throw new Error('El host no puede estar vacío');

    // Revisar colisión de host, si el nuevo host es distinto al actual
    if (hostNorm !== servidor.host) {
      const duplicado = this.datos.servidores.find(
        (s) => s.host.toLowerCase() === hostNorm && s.id !== id
      );
      if (duplicado) throw new Error(`Ya existe otro servidor con el host "${hostNorm}"`);
    }

    servidor.nombre = nombre.trim();
    servidor.host = hostNorm;
    servidor.urlAgenteRecursos = urlAgenteRecursos?.trim() || undefined;

    this.guardar();
    return { ...servidor };
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

  // --- Configuración de Email (Requisitos 1.2, 1.3, 1.4) ---

  obtenerConfiguracionEmail(): ConfiguracionEmail | undefined {
    return this.datos.email;
  }

  actualizarConfiguracionEmail(config: ConfiguracionEmail): ConfiguracionEmail {
    validarDestinatarios(config.destinatarios);
    this.datos.email = config;
    this.guardar();
    return this.datos.email;
  }

  // --- Configuración de Parámetros de Recursos ---

  obtenerConfiguracionParametros(): import('../types').ConfiguracionParametros {
    return this.datos.parametros || {
      umbralCpuPorcentaje: 90,
      umbralRamPorcentaje: 85,
      umbralDiscoPorcentaje: 90
    };
  }

  actualizarConfiguracionParametros(config: import('../types').ConfiguracionParametros): import('../types').ConfiguracionParametros {
    const vars = [
      { name: 'CPU', val: config.umbralCpuPorcentaje },
      { name: 'RAM', val: config.umbralRamPorcentaje },
      { name: 'Disco', val: config.umbralDiscoPorcentaje }
    ];

    for (const v of vars) {
      if (typeof v.val !== 'number' || v.val < 1 || v.val > 100) {
        throw new Error(`El umbral de ${v.name} debe ser un número entre 1 y 100`);
      }
    }

    this.datos.parametros = config;
    this.guardar();
    return this.datos.parametros;
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
    if (config.tema !== undefined) {
      if (config.tema !== 'light' && config.tema !== 'dark') {
        throw new Error('Tema inválido');
      }
      this.datos.configuracion.tema = config.tema;
    }
    this.guardar();
    return this.datos.configuracion;
  }

  // --- Estado del servidor ---

  actualizarEstadoServidor(
    servidorId: string,
    estado: EstadoServidor,
    urls?: UrlMonitoreada[],
    resultadosPuertos?: import('../types').ResultadoPuerto[],
    recursos?: import('../types').RecursosServidor
  ): void {
    const servidor = this._getServidor(servidorId);
    servidor.estado = estado;
    servidor.ultimaVerificacion = new Date().toISOString();
    if (urls) servidor.urls = urls;
    if (resultadosPuertos) servidor.resultadosPuertos = resultadosPuertos;
    if (recursos) servidor.recursos = recursos;
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

/**
 * Valida que una cadena tenga formato de email RFC 5322 básico.
 * Retorna true si es válido, false si no.
 */
export function validarEmail(email: string): boolean {
  // Regex RFC 5322 simplificado — cubre la gran mayoría de casos reales
  const RFC5322 = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return RFC5322.test(email.trim());
}

/**
 * Valida la lista de destinatarios:
 * - Debe tener al menos un elemento
 * - Cada elemento debe tener formato de email válido
 * Lanza Error descriptivo en caso de fallo.
 */
export function validarDestinatarios(destinatarios: string[]): void {
  if (!destinatarios || destinatarios.length === 0) {
    throw new Error('La lista de destinatarios no puede estar vacía');
  }
  for (const email of destinatarios) {
    if (!validarEmail(email)) {
      throw new Error(`Dirección de correo inválida: "${email}"`);
    }
  }
}
