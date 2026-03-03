import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { ConfigStore } from './store/ConfigStore';
import { ServicioMonitoreo } from './services/ServicioMonitoreo';
import { Planificador } from './services/Planificador';
import { GestorWebSocket } from './api/websocket';
import { crearRouter } from './api/routes';
import { RegistroNotificaciones } from './services/RegistroNotificaciones';
import { ServicioNotificaciones } from './services/ServicioNotificaciones';
import { ServicioEmail } from './services/ServicioEmail';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// Inicializar componentes
const store = new ConfigStore();
const ws = new GestorWebSocket(server);

const servicioEmail = new ServicioEmail(store);
const registroNotificaciones = new RegistroNotificaciones(
  path.join(__dirname, '../data/notifications.json')
);
const servicioNotificaciones = new ServicioNotificaciones(store, registroNotificaciones, servicioEmail);

const servicio = new ServicioMonitoreo(store, (servidorId) => {
  const servidor = store.obtenerServidor(servidorId);
  if (servidor) ws.emitirActualizacionServidor(servidor);
}, servicioNotificaciones);

const planificador = new Planificador(servicio);

// Rutas
app.use('/api', crearRouter(store, servicio, ws));

// Arrancar planificador con el intervalo guardado
const { intervaloMonitoreoSegundos } = store.obtenerConfiguracion();
planificador.iniciar(intervaloMonitoreoSegundos);

server.listen(PORT, () => {
  console.log(`[Backend] Servidor escuchando en http://localhost:${PORT}`);
  console.log(`[Backend] WebSocket disponible en ws://localhost:${PORT}/ws`);
  console.log(`[Backend] Monitoreo periódico cada ${intervaloMonitoreoSegundos}s`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  planificador.detener();
  server.close(() => process.exit(0));
});
