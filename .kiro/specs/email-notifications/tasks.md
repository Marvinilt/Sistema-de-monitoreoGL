# Plan de Implementación: Notificaciones por Correo Electrónico

## Visión General

Implementación incremental del sistema de notificaciones por email, comenzando por los tipos y modelos de datos, luego la lógica de deduplicación, el servicio de email, la integración con el monitoreo, los endpoints REST y finalmente el frontend.

## Tareas

- [ ] 1. Extender tipos y modelos de datos
  - Agregar `ConfiguracionEmail` e interfaz `CambioEstado` a `backend/src/types/index.ts`
  - Extender `ConfiguracionCompleta` con campo opcional `email?: ConfiguracionEmail`
  - _Requisitos: 1.1, 1.8_

- [ ] 2. Extender ConfigStore con soporte de configuración de email
  - [ ] 2.1 Implementar `obtenerConfiguracionEmail()` y `actualizarConfiguracionEmail()` en `ConfigStore`
    - Validar que `destinatarios` tenga al menos un email con formato RFC 5322
    - Lanzar error descriptivo si la lista está vacía o contiene emails inválidos
    - _Requisitos: 1.2, 1.3, 1.4_
  - [ ] 2.2 Escribir tests unitarios para los nuevos métodos de ConfigStore
    - Casos: guardar configuración válida, lista vacía (error), email inválido (error), retrocompatibilidad sin sección email
    - _Requisitos: 1.2, 1.3, 1.4_
  - [ ] 2.3 Escribir property test: validación de destinatarios rechaza formatos inválidos
    - **Property 7: Validación de destinatarios rechaza formatos inválidos**
    - **Validates: Requirements 1.2, 1.4**
    - Usar `fast-check` para generar strings aleatorios y verificar que solo los RFC 5322 válidos pasan
    - `Feature: email-notifications, Property 7: validación de emails rechaza formatos inválidos`

- [ ] 3. Implementar RegistroNotificaciones
  - [ ] 3.1 Crear `backend/src/services/RegistroNotificaciones.ts`
    - Persistir en `backend/data/notifications.json`
    - Implementar `yaNotificado(cambio)` y `registrar(cambio)` con clave `recursoId:estadoAnterior:estadoNuevo`
    - Manejar archivo corrupto reiniciando vacío con log de advertencia
    - _Requisitos: 3.1, 3.2, 3.5_
  - [ ] 3.2 Escribir property test: registro persiste cambios notificados (round-trip)
    - **Property 2: Registro persiste cambios notificados**
    - **Validates: Requirements 3.1, 3.2**
    - Generar cambios aleatorios, registrar, verificar `yaNotificado` retorna `true`
    - `Feature: email-notifications, Property 2: registro persiste cambios notificados`
  - [ ] 3.3 Escribir property test: deduplicación de notificaciones
    - **Property 1: Deduplicación de notificaciones**
    - **Validates: Requirements 3.2, 3.3**
    - Registrar un cambio, llamar `yaNotificado` con el mismo cambio, verificar `true`
    - `Feature: email-notifications, Property 1: deduplicación de notificaciones`
  - [ ] 3.4 Escribir property test: cambios distintos no son deduplicados
    - **Property 3: Cambios distintos no son deduplicados**
    - **Validates: Requirements 3.4**
    - Generar dos cambios con diferente transición de estado, registrar solo el primero, verificar que el segundo retorna `false`
    - `Feature: email-notifications, Property 3: cambios distintos no son deduplicados`
  - [ ] 3.5 Escribir test unitario: persistencia sobrevive reinicio de instancia
    - Registrar cambios, crear nueva instancia apuntando al mismo archivo, verificar `yaNotificado` retorna `true`
    - _Requisitos: 3.5_

- [ ] 4. Implementar ServicioNotificaciones
  - [ ] 4.1 Crear `backend/src/services/ServicioNotificaciones.ts`
    - Implementar `procesarResultado(servidorAntes, resultado)` y `detectarCambios()`
    - Comparar estado de servidor, cada puerto y cada URL
    - Omitir si `habilitado: false` o si no hay configuración de email
    - Registrar estado inicial sin notificar en primera verificación
    - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5, 4.7_
  - [ ] 4.2 Escribir property test: detección correcta de cambios por tipo de recurso
    - **Property 4: Detección correcta de cambios de servidor/puerto/URL**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
    - Generar servidores con estados distintos, verificar que `detectarCambios` produce exactamente un `CambioEstado` por recurso modificado
    - `Feature: email-notifications, Property 4: detección correcta de cambios por tipo de recurso`
  - [ ] 4.3 Escribir property test: sin cambio no genera notificación
    - **Property 5: Sin cambio no genera notificación**
    - **Validates: Requirements 2.4**
    - Generar servidores donde estado anterior = estado nuevo en todos los recursos, verificar lista vacía
    - `Feature: email-notifications, Property 5: sin cambio no genera notificación`

