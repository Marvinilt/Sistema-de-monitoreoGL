import * as net from 'net';
import { ResultadoPuerto } from '../types';

const TIMEOUT_MS = 5000;

export class VerificadorPuertos {
  async verificarPuerto(host: string, puerto: number): Promise<ResultadoPuerto> {
    const inicio = Date.now();
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let resuelto = false;

      const terminar = (estado: ResultadoPuerto['estado']) => {
        if (resuelto) return;
        resuelto = true;
        socket.destroy();
        resolve({
          puerto,
          estado,
          latenciaMs: estado === 'abierto' ? Date.now() - inicio : null,
        });
      };

      socket.setTimeout(TIMEOUT_MS);
      socket.connect(puerto, host, () => terminar('abierto'));
      socket.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'ECONNREFUSED') terminar('cerrado');
        else terminar('sin_respuesta');
      });
      socket.on('timeout', () => terminar('sin_respuesta'));
    });
  }

  async verificarPuertos(host: string, puertos: number[]): Promise<ResultadoPuerto[]> {
    return Promise.all(puertos.map((p) => this.verificarPuerto(host, p)));
  }
}
