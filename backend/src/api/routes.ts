import { Router, Request, Response } from 'express';
import * as nodemailer from 'nodemailer';
import { lookup as dnsLookup } from 'dns';
import { ConfigStore } from '../store/ConfigStore';
import { ServicioMonitoreo } from '../services/ServicioMonitoreo';
import { GestorWebSocket } from './websocket';

export function crearRouter(
  store: ConfigStore,
  servicio: ServicioMonitoreo,
  ws: GestorWebSocket
): Router {
  const router = Router();

  // --- Servidores ---

  // GET /api/servers
  router.get('/servers', (_req: Request, res: Response) => {
    res.json(store.obtenerServidores());
  });

  // POST /api/servers
  router.post('/servers', (req: Request, res: Response) => {
    try {
      const { nombre, host } = req.body;
      if (!nombre || !host) {
        res.status(400).json({ error: 'nombre y host son requeridos' });
        return;
      }
      const servidor = store.agregarServidor(nombre, host);
      res.status(201).json(servidor);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  // DELETE /api/servers/:id
  router.delete('/servers/:id', (req: Request, res: Response) => {
    try {
      store.eliminarServidor(req.params.id);
      res.status(204).send();
    } catch (err) {
      res.status(404).json({ error: (err as Error).message });
    }
  });

  // --- Puertos ---

  // POST /api/servers/:id/ports
  router.post('/servers/:id/ports', (req: Request, res: Response) => {
    try {
      const puerto = Number(req.body.puerto);
      if (isNaN(puerto)) {
        res.status(400).json({ error: 'puerto debe ser un número' });
        return;
      }
      store.agregarPuerto(req.params.id, puerto);
      res.status(201).json(store.obtenerServidor(req.params.id));
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  // DELETE /api/servers/:id/ports/:port
  router.delete('/servers/:id/ports/:port', (req: Request, res: Response) => {
    try {
      const puerto = Number(req.params.port);
      store.eliminarPuerto(req.params.id, puerto);
      res.status(204).send();
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  // --- URLs ---

  // POST /api/servers/:id/urls
  router.post('/servers/:id/urls', (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      if (!url) {
        res.status(400).json({ error: 'url es requerida' });
        return;
      }
      const urlMon = store.agregarUrl(req.params.id, url);
      res.status(201).json(urlMon);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  // DELETE /api/servers/:id/urls/:urlId
  router.delete('/servers/:id/urls/:urlId', (req: Request, res: Response) => {
    try {
      store.eliminarUrl(req.params.id, req.params.urlId);
      res.status(204).send();
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  // --- Monitoreo manual ---

  // POST /api/monitor/check/:id
  router.post('/monitor/check/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      ws.emitirProgresoVerificacion(id, true);
      const resultado = await servicio.verificarServidor(id);
      ws.emitirProgresoVerificacion(id, false);
      const servidor = store.obtenerServidor(id);
      if (servidor) ws.emitirActualizacionServidor(servidor);
      res.json(resultado);
    } catch (err) {
      res.status(404).json({ error: (err as Error).message });
    }
  });

  // POST /api/monitor/check-all
  router.post('/monitor/check-all', async (_req: Request, res: Response) => {
    try {
      const servidores = store.obtenerServidores();
      servidores.forEach((s) => ws.emitirProgresoVerificacion(s.id, true));
      const resultados = await servicio.verificarTodos();
      servidores.forEach((s) => {
        ws.emitirProgresoVerificacion(s.id, false);
        const actualizado = store.obtenerServidor(s.id);
        if (actualizado) ws.emitirActualizacionServidor(actualizado);
      });
      res.json(resultados);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // --- Configuración ---

  // GET /api/settings
  router.get('/settings', (_req: Request, res: Response) => {
    res.json(store.obtenerConfiguracion());
  });

  // PUT /api/settings
  router.put('/settings', (req: Request, res: Response) => {
    try {
      const config = store.actualizarConfiguracion(req.body);
      res.json(config);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  // --- Configuración de Email ---

  // GET /api/config/email — retorna config sin exponer smtpPassword (Req 1.2)
  router.get('/config/email', (_req: Request, res: Response) => {
    const config = store.obtenerConfiguracionEmail();
    if (!config) {
      res.json(null);
      return;
    }
    // Omitir contraseña en texto plano (Req 1.2)
    const { smtpPassword: _omit, ...configSinPassword } = config;
    res.json({ ...configSinPassword, smtpPassword: '' });
  });

  // PUT /api/config/email — valida y persiste, HTTP 400 en error (Req 1.2, 1.3, 1.4)
  router.put('/config/email', (req: Request, res: Response) => {
    try {
      const config = store.actualizarConfiguracionEmail(req.body);
      const { smtpPassword: _omit, ...configSinPassword } = config;
      res.json({ ...configSinPassword, smtpPassword: '' });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  // POST /api/config/email/test — prueba conexión SMTP (Req 1.9, 1.10, 1.11)
  // Acepta config en el body para probar sin necesidad de guardar primero
  router.post('/config/email/test', async (req: Request, res: Response) => {
    const config = (req.body && req.body.smtpHost) ? req.body : store.obtenerConfiguracionEmail();
    if (!config) {
      res.json({ ok: false, mensaje: 'No hay configuración de email guardada' });
      return;
    }

    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPuerto,
      secure: false,
      ignoreTLS: true,
      tls: { rejectUnauthorized: false },
      auth: config.smtpUsuario ? {
        user: config.smtpUsuario,
        pass: config.smtpPassword,
      } : undefined,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 10_000,
      dnsLookup,
    } as nodemailer.TransportOptions);

    try {
      await transporter.verify();
      res.json({ ok: true, mensaje: 'Conexión SMTP exitosa' });
    } catch (err) {
      const mensaje = (err as Error).message ?? 'Error desconocido';
      res.json({ ok: false, mensaje });
    }
  });

  return router;
}
