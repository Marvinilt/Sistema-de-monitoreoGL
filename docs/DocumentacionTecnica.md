# Documentación Técnica — Monitor de Servidores e Infraestructura

## Funcionalidad: Estructura base del proyecto y tipos compartidos

**Fecha:** 2026-02-27

### Descripción

Implementación completa de la aplicación de monitoreo de servidores. Incluye backend (API REST + WebSocket + verificadores) y frontend (dashboard React).

### Arquitectura

```
Frontend (React/Vite :3000)  ←→  Backend (Express :3001)
                                      ├── ConfigStore (JSON)
                                      ├── VerificadorPuertos (TCP)
                                      ├── VerificadorHTTPS (axios)
                                      ├── ServicioMonitoreo
                                      └── Planificador (setInterval)
```

### Componentes clave

**Backend:**
- `ConfigStore` — persistencia atómica en `data/config.json` con validaciones de duplicados, rango de puertos [0,65535] y formato de URL
- `VerificadorPuertos` — conexión TCP con `net.createConnection`, timeout 5s
- `VerificadorHTTPS` — GET con `axios`, timeout 10s, detección de errores SSL
- `ServicioMonitoreo` — orquesta verificaciones en paralelo, determina estado ok/alerta/desconocido; persiste `resultadosPuertos` por servidor tras cada ciclo
- `Planificador` — `setInterval` configurable entre 30s y 3600s
- `GestorWebSocket` — emite `server-update` y `check-progress` a todos los clientes conectados

**Frontend:**
- `Dashboard` — contenedor principal con hooks `useServers` y `useMonitor`
- `ServerCard` — tarjeta visual con fondo verde (ok) o rojo (alerta); muestra inline el estado de cada puerto y URL con código HTTP
- `ServerDetailModal` — detalle de puertos y URLs con formularios inline y colores de estado
- `SummaryBar` — conteo global OK/Alerta y botón "Verificar Todo"
- `SettingsPanel` — configuración del intervalo de monitoreo

### Dependencias agregadas

**Backend:** `express`, `axios`, `uuid`, `ws`, `cors`, `fast-check`, `jest`, `ts-jest`

**Frontend:** `react`, `react-dom`, `axios`, `tailwindcss`, `vite`, `vitest`, `fast-check`, `@testing-library/react`

### Pruebas de propiedad implementadas

| Propiedad | Descripción                                      | Herramienta      |
| --------- | ------------------------------------------------ | ---------------- |
| 1         | Registro de servidor persiste y es recuperable   | fast-check       |
| 2         | Eliminación de servidor es completa              | fast-check       |
| 3         | Rechazo de servidores duplicados                 | fast-check       |
| 4         | Validación de puertos rechaza entradas inválidas | fast-check       |
| 5         | Validación de URLs rechaza entradas inválidas    | manual           |
| 6         | Clasificación de estado HTTP es exhaustiva       | fast-check       |
| 7         | Renderizado de tarjeta refleja estado            | fast-check + RTL |
| 8         | Conteo del resumen global es consistente         | fast-check       |
| 9         | Validación del intervalo de monitoreo            | fast-check       |
| 10        | Persistencia round-trip de configuración         | fast-check       |

---

## Feature: Visualización de estados de puertos y URLs en tarjetas del dashboard

**Fecha:** 2026-03-02

### Descripción

Mejora visual del dashboard que expone directamente en cada `ServerCard` el estado detallado de los puertos TCP y las URLs monitoreadas, sin necesidad de abrir el modal de detalle. Incluye indicadores de color, códigos HTTP de respuesta y alertas de certificado SSL.

### Cambios realizados

#### `backend/src/types/index.ts`
- Se agregó el campo `resultadosPuertos: ResultadoPuerto[]` a la interfaz `Servidor` para persistir el último resultado de verificación por puerto junto al servidor.

