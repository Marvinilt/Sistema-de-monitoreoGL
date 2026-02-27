import { EventoWebSocket } from '../types';

type Handler = (evento: EventoWebSocket) => void;

export class ClienteWebSocket {
  private ws: WebSocket | null = null;
  private handlers: Handler[] = [];
  private reconectarTimer: ReturnType<typeof setTimeout> | null = null;

  conectar(): void {
    const url = `ws://${window.location.host}/ws`;
    this.ws = new WebSocket(url);

    this.ws.onmessage = (e) => {
      try {
        const evento = JSON.parse(e.data) as EventoWebSocket;
        this.handlers.forEach((h) => h(evento));
      } catch {
        console.error('[WebSocket] Mensaje inválido:', e.data);
      }
    };

    this.ws.onclose = () => {
      this.reconectarTimer = setTimeout(() => this.conectar(), 3000);
    };

    this.ws.onerror = (err) => console.error('[WebSocket] Error:', err);
  }

  desconectar(): void {
    if (this.reconectarTimer) clearTimeout(this.reconectarTimer);
    this.ws?.close();
    this.ws = null;
  }

  onMensaje(handler: Handler): () => void {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }
}

export const clienteWS = new ClienteWebSocket();
