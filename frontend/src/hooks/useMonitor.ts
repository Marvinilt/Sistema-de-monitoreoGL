import { useState, useEffect, useCallback } from 'react';
import { Servidor } from '../types';
import { clienteWS } from '../services/websocket';
import * as api from '../services/api';

export function useMonitor(onServerUpdate: (servidor: Servidor) => void) {
  const [enProgreso, setEnProgreso] = useState<Set<string>>(new Set());

  useEffect(() => {
    clienteWS.conectar();
    const unsub = clienteWS.onMensaje((evento) => {
      if (evento.tipo === 'server-update') {
        onServerUpdate(evento.datos);
      } else if (evento.tipo === 'check-progress') {
        setEnProgreso((prev) => {
          const next = new Set(prev);
          if (evento.datos.enProgreso) next.add(evento.datos.servidorId);
          else next.delete(evento.datos.servidorId);
          return next;
        });
      }
    });
    return () => {
      unsub();
      clienteWS.desconectar();
    };
  }, [onServerUpdate]);

  const verificarServidor = useCallback(async (id: string) => {
    await api.verificarServidor(id);
  }, []);

  const verificarTodos = useCallback(async () => {
    await api.verificarTodos();
  }, []);

  return { enProgreso, verificarServidor, verificarTodos };
}
