# Changelog

Todos los cambios notables en este proyecto se documentarán en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

## [Unreleased] / [Versión Actual] - 2026-03-10
### Added
- **Monitoreo:** Monitoreo simulado de recursos del sistema (CPU, RAM, Disco).
- **Monitoreo/API:** Backend y endpoints para la configuración de umbrales en parámetros de recursos.
- **UI:** Interfaz para configuración de parámetros y umbrales de recursos del sistema en un panel dedicado (`ParametersView` / `SettingsPanel`).
- **UI:** Rediseño SaaS "Light Mode" sistemático (claro) con botón (toggle) para alternar temas (Oscuro/Claro) conservado localmente en caché.
- **UI/Servidores:** Las tarjetas de servidor (`ServerCard`) ahora visualizan dinámicamente el porcentaje y alertas de consumo de CPU, Memoria RAM y Disco.

### Changed
- **Configuración:** La `ConfigStore` ahora incluye estructura para manejar y persistir los umbrales de alertas de sistema y temas preferidos.
- **Monitoreo:** El servicio de monitoreo detecta cuándo el servidor supera los umbrales configurados para lanzar estados de alerta correspondientes de acuerdo a hardware simulado.

## [1.3.0] - 2026-03-08
### Added
- **UI:** Layout principal con Sidebar colapsable animado y pestaña flotante discreta al borde derecho para maximizar el espacio del dashboard.
- **UI:** Vista de registros (`LogsView`), una tabla responsiva con asignación de colores basada en severidad, recuperando datos directamente del backend.
- **API:** Nuevo endpoint `PATCH /api/servers/:id` para renombrar el servidor sin requerir re-crearlo.
- **Localización (l10n):** Traducción completa de la interfaz de usuario al Español (`Tablero`, `Configuración SMTP`, `Verificando…`).

### Changed
- **UI/UX:** Rediseño completo de la interfaz de usuario bajo la temática "Cyber-Dark" futurista.
- **UI/UX:** Tarjetas de Servidores (`ServerCard`) con estilo de paneles de cristal (glassmorphism), efectos `glow-success` (OK) y `glow-danger` (Alert).
- **UI/UX:** Reemplazo de texto plano por indicadores LED para mostrar el estado de puertos y URLs.
- **UI/UX:** Modal de Detalle (`ServerDetailModal`) rediseñado con fondos desenfocados y edición *inline* sobre el nombre del servidor.
- **Dashboard:** El conteo en tiempo real calcula el porcentaje de la columna "Puertos con Falla".
- **Dashboard:** Feedback visual bloqueante (spinner animado `isChecking`) si el servidor se encuentra en un ciclo de verificación activo.
- **Monitoreo/Seguridad:** El `VerificadorHTTPS.ts` inyecta Headers propios de Mozilla/Chrome (User-Agent, Accept) para prevenir bloqueos 403 de Firewalls comunes al usar axios.
- **Monitoreo:** Tolerancia a códigos HTTP 401/403, clasificándolos como `disponible` (hay un servicio corriendo que requiere autenticación).
- **Monitoreo:** El estado dinámico del servidor prioriza la disponibilidad HTTPS: si TODAS las URLs asignadas están disponibles, se ignoran fallos en puertos internos TCP (TCP Unreachable) y se clasifica el servidor como `ok`.

## [1.2.0] - 2026-03-03
### Added
- **Backend:** Sistema de notificaciones por email asíncrono implementado con `nodemailer`.
- **Backend:** Persistencia de estado para envíos deduplicados en `backend/data/notifications.json`.
- **Backend:** Funciones `procesarResultado()` y `detectarCambios()` para analizar transiciones de estado reales.
- **API:** Endpoint `GET /api/config/email` para obtener configuración de correo sin exponer contraseñas.
- **API:** Endpoint `PUT /api/config/email` para validar (destinatarios RFC 5322) y persistir la configuración SMTP.
- **API:** Endpoint `POST /api/config/email/test` para probar la conexión SMTP (incluyendo TLS auto-firmado y dns.lookup nativo).
- **Frontend:** Sección "Notificaciones por Email" en `SettingsPanel` con toggle, campos SMTP, lista de destinatarios y botón de "Probar conexión".

## [1.1.0] - 2026-03-02
### Added
- **Backend:** Nueva propiedad `resultadosPuertos` persistida para cada servidor en `config.json`.
- **UI:** Las `ServerCard` ahora exponen el estado de puertos TCP y URLs directamente, sin abrir el modal.
- **UI:** Indicadores visuales de latencia, código de respuesta HTTP (verde <400, rojo >400) y certificado SSL (🔒) para URLs de manera inline.
- **Backend:** Configuración del compilador para soportar types globales de Jest.

### Changed
- **UI:** El Dashboard ahora muestra los puertos como una lista plana de números antes de la primera evaluación, y estados coloreados (abierto/cerrado/sin_respuesta) después.
- **UI:** Los colores de estado en `ServerDetailModal` fueron sincronizados para coincidir con `ServerCard`.

## [1.0.0] - 2026-02-27
### Added
- **Lanzamiento Inicial:** Aplicación web full-stack para monitoreo básico de servidores.
- **Backend:** Motor base Node.js + Express con WebSockets para emitir eventos `server-update` y `check-progress`.
- **Backend:** `ConfigStore` para persistencia atómica en archivo `data/config.json`.
- **Backend:** Sub-sistemas de verificación TCP (`net.createConnection`) y HTTPS (`axios`).
- **Backend:** Orquestador de intervalo automático `Planificador` (30s - 3600s).
- **Frontend:** Dashboard React con Tailwind CSS para crear/gestionar servidores, puertos y URLs.
- **QA:** Property-based testing exhaustivo para operaciones del Store y validación de tipos con `fast-check`.