- [ ] 5. Checkpoint — Verificar que todos los tests del backend pasan
  - Asegurar que todos los tests pasan, consultar al usuario si surgen dudas.

- [ ] 6. Implementar ServicioEmail
  - [ ] 6.1 Instalar dependencia `nodemailer` y sus tipos `@types/nodemailer` en el backend
    - _Requisitos: 4.1_
  - [ ] 6.2 Crear `backend/src/services/ServicioEmail.ts`
    - Implementar `construirHtml(cambios)` con tabla HTML, colores por estado y pie de página
    - Implementar `enviarNotificacion(cambios)` con asunto formato `[Monitor Servidores] N cambio(s) - DD/MM/YYYY HH:MM`
    - Timeout SMTP de 10 segundos, capturar errores y loguear sin relanzar
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  - [ ] 6.3 Escribir property test: HTML contiene información de cada cambio
    - **Property 6: El HTML del correo contiene la información de cada cambio**
    - **Validates: Requirements 4.2, 4.3**
    - Generar listas aleatorias de `CambioEstado`, verificar que el HTML contiene nombre, tipo, estado anterior y nuevo de cada uno
    - `Feature: email-notifications, Property 6: HTML contiene información de cada cambio`
  - [ ] 6.4 Escribir tests unitarios para ServicioEmail
    - Formato del asunto con distintos conteos y fechas
    - Colores correctos por cada valor de estado
    - Manejo de error SMTP (mock de nodemailer)
    - _Requisitos: 4.3, 4.4, 4.5, 4.6_

- [ ] 7. Integrar ServicioNotificaciones con ServicioMonitoreo y Planificador
  - [ ] 7.1 Modificar `ServicioMonitoreo.verificarServidor()` para capturar el estado anterior antes de actualizar y llamar a `ServicioNotificaciones.procesarResultado()` de forma asíncrona
    - _Requisitos: 5.1, 5.3_
  - [ ] 7.2 Modificar `Planificador` para capturar excepciones del `ServicioNotificaciones` sin interrumpir el ciclo
    - _Requisitos: 5.2_
  - [ ] 7.3 Escribir tests unitarios de integración
    - Verificar que excepción en `ServicioNotificaciones` no detiene el `Planificador`
    - Verificar que `procesarResultado` es llamado después de cada verificación
    - _Requisitos: 5.1, 5.2_

- [ ] 8. Agregar endpoints REST para configuración de email
  - Agregar `GET /api/config/email` y `PUT /api/config/email` al router de la API
  - `GET` retorna la configuración sin exponer la contraseña en texto plano (campo `smtpPassword` omitido o enmascarado)
  - `PUT` valida y persiste la configuración, retorna HTTP 400 con mensaje descriptivo en caso de error
  - Agregar `POST /api/config/email/test` que intenta `transporter.verify()` con la configuración actual y retorna `{ ok: boolean, mensaje: string }`
  - Instanciar y conectar `RegistroNotificaciones` y `ServicioNotificaciones` en `backend/src/index.ts`
  - _Requisitos: 1.2, 1.3, 1.4, 1.9, 1.10, 1.11_

- [ ] 9. Checkpoint — Verificar que todos los tests del backend pasan
  - Asegurar que todos los tests pasan, consultar al usuario si surgen dudas.

- [ ] 10. Implementar sección de notificaciones en el frontend
  - [ ] 10.1 Agregar tipos de `ConfiguracionEmail` al frontend (`frontend/src/types/`)
    - _Requisitos: 1.1_
  - [ ] 10.2 Agregar funciones de API en el cliente HTTP del frontend para `GET/PUT /api/config/email`
    - _Requisitos: 1.5_
  - [ ] 10.3 Extender `SettingsPanel` con la sección "Notificaciones por Email"
    - Toggle habilitado/deshabilitado
    - Campos: SMTP Host, Puerto, Usuario, Contraseña, Remitente
    - Lista de destinatarios con botón agregar y botón eliminar por ítem
    - Botón "Probar conexión" que llama a `POST /api/config/email/test` y muestra el resultado en la UI
    - _Requisitos: 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11_
  - [ ] 10.4 Escribir tests de componente para la sección de email en SettingsPanel (Vitest)
    - Renderizado del formulario con todos los campos incluyendo botón "Probar conexión"
    - Agregar destinatario incrementa la lista
    - Eliminar destinatario decrementa la lista
    - _Requisitos: 1.5, 1.6, 1.7_

- [ ] 11. Checkpoint final — Verificar que todos los tests pasan
  - Asegurar que todos los tests de backend y frontend pasan, consultar al usuario si surgen dudas.

## Notas

- `fast-check` debe instalarse como dependencia de desarrollo en el backend
- El campo `smtpPassword` no debe exponerse en el `GET /api/config/email`; retornar un placeholder o campo vacío
- El archivo `notifications.json` se crea automáticamente si no existe
- Todos los property tests deben ejecutar mínimo 100 iteraciones
