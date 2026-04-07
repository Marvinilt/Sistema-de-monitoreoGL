# Guía de Publicación en Coolify v4

Este documento describe los pasos, las configuraciones necesarias y los comandos para realizar la publicación del **Sistema de Monitoreo GL** en la plataforma Coolify.

## Arquitectura y Compatibilidad con Coolify

El proyecto ya está diseñado y empaquetado para plataformas modernas gracias a `docker-compose.yml`. Todo el enrutamiento API y WebSocket lo gestiona un contenedor Nginx (Frontend).
Para Coolify, significa que **solo necesitas exponer el servicio `frontend`** directamente al balanceador de cargas (Traefik) utilizando los FQDNs (Dominios).

## 1. Configuración de Variables de Entorno

En Coolify vas a poder definir variables para la ejecución de los contenedores. A nivel de tu repositorio, el `docker-compose.yml` acepta puertos customizables para evitar conflictos de host si es necesario, aunque en redes de Coolify no es estrictamente necesario ya que Coolify enruta tráfico a través de su red de Proxy. 

Variables principales recomendadas que puedes agregar en el apartado **Environment Variables** en la interfaz de usuario del proyecto en Coolify:

*   `FRONTEND_PORT`: Por defecto `8080`. Define qué puerto ocupará temporalmente en el host (si deseas que el servicio lo reserve fuera del proxy interno de Coolify. Usualmente puedes dejarlo vacío o con un valor random no en uso como `8880`).
*   `BACKEND_PORT`: Por defecto `3001`. (Si se requiere acceder de forma directa o manual al backend sin Nginx).

*(Nota: Coolify genera variables automáticas como `COOLIFY_FQDN` o `COOLIFY_URL` que no necesitan ser definidas manulamente en tu app ya que interactuamos de forma interna).*

---

## 2. Pasos para la Publicación (A través de la Interfaz Web)

1.  **Abre Coolify** y dirígete a tu proyecto / entorno deseado.
2.  Haz clic en el botón de **+ New Resource**.
3.  Selecciona **Git Repository** (como GitHub, GitLab o Git Público).
4.  Selecciona tu cuenta y tu repositorio `Sistema-de-monitoreoGL`.
5.  En **Build Pack**, Coolify debería autodetectar el archivo `docker-compose.yml`, o bien selecciona explícitamente **Docker Compose**.
6.  Ajusta el archivo base (Base directory) al directorio raíz (`/`).
7.  En la pantalla de configuración del servicio, verás los servicios detectados (`frontend`, `backend`).
8.  **Configurar Dominios (Domains):** En el servicio **`frontend`**, agrega el dominio que proporcionará tu aplicación (Ejemplo: `https://monitoreo.tudominio.com`). 
9.  Dentro de **Environment Variables** (Variables de Entorno), puedes especificar variables del sistema si fuese requerido en un futuro, no es estricto en la versión inicial.
10. Haz clic en **Deploy**. Coolify se encargará de levantar el backend, compilar el frontend y configurar el proxy inverso Traefik con certificados SSL.

---

## 3. Automatización y Comandos (API o Webhook)

Si deseas actualizar o disparar nuevos despliegues automáticamente (por ejemplo, desde un pipeline CI/CD o desde código remoto), existen dos métodos: usando Webhooks (recomendado por simplicidad) o empleando la API (con autenticación por tokens).

### Método A: Despliegue por Webhook de Recurso

Este método genera una URL única. No necesita cabeceras de autorización porque el token de seguridad está empotrado en la URL.

**Paso a paso:**
1. Ve al recurso configurado en Coolify.
2. Ingresa a la sección **Webhooks** del proyecto.
3. Copia el **Deploy Webhook URL**.

**Comando de ejecución (cURL):**
```bash
curl -X GET 'https://coolify.tudominio.com/api/v1/deploy?uuid=TU_RESOURCE_UUID&force=false'
```
*Sustituye la URL completa por la que te provee el panel de Coolify.*

### Método B: Despliegue utilizando la API de Coolify

Si prefieres mayor control, se debe emplear un API Key. 

**Variables requeridas:**
*   `COOLIFY_URL`: URL principal de tu instancia Coolify (Ej: `https://coolify.midominio.com`).
*   `COOLIFY_API_KEY`: Generada desde las configuraciones del sistema (*Settings* > *Keys & Tokens*). Debe contar con permisos para realizar 'Deploy'.
*   `PROJECT_UUID`: El UUID asignado al recurso de Docker Compose a ejecutar (Visible en las URLs o en la interfaz del recurso).

**Comando de ejecución (cURL):**
```bash
curl -X POST "https://api.tu-coolify.com/api/v1/deploy" \
     -H "Authorization: Bearer <TU_COOLIFY_API_KEY>" \
     -H "Content-Type: application/json" \
     -d '{
           "uuid": "<TU_PROJECT_UUID>",
           "force": false
         }'
```

Reemplaza los valores (`<TU_COOLIFY_API_KEY>` y `<TU_PROJECT_UUID>`) con tus propios identificadores. Con la marca `force=false`, Coolify va a tratar de respetar la caché para un arranque más rápido, de lo contrario `force=true` realizará todo el proceso compilando las imágenes de Docker desde cero.
