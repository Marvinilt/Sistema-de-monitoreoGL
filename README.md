# Monitor de Servidores e Infraestructura

Aplicación web full-stack para monitorear en tiempo real el estado de puertos TCP y URLs HTTPS en servidores de infraestructura.

## Stack

- **Backend**: Node.js + Express + TypeScript, WebSocket (`ws`)
- **Frontend**: React + TypeScript + Tailwind CSS + Vite
- **Persistencia**: JSON local (`backend/data/config.json`)
- **Testing**: Jest + fast-check (backend), Vitest + React Testing Library (frontend)

## Estructura

```
server-monitor/
├── backend/          # API REST, verificadores TCP/HTTPS, WebSocket
│   └── src/
│       ├── api/      # routes.ts, websocket.ts
│       ├── checkers/ # VerificadorPuertos.ts, VerificadorHTTPS.ts
│       ├── services/ # ServicioMonitoreo.ts, Planificador.ts
│       ├── store/    # ConfigStore.ts
│       └── types/    # index.ts
└── frontend/         # Dashboard React
    └── src/
        ├── components/
        ├── hooks/
        ├── services/
        └── types/
```

## Inicio rápido

```bash
# Instalar dependencias
npm run install:all

# Ejecutar backend (puerto 3001)
npm run dev:backend

# Ejecutar frontend (puerto 3000)
npm run dev:frontend

# Ejecutar todas las pruebas
npm test
```

## API REST

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/servers` | Listar servidores |
| POST | `/api/servers` | Agregar servidor |
| DELETE | `/api/servers/:id` | Eliminar servidor |
| POST | `/api/servers/:id/ports` | Agregar puerto |
| DELETE | `/api/servers/:id/ports/:port` | Eliminar puerto |
| POST | `/api/servers/:id/urls` | Agregar URL |
| DELETE | `/api/servers/:id/urls/:urlId` | Eliminar URL |
| POST | `/api/monitor/check/:id` | Verificar servidor |
| POST | `/api/monitor/check-all` | Verificar todos |
| GET/PUT | `/api/settings` | Configuración de intervalo |

## WebSocket

Conectar a `ws://localhost:3001/ws`. Eventos emitidos:
- `server-update`: estado actualizado de un servidor
- `check-progress`: indicador de verificación en progreso

---
*Actualizado: 2026-02-27*
