# Documento de Requisitos: Notificaciones por Correo Electrónico

## Introducción

Esta funcionalidad agrega un sistema de notificaciones por correo electrónico al monitor de servidores. Cuando el estado de un servidor, puerto o URL cambia durante el ciclo de monitoreo, el sistema envía un correo HTML profesional a los destinatarios configurados, informando el estado anterior y el nuevo estado. Cada cambio se notifica una única vez para evitar spam.

## Glosario

- **Servicio_Notificaciones**: Componente del backend responsable de detectar cambios de estado y enviar correos electrónicos.
- **Servicio_Email**: Componente encargado de construir y despachar el correo HTML mediante SMTP.
- **Registro_Notificaciones**: Almacén persistente que registra qué cambios ya fueron notificados, para evitar envíos duplicados.
- **Configuracion_Email**: Sección dentro de `config.json` que contiene los parámetros SMTP y la lista de destinatarios.
- **Cambio_Estado**: Transición de un recurso (servidor, puerto o URL) desde un estado anterior a un estado nuevo distinto.
- **Destinatario**: Dirección de correo electrónico registrada en `Configuracion_Email` que recibirá las notificaciones.
- **API_Configuracion**: Endpoints REST del backend que permiten leer y actualizar `Configuracion_Email`.
- **Panel_Configuracion**: Sección del frontend (SettingsPanel) donde el usuario gestiona los parámetros de notificación.
- **Estado_Servidor**: Valor enumerado: `ok`, `alerta`, `desconocido`.
- **Estado_Puerto**: Valor enumerado: `abierto`, `cerrado`, `sin_respuesta`.
- **Estado_URL**: Valor enumerado: `disponible`, `no_disponible`, `error_certificado`, `desconocido`.

---

## Requisitos

### Requisito 1: Configuración de notificaciones por correo

**User Story:** Como administrador del sistema, quiero configurar los parámetros de correo electrónico y los destinatarios, para que las notificaciones lleguen a las personas correctas.

#### Criterios de Aceptación

1. THE `Configuracion_Email` SHALL almacenar: host SMTP, puerto SMTP, usuario SMTP, contraseña SMTP, remitente (`from`), y una lista de uno o más `Destinatario`.
2. WHEN el administrador guarda la configuración de correo, THE `API_Configuracion` SHALL validar que la lista de destinatarios contenga al menos una dirección de correo con formato válido (RFC 5322).
3. IF la lista de destinatarios está vacía al guardar, THEN THE `API_Configuracion` SHALL rechazar la solicitud y retornar un error con código HTTP 400.
4. IF alguna dirección de correo en la lista tiene formato inválido, THEN THE `API_Configuracion` SHALL rechazar la solicitud y retornar un error con código HTTP 400 indicando cuál dirección es inválida.
5. THE `Panel_Configuracion` SHALL mostrar un formulario para ingresar host SMTP, puerto, usuario, contraseña, remitente y la lista de destinatarios.
6. WHEN el administrador agrega un destinatario en el `Panel_Configuracion`, THE `Panel_Configuracion` SHALL agregar la dirección a la lista visible sin recargar la página.
7. WHEN el administrador elimina un destinatario en el `Panel_Configuracion`, THE `Panel_Configuracion` SHALL remover la dirección de la lista visible sin recargar la página.
8. WHERE la funcionalidad de notificaciones está habilitada, THE `Configuracion_Email` SHALL incluir un campo booleano `habilitado` que permita activar o desactivar el envío de correos sin eliminar la configuración.

9. WHEN el administrador hace clic en el botón "Probar conexión" en el `Panel_Configuracion`, THE `API_Configuracion` SHALL intentar establecer una conexión con el servidor SMTP configurado y retornar el resultado de la prueba.
10. IF la conexión de prueba al servidor SMTP es exitosa, THEN THE `API_Configuracion` SHALL retornar HTTP 200 con un mensaje de confirmación.
11. IF la conexión de prueba al servidor SMTP falla, THEN THE `API_Configuracion` SHALL retornar HTTP 200 con un mensaje de error descriptivo indicando la causa del fallo (timeout, credenciales inválidas, host no encontrado).

---

### Requisito 2: Detección de cambios de estado

**User Story:** Como sistema de monitoreo, quiero detectar automáticamente los cambios de estado de servidores, puertos y URLs, para que solo se notifiquen transiciones reales.

#### Criterios de Aceptación

