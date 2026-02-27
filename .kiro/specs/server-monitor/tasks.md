# Plan de Implementación: Monitor de Servidores e Infraestructura

## Descripción General

Implementación incremental de la aplicación de monitoreo, comenzando por la estructura del proyecto y los tipos compartidos, luego el backend (almacén, verificadores, API), y finalmente el frontend (dashboard, tarjetas, formularios).

## Tareas

- [ ] 1. Configurar estructura del proyecto y tipos compartidos
  - Inicializar monorepo con carpetas `backend/` y `frontend/`
  - Configurar `tsconfig.json`, `package.json` y dependencias en ambos proyectos
  - Instalar dependencias backend: `express`, `axios`, `uuid`, `ws`, `cors`
  - Instalar dependencias frontend: `react`, `react-dom`, `tailwindcss`, `axios`
  - Instalar dependencias de testing: `jest`, `ts-jest`, `fast-check`, `vitest`, `@testing-library/react`
  - Definir los tipos TypeScript compartidos en `backend/src/types/index.ts` (Servidor, UrlMonitoreada, ResultadoPuerto, EstadoServidor, etc.)
  - _Requisitos: 1.1, 2.1, 3.1, 4.1, 5.1_

- [ ] 2. Implementar el Almacén de Configuración (ConfigStore)
  - [ ] 2.1 Implementar `backend/src/store/ConfigStore.ts`
    - Métodos: `obtenerServidores`, `agregarServidor`, `eliminarServidor`, `agregarPuerto`, `eliminarPuerto`, `agregarUrl`, `eliminarUrl`, `obtenerConfiguracion`, `actualizarConfiguracion`
    - Persistencia en `data/config.json` con lectura/escritura atómica
    - Validación de duplicados de host al agregar servidor
    - Validación de rango de puertos [0, 65535] y duplicados
    - Validación de formato de URL y duplicados
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_

  - [ ] 2.2 Escribir prueba de propiedad: Registro y recuperación de servidor
    - **Propiedad 1: Registro de servidor persiste y es recuperable**
    - **Valida: Requisitos 1.1, 1.3**
    - Usar `fast-check` con `fc.ipV4()` y `fc.string()` para generar datos aleatorios

  - [ ] 2.3 Escribir prueba de propiedad: Eliminación completa de servidor
    - **Propiedad 2: Eliminación de servidor es completa**
    - **Valida: Requisitos 1.2**

  - [ ] 2.4 Escribir prueba de propiedad: Rechazo de servidores duplicados
    - **Propiedad 3: Rechazo de servidores duplicados**
    - **Valida: Requisitos 1.4**

  - [ ] 2.5 Escribir prueba de propiedad: Validación de puertos
    - **Propiedad 4: Validación de puertos rechaza entradas inválidas**
    - **Valida: Requisitos 2.3, 2.4**
    - Generar enteros fuera de [0, 65535] con `fc.integer({ max: -1 })` y `fc.integer({ min: 65536 })`

  - [ ] 2.6 Escribir prueba de propiedad: Validación de URLs
    - **Propiedad 5: Validación de URLs rechaza entradas inválidas**
    - **Valida: Requisitos 3.3, 3.4**

  - [ ] 2.7 Escribir prueba de propiedad: Round-trip de configuración JSON
    - **Propiedad 10: Persistencia round-trip de configuración**
    - **Valida: Requisitos 1.3**
    - Generar configuraciones válidas aleatorias, serializar y deserializar, verificar equivalencia

- [ ] 3. Checkpoint — Verificar que todas las pruebas del almacén pasan
  - Ejecutar `npm test` en el backend y asegurarse de que todas las pruebas pasen. Consultar al usuario si hay dudas.

