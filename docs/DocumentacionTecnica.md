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

| Propiedad | Descripción | Herramienta |
|-----------|-------------|-------------|
| 1 | Registro de servidor persiste y es recuperable | fast-check |
| 2 | Eliminación de servidor es completa | fast-check |
| 3 | Rechazo de servidores duplicados | fast-check |
| 4 | Validación de puertos rechaza entradas inválidas | fast-check |
| 5 | Validación de URLs rechaza entradas inválidas | manual |
| 6 | Clasificación de estado HTTP es exhaustiva | fast-check |
| 7 | Renderizado de tarjeta refleja estado | fast-check + RTL |
| 8 | Conteo del resumen global es consistente | fast-check |
| 9 | Validación del intervalo de monitoreo | fast-check |
| 10 | Persistencia round-trip de configuración | fast-check |

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