1. WHEN el `Servicio_Monitoreo` completa una verificación de un servidor, THE `Servicio_Notificaciones` SHALL comparar el estado general anterior del servidor con el nuevo estado.
2. WHEN el `Servicio_Monitoreo` completa una verificación, THE `Servicio_Notificaciones` SHALL comparar el estado anterior de cada puerto con su nuevo estado.
3. WHEN el `Servicio_Monitoreo` completa una verificación, THE `Servicio_Notificaciones` SHALL comparar el estado anterior de cada URL con su nuevo estado.
4. THE `Servicio_Notificaciones` SHALL considerar un `Cambio_Estado` únicamente cuando el estado anterior es distinto al estado nuevo.
5. IF no existe estado anterior registrado para un recurso (primera verificación), THEN THE `Servicio_Notificaciones` SHALL registrar el estado inicial sin generar notificación.

---

### Requisito 3: Deduplicación de notificaciones

**User Story:** Como administrador, quiero que cada cambio de estado sea notificado una sola vez, para no recibir correos repetidos por el mismo evento.

#### Criterios de Aceptación

1. WHEN un `Cambio_Estado` es detectado, THE `Registro_Notificaciones` SHALL registrar una entrada con: identificador del recurso, tipo de recurso (servidor/puerto/URL), estado anterior, estado nuevo, y timestamp de notificación.
2. WHEN el `Servicio_Notificaciones` detecta un `Cambio_Estado`, THE `Servicio_Notificaciones` SHALL consultar el `Registro_Notificaciones` para verificar si ese cambio exacto ya fue notificado.
3. IF el `Registro_Notificaciones` contiene una entrada para el mismo recurso con el mismo estado anterior y el mismo estado nuevo, THEN THE `Servicio_Notificaciones` SHALL omitir el envío del correo.
4. WHEN el estado de un recurso cambia nuevamente a un estado diferente, THE `Servicio_Notificaciones` SHALL tratar ese nuevo cambio como un `Cambio_Estado` independiente y notificarlo.
5. THE `Registro_Notificaciones` SHALL persistir en disco para sobrevivir reinicios del servidor.

---

### Requisito 4: Envío del correo de notificación

**User Story:** Como administrador, quiero recibir un correo HTML profesional con el detalle de los cambios detectados, para entender rápidamente qué ocurrió en la infraestructura.

#### Criterios de Aceptación

1. WHEN existen uno o más `Cambio_Estado` no notificados tras una verificación, THE `Servicio_Email` SHALL enviar un único correo consolidado a todos los `Destinatario` configurados.
2. THE `Servicio_Email` SHALL construir el cuerpo del correo en formato HTML con: encabezado institucional, tabla de cambios (nombre del recurso, tipo, estado anterior, estado nuevo, timestamp), y pie de página con nombre del sistema.
3. THE `Servicio_Email` SHALL usar colores diferenciados en la tabla: verde para estado `ok`/`disponible`/`abierto`, rojo para `alerta`/`no_disponible`/`cerrado`/`sin_respuesta`/`error_certificado`, gris para `desconocido`.
4. THE `Servicio_Email` SHALL establecer el asunto del correo con el formato: `[Monitor Servidores] N cambio(s) detectado(s) - DD/MM/YYYY HH:MM`.
5. IF el servidor SMTP no responde en 10 segundos, THEN THE `Servicio_Email` SHALL registrar el error en el log del sistema y no reintentar en el mismo ciclo.
6. IF las credenciales SMTP son inválidas, THEN THE `Servicio_Email` SHALL registrar el error en el log del sistema sin lanzar una excepción no controlada.
7. WHILE la funcionalidad de notificaciones está deshabilitada (`habilitado: false`), THE `Servicio_Notificaciones` SHALL omitir el envío de correos sin afectar el monitoreo.

---

### Requisito 5: Integración con el ciclo de monitoreo

**User Story:** Como sistema, quiero que las notificaciones se procesen automáticamente después de cada ciclo de verificación, para que los administradores sean alertados en tiempo real.

#### Criterios de Aceptación

1. WHEN el `Planificador` ejecuta `verificarTodos`, THE `Servicio_Notificaciones` SHALL procesar los cambios detectados inmediatamente después de que cada verificación de servidor finalice.
2. IF el `Servicio_Notificaciones` lanza una excepción durante el procesamiento, THEN THE `Planificador` SHALL continuar con el ciclo de monitoreo sin interrumpirse.
3. THE `Servicio_Notificaciones` SHALL ejecutarse de forma asíncrona para no bloquear el ciclo de monitoreo.