- [ ] 4. Implementar los Verificadores (PortChecker y HTTPSChecker)
  - [ ] 4.1 Implementar `backend/src/checkers/VerificadorPuertos.ts`
    - Conexión TCP con `net.createConnection` de Node.js
    - Timeout de 5000ms por puerto
    - Retornar `ResultadoPuerto` con estado `abierto`, `cerrado` o `sin_respuesta`
    - _Requisitos: 4.1, 4.2, 4.3, 4.4_

  - [ ] 4.2 Implementar `backend/src/checkers/VerificadorHTTPS.ts`
    - Solicitudes HTTP GET con `axios` y timeout de 10000ms
    - Detectar errores de certificado SSL (código de error `CERT_*`, `UNABLE_TO_VERIFY_*`)
    - Clasificar códigos HTTP: 200-399 → `disponible`, >=400 → `no_disponible`
    - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 4.3 Escribir prueba de propiedad: Clasificación de estado HTTP
    - **Propiedad 6: Clasificación de estado HTTP es exhaustiva y correcta**
    - **Valida: Requisitos 5.2, 5.3**
    - Usar `fc.integer({ min: 200, max: 399 })` y `fc.integer({ min: 400, max: 599 })`

  - [ ]* 4.4 Escribir pruebas unitarias para los verificadores
    - Mockear `net.createConnection` y `axios.get` para simular respuestas
    - Verificar timeout de 5s para puertos y 10s para URLs
    - _Requisitos: 4.4, 5.5_

- [ ] 5. Implementar el Servicio de Monitoreo
  - [ ] 5.1 Implementar `backend/src/services/ServicioMonitoreo.ts`
    - Método `verificarServidor(id)`: ejecuta PortChecker y HTTPSChecker para un servidor
    - Método `verificarTodos()`: itera sobre todos los servidores y los verifica en paralelo
    - Lógica de determinación de estado: ok / alerta / desconocido
    - Actualizar estado y `ultimaVerificacion` en ConfigStore tras cada verificación
    - _Requisitos: 4.5, 5.6, 7.7, 8.1, 8.2_

  - [ ] 5.2 Implementar `backend/src/services/Planificador.ts`
    - Usar `setInterval` para ejecutar `verificarTodos()` periódicamente
    - Métodos `iniciar(intervaloSegundos)` y `detener()`
    - Validar que el intervalo esté en [30, 3600] segundos
    - _Requisitos: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 5.3 Escribir prueba de propiedad: Validación del intervalo de monitoreo
    - **Propiedad 9: Validación del intervalo de monitoreo**
    - **Valida: Requisitos 6.3, 6.4**

- [ ] 6. Implementar la API REST y WebSocket
  - [ ] 6.1 Implementar `backend/src/api/routes.ts` con todos los endpoints definidos en el diseño
    - Rutas de servidores: GET, POST, DELETE `/api/servers`
    - Rutas de puertos: POST, DELETE `/api/servers/:id/ports`
    - Rutas de URLs: POST, DELETE `/api/servers/:id/urls`
    - Rutas de monitoreo: POST `/api/monitor/check/:id`, POST `/api/monitor/check-all`
    - Rutas de configuración: GET, PUT `/api/settings`
    - _Requisitos: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 6.2, 8.1, 8.2_

  - [ ] 6.2 Implementar servidor WebSocket en `backend/src/api/websocket.ts`
    - Emitir evento `server-update` cuando cambia el estado de un servidor
    - Emitir evento `check-progress` durante verificaciones manuales
    - _Requisitos: 7.6, 8.3_

  - [ ] 6.3 Implementar `backend/src/index.ts` como punto de entrada
    - Inicializar Express, WebSocket, ConfigStore y Planificador
    - Cargar configuración de intervalo desde ConfigStore al arrancar
    - _Requisitos: 6.1_

- [ ] 7. Checkpoint — Probar la API manualmente con curl o Postman
  - Verificar que todos los endpoints responden correctamente. Ejecutar `npm test` en el backend. Consultar al usuario si hay dudas.

- [ ] 8. Implementar los tipos y el cliente API del frontend
  - Definir tipos TypeScript en `frontend/src/types/index.ts` (espejo de los tipos del backend)
  - Implementar `frontend/src/services/api.ts` con funciones para todos los endpoints REST
  - Implementar `frontend/src/services/websocket.ts` para la conexión WebSocket
  - _Requisitos: 7.1, 7.6_