#### `frontend/src/types/index.ts`
- Se sincronizó la interfaz `Servidor` del frontend con el nuevo campo `resultadosPuertos: ResultadoPuerto[]`.
- Se exportó el tipo `EstadoPuerto` para uso en componentes.

#### `backend/src/services/ServicioMonitoreo.ts`
- `verificarServidor` ahora llama a `store.actualizarEstadoServidor` pasando también los `resultadosPuertos`, de modo que el estado de cada puerto queda persistido en `config.json` y disponible vía API.

#### `frontend/src/components/ServerCard.tsx`
- Cuando existen `resultadosPuertos` (post-verificación), se renderizan badges por puerto con:
  - Indicador de color: verde (abierto), rojo (cerrado), amarillo (sin_respuesta)
  - Número de puerto con tooltip que incluye latencia en ms
- Para cada URL se muestra inline:
  - Indicador de color según estado (disponible / no_disponible / error_certificado / desconocido)
  - Nombre de dominio truncado
  - Código HTTP de respuesta coloreado (verde < 400, rojo ≥ 400)
  - Ícono 🔒 cuando hay error de certificado SSL
- Antes de la primera verificación se muestra la lista de puertos configurados en texto plano.

#### `frontend/src/components/ServerDetailModal.tsx`
- Se aplican colores de estado a los puertos y URLs en el modal de detalle, consistentes con los de la tarjeta.

#### `backend/tsconfig.json`
- Se agregó `"types": ["jest", "node"]` y se eliminó `**/*.test.ts` del `exclude` para que el editor TypeScript reconozca los globals de Jest en los archivos de test.

### Modelo de datos actualizado

```typescript
interface Servidor {
  // ... campos existentes ...
  resultadosPuertos: ResultadoPuerto[]; // NUEVO — último resultado por puerto
}

interface ResultadoPuerto {
  puerto: number;
  estado: 'abierto' | 'cerrado' | 'sin_respuesta';
  latenciaMs: number | null;
}
```

### Comportamiento

- Antes de la primera verificación: la tarjeta muestra los puertos configurados como lista de números y las URLs sin estado.
- Después de verificar: cada puerto muestra su estado con color y cada URL muestra su estado, código HTTP y alerta de certificado si aplica.
- Los estados son consistentes entre la tarjeta (`ServerCard`) y el modal de detalle (`ServerDetailModal`).

---

## Feature: Sistema de Notificaciones por Correo Electrónico

**Fecha:** 2026-03-03

### Descripción

Implementación completa del sistema de notificaciones por email. Cuando el ciclo de monitoreo detecta un cambio de estado en un servidor, puerto o URL, el sistema envía un correo HTML consolidado a los destinatarios configurados. Cada cambio se notifica exactamente una vez mediante un registro persistente de deduplicación.

### Arquitectura

```
Planificador → ServicioMonitoreo → ServicioNotificaciones
                                        ├── RegistroNotificaciones (notifications.json)
                                        ├── ConfigStore (config.json → sección email)
                                        └── ServicioEmail (nodemailer → SMTP)

API REST (/api/config/email) → ConfigStore
Frontend SettingsPanel → API REST
```

### Componentes nuevos

#### `backend/src/services/ServicioNotificaciones.ts`
- `procesarResultado(servidorAntes, resultado)` — compara estado anterior vs nuevo para servidor, puertos y URLs
- `detectarCambios()` — genera lista de `CambioEstado` para recursos con transición real
- Omite procesamiento si `habilitado: false` o sin configuración de email
- Registra estado inicial sin notificar en primera verificación

#### `backend/src/services/RegistroNotificaciones.ts`
- Persiste en `backend/data/notifications.json`
- Clave de deduplicación: `${recursoId}:${estadoAnterior}:${estadoNuevo}`
- `yaNotificado(cambio)` — consulta si el cambio exacto ya fue notificado
- `registrar(cambio)` — persiste el cambio notificado
- Maneja archivo corrupto reiniciando vacío con log de advertencia

