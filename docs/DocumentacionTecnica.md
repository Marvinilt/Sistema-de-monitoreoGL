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
- `ServicioMonitoreo` — orquesta verificaciones en paralelo, determina estado ok/alerta/desconocido
- `Planificador` — `setInterval` configurable entre 30s y 3600s
- `GestorWebSocket` — emite `server-update` y `check-progress` a todos los clientes conectados

**Frontend:**
- `Dashboard` — contenedor principal con hooks `useServers` y `useMonitor`
- `ServerCard` — tarjeta visual con fondo verde (ok) o rojo (alerta)
- `ServerDetailModal` — detalle de puertos y URLs con formularios inline
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
