# Monitor de Servidores e Infraestructura

Aplicación web full-stack para monitorear en tiempo real el estado de puertos TCP y URLs HTTPS en servidores de infraestructura.

## Stack

- **Backend**: Node.js + Express + TypeScript, WebSocket (`ws`)
- **Frontend**: React + TypeScript + Tailwind CSS + Vite (UI Cyber-Dark Futurista)
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

| Método  | Ruta                           | Descripción                |
| ------- | ------------------------------ | -------------------------- |
| GET     | `/api/servers`                 | Listar servidores          |
| POST    | `/api/servers`                 | Agregar servidor           |
| DELETE  | `/api/servers/:id`             | Eliminar servidor          |
| POST    | `/api/servers/:id/ports`       | Agregar puerto             |
| DELETE  | `/api/servers/:id/ports/:port` | Eliminar puerto            |
| POST    | `/api/servers/:id/urls`        | Agregar URL                |
| DELETE  | `/api/servers/:id/urls/:urlId` | Eliminar URL               |
| POST    | `/api/monitor/check/:id`       | Verificar servidor         |
| POST    | `/api/monitor/check-all`       | Verificar todos            |
| GET/PUT | `/api/settings`                | Configuración de intervalo e interfaz (Tema) |

| GET | `/api/config/email` | Obtener configuración de email (sin contraseña) |
| PUT | `/api/config/email` | Actualizar configuración de email |
| POST | `/api/config/email/test` | Probar conexión SMTP |

## WebSocket

Conectar a `ws://localhost:3001/ws`. Eventos emitidos:
- `server-update`: estado actualizado de un servidor
- `check-progress`: indicador de verificación en progreso

## Notificaciones por Email y Recursos del Sistema

El sistema envía correos HTML automáticamente cuando detecta cambios de estado en servidores, puertos o URLs, así como cuando los recursos del sistema superan los umbrales configurados. Todo esto es configurable desde el panel de **Configuración de notificaciones**.

**Configuración requerida:** 
- Para email: host SMTP, puerto, usuario, contraseña, remitente y al menos un destinatario válido.
- Para alertas de recursos: Umbrales porcentuales de CPU, Memoria RAM y uso de Disco. Por defecto 90%, 85% y 90% respectivamente.

**Nota sobre recursos remotos:** La arquitectura primaria requiere desplegar un Agente en los servidores monitoreados (para consultar `/metrics`), sin embargo, a modo de demostración, los valores visualizados actualmente provienen de una simulación de monitoreo.

**Nota para entornos internos:** si el servidor SMTP solo es accesible por IP privada, usar la IP directa como `smtpHost` en lugar del hostname.

---
*Actualizado: 2026-03-08*