#### `backend/src/services/ServicioEmail.ts`
- `construirHtml(cambios)` — tabla HTML con colores e iconos por estado (✅🔴⚠️❓)
- `enviarNotificacion(cambios)` — envío consolidado via nodemailer
- Asunto: `[Monitor Servidores] N cambio(s) detectado(s) - DD/MM/YYYY HH:MM`
- Timeout SMTP 10s, captura errores sin relanzar
- Usa `dns.lookup` para respetar el archivo `hosts` del SO
- `tls: { rejectUnauthorized: false }` para servidores con certificado expirado

### Endpoints REST nuevos

| Método | Ruta                     | Descripción                                    |
| ------ | ------------------------ | ---------------------------------------------- |
| GET    | `/api/config/email`      | Retorna config sin exponer `smtpPassword`      |
| PUT    | `/api/config/email`      | Valida y persiste config; HTTP 400 si inválida |
| POST   | `/api/config/email/test` | Prueba conexión SMTP; acepta config en body    |

### Cambios en componentes existentes

#### `backend/src/store/ConfigStore.ts`
- `obtenerConfiguracionEmail()` — retorna sección `email` de config.json
- `actualizarConfiguracionEmail(config)` — valida destinatarios RFC 5322, persiste

#### `backend/src/services/ServicioMonitoreo.ts`
- Captura estado anterior antes de actualizar y llama `ServicioNotificaciones.procesarResultado()` de forma asíncrona

#### `backend/src/services/Planificador.ts`
- Captura excepciones de `ServicioNotificaciones` sin interrumpir el ciclo

#### `backend/src/api/routes.ts`
- Nuevos endpoints de configuración de email
- Endpoint de prueba SMTP acepta config en body (sin necesidad de guardar primero)

#### `frontend/src/types/index.ts`
- Nuevas interfaces: `ConfiguracionEmail`, `ResultadoPruebaConexion`

#### `frontend/src/services/api.ts`
- `obtenerConfiguracionEmail()`, `actualizarConfiguracionEmail()`, `probarConexionEmail(config)`

#### `frontend/src/components/SettingsPanel.tsx`
- Sección "Notificaciones por Email" con toggle, campos SMTP, lista de destinatarios y botón "Probar conexión"

### Modelo de datos

```typescript
interface ConfiguracionEmail {
  habilitado: boolean;
  smtpHost: string;
  smtpPuerto: number;
  smtpUsuario: string;
  smtpPassword: string;
  remitente: string;
  destinatarios: string[]; // mínimo 1, formato RFC 5322
}

interface CambioEstado {
  recursoId: string;
  tipoRecurso: 'servidor' | 'puerto' | 'url';
  nombreRecurso: string;
  estadoAnterior: string;
  estadoNuevo: string;
  timestamp: string; // ISO 8601
  servidorId: string;
  servidorNombre: string;
}
```

### Dependencias agregadas

**Backend:** `nodemailer`, `@types/nodemailer`

### Propiedades de corrección implementadas (fast-check)

| Propiedad | Descripción                                                            |
| --------- | ---------------------------------------------------------------------- |
| 1         | Deduplicación: `yaNotificado` retorna `true` para cambio ya registrado |
| 2         | Round-trip: `registrar` → `yaNotificado` retorna `true`                |
| 3         | Cambios distintos no son deduplicados                                  |
| 4         | Detección correcta de cambios por tipo de recurso                      |
| 5         | Sin cambio no genera notificación                                      |
| 6         | HTML del correo contiene información de cada cambio                    |
| 7         | Validación de destinatarios rechaza formatos inválidos                 |

### Notas de conectividad SMTP

- El transporter usa `dns.lookup` (respeta `/etc/hosts` y `C:\Windows\System32\drivers\etc\hosts`)
- Para servidores SMTP internos accesibles solo por IP, usar la IP directa como `smtpHost`
- `ignoreTLS: true` + `tls: { rejectUnauthorized: false }` para relay interno sin TLS estricto
