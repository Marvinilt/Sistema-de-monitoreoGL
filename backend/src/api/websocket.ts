import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { EventoWebSocket, Servidor } from '../types';

export class GestorWebSocket {
  private wss: WebSocketServer;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.wss.on('connection', (ws) => {
      ws.on('error', (err) => console.error('[WebSocket] Error:', err));
    });
  }

  private emitir(evento: EventoWebSocket): void {
    const mensaje = JSON.stringify(evento);
    this.wss.clients.forEach((cliente) => {
      if (cliente.readyState === WebSocket.OPEN) {
        cliente.send(mensaje);
      }
    });
  }

  emitirActualizacionServidor(servidor: Servidor): void {
    this.emitir({ tipo: 'server-update', datos: servidor });
  }

  emitirProgresoVerificacion(servidorId: string, enProgreso: boolean): void {
    this.emitir({ tipo: 'check-progress', datos: { servidorId, enProgreso } });
  }
}
