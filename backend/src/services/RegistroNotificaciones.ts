import * as fs from 'fs';
import * as path from 'path';
import { CambioEstado } from '../types';

interface EntradaNotificacion {
  claveDeduplicacion: string; // `${recursoId}:${estadoAnterior}:${estadoNuevo}`
  timestamp: string;
}

interface ArchivoNotificaciones {
  notificaciones: EntradaNotificacion[];
}

export class RegistroNotificaciones {
  private notificaciones: Set<string> = new Set();

  constructor(private filePath: string) {
    this.cargar();
  }

  /**
   * Verifica si un cambio ya fue notificado previamente.
   * Requisito 3.2, 3.3
   */
  yaNotificado(cambio: CambioEstado): boolean {
    const clave = this.buildClave(cambio);
    return this.notificaciones.has(clave);
  }

  /**
   * Registra un cambio como notificado y persiste en disco.
   * Requisito 3.1, 3.5
   */
  registrar(cambio: CambioEstado): void {
    const clave = this.buildClave(cambio);
    this.notificaciones.add(clave);
    this.guardar();
  }

  private buildClave(cambio: CambioEstado): string {
    return `${cambio.recursoId}:${cambio.estadoAnterior}:${cambio.estadoNuevo}`;
  }

  private cargar(): void {
    if (!fs.existsSync(this.filePath)) {
      this.notificaciones = new Set();
      return;
    }

    try {
      const contenido = fs.readFileSync(this.filePath, 'utf-8');
      const datos: ArchivoNotificaciones = JSON.parse(contenido);
      this.notificaciones = new Set(
        datos.notificaciones.map((e) => e.claveDeduplicacion)
      );
    } catch (err) {
      console.warn(
        `[RegistroNotificaciones] Archivo corrupto o inválido en "${this.filePath}". Reiniciando vacío.`,
        err
      );
      this.notificaciones = new Set();
      this.guardar();
    }
  }

  private guardar(): void {
    const datos: ArchivoNotificaciones = {
      notificaciones: Array.from(this.notificaciones).map((clave) => ({
        claveDeduplicacion: clave,
        timestamp: new Date().toISOString(),
      })),
    };

    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(this.filePath, JSON.stringify(datos, null, 2), 'utf-8');
  }
}