- [ ] 9. Implementar los componentes del Dashboard
  - [ ] 9.1 Implementar `frontend/src/components/StatusBadge.tsx`
    - Componente visual que muestra "OK" en verde o "Alerta" en rojo/naranja según el estado
    - _Requisitos: 7.2, 7.3_

  - [ ] 9.2 Implementar `frontend/src/components/SummaryBar.tsx`
    - Barra superior con conteo total de servidores OK y en Alerta
    - _Requisitos: 7.5_

  - [ ] 9.3 Implementar `frontend/src/components/ServerCard.tsx`
    - Tarjeta visual por servidor con nombre, host, estado (OK/Alerta), última verificación
    - Fondo verde para Estado_OK, fondo rojo/naranja para Estado_Alerta
    - Botón de verificación manual por servidor
    - Indicador de carga durante verificación en progreso
    - _Requisitos: 7.1, 7.2, 7.3, 7.7, 8.1, 8.3_

  - [ ]* 9.4 Escribir prueba de propiedad: Renderizado de tarjeta según estado
    - **Propiedad 7: Renderizado de tarjeta refleja estado del servidor**
    - **Valida: Requisitos 7.2, 7.3**
    - Usar `fast-check` con `fc.constantFrom('ok', 'alerta')` y verificar clases CSS aplicadas

  - [ ]* 9.5 Escribir prueba de propiedad: Conteo del resumen global
    - **Propiedad 8: Conteo del resumen global es consistente**
    - **Valida: Requisitos 7.5**
    - Generar listas aleatorias de servidores con estados mixtos y verificar que ok + alerta + desconocido = total

- [ ] 10. Implementar el Modal de Detalle y los Formularios
  - [ ] 10.1 Implementar `frontend/src/components/ServerDetailModal.tsx`
    - Modal que muestra al hacer clic en una tarjeta de servidor
    - Lista de puertos con estado individual (abierto/cerrado/sin_respuesta)
    - Lista de URLs con estado individual, código HTTP y error de certificado
    - _Requisitos: 7.4_

  - [ ] 10.2 Implementar `frontend/src/components/AddServerForm.tsx`
    - Formulario con campos: nombre, host (IP o hostname)
    - Validación en frontend antes de enviar a la API
    - _Requisitos: 1.1, 1.4_

  - [ ] 10.3 Implementar `frontend/src/components/AddPortForm.tsx` y `AddUrlForm.tsx`
    - Formulario de puerto con validación de rango [0, 65535]
    - Formulario de URL con validación de formato http/https
    - _Requisitos: 2.1, 2.3, 3.1, 3.3_

- [ ] 11. Implementar el Dashboard principal y los Hooks
  - [ ] 11.1 Implementar `frontend/src/hooks/useServers.ts`
    - Estado de la lista de servidores con carga inicial desde la API
    - Funciones para agregar/eliminar servidores, puertos y URLs
    - _Requisitos: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2_

  - [ ] 11.2 Implementar `frontend/src/hooks/useMonitor.ts`
    - Suscripción al WebSocket para recibir actualizaciones en tiempo real
    - Funciones para verificación manual de servidor y de toda la infraestructura
    - _Requisitos: 7.6, 8.1, 8.2, 8.3, 8.4_

  - [ ] 11.3 Implementar `frontend/src/components/Dashboard.tsx`
    - Contenedor principal que usa `useServers` y `useMonitor`
    - Renderiza `SummaryBar`, grilla de `ServerCard`, botón "Verificar Todo"
    - Panel de configuración de intervalo de monitoreo
    - _Requisitos: 7.1, 7.5, 7.6, 6.2_

  - [ ] 11.4 Implementar `frontend/src/App.tsx` como punto de entrada de la aplicación
    - Configurar rutas y layout principal
    - _Requisitos: 7.1_

- [ ] 12. Checkpoint final — Verificar integración completa
  - Ejecutar todas las pruebas del backend y frontend con `npm test`. Verificar que el dashboard se actualiza en tiempo real al cambiar estados. Consultar al usuario si hay dudas.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Las pruebas de propiedad validan corrección universal con mínimo 100 iteraciones cada una
- Las pruebas unitarias validan ejemplos específicos y casos borde
